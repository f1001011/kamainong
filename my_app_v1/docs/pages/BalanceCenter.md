# Page: Balance Center (`/balance`)

**File:** `src/views/BalanceCenter.vue`
**Route name:** `BalanceCenter`
**Auth required:** No

---

## Layout Overview

```
┌─────────────────────────────┐
│  Header (back btn + title + settings) │
├─────────────────────────────┤
│  Hero Card (digit roller balance)     │
├─────────────────────────────┤
│  Quick Actions (4 buttons)            │
├─────────────────────────────┤
│  Stats Row (3 cards)                  │
├─────────────────────────────┤
│  Recent Transactions list             │
└─────────────────────────────┘
       BottomNav (fixed)
  ActionModal (overlay, on demand)
```

---

## Sections

### Header
- Back button (`ChevronLeft`) → `router.back()`
- Title: `balance.title`
- Settings button (`Settings`) — currently no action

### Hero Card
- Animated digit roller: counts up from 0 to `totalAssets` over 2200ms (easeOut quartic)
- Integer digits rendered as individual scrolling columns (`.digit-col` / `.digit-strip`)
- Decimal part shown as static text
- Today's earnings badge (cyan, `TrendingUp` icon)
- Bottom row: Available balance | Frozen amount (amber)
- Top accent bar: red→cyan→amber gradient
- Card has `@keyframes breathe` glow animation (6s loop)

### Quick Actions (4 buttons)
Each action opens `ActionModal` with its config:

| Key | Label (zh) | Color | Icon |
|---|---|---|---|
| deposit | 充值 | Red `#ff4d4d` | ArrowDownCircle |
| withdraw | 提现 | Cyan `#00e5ff` | ArrowUpCircle |
| transfer | 转账 | Amber `#ffb800` | ArrowLeftRight |
| history | 明细 | Lime `#69ff47` | ClipboardList |

Action icons use the 3D perspective transform pattern with `--c1`, `--c2`, `--glow` CSS vars.

### Stats Row (3 cards)
- Monthly Income (cyan, TrendingUp)
- Monthly Expense (red, TrendingDown)
- Frozen Amount (amber, Lock)
- Each card has a small 3D icon + label + value

### Transactions
- List from `balanceData.transactions`
- Each item: 3D icon + name + relative time + amount (income=cyan / expense=red)
- Relative time via `formatRelativeTime()` using i18n keys `balance.time.*`
- Category → icon/color mapping via `CATEGORY_MAP` (wechat, meituan, salary, didi, coffee)

---

## ActionModal Integration

```ts
const activeAction = ref<Action | null>(null)
const openAction = (a) => { activeAction.value = a }
const handleConfirm = () => { activeAction.value = null }
```

`ActionModal` receives the full action object (label, subtitle, placeholder, note, gradient, glowColor).

---

## Data & API

| Call | Function | When |
|---|---|---|
| Balance data | `fetchBalanceData()` | onMounted |

`BalanceData` type (`src/types/balance.ts`):
```ts
{
  totalAssets: number
  availableBalance: number
  frozenAmount: number
  todayEarnings: number
  monthlyIncome: number
  monthlyExpense: number
  transactions: Transaction[]
}
```

---

## Digit Roller Implementation

```ts
const startRoll = (target: number) => {
  // easeOut quartic over 2200ms, starts after 500ms delay
  // animatedBalance.value counts from 0 → target
}
const integerChars = computed(() =>
  Math.floor(animatedBalance.value).toLocaleString('zh-CN').split('')
)
// Each digit char → CSS translateY(-${digit * 10}%) on a strip of 0-9
```

---

## i18n Keys Used

```
balance.title           balance.totalAssets     balance.currency
balance.todayEarnings   balance.available       balance.frozen
balance.recentTx        balance.monthlyIncome   balance.monthlyExpense
balance.actions.deposit.*   balance.actions.withdraw.*
balance.actions.transfer.*  balance.actions.history.*
balance.tx.wechat/meituan/salary/didi/coffee
balance.time.minutesAgo/hourAgo/yesterday/daysAgo
common.viewAll
```

---

## Styling Notes

- Multiple `<style scoped>` blocks (split by section for readability)
- Max width: `460px`, padding `0 20px 80px`
- Orbs: red (top-left), cyan (mid-right), amber (bottom) — CSS vars
- `color-mix(in srgb, var(--sc) 30%, transparent)` used for stat icon glow
