# Genapps Workspace Instructions

## Scope
- This is a generated enterprise app repository, deployed to Vercel via GitHub.
- Keep edits scoped to this app. Prefer explicit manifests, typed data contracts, and reviewable diffs.
- Do not commit secrets. Use environment variable placeholders only.
- UI should follow the Tanka control-plane design language.

## Connectors — Tanka-Link MCP gateway
All third-party data and operations (Airtable, HubSpot, Linear, GitHub-link, etc.) go through the Tanka-Link MCP gateway.

Runtime contract (used by the deployed Next.js app):
- Base URL: `process.env.TANKA_LINK_MCP_BASE_URL` (configured per environment by Genapps).
- User identity: `process.env.TANKA_TEST_USER_ID` for now; eventually replaced by the logged-in user resolved via Tanka Platform SDK.
- Per-app endpoint: `${TANKA_LINK_MCP_BASE_URL}/{appName}` (e.g., `.../airtable`).
- Protocol: JSON-RPC 2.0 POST. Header `X-User-Id: <userId>`. Methods: `initialize`, `tools/list`, `tools/call` with `{ name, arguments }`.
- Response envelope: backend wraps `{ code, debugMsg, data: <MCP response> }`. Unwrap `data` when it has a `jsonrpc` key, then read `result.content`.
- All connector calls MUST happen on the server side (Server Components / Route Handlers / Server Actions). Do not expose the gateway or userId to the browser.

Editor-time discovery (use these only while writing code, not in generated runtime code):
- List the tools an app exposes: GET /api/apps/dashboard-demo/connectors/{appName}/tools
- Invoke a tool for testing: POST /api/apps/dashboard-demo/connectors/{appName}/call body { tool, arguments, userId? }

Generated apps should:
- Create a small `lib/tanka-link.ts` helper that wraps `callLinkTool(appName, toolName, args)` and reads env vars at runtime.
- Map each external entity (e.g., 'customer', 'lead') to a specific MCP `tool` call discovered via `tools/list`; do not hardcode HTTP paths to Airtable / Salesforce / etc.
- Cache nothing client-side. Use Next.js `cache: 'no-store'` server fetches.
- Surface a clear empty state when `TANKA_LINK_MCP_BASE_URL` or `TANKA_TEST_USER_ID` is missing — tell the user to configure them in Settings.

## Forbidden
- Do not call `https://api.airtable.com` (or any third-party API) directly from generated code.
- Do not rely on Genapps platform endpoints (`/api/apps/.../data-sources/...`, `/api/apps/.../query/...`) at runtime. Those are deprecated and only exist for legacy compatibility.
- Do not require `AIRTABLE_TOKEN` / `AIRTABLE_BASE_ID` in generated code; the OAuth token lives on the Tanka-Link gateway, not in the app.
