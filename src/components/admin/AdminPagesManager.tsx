import React, { useEffect, useState } from 'react';
import { cmsPagesService, CmsPageInput, CmsPageStatus } from '../../services/cmsPagesService';

type CmsPageRecord = CmsPageInput & { id: string; updated_at?: string };

const EMPTY_CONTENT = JSON.stringify({ sections: [] }, null, 2);

export function AdminPagesManager() {
  const [pages, setPages] = useState<CmsPageRecord[]>([]);
  const [editing, setEditing] = useState<CmsPageRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [path, setPath] = useState('/');
  const [status, setStatus] = useState<CmsPageStatus>('draft');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [content, setContent] = useState(EMPTY_CONTENT);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const result = await cmsPagesService.listAdminPages();
    if (result.error) setError(result.error);
    else setPages(result.data as CmsPageRecord[]);
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, []);

  const reset = () => {
    setEditing(null);
    setIsEditing(false);
    setTitle('');
    setSlug('');
    setPath('/');
    setStatus('draft');
    setSeoTitle('');
    setSeoDescription('');
    setContent(EMPTY_CONTENT);
    setError(null);
  };

  const beginEdit = (page: CmsPageRecord) => {
    setIsEditing(true);
    setEditing(page);
    setTitle(page.title);
    setSlug(page.slug);
    setPath(page.path);
    setStatus(page.status || 'draft');
    setSeoTitle(page.seo_title || '');
    setSeoDescription(page.seo_description || '');
    setContent(JSON.stringify(page.content || {}, null, 2));
    setError(null);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    let parsedContent: Record<string, unknown>;
    try {
      parsedContent = JSON.parse(content);
      if (!parsedContent || Array.isArray(parsedContent) || typeof parsedContent !== 'object') {
        throw new Error('Page content must be a JSON object.');
      }
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : 'Invalid page JSON.');
      return;
    }

    setSaving(true);
    const result = await cmsPagesService.savePage({
      id: editing?.id,
      title, slug, path, status,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      content: parsedContent,
      sections: Array.isArray(parsedContent.sections)
        ? (parsedContent.sections as Record<string, unknown>[]).map((section, index) => ({
            section_key: String(section.key || `section-${index + 1}`),
            section_type: String(section.type || 'content'),
            sort_order: index,
            enabled: section.enabled !== false,
            content: section,
          }))
        : [],
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    reset();
    await refresh();
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this CMS page and its sections?')) return;
    const result = await cmsPagesService.deletePage(id);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await refresh();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600">Supabase · cms_pages</span>
          <h1 className="text-3xl font-black tracking-tight text-stone-900">Website Pages</h1>
          <p className="mt-1 text-xs text-stone-500">Persist page content, routes and SEO metadata independently of frontend releases.</p>
        </div>
        {!isEditing && <button onClick={() => { reset(); setIsEditing(true); }} className="rounded-xl bg-rose-700 px-4 py-2.5 text-xs font-bold text-white">Create Page</button>}
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}

      {isEditing ? (
        <form onSubmit={save} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-bold text-stone-700">Page title
              <input required value={title} onChange={e => { setTitle(e.target.value); if (!editing) { const s=e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); setSlug(s); setPath(s ? `/${s}` : '/'); } }} className="w-full rounded-lg border border-stone-300 p-2.5 font-normal"/>
            </label>
            <label className="space-y-1 text-xs font-bold text-stone-700">Slug
              <input required value={slug} onChange={e => setSlug(e.target.value)} className="w-full rounded-lg border border-stone-300 p-2.5 font-mono font-normal"/>
            </label>
            <label className="space-y-1 text-xs font-bold text-stone-700">Public path
              <input required value={path} onChange={e => setPath(e.target.value)} className="w-full rounded-lg border border-stone-300 p-2.5 font-mono font-normal"/>
            </label>
            <label className="space-y-1 text-xs font-bold text-stone-700">Publication status
              <select value={status} onChange={e => setStatus(e.target.value as CmsPageStatus)} className="w-full rounded-lg border border-stone-300 bg-white p-2.5 font-normal">
                <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
              </select>
            </label>
            <label className="space-y-1 text-xs font-bold text-stone-700">SEO title
              <input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} className="w-full rounded-lg border border-stone-300 p-2.5 font-normal"/>
            </label>
            <label className="space-y-1 text-xs font-bold text-stone-700">SEO description
              <input value={seoDescription} onChange={e => setSeoDescription(e.target.value)} className="w-full rounded-lg border border-stone-300 p-2.5 font-normal"/>
            </label>
          </div>
          <label className="block space-y-1 text-xs font-bold text-stone-700">Page content (JSON)
            <textarea required rows={14} value={content} onChange={e => setContent(e.target.value)} spellCheck={false} className="w-full rounded-lg border border-stone-300 p-3 font-mono text-xs"/>
          </label>
          <p className="text-[11px] text-stone-500">Content is stored as structured JSON. Existing React templates must explicitly read these records before a page becomes fully CMS-rendered.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={reset} className="rounded-xl border border-stone-300 px-4 py-2.5 text-xs font-bold">Cancel</button>
            <button disabled={saving} type="submit" className="rounded-xl bg-rose-700 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save page to Supabase'}</button>
          </div>
        </form>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {loading ? <p className="p-5 text-xs text-stone-500">Loading pages…</p> : pages.length === 0 ? <p className="p-5 text-xs text-stone-500">No CMS pages created yet.</p> : (
            <div className="divide-y divide-stone-100">
              {pages.map(page => <div key={page.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div><p className="text-sm font-bold text-stone-900">{page.title}</p><p className="mt-1 text-[11px] font-mono text-stone-500">{page.path} · {page.status}</p></div>
                <div className="flex gap-3 text-xs font-bold"><button onClick={() => beginEdit(page)} className="text-stone-700">Edit</button><button onClick={() => void remove(page.id)} className="text-red-600">Delete</button></div>
              </div>)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
