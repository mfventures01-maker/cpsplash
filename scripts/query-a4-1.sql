SELECT
  p.slug,
  p.status,
  p.featured,
  COUNT(pm.media_id) AS media_count,
  MAX(CASE WHEN pm.is_primary THEN ma.path ELSE NULL END) AS primary_path,
  MAX(CASE WHEN pm.is_primary THEN ma.bucket ELSE NULL END) AS primary_bucket
FROM public.products p
LEFT JOIN public.product_media pm ON pm.product_id = p.id
LEFT JOIN public.media_assets ma ON ma.id = pm.media_id
WHERE p.tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'
GROUP BY p.id, p.slug, p.status, p.featured
ORDER BY p.created_at DESC;
