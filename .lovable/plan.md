

## Diagnosis

There are two issues causing the Simulator header to not respect user personalizations:

### Issue 1: Style validator is incomplete
In `StoreContext.tsx` (line 94), the `isHeaderStyleMode` function only validates 4 styles:
```typescript
function isHeaderStyleMode(v: any): v is HeaderStyleMode {
  return v === "glass" || v === "gradient" || v === "card" || v === "minimal";
}
```
But the type `HeaderStyleMode` (in `defaultColors.ts`) includes 7 styles: `"glass" | "gradient" | "card" | "minimal" | "primary" | "white" | "white-accent"`.

If a user selects `"primary"`, `"white"`, or `"white-accent"` in the Dashboard, the value is saved to the database correctly, but when reloaded via `refreshData()`, the validator rejects it and falls back to `"glass"`. This means the Simulator always sees `"glass"` for those styles.

### Issue 2: Dashboard and Simulator headers are inconsistent
The Dashboard has its own inline header (lines 883-912) that supports `glass`, `gradient`, `card`, and `minimal`. The Simulator uses `SimulatorHeader.tsx` which supports `glass`, `primary`, `white`, and `white-accent`. There is no shared header component, and each page supports a different subset of styles.

## Proposed Plan

### 1. Fix the `isHeaderStyleMode` validator in `StoreContext.tsx`
Add the missing 3 styles (`"primary"`, `"white"`, `"white-accent"`) so they are no longer discarded on load.

### 2. Unify header style support in `SimulatorHeader.tsx`
Add support for the `gradient`, `card`, and `minimal` styles that exist in the Dashboard, so the Simulator header renders them consistently.

### 3. (Optional suggestion) Unify header style support in `Dashboard.tsx`
Add support for `primary`, `white`, and `white-accent` in the Dashboard header as well, so all 7 styles work in both places.

### Files to modify
- `src/contexts/StoreContext.tsx` — fix validator (1 line)
- `src/components/simulator/SimulatorHeader.tsx` — add missing style variants (`gradient`, `card`, `minimal`)
- Optionally: `src/pages/Dashboard.tsx` — add missing style variants (`primary`, `white`, `white-accent`)

This is a straightforward fix. The core bug is the validator rejecting valid styles.

