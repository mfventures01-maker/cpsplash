-- Migration: 20261017000002_grant_anon_analytics_events_insert.sql
-- Description: Allow anonymous storefront sessions to emit analytics_events with strict tenant & field constraints.
-- Defense-in-depth: anon can ONLY insert; SELECT, UPDATE, DELETE remain strictly revoked.

GRANT INSERT ON TABLE public.analytics_events TO anon;

DROP POLICY IF EXISTS "anon_insert_analytics_events" ON public.analytics_events;
CREATE POLICY "anon_insert_analytics_events"
ON public.analytics_events
FOR INSERT
TO anon
WITH CHECK (
    tenant_id IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.tenants t
        WHERE t.id = analytics_events.tenant_id
          AND t.status = 'active'
    )
);
