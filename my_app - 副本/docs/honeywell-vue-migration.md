# Honeywell Web -> my_app Vue Migration

## Goal

Rebuild `honeywell/apps/web` as a Vue 3 + Vite application inside `my_app`.

Rules:

- `my_app` becomes the only frontend deliverable.
- Route structure follows `honeywell/apps/web` exactly.
- Existing `my_app` pages that do not belong to the Honeywell route system are removed after replacement.
- Pages are migrated one by one, not as a single blind rewrite.

## Source Scope

- Source pages: `honeywell/apps/web/src/app/**/page.tsx`
- Source shared layouts:
  - `honeywell/apps/web/src/app/layout.tsx`
  - `honeywell/apps/web/src/app/(auth)/layout.tsx`
  - `honeywell/apps/web/src/app/(main)/layout.tsx`
- Source shared navigation and patterns:
  - `honeywell/apps/web/src/components/layout/sidebar.tsx`
  - `honeywell/apps/web/src/components/layout/bottom-nav.tsx`
  - `honeywell/apps/web/src/providers/*`
  - `honeywell/apps/web/src/stores/*`

## Confirmed Honeywell Route Inventory

### Public

| Route | Source file | Planned Vue file |
| --- | --- | --- |
| `/welcome` | `honeywell/apps/web/src/app/welcome/page.tsx` | `my_app/src/views/public/WelcomeView.vue` |

### Auth

| Route | Source file | Planned Vue file |
| --- | --- | --- |
| `/login` | `honeywell/apps/web/src/app/(auth)/login/page.tsx` | `my_app/src/views/auth/LoginView.vue` |
| `/register` | `honeywell/apps/web/src/app/(auth)/register/page.tsx` | `my_app/src/views/auth/RegisterView.vue` |
| `/forgot-password` | `honeywell/apps/web/src/app/(auth)/forgot-password/page.tsx` | `my_app/src/views/auth/ForgotPasswordView.vue` |

### Main

| Route | Source file | Planned Vue file |
| --- | --- | --- |
| `/` | `honeywell/apps/web/src/app/(main)/page.tsx` | `my_app/src/views/main/HomeView.vue` |
| `/about` | `honeywell/apps/web/src/app/(main)/about/page.tsx` | `my_app/src/views/main/AboutView.vue` |
| `/activities` | `honeywell/apps/web/src/app/(main)/activities/page.tsx` | `my_app/src/views/main/activities/ActivitiesView.vue` |
| `/activities/weekly-salary` | `honeywell/apps/web/src/app/(main)/activities/weekly-salary/page.tsx` | `my_app/src/views/main/activities/WeeklySalaryView.vue` |
| `/activities/svip` | `honeywell/apps/web/src/app/(main)/activities/svip/page.tsx` | `my_app/src/views/main/activities/SvipView.vue` |
| `/activities/spin-wheel` | `honeywell/apps/web/src/app/(main)/activities/spin-wheel/page.tsx` | `my_app/src/views/main/activities/SpinWheelView.vue` |
| `/activities/prize-pool` | `honeywell/apps/web/src/app/(main)/activities/prize-pool/page.tsx` | `my_app/src/views/main/activities/PrizePoolView.vue` |
| `/activities/invite` | `honeywell/apps/web/src/app/(main)/activities/invite/page.tsx` | `my_app/src/views/main/activities/InviteView.vue` |
| `/activities/invite-reward` | `honeywell/apps/web/src/app/(main)/activities/invite-reward/page.tsx` | `my_app/src/views/main/activities/InviteRewardView.vue` |
| `/activities/collection` | `honeywell/apps/web/src/app/(main)/activities/collection/page.tsx` | `my_app/src/views/main/activities/CollectionView.vue` |
| `/bank-cards` | `honeywell/apps/web/src/app/(main)/bank-cards/page.tsx` | `my_app/src/views/main/bank-cards/BankCardsView.vue` |
| `/bank-cards/add` | `honeywell/apps/web/src/app/(main)/bank-cards/add/page.tsx` | `my_app/src/views/main/bank-cards/BankCardAddView.vue` |
| `/community` | `honeywell/apps/web/src/app/(main)/community/page.tsx` | `my_app/src/views/main/community/CommunityView.vue` |
| `/community/my` | `honeywell/apps/web/src/app/(main)/community/my/page.tsx` | `my_app/src/views/main/community/CommunityMyView.vue` |
| `/community/create` | `honeywell/apps/web/src/app/(main)/community/create/page.tsx` | `my_app/src/views/main/community/CommunityCreateView.vue` |
| `/community/:id` | `honeywell/apps/web/src/app/(main)/community/[id]/page.tsx` | `my_app/src/views/main/community/CommunityDetailView.vue` |
| `/gift-code` | `honeywell/apps/web/src/app/(main)/gift-code/page.tsx` | `my_app/src/views/main/GiftCodeView.vue` |
| `/messages` | `honeywell/apps/web/src/app/(main)/messages/page.tsx` | `my_app/src/views/main/messages/MessagesView.vue` |
| `/messages/:id` | `honeywell/apps/web/src/app/(main)/messages/[id]/page.tsx` | `my_app/src/views/main/messages/MessageDetailView.vue` |
| `/positions` | `honeywell/apps/web/src/app/(main)/positions/page.tsx` | `my_app/src/views/main/positions/PositionsView.vue` |
| `/positions/:id` | `honeywell/apps/web/src/app/(main)/positions/[id]/page.tsx` | `my_app/src/views/main/positions/PositionDetailView.vue` |
| `/products` | `honeywell/apps/web/src/app/(main)/products/page.tsx` | `my_app/src/views/main/products/ProductsView.vue` |
| `/products/:id` | `honeywell/apps/web/src/app/(main)/products/[id]/page.tsx` | `my_app/src/views/main/products/ProductDetailView.vue` |
| `/profile` | `honeywell/apps/web/src/app/(main)/profile/page.tsx` | `my_app/src/views/main/profile/ProfileView.vue` |
| `/profile/app-download` | `honeywell/apps/web/src/app/(main)/profile/app-download/page.tsx` | `my_app/src/views/main/profile/AppDownloadView.vue` |
| `/recharge` | `honeywell/apps/web/src/app/(main)/recharge/page.tsx` | `my_app/src/views/main/recharge/RechargeView.vue` |
| `/recharge/records` | `honeywell/apps/web/src/app/(main)/recharge/records/page.tsx` | `my_app/src/views/main/recharge/RechargeRecordsView.vue` |
| `/recharge/records/:id` | `honeywell/apps/web/src/app/(main)/recharge/records/[id]/page.tsx` | `my_app/src/views/main/recharge/RechargeRecordDetailView.vue` |
| `/security` | `honeywell/apps/web/src/app/(main)/security/page.tsx` | `my_app/src/views/main/security/SecurityView.vue` |
| `/security/password` | `honeywell/apps/web/src/app/(main)/security/password/page.tsx` | `my_app/src/views/main/security/SecurityPasswordView.vue` |
| `/settings` | `honeywell/apps/web/src/app/(main)/settings/page.tsx` | `my_app/src/views/main/settings/SettingsView.vue` |
| `/settings/password` | `honeywell/apps/web/src/app/(main)/settings/password/page.tsx` | `my_app/src/views/main/settings/SettingsPasswordView.vue` |
| `/settings/security` | `honeywell/apps/web/src/app/(main)/settings/security/page.tsx` | `my_app/src/views/main/settings/SettingsSecurityView.vue` |
| `/team` | `honeywell/apps/web/src/app/(main)/team/page.tsx` | `my_app/src/views/main/TeamView.vue` |
| `/transactions` | `honeywell/apps/web/src/app/(main)/transactions/page.tsx` | `my_app/src/views/main/TransactionsView.vue` |
| `/withdraw` | `honeywell/apps/web/src/app/(main)/withdraw/page.tsx` | `my_app/src/views/main/withdraw/WithdrawView.vue` |
| `/withdraw/records` | `honeywell/apps/web/src/app/(main)/withdraw/records/page.tsx` | `my_app/src/views/main/withdraw/WithdrawRecordsView.vue` |
| `/withdraw/records/:id` | `honeywell/apps/web/src/app/(main)/withdraw/records/[id]/page.tsx` | `my_app/src/views/main/withdraw/WithdrawRecordDetailView.vue` |

## Shared Vue Structure To Build

### Layouts

- `my_app/src/layouts/PublicLayout.vue`
- `my_app/src/layouts/AuthLayout.vue`
- `my_app/src/layouts/MainLayout.vue`

### Shared Components

- `my_app/src/components/layout/AppSidebar.vue`
- `my_app/src/components/layout/AppBottomNav.vue`
- `my_app/src/components/layout/PageContainer.vue`
- `my_app/src/components/layout/PageHeader.vue`
- `my_app/src/components/layout/AuthCard.vue`

### Shared Data / State / API

- `my_app/src/stores/user.ts`
- `my_app/src/stores/config.ts`
- `my_app/src/stores/text.ts`
- `my_app/src/api/home.ts`
- `my_app/src/api/profile.ts`
- `my_app/src/api/activity.ts`
- `my_app/src/api/message.ts`
- `my_app/src/api/position.ts`

## Existing my_app Files To Replace Or Remove

### Existing files that can be overwritten or moved into the new structure

- `my_app/src/views/Home.vue`
- `my_app/src/views/Login.vue`
- `my_app/src/views/Register.vue`
- `my_app/src/views/Products.vue`
- `my_app/src/views/ProductDetail.vue`
- `my_app/src/views/Profile.vue`
- `my_app/src/views/Recharge.vue`
- `my_app/src/views/RechargeRecords.vue`
- `my_app/src/views/Withdraw.vue`
- `my_app/src/views/WithdrawRecords.vue`
- `my_app/src/views/Transactions.vue`
- `my_app/src/views/Team.vue`
- `my_app/src/views/Settings.vue`
- `my_app/src/views/Security.vue`
- `my_app/src/views/BankCards.vue`
- `my_app/src/views/Messages.vue`
- `my_app/src/views/Activities.vue`
- `my_app/src/views/About.vue`
- `my_app/src/views/GiftCode.vue`
- `my_app/src/views/Positions.vue`
- `my_app/src/views/Community.vue`
- `my_app/src/views/CommunityDetail.vue`
- `my_app/src/views/CommunityCreate.vue`
- `my_app/src/views/CommunityMy.vue`

### Missing Vue pages that must be added

- `ForgotPasswordView.vue`
- `WelcomeView.vue`
- `MessageDetailView.vue`
- `PositionDetailView.vue`
- `RechargeRecordDetailView.vue`
- `WithdrawRecordDetailView.vue`
- `BankCardAddView.vue`
- `AppDownloadView.vue`
- `SecurityPasswordView.vue`
- `SettingsPasswordView.vue`
- `SettingsSecurityView.vue`
- All six dedicated activity detail pages

## Page-by-Page Migration Order

### Phase 1: Route skeleton and shared layouts

1. Root route map and file structure
2. `PublicLayout.vue`
3. `AuthLayout.vue`
4. `MainLayout.vue`
5. Sidebar and bottom navigation

### Phase 2: Public and auth pages

6. `/welcome`
7. `/login`
8. `/register`
9. `/forgot-password`

### Phase 3: Main shell and homepage

10. `/`
11. `/about`
12. `/products`
13. `/products/:id`

### Phase 4: Wallet and asset flows

14. `/recharge`
15. `/recharge/records`
16. `/recharge/records/:id`
17. `/withdraw`
18. `/withdraw/records`
19. `/withdraw/records/:id`
20. `/transactions`
21. `/positions`
22. `/positions/:id`

### Phase 5: User and settings flows

23. `/profile`
24. `/profile/app-download`
25. `/settings`
26. `/settings/password`
27. `/settings/security`
28. `/security`
29. `/security/password`
30. `/bank-cards`
31. `/bank-cards/add`
32. `/messages`
33. `/messages/:id`
34. `/gift-code`
35. `/team`

### Phase 6: Community and activities

36. `/community`
37. `/community/my`
38. `/community/create`
39. `/community/:id`
40. `/activities`
41. `/activities/weekly-salary`
42. `/activities/svip`
43. `/activities/spin-wheel`
44. `/activities/prize-pool`
45. `/activities/invite`
46. `/activities/invite-reward`
47. `/activities/collection`

### Phase 7: Cleanup

48. Delete old `my_app/src/views/*.vue` files that are no longer referenced
49. Remove obsolete API files or aliases left from the old structure
50. Build and fix compile issues until `npm run build` passes

## Current Working Rule

From this point onward, every migration step should follow this sequence:

1. Read the Honeywell source page.
2. Create the Vue page under the planned target path.
3. Wire it into `my_app/src/router/index.ts`.
4. Reuse shared layout/components where possible.
5. Only delete the old page after the new route is in place.
6. Run build validation after each logical batch.
