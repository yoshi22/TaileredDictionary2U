# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important References

- **TODO.md**: 現在のタスクリストと進捗状況。作業開始前に必ず確認してください。

## Project Overview

TaileredDictionary2U (TD2U) is a personal vocabulary learning app with AI-powered enrichment and spaced repetition system (SRS).

**Core Value**: Register unknown terms → AI generates learning content (translations, summaries, examples, related terms) → SRS optimizes review timing.

## Tech Stack

- **Web**: Next.js 14 (App Router) + TypeScript (strict mode) + Tailwind CSS
- **Backend/DB/Auth**: Supabase (PostgreSQL + Auth + RLS)
- **AI**: OpenAI GPT-4o-mini
- **Payments**: Stripe (web), RevenueCat (future mobile)
- **Mobile (future)**: React Native + Expo
- **Monorepo**: Turborepo + pnpm workspaces

## Development Commands

```bash
# Install dependencies
pnpm install

# Local Supabase (requires Docker)
supabase start        # Start local Supabase (PostgreSQL, Auth, Studio)
supabase stop         # Stop local Supabase
supabase status       # Check status and get local keys
supabase db reset     # Reset DB and reapply all migrations

# Development
pnpm dev:web          # Start Next.js dev server at localhost:3000

# Quality checks
pnpm lint             # ESLint
pnpm type-check       # TypeScript type checking
pnpm test             # Unit tests (Vitest)
pnpm test:e2e         # E2E tests (Playwright) - in apps/web

# Build
pnpm build            # Production build (all packages)
pnpm clean            # Clean all build artifacts

# Single package commands
pnpm --filter web dev           # Run dev in web app only
pnpm --filter @td2u/shared-srs test  # Run tests in specific package
```

## Local Development Setup

1. **Start Docker Desktop**
2. **Start local Supabase**: `supabase start`
3. **Create `.env.local`**: Copy from `.env.example`, fill with keys from `supabase status`
4. **Apply migrations**: `supabase db reset`
5. **Start dev server**: `pnpm dev:web`

Local URLs:
- App: http://localhost:3000
- Supabase Studio: http://127.0.0.1:54323
- Supabase API: http://127.0.0.1:54321
- Mailpit (email testing): http://127.0.0.1:54324

## Architecture

### Monorepo Structure (Turborepo)

```
apps/
  web/                 # Next.js web application
  mobile/              # Expo mobile app (future)
packages/
  shared-types/        # TypeScript type definitions
  shared-utils/        # Common utilities
  shared-srs/          # SRS algorithm (SM-2 implementation)
  shared-validations/  # Zod schemas
```

### Web App Structure (apps/web/)

```
app/
├── (public)/         # No auth required (landing, login, signup, pricing)
├── (authenticated)/  # Auth required (dashboard, entry, review, decks, settings)
├── api/              # Route Handlers (REST API)
└── checkout/         # Stripe checkout pages
lib/
├── supabase/         # Client (browser), server, middleware clients
├── llm/              # LLM provider abstraction (OpenAI implementation)
├── billing/          # Stripe and entitlements logic
components/           # Domain-organized (ui, layout, entry, review, deck, billing)
```

### Package Dependencies

```
shared-types     ← No dependencies (base types)
shared-utils     ← No dependencies (utilities)
shared-srs       ← shared-types (SM-2 algorithm)
shared-validations ← zod (Zod schemas)
web              ← All shared packages
```

### Key Data Flow

1. **Entry Creation**: User input → API validates → Supabase insert → Trigger AI enrichment
2. **AI Enrichment**: Load prompt template → Call OpenAI → Parse JSON response → Update entry
3. **SRS Review**: Fetch due entries → User rates difficulty → SM-2 calculates next interval → Update srs_data

## Domain Concepts

### SRS Algorithm (SM-2)

Located in `packages/shared-srs/`. Key concepts:
- **Ease Factor**: Multiplier for interval calculation (starts at 2.5, min 1.3)
- **Interval**: Days until next review
- **Rating**: Again(0), Hard(1), Good(2), Easy(3)
- "Again" resets interval to 1 day; consecutive correct answers extend interval exponentially

### Entitlements System

Single source of truth in `entitlements` table:
- `plan_type`: 'free' | 'plus'
- `generation_limit`: Max AI generations per period
- `generation_used`: Current usage count
- `credit_balance`: Purchased credits (Plus only)

Consumption priority: monthly quota first → credits when exceeded

### AI Enrichment Output

Prompt templates in `prompts/`. Expected JSON structure:
```json
{
  "translation_ja": "Japanese translation",
  "translation_en": "English translation",
  "summary": "3-line explanation",
  "examples": ["usage example 1", "..."],
  "related_terms": ["term1", "term2"],
  "reference_links": [{"title": "...", "url": "..."}]
}
```

## Database

Key tables (see `supabase/migrations/`):
- `profiles`: User profile linked to Supabase Auth
- `entitlements`: Usage limits and credits
- `decks`: User-created card decks
- `entries`: Vocabulary entries with AI-generated enrichment (JSONB)
- `srs_data`: Per-entry SRS state (ease_factor, interval, next_review_at)
- `usage_logs`: Action logging
- `credit_transactions`: Credit purchase/consumption history

Key views:
- `v_entries_with_srs`: Entries joined with SRS data
- `v_due_entries`: Entries due for review
- `v_user_stats`: User statistics

All tables use Row Level Security (RLS) - users can only access their own data.

Triggers automatically create:
- `profiles`, `entitlements`, default deck on user signup
- `srs_data` record when entry is created

## Environment Variables

Required in `apps/web/.env.local` (see `.env.example`):
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# OpenAI
OPENAI_API_KEY

# Stripe
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_PLUS_PRICE_ID
STRIPE_CREDIT_100_PRICE_ID

# App
NEXT_PUBLIC_APP_URL
```

For local development, run `supabase status` to get Supabase keys.

## Testing Strategy

- **Unit**: Vitest for SRS calculator, validations, utilities (`pnpm test`)
- **Integration**: API route tests with mocked Supabase
- **E2E**: Playwright for critical user flows (`pnpm --filter web test:e2e`)

Run single test file:
```bash
pnpm --filter @td2u/shared-srs test -- calculator.test.ts
```

## Important Patterns

### API Error Handling
All API routes return consistent error format:
```json
{ "error": { "code": "ERROR_CODE", "message": "Human readable" } }
```

### LLM Provider Abstraction
`lib/llm/types.ts` defines interface - implementations are swappable (OpenAI now, Claude/Gemini possible).

### Webhook Idempotency
Stripe webhooks store event IDs in `webhook_events` table to prevent duplicate processing.

### Validation
Zod schemas in `shared-validations` are used on both client and server for runtime validation.

### Path Aliases
- Web app uses `@/*` → `./` (e.g., `@/lib/supabase/client`)
- Shared packages are imported as `@td2u/shared-*`

## Documentation

Detailed docs in `/docs/`:
- `00_overview.md` - Project vision and glossary
- `03_architecture_web.md` - System architecture
- `04_data_model.md` - Database schema details
- `07_srs_design.md` - SM-2 algorithm specs
- `08_billing_entitlements.md` - Pricing model
- `development-logs/` - Development history
