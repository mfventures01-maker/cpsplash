import { supabase, TENANT_ID } from '../lib/supabase';
import { Campaign, Influencer } from '../types/database.types';

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return err ? String(err) : fallback;
};

export const campaignService = {
  async getActiveCampaigns(): Promise<Campaign[]> {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'active');
    
    return (data as Campaign[]) || [];
  },

  async getAllCampaigns(): Promise<Campaign[]> {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false });
    return (data as Campaign[]) || [];
  },

  async getCampaignBySlug(slug: string): Promise<Campaign | null> {
    const { data: cmp } = await supabase
      .from('campaigns')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('slug', slug)
      .single();
    if (!cmp) return null;
    return cmp as Campaign;
  },

  async createCampaign(campaign: Partial<Campaign>): Promise<{ data: Campaign | null; error: string | null }> {
    try {
      const slug = (campaign.slug || campaign.name || 'campaign')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const record = {
        tenant_id: TENANT_ID,
        name: campaign.name || 'New Campaign',
        slug,
        description: campaign.description || null,
        status: campaign.status || 'draft',
        starts_at: campaign.starts_at || null,
        ends_at: campaign.ends_at || null,
        landing_path: campaign.landing_path || `/campaign/${slug}`,
        default_utm_source: campaign.default_utm_source || 'social',
        default_utm_medium: campaign.default_utm_medium || 'influencer',
        default_utm_campaign: campaign.default_utm_campaign || slug,
      };

      const { data, error } = await supabase.from('campaigns').insert(record).select().single();
      if (error || !data) {
        return { data: null, error: error ? getErrMsg(error, 'Failed to create campaign') : 'Failed to create campaign' };
      }
      return { data: data as Campaign, error: null };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : 'Error creating campaign' };
    }
  },

  // Influencers API
  async getInfluencers(): Promise<Influencer[]> {
    const { data } = await supabase
      .from('influencers')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false });
    return (data as Influencer[]) || [];
  },

  async createInfluencer(influencer: Partial<Influencer>): Promise<{ data: Influencer | null; error: string | null }> {
    try {
      const record = {
        tenant_id: TENANT_ID,
        name: influencer.name || '',
        handle: influencer.handle || null,
        platform: influencer.platform || 'instagram',
        profile_url: influencer.profile_url || null,
        phone: influencer.phone || null,
        email: influencer.email || null,
        status: influencer.status || 'active',
      };
      const { data, error } = await supabase.from('influencers').insert(record).select().single();
      if (error || !data) {
        return { data: null, error: error ? getErrMsg(error, 'Failed to create influencer') : 'Failed to create influencer' };
      }
      return { data: data as Influencer, error: null };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : 'Error creating influencer' };
    }
  }
};
