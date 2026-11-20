-- One active media asset per tenant/scope/placement key.
-- Duplicate audit was run before applying this index and returned zero rows.
-- Reuses the existing media_placements contract; no parallel media schema is introduced.
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_placements_active_slot_unique
ON public.media_placements (
  tenant_id,
  scope_type,
  COALESCE(scope_id, ''),
  placement_key
)
WHERE active = true;
