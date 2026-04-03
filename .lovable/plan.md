

# Plan: Design Standardization + Build Error Fixes

## Summary
Standardize the design system across all pages into two tiers: (1) **Public pages** (Landing, Login, Reset, Terms, Privacy, Checkout, CheckoutSuccess) using Colora brand identity, and (2) **White-label pages** (Dashboard, Simulator) using client branding with WCAG-safe fallbacks. Also fix all current build errors.

---

## Part 1: Fix Build Errors (prerequisite)

These must be resolved first to unblock everything:

1. **`StoreFooter.tsx` line 109** — `documentNumber` doesn't exist on `Company`. Add `documentNumber?: string` to `Company` interface in `defaultColors.ts`.

2. **`useSimulator.ts` line 8** — imports `Paint` from `./types` but it's not exported there (it's in `defaultColors`). Change import to `import { Paint } from "@/data/defaultColors"`.

3. **`Dashboard.tsx` line 160** — `CatalogsTab` receives props it doesn't declare (`newCatalogName`, `editingCatalogId`, `editingCatalogName`, `handleSaveCatalog`, `setEditingCatalogId`, `setEditingCatalogName`). Add these missing props to `CatalogsTabProps` interface, or internalize them in the tab component.

4. **`useCatalogManagement.ts` line 49** — `paints` passed to `addCatalog` but type excludes it. Fix the `addCatalog` call to match the expected type signature.

5. **`useCatalogManagement.ts` line 108** — `importPaintsCSV` receives `File` but expects `string`. Update the `importPaintsCSV` signature or convert file to string before passing.

6. **`useDashboardState.ts` line 172** — `checkSubscription` returns `Promise<void>`, so testing its result for truthiness fails. Update `checkSubscription` in `AuthContext` to return the subscription status object, or refactor the check logic to not rely on a return value.

---

## Part 2: Create Shared Public Layout Component

**New file: `src/components/layouts/PublicLayout.tsx`**

A shared layout for all public-facing (non-authenticated) pages with:
- Consistent navbar: Colora logo (left), contextual back-link or nav items (right)
- Backdrop blur header with `sticky top-0`
- Consistent container: `max-w-4xl mx-auto` with standard padding
- Shared footer with links to Terms, Privacy, and copyright
- Consistent background: `bg-white` base with subtle gradient accents

**Apply to**: Terms, Privacy, ResetPassword, Login, Checkout, CheckoutSuccess

Currently each page duplicates its own nav bar with slight variations. The shared layout eliminates this duplication.

---

## Part 3: Standardize Public Pages

For each public page, wrap content in `<PublicLayout>` and normalize:

- **Terms & Privacy**: Already similar — just wrap in shared layout, remove duplicated nav
- **Login & ResetPassword**: Wrap in shared layout, keep form cards centered with consistent card styling (`rounded-2xl border shadow-sm bg-white`)
- **Checkout**: Wrap in shared layout, normalize form card to match Login style
- **CheckoutSuccess**: Wrap in shared layout, normalize status cards

Typography rules for all public pages:
- Page titles: `text-2xl font-display font-bold`
- Section headings: `text-lg font-semibold`
- Body text: `text-sm text-muted-foreground`
- Consistent spacing tokens from `index.css`

---

## Part 4: Strengthen White-Label WCAG Compliance

**In `BrandingApplier.tsx`**, enhance the CSS variable generation to always produce WCAG AA-safe foreground colors:

- When applying `--primary`, compute relative luminance and auto-set `--primary-foreground` to white or dark based on contrast ratio >= 4.5:1
- Same for `--secondary` / `--secondary-foreground`
- Add fallback values for all header style variables so pages render correctly even with no client branding configured
- Ensure `--background` and `--foreground` always maintain minimum 4.5:1 contrast

**In Dashboard and Simulator headers**, add defensive CSS:
- Use `color: var(--header-fg, hsl(var(--foreground)))` pattern everywhere
- Ensure token badges, buttons, and text remain readable regardless of client color choices

---

## Part 5: Normalize Dashboard & Simulator Shared Patterns

- Ensure both pages use consistent spacing (`p-4 lg:p-8`) and max-width containers
- Standardize the token display badge component (currently duplicated with slight differences)
- Ensure mobile menu triggers use consistent sizing and positioning

---

## Files to Create
- `src/components/layouts/PublicLayout.tsx`

## Files to Modify
- `src/data/defaultColors.ts` (add `documentNumber` to Company)
- `src/components/simulator/useSimulator.ts` (fix Paint import)
- `src/pages/Dashboard.tsx` (fix CatalogsTab props)
- `src/pages/Dashboard/components/CatalogsTab.tsx` (add missing props to interface)
- `src/pages/Dashboard/hooks/useCatalogManagement.ts` (fix type mismatches)
- `src/pages/Dashboard/hooks/useDashboardState.ts` (fix void check)
- `src/contexts/AuthContext.tsx` (return value from checkSubscription)
- `src/components/BrandingApplier.tsx` (WCAG contrast enforcement)
- `src/components/StoreFooter.tsx` (no change needed after Company fix)
- `src/pages/Terms.tsx` (use PublicLayout)
- `src/pages/Privacy.tsx` (use PublicLayout)
- `src/pages/Login.tsx` (use PublicLayout)
- `src/pages/ResetPassword.tsx` (use PublicLayout)
- `src/pages/Checkout.tsx` (use PublicLayout)
- `src/pages/CheckoutSuccess.tsx` (use PublicLayout)

