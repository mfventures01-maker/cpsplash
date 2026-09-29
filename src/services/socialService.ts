import { supabase } from '../lib/supabase';
import { SocialContent } from '../types/database.types';

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return err ? String(err) : fallback;
};

export const socialService = {
  async getPublishedContent(): Promise<SocialContent[]> {
    const { data } = await supabase
      .from('social_content')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    return (data as SocialContent[]) || [];
  },

  async getAllContent(): Promise<SocialContent[]> {
    const { data } = await supabase
      .from('social_content')
      .select('*')
      .order('published_at', { ascending: false });
    return (data as SocialContent[]) || [];
  },

  async addSocialContent(item: Partial<SocialContent>): Promise<{ data: SocialContent | null; error: string | null }> {
    try {
      const record = {
        platform: item.platform || 'instagram',
        post_url: item.post_url || '',
        thumbnail: item.thumbnail || '',
        caption: item.caption || '',
        creator: item.creator || '',
        campaign_id: item.campaign_id || null,
        product_id: item.product_id || null,
        status: item.status || 'published',
        published_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('social_content').insert(record);
      if (error || !data) {
        return { data: null, error: error ? getErrMsg(error, 'Failed to save social content') : 'Failed to save social content' };
      }
      return { data: Array.isArray(data) ? (data[0] as SocialContent) : (data as SocialContent), error: null };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : 'Error adding social content' };
    }
  },

  async deleteSocialContent(id: string): Promise<{ success: boolean; error: string | null }> {
    const { error } = await supabase.from('social_content').delete().eq('id', id);
    return { success: !error, error: error ? getErrMsg(error, 'Delete failed') : null };
  }
};
