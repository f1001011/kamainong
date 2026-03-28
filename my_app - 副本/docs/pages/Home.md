# Page: Home (`/`)

**File:** `src/views/Home.vue`
**Route name:** `Home`
**Auth required:** No

---

## Layout Overview

```
┌─────────────────────────────┐
│  Header (avatar + wallet btn)│
├─────────────────────────────┤
│  Balance Quick Card          │
├─────────────────────────────┤
│  Carousel (4 banners, auto)  │
├─────────────────────────────┤
│  Category Filter Row         │
├─────────────────────────────┤
│  Product Grid (2 cols)       │
│  ... infinite scroll ...     │
└─────────────────────────────┘
       BottomNav (fixed)
```

---

## Sections

### Header
- Left: avatar (red gradient square) + greeting text (`home.greeting`, `home.welcome`)
- Right: glass icon button → navigates to `/balance`

### Balance Quick Card
- Shows `homeBalance` fetched from `fetchHomeBalance()` API
- Formatted with `toLocaleString('zh-CN', { minimumFractionDigits: 2 })`
- Button → navigates to `/balance`
- Top accent bar: `linear-gradient(90deg, #ff4d4d, #00e5ff, #ffb800)`

### Carousel
- 4 hardcoded banners (no API), auto-advances every 2000ms
- Pauses on `mouseenter`, resumes on `mouseleave`
- Dot indicators, clickable
- Supports `imageUrl` (shows `<img>`) or gradient + icon fallback
- Transition: `translateX` CSS transform, 0.55s cubic-bezier

### Category Filter
- Fetched from `fetchCategories()` API → `CategoryItem[]`
- Each item has `iconKey` (mapped via `ICON_MAP`) and `colorKey` (mapped via `COLOR_MAP`)
- Active state uses CSS var `--ac` for color + border
- Label: `cat.labelZh` or `cat.labelEn` based on current locale (NOT i18n key)
- Horizontal scroll, no scrollbar

### Product Grid
- 2-column CSS grid
- Fetched from `fetchProducts({ category, page, pageSize: 10 })`
- Infinite scroll via `IntersectionObserver` on `.sentinel` element
- Resets on category change (`watch(activeCategory, ...)`)
- Each card: gradient image area + icon (3D transform) + name + price + stock count
- Visual config per category: `CATEGORY_VISUAL` record (gradient, glow, priceColor)
- Tag badge colors: `TAG_COLOR` record (`热门`→red, `推荐`/`精选`→lime, `爆款`/`超值`→amber)

---

## Data & API

| Call | Function | When |
|---|---|---|
| Balance | `fetchHomeBalance()` | onMounted |
| Categories | `fetchCategories()` | onMounted |
| Products | `fetchProducts({ category, page, pageSize })` | onMounted + category change + scroll |

---

## State

```ts
homeBalance: ref<number>
activeCategory: ref<string>   // 'all' default
categoriesRaw: ref<CategoryItem[]>
productList: ref<ProductItem[]>
page: ref<number>
hasMore: ref<boolean>
isLoading: ref<boolean>
currentSlide: ref<number>
```

---

## Icon Maps (frontend-only config)

```ts
// Maps iconKey string → lucide Component
ICON_MAP: { layoutgrid, wifi, phone, crown, gamepad2, coffee, signal, creditcard, music, star, sword, gem, shoppingcart, car }

// Maps colorKey string → hex from colors config
COLOR_MAP: { red, cyan, amber, green }

// Category visual styles
CATEGORY_VISUAL: { data, phone, member, game, life }
```

---

## i18n Keys Used

```
home.greeting       home.welcome        home.balanceLabel
home.balanceCenter  home.loadingMore    home.noMore
home.purchasable    home.products
```

---

## Styling Notes

- Max width: `460px`, centered, padding `0 18px 80px`
- Glass card: `var(--bg-card)` + `var(--border)` + `border-radius: 20px`
- Orbs: red (top-left), cyan (mid-right), amber (bottom-left) — all use CSS vars
- Product icon: 3D perspective transform, lifts on hover
- Category active: `color-mix(in srgb, var(--ac) 14%, transparent)` background
