# Page: Login (`/login`)

**File:** `src/views/Login.vue`
**Route name:** `Login`
**Auth required:** No

---

## Layout Overview

Simple centered form — no orb background, no glass card styling yet (minimal placeholder).

```
┌─────────────────┐
│  Login title    │
│  Username input │
│  Password input │
│  Login button   │
└─────────────────┘
```

---

## Behavior

1. User enters username + password
2. Calls `useAuth().login(username, password)`
3. On success → `showPopup(t('loginSuccess'), 'loginSuccess')`
4. On failure → `showPopup(t('loginFailed'), 'loginFailed')`

---

## Composables Used

```ts
import { useAuth }  from '../hooks/useAuth'
import { usePopup } from '@/composables/usePopup'
import { useI18n }  from 'vue-i18n'
```

---

## Auth Flow (`src/hooks/useAuth.ts`)

- `login(username, password)` → calls `src/api/auth.ts` → stores token in `localStorage`
- `logout()` → clears token, redirects to `/login`
- Token key: `token`

---

## i18n Keys Used

```
login       username      password
loginSuccess              loginFailed
```

---

## Notes

- BottomNav is hidden on this page (`showNav = computed(() => route.name !== 'Login')`)
- This page needs styling work — it currently has no design applied (no glass card, no orbs, no theme)
- When redesigning: follow the orb background + glass card pattern from other pages
