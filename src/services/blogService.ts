import { supabase, TENANT_ID } from '../lib/supabase';
import { BlogPost } from '../types/database.types';

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return err ? String(err) : fallback;
};

export const blogService = {
  async getPublishedPosts(): Promise<BlogPost[]> {
    const { data } = await supabase
      .from('blog_posts')
      .select('*, featured_media:media_assets(*)')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    return (data as BlogPost[]) || [];
  },

  async getAllPosts(): Promise<BlogPost[]> {
    const { data } = await supabase
      .from('blog_posts')
      .select('*, featured_media:media_assets(*)')
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false });
    return (data as BlogPost[]) || [];
  },

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const { data } = await supabase
      .from('blog_posts')
      .select('*, featured_media:media_assets(*)')
      .eq('tenant_id', TENANT_ID)
      .eq('slug', slug)
      .single();
    return (data as BlogPost) || null;
  },

  async createPost(post: Partial<BlogPost>): Promise<{ data: BlogPost | null; error: string | null }> {
    try {
      const slug = (post.slug || post.title || 'post')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const newPost = {
        tenant_id: TENANT_ID,
        title: post.title || 'Untitled Post',
        slug,
        excerpt: post.excerpt || null,
        content: post.content || '',
        featured_media_id: post.featured_media_id || null,
        status: post.status || 'draft',
        published_at: post.status === 'published' ? new Date().toISOString() : null,
        seo_title: post.seo_title || post.title,
        seo_description: post.seo_description || post.excerpt,
      };

      const { data, error } = await supabase.from('blog_posts').insert(newPost).select().single();
      if (error || !data) {
        return { data: null, error: error ? getErrMsg(error, 'Failed to create blog post') : 'Failed to create blog post' };
      }
      return { data: data as BlogPost, error: null };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : 'Error creating blog post' };
    }
  },

  async updatePost(id: string, updates: Partial<BlogPost>): Promise<{ success: boolean; error: string | null }> {
    const { error } = await supabase.from('blog_posts').update(updates).eq('id', id);
    return { success: !error, error: error ? getErrMsg(error, 'Update post failed') : null };
  },

  async deletePost(id: string): Promise<{ success: boolean; error: string | null }> {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    return { success: !error, error: error ? getErrMsg(error, 'Delete post failed') : null };
  }
};
