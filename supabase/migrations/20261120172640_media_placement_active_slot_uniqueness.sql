-- HOEOS: one active asset per tenant + scope + logical placement slot.
-- The live duplicate audit returned zero active duplicate keys before application.
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_placements_active_slot_unique
ON public.media_placements (
  tenant_id,
  scope_type,
  COALESCE(scope_id, ''),
  placement_key
)
WHERE active = true;
