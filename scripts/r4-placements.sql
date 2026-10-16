-- Insert a funnel_hero placement for sports
INSERT INTO public.media_placements (
  tenant_id, media_id, placement_key, scope_type, scope_id, sort_order, active
)
SELECT
  '42d36cee-4cd6-43d1-af5d-334e5a07e37c',
  ma.id,
  'sports_hero_' || EXTRACT(EPOCH FROM now())::text,
  'funnel_hero',
  'sports',
  1,
  true
FROM public.media_assets ma
WHERE ma.tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'
  AND ma.filename = 'test-video.mp4'
  AND ma.status = 'active'
LIMIT 1;

-- Insert a funnel_card placement for sports
INSERT INTO public.media_placements (
  tenant_id, media_id, placement_key, scope_type, scope_id, sort_order, active
)
SELECT
  '42d36cee-4cd6-43d1-af5d-334e5a07e37c',
  ma.id,
  'sports_card_' || EXTRACT(EPOCH FROM now())::text,
  'funnel_card',
  'sports',
  1,
  true
FROM public.media_assets ma
WHERE ma.tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'
  AND ma.filename = 'test-animation.gif'
  AND ma.status = 'active'
LIMIT 1;

-- Verify
SELECT scope_type, scope_id, placement_key, active
FROM public.media_placements
WHERE tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'
  AND scope_id = 'sports'
ORDER BY scope_type;
