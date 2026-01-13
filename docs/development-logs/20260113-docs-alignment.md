# 2026-01-13 - Docs alignment with implementation

## Summary
- Audited `docs/` after recent product/code changes.
- Updated multiple specs (overview, PRD, user flows, architecture, data model, API references, deployment guide, etc.) to match current behavior.
- Documented CSV import/export, profile endpoint, SRS tweaks, LLM prompt strategy, entitlement RPC, and env var requirements.

## Notable Changes
- Clarified Entry creation + AI generation flow (Entry detail triggers enrichment) and landing page behavior.
- Added coverage for `/api/entries/import|export`, `/api/profile`, `/api/billing/credits/purchase` in API docs.
- Synced dependency versions and repo structure (removed non-existent `apps/mobile`, `prompts/` dirs; noted embedded prompts).
- Reflected actual SRS algorithm (Again lowers EF, Hard multiplies interval) and new `consume_generation_atomic` RPC usage.
- Expanded deployment env-var table (Stripe price IDs, Upstash, Sentry) and noted metrics/testing gaps still pending.

## Follow-ups
- Keep README / TODO in sync with doc changes.
- When PostHog or mobile work starts, update 10_metrics_growth.md / 12_mobile_plan.md accordingly.
