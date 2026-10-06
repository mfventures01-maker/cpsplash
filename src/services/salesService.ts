import { supabase, TENANT_ID } from '../lib/supabase';
import { 
  SalesTerritory, 
  SalesJourney, 
  SalesOffer, 
  SalesQuestion, 
  SalesLead, 
  SalesFunnelSummary,
  LeadStatus 
} from '../types/database.types';

export interface CreateLeadParams {
  territoryId: string;
  journeyId: string;
  offerId?: string | null;
  answers: Record<string, unknown>;
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
}

export const salesService = {
  // ========================================================
  // PUBLIC COMMERCIAL SALES ENGINE OPERATIONS
  // ========================================================

  /**
   * Fetch all published & active commercial territories
   */
  async getActiveTerritories(): Promise<SalesTerritory[]> {
    const { data, error } = await supabase
      .from('sales_territories')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('[salesService] Error loading active territories:', error.message);
      return [];
    }
    return (data as SalesTerritory[]) || [];
  },

  /**
   * Fetch single territory by slug
   */
  async getTerritoryBySlug(slug: string): Promise<SalesTerritory | null> {
    const { data, error } = await supabase
      .from('sales_territories')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle();

    if (error) {
      console.error(`[salesService] Error loading territory slug ${slug}:`, error.message);
      return null;
    }
    return data as SalesTerritory | null;
  },

  /**
   * Fetch active journeys for a territory
   */
  async getJourneysForTerritory(territoryId: string): Promise<SalesJourney[]> {
    const { data, error } = await supabase
      .from('sales_journeys')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('territory_id', territoryId)
      .eq('active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`[salesService] Error loading journeys for territory ${territoryId}:`, error.message);
      return [];
    }
    return (data as SalesJourney[]) || [];
  },

  /**
   * Fetch active offers for a territory
   */
  async getOffersForTerritory(territoryId: string): Promise<SalesOffer[]> {
    const { data, error } = await supabase
      .from('sales_offers')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('territory_id', territoryId)
      .eq('active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`[salesService] Error loading offers for territory ${territoryId}:`, error.message);
      return [];
    }
    return (data as SalesOffer[]) || [];
  },

  /**
   * Fetch active dynamic qualification questions for a journey
   */
  async getQuestionsForJourney(journeyId: string): Promise<SalesQuestion[]> {
    const { data, error } = await supabase
      .from('sales_questions')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('journey_id', journeyId)
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error(`[salesService] Error loading questions for journey ${journeyId}:`, error.message);
      return [];
    }
    return (data as SalesQuestion[]) || [];
  },

  /**
   * Deterministic lead creation via authoritative database RPC
   * Returns authoritative lead record with sequence-backed lead_number (e.g., CPL-000001)
   */
  async createLead(params: CreateLeadParams): Promise<{ lead: SalesLead | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('create_sales_lead', {
        p_territory_id: params.territoryId,
        p_journey_id: params.journeyId,
        p_offer_id: params.offerId || null,
        p_answers: params.answers,
        p_source: params.source || 'website',
        p_medium: params.medium || null,
        p_campaign: params.campaign || null,
        p_content: params.content || null
      });

      if (error) {
        return { lead: null, error: error.message };
      }

      return { lead: data as SalesLead, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown lead creation failure';
      return { lead: null, error: msg };
    }
  },

  // ========================================================
  // CMS / ADMIN CONTROL OPERATIONS (Protected by RLS)
  // ========================================================

  async getAllTerritories(): Promise<SalesTerritory[]> {
    const { data, error } = await supabase
      .from('sales_territories')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data as SalesTerritory[]) || [];
  },

  async saveTerritory(territory: Partial<SalesTerritory>): Promise<SalesTerritory> {
    const payload = {
      ...territory,
      tenant_id: TENANT_ID,
      updated_at: new Date().toISOString()
    };

    if (territory.id) {
      const { data, error } = await supabase
        .from('sales_territories')
        .update(payload)
        .eq('id', territory.id)
        .eq('tenant_id', TENANT_ID)
        .select()
        .single();
      if (error) throw error;
      return data as SalesTerritory;
    } else {
      const { data, error } = await supabase
        .from('sales_territories')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as SalesTerritory;
    }
  },

  async deleteTerritory(id: string): Promise<void> {
    const { error } = await supabase
      .from('sales_territories')
      .delete()
      .eq('id', id)
      .eq('tenant_id', TENANT_ID);
    if (error) throw error;
  },

  async getAllJourneys(territoryId?: string): Promise<SalesJourney[]> {
    let query = supabase
      .from('sales_journeys')
      .select('*, territory:sales_territories(name, slug)')
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: true });

    if (territoryId) {
      query = query.eq('territory_id', territoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as SalesJourney[]) || [];
  },

  async saveJourney(journey: Partial<SalesJourney>): Promise<SalesJourney> {
    const payload = {
      ...journey,
      tenant_id: TENANT_ID,
      updated_at: new Date().toISOString()
    };

    if (journey.id) {
      const { data, error } = await supabase
        .from('sales_journeys')
        .update(payload)
        .eq('id', journey.id)
        .eq('tenant_id', TENANT_ID)
        .select()
        .single();
      if (error) throw error;
      return data as SalesJourney;
    } else {
      const { data, error } = await supabase
        .from('sales_journeys')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as SalesJourney;
    }
  },

  async deleteJourney(id: string): Promise<void> {
    const { error } = await supabase
      .from('sales_journeys')
      .delete()
      .eq('id', id)
      .eq('tenant_id', TENANT_ID);
    if (error) throw error;
  },

  async getAllOffers(territoryId?: string): Promise<SalesOffer[]> {
    let query = supabase
      .from('sales_offers')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: true });

    if (territoryId) {
      query = query.eq('territory_id', territoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as SalesOffer[]) || [];
  },

  async saveOffer(offer: Partial<SalesOffer>): Promise<SalesOffer> {
    const payload = {
      ...offer,
      tenant_id: TENANT_ID,
      updated_at: new Date().toISOString()
    };

    if (offer.id) {
      const { data, error } = await supabase
        .from('sales_offers')
        .update(payload)
        .eq('id', offer.id)
        .eq('tenant_id', TENANT_ID)
        .select()
        .single();
      if (error) throw error;
      return data as SalesOffer;
    } else {
      const { data, error } = await supabase
        .from('sales_offers')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as SalesOffer;
    }
  },

  async deleteOffer(id: string): Promise<void> {
    const { error } = await supabase
      .from('sales_offers')
      .delete()
      .eq('id', id)
      .eq('tenant_id', TENANT_ID);
    if (error) throw error;
  },

  async getAllQuestions(journeyId?: string): Promise<SalesQuestion[]> {
    let query = supabase
      .from('sales_questions')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .order('sort_order', { ascending: true });

    if (journeyId) {
      query = query.eq('journey_id', journeyId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as SalesQuestion[]) || [];
  },

  async saveQuestion(question: Partial<SalesQuestion>): Promise<SalesQuestion> {
    const payload = {
      ...question,
      tenant_id: TENANT_ID,
      updated_at: new Date().toISOString()
    };

    if (question.id) {
      const { data, error } = await supabase
        .from('sales_questions')
        .update(payload)
        .eq('id', question.id)
        .eq('tenant_id', TENANT_ID)
        .select()
        .single();
      if (error) throw error;
      return data as SalesQuestion;
    } else {
      const { data, error } = await supabase
        .from('sales_questions')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as SalesQuestion;
    }
  },

  async deleteQuestion(id: string): Promise<void> {
    const { error } = await supabase
      .from('sales_questions')
      .delete()
      .eq('id', id)
      .eq('tenant_id', TENANT_ID);
    if (error) throw error;
  },

  async getLeads(filters?: { territoryId?: string; status?: string; limit?: number }): Promise<SalesLead[]> {
    let query = supabase
      .from('sales_leads')
      .select('*, territory:sales_territories(name, slug), journey:sales_journeys(name, slug), offer:sales_offers(name)')
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false });

    if (filters?.territoryId) {
      query = query.eq('territory_id', filters.territoryId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as SalesLead[]) || [];
  },

  async updateLeadStatus(id: string, status: LeadStatus, notes?: string): Promise<SalesLead> {
    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    };
    if (notes !== undefined) {
      updatePayload.notes = notes;
    }

    const { data, error } = await supabase
      .from('sales_leads')
      .update(updatePayload)
      .eq('id', id)
      .eq('tenant_id', TENANT_ID)
      .select()
      .single();

    if (error) throw error;
    return data as SalesLead;
  },

  async getFunnelSummary(): Promise<SalesFunnelSummary[]> {
    const { data, error } = await supabase
      .from('sales_funnel_summary')
      .select('*')
      .eq('tenant_id', TENANT_ID);

    if (error) {
      console.warn('[salesService] Error loading funnel summary:', error.message);
      return [];
    }
    return (data as SalesFunnelSummary[]) || [];
  }
};
