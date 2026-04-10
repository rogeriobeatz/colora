# Colora Master Documentation (GEMINI.md)

## 1. Project Overview
Colora is a B2B White-Label SaaS platform for photorealistic paint simulation. It allows paint retailers to provide an AI-powered visualization tool to their customers.
- **Model:** B2B2C (Tenant: Store, End-user: Customer).
- **Core Value:** Eliminates "decision paralysis" by showing real paint colors in the user's actual room.

## 2. Tech Stack & Standards
- **Frontend:** React 18, Vite, TypeScript (Strict).
- **UI/UX:** Tailwind CSS, shadcn/ui, Lucide React, Jost Font.
- **State Management:** TanStack Query v5 (Server), StoreContext (Global), useSimulator (Feature).
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- **AI Infrastructure:**
    - **Gemini 2.0 Flash:** Room structural analysis (surfaces, objects).
    - **Flux Kontext (Kie.AI):** Photorealistic image-to-image painting.
- **Payments:** Stripe (Subscriptions, One-time token top-ups).

## 3. Core Architecture
### A. White-Labeling (BrandingApplier.tsx)
- **Runtime Theme:** CSS variables (`--primary`, `--background`, etc.) are injected into `:root` based on `StoreContext` data.
- **WCAG Compliance:** Foreground colors are auto-calculated for contrast (AA standard).
- **Isolation:** Multi-tenancy via Row Level Security (RLS) in PostgreSQL. Tenants only see their own catalogs/users.

### B. Simulator Engine (useSimulator.ts)
- **Flow:** Upload -> `analyze-room` (Gemini) -> `paint-wall` (Flux) -> Cache/Result.
- **Persistence:** Uses `idb` (IndexedDB) via `simulator-db.ts` for offline-resilient sessions.
- **Optimization:** `wall_cache` table stores analyzed room hashes to avoid redundant Gemini calls.

### C. Token Economy
- **Unit:** 1 Token = 1 Photorealistic Painting.
- **Ledger:** Current balance in `profiles.tokens`, history in `token_consumptions`.
- **Logic:**
    - Room Analysis: Free (0 tokens).
    - Painting: 1 Token (deducted after successful generation).
- **Provisioning:** Stripe Webhooks and `generate-auth-link` handle credit top-ups and subscriptions.

## 4. Database Schema (Key Tables)
- `profiles`: User/Store data, branding settings, token balance.
- `companies`: (Deprecated/Merged into profiles in some versions, check RLS).
- `catalogs` / `paints`: Store-specific paint collections.
- `token_consumptions`: Audit log of all token transactions.
- `wall_cache`: Hashes of original images + detected surfaces.

## 5. Development Rules
- **UI:** Always check `src/components/ui/` before creating new components.
- **Icons:** Use `lucide-react` only.
- **Styling:** Tailwind only. No custom CSS except in `index.css` for variables.
- **Backend:** All heavy logic in `supabase/functions/`. No direct API calls from frontend to 3rd party AI.
- **Errors:** Wrap app in `ErrorBoundary`. Use `sonner` for notifications.
- **Environment:** Use `import.meta.env.VITE_*` (not `process.env`).

## 6. Critical Fixes & Gotchas
- **HeaderStyleMode:** Must include `glass | gradient | card | minimal | primary | white | white-accent`.
- **LocalStorage:** Always wrap `JSON.parse` in try-catch with validation in `StoreContext`.
- **Auth Events:** `subscription-updated` event triggers `refreshData()` in `StoreContext`. Use debounce to avoid loops.
- **Vite Build:** Ensure `process.env` is replaced with `import.meta.env`.

## 7. Directory Structure
- `src/api/`: Health checks and external service wrappers.
- `src/components/simulator/`: Core simulation logic and UI.
- `src/contexts/`: `AuthContext` (tokens/session), `StoreContext` (branding/catalogs).
- `src/hooks/`: `useSimulator`, `useSubscriptionCheck`, `useAccessibleStyles`.
- `src/lib/`: `simulator-db.ts` (IndexedDB), `image-preprocess.ts`.
- `supabase/functions/`: Deno Edge Functions (AI and Stripe logic).

## 8. Critical Procedures
- **Adding a Component:** Check shadcn -> add to `src/components/ui/` if missing -> use in page.
- **New IA Feature:** Create Edge Function -> Add RLS policy -> Implement frontend hook.
- **Styling Update:** Update `BrandingApplier.tsx` to ensure all children components inherit the new CSS variable.
