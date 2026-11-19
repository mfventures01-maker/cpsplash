import { supabase, TENANT_ID, notifySyncEvent } from '../lib/supabase';

export type CmsPageStatus = 'draft' | 'published' | 'archived';

export interface CmsPageSectionInput {
  id?: string;
  section_key: string;
  section_type: string;
  sort_order?: number;
  enabled?: boolean;
  content: Record<string, unknown>;
}

export interface CmsPageInput {
  id?: string;
  slug: string;
  path: string;
  title: string;
  template_key?: string;
  status?: CmsPageStatus;
  content?: Record<string, unknown>;
  seo_title?: string | null;
  seo_description?: string | null;
  sections?: CmsPageSectionInput[];
}

const errorMessage = (error: unknown, fallback: string) =>
  error && typeof error === 'object' && 'message' in error
    ? String((error as { message: unknown }).message)
    : error ? String(error) : fallback;

export const cmsPagesService = {
  async listAdminPages() {
    const { data, error } = await supabase
      .from('cms_pages')
      .select('*, sections:cms_page_sections(*)')
      .eq('tenant_id', TENANT_ID)
      .order('updated_at', { ascending: false });
    if (error) return { data: [], error: errorMessage(error, 'Failed to load CMS pages') };
    return { data: data || [], error: null };
  },

  async getPublishedPageByPath(path: string) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const { data, error } = await supabase
      .from('cms_pages')
      .select('*, sections:cms_page_sections(*)')
      .eq('tenant_id', TENANT_ID)
      .eq('path', normalizedPath)
      .eq('status', 'published')
      .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
      .maybeSingle();
    if (error) return { data: null, error: errorMessage(error, 'Failed to load published page') };
    return { data, error: null };
  },

  async savePage(input: CmsPageInput) {
    if (!input.title.trim() || !input.slug.trim() || !input.path.trim()) {
      return { data: null, error: 'Page title, slug and path are required.' };
    }
    const normalizedPath = input.path.startsWith('/') ? input.path : `/${input.path}`;
    const pageRecord = {
      tenant_id: TENANT_ID,
      slug: input.slug.trim().toLowerCase(),
      path: normalizedPath,
      title: input.title.trim(),
      template_key: input.template_key || 'standard',
      status: input.status || 'draft',
      content: input.content || {},
      seo_title: input.seo_title || null,
      seo_description: input.seo_description || null,
      published_at: input.status === 'published' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const query = input.id
      ? supabase.from('cms_pages').update(pageRecord).eq('id', input.id).eq('tenant_id', TENANT_ID)
      : supabase.from('cms_pages').insert(pageRecord);
    const { data, error } = await query.select('*').single();
    if (error || !data) return { data: null, error: errorMessage(error, 'Page save returned no record') };

    if (input.sections) {
      const sectionRows = input.sections.map((section, index) => ({
        tenant_id: TENANT_ID,
        page_id: data.id,
        section_key: section.section_key,
        section_type: section.section_type,
        sort_order: section.sort_order ?? index,
        enabled: section.enabled ?? true,
        content: section.content,
        updated_at: new Date().toISOString(),
      }));

      // Upsert each section by its stable page/section key. A failure is surfaced
      // explicitly so the UI cannot claim the complete page save succeeded.
      for (const section of sectionRows) {
        const { error: sectionError } = await supabase
          .from('cms_page_sections')
          .upsert(section, { onConflict: 'page_id,section_key' });
        if (sectionError) {
          return {
            data,
            error: `Page record saved, but section "${section.section_key}" failed: ${errorMessage(sectionError, 'Section persistence failed')}`,
          };
        }
      }
    }

    notifySyncEvent('cms_pages', { id: data.id, path: normalizedPath }, input.id ? 'UPDATE' : 'INSERT');
    return { data, error: null };
  },

  async deletePage(id: string) {
    const { error } = await supabase
      .from('cms_pages')
      .delete()
      .eq('id', id)
      .eq('tenant_id', TENANT_ID);
    if (error) return { success: false, error: errorMessage(error, 'Failed to delete page') };
    notifySyncEvent('cms_pages', { id }, 'DELETE');
    return { success: true, error: null };
  },
};
