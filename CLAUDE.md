# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TaileredDictionary2U (TD2U) is a personal vocabulary learning app with AI-powered enrichment and spaced repetition system (SRS).

**Core Value**: Register unknown terms → AI generates learning content (translations, summaries, examples, related terms) → SRS optimizes review timing.

## Tech Stack

- **Web**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend/DB/Auth**: Supabase (PostgreSQL + Auth + RLS)
- **AI**: OpenAI GPT-4o-mini
- **Payments**: Stripe (web), RevenueCat (future mobile)
- **Mobile (future)**: React Native + Expo

## Development Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev:web          # Start Next.js dev server at localhost:3000

# Quality checks
pnpm lint             # ESLint
pnpm type-check       # TypeScript type checking
pnpm test             # Unit tests (Vitest)
pnpm test:e2e         # E2E tests (Playwright)

# Build
pnpm build            # Production build

# Supabase
supabase db push      # Apply migrations
supabase db seed      # Insert seed data
```

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

### Web App Layers

```
app/                   # Next.js App Router pages and API routes
├── api/              # Route Handlers (REST API)
lib/
├── supabase/         # Supabase client and auth helpers
├── llm/              # LLM provider abstraction
├── billing/          # Stripe and entitlements logic
components/           # React components
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
- `entries`: Vocabulary entries with AI-generated enrichment
- `srs_data`: Per-entry SRS state (ease_factor, interval, next_review_at)

All tables use Row Level Security (RLS) - users can only access their own data.

## Environment Variables

Required in `apps/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

## Testing Strategy

- **Unit**: Vitest for SRS calculator, validations, utilities
- **Integration**: API route tests with mocked Supabase
- **E2E**: Playwright for critical user flows (auth, entry creation, review)

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
