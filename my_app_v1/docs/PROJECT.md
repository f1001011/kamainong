# Project Context — v1 App

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Language | TypeScript |
| Router | Vue Router 4 |
| i18n | Vue I18n 9 (legacy: false) |
| Animations | @vueuse/motion (`v-motion`) |
| Icons | lucide-vue-next |
| HTTP | Axios (via `src/api/request.ts`) |
| Build | Vite |

---

## Design System

### Color Palette — Clash Color Scheme
All colors live in `src/config/colors.ts` and are injected as CSS variables via `src/composables/useTheme.ts`.

```
Background:  #080c18  (deep navy)
Red:         #ff4d4d / #ff1744
Cyan:        #00e5ff / #00b0ff
Amber:       #ffb800 / #ff6d00
Lime:        #69ff47 / #00e676
```

**CSS Variables (auto-injected to :root)**
```
--bg-base        --bg-card        --bg-card-hover
--nav-bg         --orb-red        --orb-cyan        --orb-amber
--color-red      --color-cyan     --color-amber     --color-lime
--text-primary   --text-secondary --text-muted
--border         --border-light
```

### Glass Card Pattern
```css
background: var(--bg-card);           /* rgba(255,255,255,0.07) */
backdrop-filter: blur(28px) saturate(160%);
border: 1px solid var(--border);      /* rgba(255,255,255,0.13) */
border-radius: 20px;
```

### 3D Icon Pattern
```css
transform: perspective(100px) rotateX(10deg) rotateY(-7deg);
box-shadow: 3px 4px 0 rgba(0,0,0,0.32), 6px 8px 0 rgba(0,0,0,0.16), 0 0 16px var(--glow);
```
On hover: flatten + lift (`rotateX(5deg) rotateY(-3deg) translateY(-4px)`).

### Floating Orb Background
Every page has a fixed `.bg-canvas` with 1–3 blurred orbs using CSS vars:
```html
<div class="bg-canvas">
  <div class="orb orb-red"></div>
  <div class="orb orb-cyan"></div>
  <div class="orb orb-amber"></div>
</div>
```
Orbs animate with `@keyframes drift` (translate + scale, 16–24s loops).

### Typography
```
Font stack: 'Inter', 'SF Pro Text', -apple-system, 'PingFang SC', 'Noto Sans SC', sans-serif
```

### Animation — v-motion Spring
```html
v-motion
:initial="{ opacity:0, y:30, scale:0.95 }"
:enter="{ opacity:1, y:0, scale:1, transition:{ delay:120, type:'spring', stiffness:200, damping:22 } }"
```

---

## File Structure

```
src/
├── api/
│   ├── auth.ts          login/logout API calls
│   ├── balance.ts       fetchBalanceData()
│   ├── product.ts       fetchCategories(), fetchProducts(), fetchHomeBalance()
│   └── request.ts       Axios instance (baseURL, token interceptor)
├── components/
│   ├── ActionModal.vue  Bottom-sheet modal for balance actions (deposit/withdraw/transfer/history)
│   ├── BottomNav.vue    Fixed bottom navigation (4 tabs: Home/Products/Vip/Mine)
│   └── PopupModal.vue   Toast/popup notification component
├── composables/
│   ├── usePopup.ts      showPopup(message, preset) — triggers PopupModal
│   └── useTheme.ts      Injects cssVarMap into document.documentElement
├── config/
│   ├── colors.ts        Master color palette + cssVarMap export
│   ├── config.ts        CURRENCY = '¥'
│   └── popupPresets.ts  Popup style presets keyed by name
├── hooks/
│   └── useAuth.ts       login(), logout(), token management
├── locales/
│   ├── zh.json          Chinese translations
│   └── en.json          English translations
├── router/
│   └── index.ts         Routes + beforeEach (lang param + auth guard)
├── types/
│   ├── balance.ts       BalanceData interface
│   └── product.ts       CategoryItem, ProductItem interfaces
├── views/
│   ├── Home.vue         Product listing + carousel + balance quick card
│   ├── BalanceCenter.vue  Full balance page with digit roller + actions
│   ├── Login.vue        Simple login form
│   ├── Products.vue     Placeholder (coming soon)
│   └── Vip.vue          Placeholder (coming soon)
├── App.vue              Root: useTheme() + PopupModal + BottomNav + RouterView
├── config.ts            Re-exports CURRENCY
├── i18n.ts              Shared i18n instance + setLocale()
└── main.ts              App bootstrap
```

---

## Key Patterns

### i18n — Language Switching
- Shared instance in `src/i18n.ts`
- Persisted to `localStorage` key `app_locale`
- URL param: `?lang=zh` or `?lang=en` → triggers `setLocale()` in router `beforeEach`
- Supported locales: `zh` (default), `en`

### Theme Injection
`App.vue` calls `useTheme()` once on mount → sets all CSS vars on `:root`.
To change a color globally: edit `src/config/colors.ts`.

### Auth Guard
Routes with `meta: { requiresAuth: true }` redirect to `Login` if no `token` in localStorage.
Public routes: Login, Home, BalanceCenter.

### API Layer
`src/api/request.ts` — Axios instance with:
- `baseURL` from env or config
- Request interceptor: attaches `Authorization: Bearer <token>`
- Response interceptor: handles 401 → redirect to login

### Popup System
```ts
const { showPopup } = usePopup()
showPopup('操作成功', 'success')   // preset key from popupPresets.ts
```

---

## Routes

| Name | Path | Auth | Component |
|---|---|---|---|
| Login | /login | No | Login.vue |
| Home | / | No | Home.vue |
| Products | /products | Yes | Products.vue |
| Vip | /vip | Yes | Vip.vue |
| BalanceCenter | /balance | No | BalanceCenter.vue |

---

## Adding a New Page — Checklist

1. Create `src/views/NewPage.vue` — use orb background + glass card pattern
2. Add route to `src/router/index.ts`
3. Add nav item to `src/components/BottomNav.vue` if needed (with `labelKey`)
4. Add i18n keys to `src/locales/zh.json` and `en.json`
5. Use colors from `src/config/colors.ts` — never hardcode hex values
6. Use `v-motion` for entrance animations with spring transitions
