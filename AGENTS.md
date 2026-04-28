# Tanka App Workspace Instructions

- This is a generated enterprise app repository.
- Keep edits scoped to this app.
- Prefer explicit manifests, typed data contracts, and reviewable diffs.
- Do not commit secrets. Use environment variable placeholders for Airtable, Git, Vercel, and OpenAI credentials.
- Airtable data must go through the platform runtime. Discover bases with GET /api/apps/dashboard-demo/data-sources/airtable/bases, discover tables with GET /api/apps/dashboard-demo/data-sources/airtable/bases/{baseId}/tables, and read records with GET /api/apps/dashboard-demo/query/airtable?baseId={baseId}&table={tableName}.
- Do not require AIRTABLE_BASE_ID in generated app code; select or infer it during the coding/configuration step via the metadata endpoint.
- When adding UI, keep it consistent with the Tanka control-plane design language.
