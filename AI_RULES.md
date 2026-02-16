# AI Development Rules - Colora

## Tech Stack
- **Vite + React + TypeScript**: Core framework for a fast, type-safe development experience.
- **Tailwind CSS**: Utility-first CSS framework for all styling and responsive layouts.
- **shadcn/ui**: Primary component library for accessible and consistent UI elements.
- **Lucide React**: Standard icon library used throughout the application.
- **React Router (v6)**: Handles all client-side routing and navigation.
- **TanStack Query (v5)**: Manages server state and data fetching.
- **Supabase**: Backend-as-a-Service for Edge Functions, Authentication, and Database.
- **Sonner**: Used for all toast notifications and user feedback.
- **AI Services**: Gemini (via Lovable API) for room analysis and Flux Kontext (via Kie.AI) for photorealistic wall painting.

## Library Usage Rules

### 1. UI Components
- **Rule**: Always check `src/components/ui/` for existing shadcn/ui components before creating new ones.
- **Rule**: Use `lucide-react` for all icons. Do not install alternative icon libraries.

### 2. Styling
- **Rule**: Use Tailwind CSS classes exclusively. Avoid writing custom CSS in `.css` files unless defining global variables or complex animations in `src/index.css`.
- **Rule**: Follow the design tokens (colors, shadows, gradients) defined in `src/index.css`.

### 3. State Management
- **Rule**: Use `StoreContext` (`src/contexts/StoreContext.tsx`) for global application state like company settings, catalogs, and paint data.
- **Rule**: Use local state (`useState`) or specialized hooks like `useSimulator` for feature-specific logic.

### 4. Backend & AI
- **Rule**: All AI-heavy operations (image analysis, image generation) must be handled via Supabase Edge Functions located in `supabase/functions/`.
- **Rule**: Use the `supabase` client from `@/integrations/supabase/client` to interact with backend services.

### 5. Notifications
- **Rule**: Use `toast` from `sonner` for all user-facing alerts and success/error messages.

### 6. File Structure
- **Pages**: Place in `src/pages/`.
- **Components**: Place in `src/components/` (feature-specific subfolders are encouraged).
- **Hooks**: Place in `src/hooks/`.
- **Data/Types**: Place in `src/data/` or `src/components/[feature]/types.ts`.