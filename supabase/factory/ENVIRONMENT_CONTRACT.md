# Environment and Secret Contract

## Environment matrix

| Environment | Supabase project | Hosting target | Data |
|---|---|---|---|
| Local | Local Supabase or isolated dev project | localhost | Synthetic fixtures |
| Preview | Dedicated preview/staging project | Preview deployment | Synthetic or explicitly approved test data |
| Production | New app's production project | Production deployment | Real tenant data |

Do not point Preview at CP Splash production. Do not use a production service-role key locally.

## Browser variables

```dotenv
VITE_SUPABASE_URL=https://<new-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-or-anon-key>
VITE_PUBLIC_TENANT_SLUG=<new-tenant-slug>
```

## Server-only variables

```dotenv
SUPABASE_URL=https://<new-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-secret>
PAYMENT_WEBHOOK_SECRET=<provider-secret>
```

Only define server-only variables in a trusted server/Edge Function environment. Never commit real values.

## Repository safeguards

- Add `.env`, `.env.*`, `.env.local` to `.gitignore`; allow only `.env.example`.
- Enable secret scanning and push protection where available.
- Redact Authorization headers, cookies, API keys and signed URLs from logs.
- Rotate any secret that was committed or exposed.
- Keep project references and tenant slugs in a non-secret deployment manifest; keep credentials in the platform's secret manager.

## Release identity assertion

Before any deployment or migration, CI must assert:
- expected Git branch and commit SHA,
- expected Supabase project reference,
- expected hosting environment,
- expected tenant slug,
- expected migration target.

If any value is absent or mismatched, fail closed.
