import { supabase } from '../lib/supabase';
import { Campaign, Influencer } from '../types/database.types';

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return err ? String(err) : fallback;
};

export const campaignService = {
  async getActiveCampaigns(): Promise<Campaign[]> {
    const { data: rawCampaigns } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active');
    
    if (!rawCampaigns || !Array.isArray(rawCampaigns)) return [];

    const enriched = await Promise.all(
      (rawCampaigns as Campaign[]).map(async (cmp) => {
        let inf: Influencer | undefined = undefined;
        if (cmp.influencer_id) {
          const { data: infData } = await supabase.from('influencers').select('*').eq('id', cmp.influencer_id).single();
          if (infData) inf = infData as Influencer;
        }
        return { ...cmp, influencer: inf };
      })
    );

    return enriched;
  },

  async getAllCampaigns(): Promise<Campaign[]> {
    const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
    return (data as Campaign[]) || [];
  },

  async getCampaignBySlug(slug: string): Promise<Campaign | null> {
    const { data: cmp } = await supabase.from('campaigns').select('*').eq('slug', slug).single();
    if (!cmp) return null;

    const typedCmp = cmp as Campaign;
    let inf: Influencer | undefined = undefined;
    if (typedCmp.influencer_id) {
      const { data: infData } = await supabase.from('influencers').select('*').eq('id', typedCmp.influencer_id).single();
      if (infData) inf = infData as Influencer;
    }
    return { ...typedCmp, influencer: inf };
  },

  async createCampaign(campaign: Partial<Campaign>): Promise<{ data: Campaign | null; error: string | null }> {
    try {
      const slug = (campaign.slug || campaign.name || 'campaign')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const record = {
        name: campaign.name || 'New Campaign',
        slug,
        hero_headline: campaign.hero_headline || '',
        hero_subheadline: campaign.hero_subheadline || null,
        video_url: campaign.video_url || null,
        influencer_id: campaign.influencer_id || null,
        product_id: campaign.product_id || null,
        promotion_code: campaign.promotion_code || null,
        discount_percent: campaign.discount_percent || 0,
        status: campaign.status || 'draft',
        utm_source: campaign.utm_source || 'social',
        utm_medium: campaign.utm_medium || 'influencer',
        utm_campaign: campaign.utm_campaign || slug,
      };

      const { data, error } = await supabase.from('campaigns').insert(record);
      if (error || !data) {
        return { data: null, error: error ? getErrMsg(error, 'Failed to create campaign') : 'Failed to create campaign' };
      }
      return { data: Array.isArray(data) ? (data[0] as Campaign) : (data as Campaign), error: null };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : 'Error creating campaign' };
    }
  },

  // Influencers API
  async getInfluencers(): Promise<Influencer[]> {
    const { data } = await supabase.from('influencers').select('*').order('created_at', { ascending: false });
    return (data as Influencer[]) || [];
  },

  async createInfluencer(influencer: Partial<Influencer>): Promise<{ data: Influencer | null; error: string | null }> {
    try {
      const record = {
        name: influencer.name || '',
        handle: influencer.handle || '',
        platform: influencer.platform || 'instagram',
        bio: influencer.bio || '',
        avatar_url: influencer.avatar_url || null,
        reach_count: influencer.reach_count || 0,
        status: influencer.status || 'active',
      };
      const { data, error } = await supabase.from('influencers').insert(record);
      if (error || !data) {
        return { data: null, error: error ? getErrMsg(error, 'Failed to create influencer') : 'Failed to create influencer' };
      }
      return { data: Array.isArray(data) ? (data[0] as Influencer) : (data as Influencer), error: null };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : 'Error creating influencer' };
    }
  }
};
