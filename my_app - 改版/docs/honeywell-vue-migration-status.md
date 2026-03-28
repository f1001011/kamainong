# Honeywell -> my_app Vue Migration Status

**Generated:** 2026-03-24  
**Total Routes:** 42  
**Completed:** 8 (19%)  
**Pending:** 34 (81%)

---

## Completed Routes (8)

| Route | Status | Target File | Notes |
|---|---|---|---|
| `/welcome` | ✅ Done | `my_app/src/views/public/WelcomeView.vue` | |
| `/login` | ✅ Done | `my_app/src/views/auth/LoginView.vue` | |
| `/register` | ✅ Done | `my_app/src/views/auth/RegisterView.vue` | |
| `/forgot-password` | ✅ Done | `my_app/src/views/auth/ForgotPasswordView.vue` | |
| `/` (Home) | ✅ Done | `my_app/src/views/main/HomeView.vue` | |
| `/about` | ✅ Done | `my_app/src/views/main/AboutView.vue` | |
| `/products` | ✅ Done | `my_app/src/views/main/products/ProductsView.vue` | |
| `/profile` | ✅ Done | `my_app/src/views/main/profile/ProfileView.vue` | |

---

## Pending Routes (34)

### Phase 1: Wallet & Transactions (6)

| Route | Status | Source File | Target File (Planned) | Reusable Source |
|---|---|---|---|---|
| `/recharge` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/recharge/page.tsx` | `my_app/src/views/main/recharge/RechargeView.vue` | `my_app/src/views/Recharge.vue` |
| `/recharge/records` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/recharge/records/page.tsx` | `my_app/src/views/main/recharge/RechargeRecordsView.vue` | `my_app/src/views/RechargeRecords.vue` |
| `/recharge/records/:id` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/recharge/records/[id]/page.tsx` | `my_app/src/views/main/recharge/RechargeRecordDetailView.vue` | - |
| `/withdraw` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/withdraw/page.tsx` | `my_app/src/views/main/withdraw/WithdrawView.vue` | `my_app/src/views/Withdraw.vue` |
| `/withdraw/records` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/withdraw/records/page.tsx` | `my_app/src/views/main/withdraw/WithdrawRecordsView.vue` | `my_app/src/views/WithdrawRecords.vue` |
| `/withdraw/records/:id` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/withdraw/records/[id]/page.tsx` | `my_app/src/views/main/withdraw/WithdrawRecordDetailView.vue` | - |
| `/transactions` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/transactions/page.tsx` | `my_app/src/views/main/TransactionsView.vue` | `my_app/src/views/Transactions.vue` |

### Phase 2: Team & Settings (8)

| Route | Status | Source File | Target File (Planned) | Reusable Source |
|---|---|---|---|---|
| `/team` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/team/page.tsx` | `my_app/src/views/main/TeamView.vue` | `my_app/src/views/Team.vue` |
| `/settings` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/settings/page.tsx` | `my_app/src/views/main/settings/SettingsView.vue` | `my_app/src/views/Settings.vue` |
| `/settings/password` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/settings/password/page.tsx` | `my_app/src/views/main/settings/SettingsPasswordView.vue` | - |
| `/settings/security` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/settings/security/page.tsx` | `my_app/src/views/main/settings/SettingsSecurityView.vue` | - |
| `/security` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/security/page.tsx` | `my_app/src/views/main/security/SecurityView.vue` | `my_app/src/views/Security.vue` |
| `/security/password` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/security/password/page.tsx` | `my_app/src/views/main/security/SecurityPasswordView.vue` | - |
| `/profile/app-download` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/profile/app-download/page.tsx` | `my_app/src/views/main/profile/AppDownloadView.vue` | - |
| `/gift-code` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/gift-code/page.tsx` | `my_app/src/views/main/GiftCodeView.vue` | `my_app/src/views/GiftCode.vue` |

### Phase 3: Bank Cards & Messages (5)

| Route | Status | Source File | Target File (Planned) | Reusable Source |
|---|---|---|---|---|
| `/bank-cards` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/bank-cards/page.tsx` | `my_app/src/views/main/bank-cards/BankCardsView.vue` | `my_app/src/views/BankCards.vue` |
| `/bank-cards/add` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/bank-cards/add/page.tsx` | `my_app/src/views/main/bank-cards/BankCardAddView.vue` | - |
| `/messages` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/messages/page.tsx` | `my_app/src/views/main/messages/MessagesView.vue` | `my_app/src/views/Messages.vue` |
| `/messages/:id` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/messages/[id]/page.tsx` | `my_app/src/views/main/messages/MessageDetailView.vue` | - |

### Phase 4: Positions (2)

| Route | Status | Source File | Target File (Planned) | Reusable Source |
|---|---|---|---|---|
| `/positions` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/positions/page.tsx` | `my_app/src/views/main/positions/PositionsView.vue` | `my_app/src/views/Positions.vue` |
| `/positions/:id` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/positions/[id]/page.tsx` | `my_app/src/views/main/positions/PositionDetailView.vue` | - |

### Phase 5: Community (4)

| Route | Status | Source File | Target File (Planned) | Reusable Source |
|---|---|---|---|---|
| `/community` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/community/page.tsx` | `my_app/src/views/main/community/CommunityView.vue` | `my_app/src/views/Community.vue` |
| `/community/my` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/community/my/page.tsx` | `my_app/src/views/main/community/CommunityMyView.vue` | `my_app/src/views/CommunityMy.vue` |
| `/community/create` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/community/create/page.tsx` | `my_app/src/views/main/community/CommunityCreateView.vue` | `my_app/src/views/CommunityCreate.vue` |
| `/community/:id` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/community/[id]/page.tsx` | `my_app/src/views/main/community/CommunityDetailView.vue` | `my_app/src/views/CommunityDetail.vue` |

### Phase 6: Activities (7)

| Route | Status | Source File | Target File (Planned) | Reusable Source |
|---|---|---|---|---|
| `/activities` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/activities/page.tsx` | `my_app/src/views/main/activities/ActivitiesView.vue` | `my_app/src/views/Activities.vue` |
| `/activities/weekly-salary` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/activities/weekly-salary/page.tsx` | `my_app/src/views/main/activities/WeeklySalaryView.vue` | - |
| `/activities/svip` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/activities/svip/page.tsx` | `my_app/src/views/main/activities/SvipView.vue` | - |
| `/activities/spin-wheel` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/activities/spin-wheel/page.tsx` | `my_app/src/views/main/activities/SpinWheelView.vue` | - |
| `/activities/prize-pool` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/activities/prize-pool/page.tsx` | `my_app/src/views/main/activities/PrizePoolView.vue` | - |
| `/activities/invite` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/activities/invite/page.tsx` | `my_app/src/views/main/activities/InviteView.vue` | - |
| `/activities/invite-reward` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/activities/invite-reward/page.tsx` | `my_app/src/views/main/activities/InviteRewardView.vue` | - |
| `/activities/collection` | 🔲 Pending | `honeywell/apps/web/src/app/(main)/activities/collection/page.tsx` | `my_app/src/views/main/activities/CollectionView.vue` | - |

---

## Reusable Legacy Vue Files

These files in `my_app/src/views/*.vue` can be migrated to the new structure:

| Legacy File | Planned New Location | Priority |
|---|---|---|
| `Recharge.vue` | `my_app/src/views/main/recharge/RechargeView.vue` | High |
| `RechargeRecords.vue` | `my_app/src/views/main/recharge/RechargeRecordsView.vue` | High |
| `Withdraw.vue` | `my_app/src/views/main/withdraw/WithdrawView.vue` | High |
| `WithdrawRecords.vue` | `my_app/src/views/main/withdraw/WithdrawRecordsView.vue` | High |
| `Transactions.vue` | `my_app/src/views/main/TransactionsView.vue` | High |
| `Team.vue` | `my_app/src/views/main/TeamView.vue` | Medium |
| `Settings.vue` | `my_app/src/views/main/settings/SettingsView.vue` | Medium |
| `Security.vue` | `my_app/src/views/main/security/SecurityView.vue` | Medium |
| `BankCards.vue` | `my_app/src/views/main/bank-cards/BankCardsView.vue` | Medium |
| `Messages.vue` | `my_app/src/views/main/messages/MessagesView.vue` | Medium |
| `Activities.vue` | `my_app/src/views/main/activities/ActivitiesView.vue` | Medium |
| `GiftCode.vue` | `my_app/src/views/main/GiftCodeView.vue` | Medium |
| `Positions.vue` | `my_app/src/views/main/positions/PositionsView.vue` | Medium |
| `Community.vue` | `my_app/src/views/main/community/CommunityView.vue` | Medium |
| `CommunityDetail.vue` | `my_app/src/views/main/community/CommunityDetailView.vue` | Medium |
| `CommunityCreate.vue` | `my_app/src/views/main/community/CommunityCreateView.vue` | Medium |
| `CommunityMy.vue` | `my_app/src/views/main/community/CommunityMyView.vue` | Medium |

---

## Migration Priority Order

1. **Wallet & Transactions** (6 routes) - Highest business impact
2. **Team & Settings** (8 routes) - Core user features
3. **Bank Cards & Messages** (5 routes) - Common flows
4. **Positions** (2 routes) - Product listings
5. **Community** (4 routes) - Social features
6. **Activities** (8 routes) - Promotional pages

---

## Cleanup Required After Migration

- Delete old `my_app/src/views/*.vue` files (not in `views/main/`, `views/auth/`, `views/public/`)
- Remove unused API files from old structure
- Verify all routes work after cleanup

---

*This document is auto-generated. Last updated: 2026-03-24*
