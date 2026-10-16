import { execSync } from 'child_process';
import fs from 'fs';

const queries = {
  'A4_funnel_placements': `
    SELECT
      mp.scope_type, mp.scope_id, mp.sort_order, mp.active,
      ma.filename, ma.mime_type, ma.bucket, ma.path
    FROM public.media_placements mp
    JOIN public.media_assets ma ON ma.id = mp.media_id
    WHERE mp.tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'
    ORDER BY mp.scope_type, mp.scope_id, mp.sort_order;
  `,
  'A4_blog_posts': `
    SELECT
      bp.slug, bp.title, bp.status, bp.published_at,
      ma.path AS featured_image_path, ma.bucket AS featured_image_bucket
    FROM public.blog_posts bp
    LEFT JOIN public.media_assets ma ON ma.id = bp.featured_media_id
    WHERE bp.tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c'
    ORDER BY bp.created_at DESC;
  `,
  'A5_storage_objects': `
    SELECT bucket_id, name, created_at, (metadata->>'size')::bigint AS size_bytes
    FROM storage.objects
    WHERE bucket_id = 'cp-public'
    ORDER BY created_at DESC
    LIMIT 20;
  `,
  'A6_storage_policies': `
    SELECT policyname, cmd, roles, qual
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    ORDER BY policyname;
  `,
  'A7_table_policies': `
    SELECT tablename, policyname, cmd, roles, qual
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('products','product_media','media_assets','media_placements','blog_posts')
    ORDER BY tablename, policyname;
  `
};

const results = {};

for (const [key, sql] of Object.entries(queries)) {
  console.log(`Running query: ${key}...`);
  const tempFile = `scripts/temp-${key}.sql`;
  fs.writeFileSync(tempFile, sql.trim(), 'utf8');
  try {
    const raw = execSync(`npx supabase db query --linked --file ${tempFile}`, { encoding: 'utf8' });
    // find JSON in raw
    const jsonStart = raw.indexOf('{');
    if (jsonStart !== -1) {
      const jsonStr = raw.slice(jsonStart);
      const parsed = JSON.parse(jsonStr);
      results[key] = parsed.rows || parsed;
    } else {
      results[key] = raw;
    }
  } catch (err) {
    results[key] = { error: err.message, stderr: err.stderr?.toString() };
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
}

fs.writeFileSync('scripts/phase-a-sql-results.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Finished. Results saved to scripts/phase-a-sql-results.json');
