# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server (port 8080)
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # ESLint
npm run preview      # Preview production build
```

No test framework is configured.

## Tech Stack

- **Frontend:** React 18 + TypeScript 5.8 + Vite (SWC)
- **UI:** shadcn/ui (Radix primitives) + Tailwind CSS 3
- **State:** TanStack React Query (server state), Zustand (client state), React Hook Form + Zod (forms)
- **Routing:** React Router DOM 6
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **Edge Functions:** Deno runtime, located in `supabase/functions/`
- **AI Providers:** Google AI, OpenAI, Anthropic (keys managed in DB, used by Edge Functions)

## Architecture

### Path Alias
`@/` maps to `src/` (configured in vite.config.ts and tsconfig).

### Data Flow
Pages fetch data via custom hooks (`src/hooks/`) that call Supabase directly. React Query handles caching. Edge Functions handle AI/LLM calls and external API integrations (scraping, Gamma presentations).

### Key Patterns
- **Hooks** (`src/hooks/`): Each domain entity has a hook (e.g., `useHotels`, `useAgentConfigs`). They encapsulate Supabase queries and return data + CRUD operations.
- **Module System** (`src/lib/modules-data.ts`): 11+ analysis modules, each with checklist, questions, and agent config. Module execution runs through Edge Functions with LLM streaming.
- **Route Guards**: `ProtectedRoute` (auth check), `AdminRoute` (role check), `PublicRoute` (redirects if authenticated).
- **ViewModeContext** (`src/contexts/`): Toggles between admin and user views.

### Public Routes (no auth)
- `/manual/:hotelId/:token` — Public manual form
- `/v/:slug` — Public client view

### Design System
- Montserrat (display) + Inter (sans) fonts
- HSL-based color tokens, red primary (#EF3B3A), gold accents
- Zero border-radius (sharp corners)
- Dark mode supported via CSS variables
- `cn()` utility for class merging (Tailwind)

### Supabase
- Migrations in `supabase/migrations/`
- Auto-generated types in `src/integrations/supabase/types.ts`
- RLS enabled on all tables, UUID primary keys
- API keys for LLM providers stored in `api_keys` table

## Language

The application UI is in Portuguese (pt-BR). Code identifiers and comments may mix Portuguese and English.
