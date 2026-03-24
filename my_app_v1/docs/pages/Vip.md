# Page: VIP (`/vip`)

**File:** `src/views/Vip.vue`
**Route name:** `Vip`
**Auth required:** Yes (`meta: { requiresAuth: true }`)

---

## Current State

Placeholder page — not yet implemented.

```
┌─────────────────────────────┐
│  (orb-amber background)     │
│                             │
│     [Crown icon]            │
│      VIP 特权               │
│       敬请期待               │
│                             │
└─────────────────────────────┘
```

---

## Styling

- Background: `var(--bg-base)`
- Single orb: amber, bottom-left (`var(--orb-amber)`)
- Icon color: `#ffb800` at 50% opacity
- Centered flex layout

---

## Implementation Notes (when building out)

- This page is auth-gated
- Suggested content: VIP tier cards, privilege list, upgrade CTA
- Color theme: amber/gold (`colors.amber`, `colors.amberDark`)
- Use `colors.gradients.transfer` (`linear-gradient(135deg, #ffb800, #ff6d00)`) for VIP card accents
- Follow glass card + 3D icon pattern from other pages
- Add `v-motion` spring entrance animations
