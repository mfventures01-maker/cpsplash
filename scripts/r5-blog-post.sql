-- Insert blog post for HOEOS certification
INSERT INTO public.blog_posts (
  tenant_id,
  title,
  slug,
  excerpt,
  content,
  featured_media_id,
  status,
  published_at,
  seo_title,
  seo_description
)
SELECT
  '42d36cee-4cd6-43d1-af5d-334e5a07e37c',
  'HOEOS SEO Certification Test Post',
  'hoeos-seo-test',
  'A certified test post verifying end-to-end OpenGraph, canonical, and image resolution protocols.',
  'This is an authoritative test post for HOEOS image pipeline certification.',
  ma.id,
  'published',
  now(),
  'HOEOS SEO Certification Test Post | CP Fruit Splash',
  'Authoritative HOEOS certification blog post testing OpenGraph image pipeline.'
FROM public.media_assets ma
WHERE ma.tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'
  AND ma.filename = 'test-hero.png'
  AND ma.status = 'active'
LIMIT 1;

-- Verify
SELECT slug, title, status, featured_media_id, published_at
FROM public.blog_posts
WHERE slug = 'hoeos-seo-test';
