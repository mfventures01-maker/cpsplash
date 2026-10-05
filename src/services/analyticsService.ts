import { supabase, TENANT_ID } from '../lib/supabase';
import { AnalyticsEvent } from '../types/database.types';

export const analyticsService = {
  /**
   * Track an event into the Supabase-backed event pipeline
   */
  async trackEvent(
    eventName: AnalyticsEvent['event_name'],
    options: {
      productId?: string | null;
      landingPage?: string;
      source?: string | null;
      medium?: string | null;
      campaign?: string | null;
      content?: string | null;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<void> {
    try {
      // Capture UTM parameters from URL if present
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const utmSource = options.source || params?.get('utm_source') || 'direct';
      const utmMedium = options.medium || params?.get('utm_medium') || null;
      const utmCampaign = options.campaign || params?.get('utm_campaign') || null;
      const utmContent = options.content || params?.get('utm_content') || null;

      const record: AnalyticsEvent = {
        tenant_id: TENANT_ID,
        event_name: eventName,
        source: utmSource,
        medium: utmMedium,
        campaign: utmCampaign,
        content: utmContent,
        page_path: options.landingPage || (typeof window !== 'undefined' ? window.location.pathname : '/'),
        product_id: options.productId || null,
        metadata: options.metadata || {},
        created_at: new Date().toISOString(),
      };

      await supabase.from('analytics_events').insert(record as unknown as Record<string, unknown>);
    } catch (err) {
      console.warn('Analytics event tracking error:', err);
    }
  },

  /**
   * Retrieve recent analytics events
   */
  async getEvents(limit = 100): Promise<AnalyticsEvent[]> {
    const { data } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data as unknown as AnalyticsEvent[]) || [];
  },

  /**
   * Calculate aggregated metrics for the admin dashboard
   */
  async getMetricsSummary() {
    const events = await this.getEvents(500);

    const counts: Record<string, number> = {
      page_view: 0,
      product_view: 0,
      whatsapp_click: 0,
      order_started: 0,
      order_completed: 0,
      product_video_play: 0,
      social_click: 0,
    };

    const sourceBreakdown: Record<string, number> = {};
    const productInteractions: Record<string, number> = {};

    events.forEach(ev => {
      counts[ev.event_name] = (counts[ev.event_name] || 0) + 1;
      
      const src = ev.source || 'direct';
      sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;

      if (ev.product_id) {
        productInteractions[ev.product_id] = (productInteractions[ev.product_id] || 0) + 1;
      }
    });

    const conversionRate = counts.product_view > 0 
      ? ((counts.whatsapp_click / counts.product_view) * 100).toFixed(1)
      : '0.0';

    return {
      counts,
      conversionRate,
      sourceBreakdown,
      productInteractions,
      totalEvents: events.length,
    };
  }
};
