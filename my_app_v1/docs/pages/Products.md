# Page: Products (`/products`)

**File:** `src/views/Products.vue`
**Route name:** `Products`
**Auth required:** Yes (`meta: { requiresAuth: true }`)

---

## Current State

Placeholder page — not yet implemented.

```
┌─────────────────────────────┐
│  (orb-cyan background)      │
│                             │
│     [Package icon]          │
│        产品                  │
│       敬请期待               │
│                             │
└─────────────────────────────┘
```

---

## Styling

- Background: `var(--bg-base)`
- Single orb: cyan, top-right (`var(--orb-cyan)`)
- Icon color: `#00e5ff` at 50% opacity
- Centered flex layout

---

## Implementation Notes (when building out)

- This page is auth-gated — user must be logged in
- Suggested content: full product catalog with search/filter
- Can reuse `CATEGORY_VISUAL`, `ICON_MAP`, `COLOR_MAP` patterns from `Home.vue`
- Product data API: `fetchProducts()` from `src/api/product.ts`
- Follow glass card + 3D icon pattern
- Add entrance animations with `v-motion` spring transitions
