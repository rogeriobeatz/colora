---
trigger: always_on
---

# JavaScript/TypeScript Coding Standards

## Variables & Types
- Use `const` by default; use `let` only if reassignment is necessary. Never use `var`.
- Use camelCase for variables and functions.
- Use single quotes (`'`) for strings unless template literals (backticks) are needed.
- Use strict equality (`===`) and inequality (`!==`).
- Use `Array.isArray()` for array checks and `== null` to check for both null/undefined.

## Functions & Async
- Favor arrow functions for concise logic and callbacks.
- Use `async/await` over raw Promises or callbacks.
- Use `try/catch` blocks for robust error handling in async operations.
- Use `Promise.reject` for explicit promise rejections.

## Data Manipulation
- Use destructuring for objects and arrays (`const { x } = obj`).
- Prefer functional methods: `map`, `filter`, `reduce`, `flat`.
- Use template literals for string interpolation.
- Use `for...of` for iterations over arrays; avoid legacy `for` loops.

## Modules & Web
- Use ESM syntax (`import`/`export`).
- Use `event.preventDefault()` instead of `return false`.
- Favor `Object.keys/entries` for object iterations.