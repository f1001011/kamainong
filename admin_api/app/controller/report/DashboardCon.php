<?php
declare(strict_types=1);

namespace app\controller\report;

use app\controller\BaseCon;
use app\model\CommonGoodsOrderModel;
use app\model\CommonIncomeClaimLogModel;
use app\model\CommonPayCashModel;
use app\model\CommonPayRechargeModel;
use app\model\CommonUserModel;
use think\facade\Cache;
use think\facade\Db;

class DashboardCon extends BaseCon
{
    protected const OVERVIEW_CACHE_EXPIRE = 180;

    public function GetOverview()
    {
        $postField = 'start_time,end_time';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        $startTime = $this->normalizeSearchTime($post['start_time'] ?? null);
        if (($post['start_time'] ?? '') !== '' && $startTime === false) {
            return Show(ERROR, [], 10025);
        }

        $endTime = $this->normalizeSearchTime($post['end_time'] ?? null, true);
        if (($post['end_time'] ?? '') !== '' && $endTime === false) {
            return Show(ERROR, [], 10025);
        }

        [$todayStart, $todayEnd, $yesterdayStart, $yesterdayEnd] = $this->resolveRange($startTime, $endTime);

        $cacheKey = $this->buildOverviewCacheKey([$todayStart, $todayEnd, $yesterdayStart, $yesterdayEnd]);

        $data = Cache::remember($cacheKey, function () use ($todayStart, $todayEnd, $yesterdayStart, $yesterdayEnd) {
            $todayRecharge = $this->getRechargeSummary($todayStart, $todayEnd);
            $yesterdayRecharge = $this->getRechargeSummary($yesterdayStart, $yesterdayEnd);

            $todayWithdraw = $this->getWithdrawSummary($todayStart, $todayEnd);
            $yesterdayWithdraw = $this->getWithdrawSummary($yesterdayStart, $yesterdayEnd);

            $todayRegisterCount = $this->getRegisterCount($todayStart, $todayEnd);
            $yesterdayRegisterCount = $this->getRegisterCount($yesterdayStart, $yesterdayEnd);

            $todayFirstRechargeCount = $this->getFirstRechargeCount($todayStart, $todayEnd);
            $yesterdayFirstRechargeCount = $this->getFirstRechargeCount($yesterdayStart, $yesterdayEnd);

            $todayFirstInvestCount = $this->getFirstInvestCount($todayStart, $todayEnd);
            $yesterdayFirstInvestCount = $this->getFirstInvestCount($yesterdayStart, $yesterdayEnd);

            $todayActiveCount = $this->getActiveUserCount($todayStart, $todayEnd);
            $yesterdayActiveCount = $this->getActiveUserCount($yesterdayStart, $yesterdayEnd);

            $todayIncomeClaimAmount = $this->getIncomeClaimAmount($todayStart, $todayEnd);
            $yesterdayIncomeClaimAmount = $this->getIncomeClaimAmount($yesterdayStart, $yesterdayEnd);

            $userAssetSummary = $this->getUserAssetSummary();
            $platformNetInAmount = $this->getPlatformNetInAmount();
            $activeChannelCount = $this->getActiveChannelCount();
            $onlineUserCount = $this->getOnlineUserCount();
            $pendingItems = $this->getPendingItems($todayStart, $todayEnd);

            $rechargeAmount = (float)($todayRecharge['success_amount'] ?? 0);
            $withdrawAmount = (float)($todayWithdraw['success_amount'] ?? 0);

            return [
                'updated_at' => date('Y-m-d H:i:s'),
                'query_range' => [
                    'start_time' => $todayStart,
                    'end_time' => $todayEnd,
                    'compare_start_time' => $yesterdayStart,
                    'compare_end_time' => $yesterdayEnd,
                ],
                'kpis' => [
                    'today_recharge_amount' => $rechargeAmount,
                    'yesterday_recharge_amount' => (float)($yesterdayRecharge['success_amount'] ?? 0),
                    'today_withdraw_amount' => $withdrawAmount,
                    'yesterday_withdraw_amount' => (float)($yesterdayWithdraw['success_amount'] ?? 0),
                    'today_fee_amount' => (float)($todayWithdraw['fee_amount'] ?? 0),
                    'yesterday_fee_amount' => (float)($yesterdayWithdraw['fee_amount'] ?? 0),
                    'today_net_in_amount' => $rechargeAmount - $withdrawAmount,
                    'yesterday_net_in_amount' => (float)($yesterdayRecharge['success_amount'] ?? 0) - (float)($yesterdayWithdraw['success_amount'] ?? 0),
                    'today_register_count' => $todayRegisterCount,
                    'yesterday_register_count' => $yesterdayRegisterCount,
                    'today_active_count' => $todayActiveCount,
                    'yesterday_active_count' => $yesterdayActiveCount,
                    'today_first_recharge_count' => $todayFirstRechargeCount,
                    'yesterday_first_recharge_count' => $yesterdayFirstRechargeCount,
                    'today_first_invest_count' => $todayFirstInvestCount,
                    'yesterday_first_invest_count' => $yesterdayFirstInvestCount,
                    'today_income_claim_amount' => $todayIncomeClaimAmount,
                    'yesterday_income_claim_amount' => $yesterdayIncomeClaimAmount,
                    'total_user_count' => $this->getTotalUserCount(),
                    'online_user_count' => $onlineUserCount,
                    'active_channel_count' => $activeChannelCount,
                    'user_balance_amount' => (float)($userAssetSummary['balance_amount'] ?? 0),
                ],
                'pending_items' => $pendingItems,
                'capital' => [
                    'platform_net_in_amount' => $platformNetInAmount,
                    'user_balance_amount' => (float)($userAssetSummary['balance_amount'] ?? 0),
                    'freeze_amount' => (float)($userAssetSummary['freeze_amount'] ?? 0),
                    'team_commission_amount' => (float)($userAssetSummary['team_amount'] ?? 0),
                    'user_integral_amount' => (float)($userAssetSummary['integral_amount'] ?? 0),
                    'fund_gap_amount' => $platformNetInAmount - (float)($userAssetSummary['balance_amount'] ?? 0) - (float)($userAssetSummary['freeze_amount'] ?? 0),
                    'recharge_withdraw_ratio' => $withdrawAmount > 0 ? round($rechargeAmount / $withdrawAmount, 2) : 0,
                    'active_channel_count' => $activeChannelCount,
                    'online_user_count' => $onlineUserCount,
                ],
                'user_growth' => [
                    'today_register_count' => $todayRegisterCount,
                    'today_active_count' => $todayActiveCount,
                    'today_first_recharge_count' => $todayFirstRechargeCount,
                    'today_first_invest_count' => $todayFirstInvestCount,
                    'register_trend' => $this->getRegisterTrend($todayStart, $todayEnd),
                    'vip_distribution' => $this->getVipDistribution(),
                ],
                'finance_trend' => $this->getFinanceTrend($todayStart, $todayEnd),
                'channel_flow' => $this->getChannelFlow($todayStart, $todayEnd),
            ];
        }, self::OVERVIEW_CACHE_EXPIRE);

        return Show(SUCCESS, $data);
    }

    protected function buildOverviewCacheKey(array $parts = []): string
    {
        return 'dashboard:overview:' . md5(json_encode($parts, JSON_UNESCAPED_UNICODE));
    }

    protected function getDayRange(int $offset = 0): array
    {
        $date = date('Y-m-d', strtotime($offset . ' day'));
        return [$date . ' 00:00:00', $date . ' 23:59:59'];
    }

    protected function resolveRange(?string $startTime, ?string $endTime): array
    {
        if (empty($startTime) || empty($endTime)) {
            [$currentStart, $currentEnd] = $this->getDayRange(0);
            [$compareStart, $compareEnd] = $this->getDayRange(-1);
            return [$currentStart, $currentEnd, $compareStart, $compareEnd];
        }

        $currentStartTimestamp = strtotime($startTime);
        $currentEndTimestamp = strtotime($endTime);

        if ($currentStartTimestamp === false || $currentEndTimestamp === false || $currentStartTimestamp > $currentEndTimestamp) {
            [$currentStart, $currentEnd] = $this->getDayRange(0);
            [$compareStart, $compareEnd] = $this->getDayRange(-1);
            return [$currentStart, $currentEnd, $compareStart, $compareEnd];
        }

        $periodSeconds = $currentEndTimestamp - $currentStartTimestamp + 1;
        $compareEndTimestamp = $currentStartTimestamp - 1;
        $compareStartTimestamp = $compareEndTimestamp - $periodSeconds + 1;

        return [
            date('Y-m-d H:i:s', $currentStartTimestamp),
            date('Y-m-d H:i:s', $currentEndTimestamp),
            date('Y-m-d H:i:s', $compareStartTimestamp),
            date('Y-m-d H:i:s', $compareEndTimestamp),
        ];
    }

    protected function applyTimeRange($query, string $field, ?string $startTime, ?string $endTime)
    {
        if (!empty($startTime)) {
            $query->where($field, '>=', $startTime);
        }

        if (!empty($endTime)) {
            $query->where($field, '<=', $endTime);
        }
    }

    protected function getRechargeSummary(string $startTime, string $endTime)
    {
        $query = Db::name('common_pay_recharge')->where('status', CommonPayRechargeModel::STATUS_PAY_SUCCESS);
        $this->applyTimeRange($query, 'create_time', $startTime, $endTime);

        return $query
            ->fieldRaw('COUNT(*) as total_count, COUNT(DISTINCT uid) as user_count, COALESCE(SUM(CASE WHEN COALESCE(actual_amount, 0) > 0 THEN actual_amount ELSE money END), 0) as success_amount')
            ->find();
    }

    protected function getWithdrawSummary(string $startTime, string $endTime)
    {
        $query = Db::name('common_pay_cash')->where('status', CommonPayCashModel::STATUS_SUCCESS);
        $this->applyTimeRange($query, 'create_time', $startTime, $endTime);

        return $query
            ->fieldRaw('COUNT(*) as total_count, COUNT(DISTINCT u_id) as user_count, COALESCE(SUM(CASE WHEN COALESCE(actual_amount, 0) > 0 THEN actual_amount WHEN COALESCE(money_actual, 0) > 0 THEN money_actual ELSE money END), 0) as success_amount, COALESCE(SUM(CASE WHEN COALESCE(fee, 0) > 0 THEN fee ELSE COALESCE(money_fee, 0) END), 0) as fee_amount')
            ->find();
    }

    protected function getRegisterCount(string $startTime, string $endTime): int
    {
        $query = Db::name('common_user')->where('status', '<>', CommonUserModel::STATUS_DELETE);
        $this->applyTimeRange($query, 'create_time', $startTime, $endTime);
        return (int)$query->count();
    }

    protected function getFirstRechargeCount(string $startTime, string $endTime): int
    {
        $prefix = (string)config('database.connections.mysql.prefix');
        $sql = "SELECT COUNT(*) AS total FROM (
                    SELECT uid, MIN(COALESCE(success_time, create_time)) AS first_time
                    FROM {$prefix}common_pay_recharge
                    WHERE status = ?
                    GROUP BY uid
                ) t
                WHERE t.first_time >= ? AND t.first_time <= ?";

        $result = Db::query($sql, [
            CommonPayRechargeModel::STATUS_PAY_SUCCESS,
            $startTime,
            $endTime,
        ]);

        return (int)($result[0]['total'] ?? 0);
    }

    protected function getFirstInvestCount(string $startTime, string $endTime): int
    {
        $prefix = (string)config('database.connections.mysql.prefix');
        $sql = "SELECT COUNT(*) AS total FROM (
                    SELECT user_id, MIN(create_time) AS first_time
                    FROM {$prefix}common_goods_order
                    WHERE status <> ?
                    GROUP BY user_id
                ) t
                WHERE t.first_time >= ? AND t.first_time <= ?";

        $result = Db::query($sql, [
            CommonGoodsOrderModel::STATUS_DELETE,
            $startTime,
            $endTime,
        ]);

        return (int)($result[0]['total'] ?? 0);
    }

    protected function getIncomeClaimAmount(string $startTime, string $endTime): float
    {
        $query = Db::name('common_income_claim_log')->where('status', CommonIncomeClaimLogModel::STATUS_CLAIMED);
        $this->applyTimeRange($query, 'claim_time', $startTime, $endTime);

        return (float)$query->sum('claim_amount');
    }

    protected function getActiveUserCount(string $startTime, string $endTime): int
    {
        $userIds = [];

        $rechargeIds = Db::name('common_pay_recharge')
            ->where('status', CommonPayRechargeModel::STATUS_PAY_SUCCESS)
            ->where('create_time', '>=', $startTime)
            ->where('create_time', '<=', $endTime)
            ->distinct(true)
            ->column('uid');

        $withdrawIds = Db::name('common_pay_cash')
            ->where('status', CommonPayCashModel::STATUS_SUCCESS)
            ->where('create_time', '>=', $startTime)
            ->where('create_time', '<=', $endTime)
            ->distinct(true)
            ->column('u_id');

        $goodsOrderIds = Db::name('common_goods_order')
            ->where('status', '<>', CommonGoodsOrderModel::STATUS_DELETE)
            ->where('create_time', '>=', $startTime)
            ->where('create_time', '<=', $endTime)
            ->distinct(true)
            ->column('user_id');

        $claimIds = Db::name('common_income_claim_log')
            ->where('status', CommonIncomeClaimLogModel::STATUS_CLAIMED)
            ->where('claim_time', '>=', $startTime)
            ->where('claim_time', '<=', $endTime)
            ->distinct(true)
            ->column('user_id');

        foreach ([$rechargeIds, $withdrawIds, $goodsOrderIds, $claimIds] as $group) {
            foreach ($group as $id) {
                if ((int)$id > 0) {
                    $userIds[(int)$id] = true;
                }
            }
        }

        return count($userIds);
    }

    protected function getUserAssetSummary()
    {
        return Db::name('common_user')
            ->where('status', '<>', CommonUserModel::STATUS_DELETE)
            ->fieldRaw('COALESCE(SUM(money_balance), 0) as balance_amount, COALESCE(SUM(money_freeze), 0) as freeze_amount, COALESCE(SUM(money_integral), 0) as integral_amount, COALESCE(SUM(money_team), 0) as team_amount')
            ->find();
    }

    protected function getPlatformNetInAmount(): float
    {
        $rechargeSummary = Db::name('common_pay_recharge')
            ->where('status', CommonPayRechargeModel::STATUS_PAY_SUCCESS)
            ->fieldRaw('COALESCE(SUM(CASE WHEN COALESCE(actual_amount, 0) > 0 THEN actual_amount ELSE money END), 0) as total_amount')
            ->find();

        $withdrawSummary = Db::name('common_pay_cash')
            ->where('status', CommonPayCashModel::STATUS_SUCCESS)
            ->fieldRaw('COALESCE(SUM(CASE WHEN COALESCE(actual_amount, 0) > 0 THEN actual_amount WHEN COALESCE(money_actual, 0) > 0 THEN money_actual ELSE money END), 0) as total_amount')
            ->find();

        $rechargeAmount = (float)($rechargeSummary['total_amount'] ?? 0);
        $withdrawAmount = (float)($withdrawSummary['total_amount'] ?? 0);

        return $rechargeAmount - $withdrawAmount;
    }

    protected function getActiveChannelCount(): int
    {
        return (int)Db::name('common_pay_channel')->where('status', 1)->count();
    }

    protected function getOnlineUserCount(): int
    {
        return (int)Db::name('common_user')
            ->where('status', CommonUserModel::STATUS_NORMAL)
            ->where('state', CommonUserModel::STATE_ONLINE)
            ->count();
    }

    protected function getTotalUserCount(): int
    {
        return (int)Db::name('common_user')->where('status', '<>', CommonUserModel::STATUS_DELETE)->count();
    }

    protected function getPendingItems(string $todayStart, string $todayEnd): array
    {
        $overdueTime = date('Y-m-d H:i:s', strtotime('-15 minutes'));

        $overdueRecharge = Db::name('common_pay_recharge')
            ->whereIn('status', [CommonPayRechargeModel::STATUS_CREATE, CommonPayRechargeModel::STATUS_WAIT_PAY])
            ->where('create_time', '<=', $overdueTime)
            ->fieldRaw('COUNT(*) as total_count, COALESCE(SUM(CASE WHEN COALESCE(actual_amount, 0) > 0 THEN actual_amount ELSE money END), 0) as total_amount')
            ->find();

        $pendingWithdraw = Db::name('common_pay_cash')
            ->where('status', CommonPayCashModel::STATUS_APPLY)
            ->fieldRaw('COUNT(*) as total_count, COALESCE(SUM(CASE WHEN COALESCE(actual_amount, 0) > 0 THEN actual_amount WHEN COALESCE(money_actual, 0) > 0 THEN money_actual ELSE money END), 0) as total_amount')
            ->find();

        $channelFlow = $this->getChannelFlow($todayStart, $todayEnd);
        $netOutflowChannels = array_values(array_filter($channelFlow, static function ($item) {
            return (float)($item['net_amount'] ?? 0) < 0;
        }));

        return [
            [
                'title' => '待支付充值 > 15 分钟',
                'count' => (int)($overdueRecharge['total_count'] ?? 0),
                'amount' => (float)($overdueRecharge['total_amount'] ?? 0),
                'type' => 'warning',
                'description' => '超时未支付订单，需要人工跟进或清理。',
            ],
            [
                'title' => '待审核提现',
                'count' => (int)($pendingWithdraw['total_count'] ?? 0),
                'amount' => (float)($pendingWithdraw['total_amount'] ?? 0),
                'type' => 'danger',
                'description' => '当前处于申请状态的提现单量。',
            ],
            [
                'title' => '净流出通道',
                'count' => count($netOutflowChannels),
                'amount' => array_reduce($netOutflowChannels, static function ($carry, $item) {
                    return $carry + abs((float)($item['net_amount'] ?? 0));
                }, 0),
                'type' => 'info',
                'description' => '今日提现金额高于充值金额的通道数量。',
            ],
        ];
    }

    protected function getRegisterTrend(string $startDateTime, string $endDateTime): array
    {
        $dates = $this->buildDateSeriesByRange($startDateTime, $endDateTime);
        $startDate = reset($dates) . ' 00:00:00';
        $endDate = end($dates) . ' 23:59:59';

        $registerRows = Db::name('common_user')
            ->where('status', '<>', CommonUserModel::STATUS_DELETE)
            ->where('create_time', '>=', $startDate)
            ->where('create_time', '<=', $endDate)
            ->fieldRaw("DATE_FORMAT(create_time, '%Y-%m-%d') as stat_date, COUNT(*) as total_count")
            ->group("DATE_FORMAT(create_time, '%Y-%m-%d')")
            ->select()
            ->toArray();

        $firstRechargeRows = $this->getFirstActionTrendRows('common_pay_recharge', 'uid', 'COALESCE(success_time, create_time)', CommonPayRechargeModel::STATUS_PAY_SUCCESS, $startDate, $endDate);
        $firstInvestRows = $this->getFirstActionTrendRows('common_goods_order', 'user_id', 'create_time', CommonGoodsOrderModel::STATUS_DELETE, $startDate, $endDate, '<>');

        $registerMap = $this->keyTrendRows($registerRows);
        $firstRechargeMap = $this->keyTrendRows($firstRechargeRows);
        $firstInvestMap = $this->keyTrendRows($firstInvestRows);

        $trend = [];
        foreach ($dates as $date) {
            $trend[] = [
                'date' => $date,
                'register_count' => (int)($registerMap[$date]['total_count'] ?? 0),
                'first_recharge_count' => (int)($firstRechargeMap[$date]['total_count'] ?? 0),
                'first_invest_count' => (int)($firstInvestMap[$date]['total_count'] ?? 0),
            ];
        }

        return $trend;
    }

    protected function getFirstActionTrendRows(
        string $table,
        string $groupField,
        string $timeField,
        int $statusValue,
        string $startDate,
        string $endDate,
        string $operator = '='
    ): array {
        $prefix = (string)config('database.connections.mysql.prefix');
        $statusCondition = $operator === '<>' ? "status <> ?" : "status = ?";
        $sql = "SELECT DATE_FORMAT(first_time, '%Y-%m-%d') AS stat_date, COUNT(*) AS total_count FROM (
                    SELECT {$groupField}, MIN({$timeField}) AS first_time
                    FROM {$prefix}{$table}
                    WHERE {$statusCondition}
                    GROUP BY {$groupField}
                ) t
                WHERE first_time >= ? AND first_time <= ?
                GROUP BY DATE_FORMAT(first_time, '%Y-%m-%d')
                ORDER BY stat_date ASC";

        return Db::query($sql, [$statusValue, $startDate, $endDate]);
    }

    protected function keyTrendRows(array $rows): array
    {
        $map = [];
        foreach ($rows as $row) {
            $date = (string)($row['stat_date'] ?? '');
            if ($date !== '') {
                $map[$date] = $row;
            }
        }
        return $map;
    }

    protected function buildDateSeriesByRange(string $startDateTime, string $endDateTime): array
    {
        $dates = [];
        $currentTimestamp = strtotime(date('Y-m-d', strtotime($startDateTime)));
        $endTimestamp = strtotime(date('Y-m-d', strtotime($endDateTime)));

        while ($currentTimestamp !== false && $endTimestamp !== false && $currentTimestamp <= $endTimestamp) {
            $dates[] = date('Y-m-d', $currentTimestamp);
            $currentTimestamp = strtotime('+1 day', $currentTimestamp);
        }
        return $dates;
    }

    protected function getVipDistribution(): array
    {
        $rows = Db::name('common_user')
            ->where('status', '<>', CommonUserModel::STATUS_DELETE)
            ->fieldRaw('level_vip, COUNT(*) as total_count')
            ->group('level_vip')
            ->order('level_vip asc')
            ->select()
            ->toArray();

        $distribution = [];
        foreach ($rows as $row) {
            $distribution[] = [
                'name' => 'VIP' . (string)($row['level_vip'] ?? 0),
                'value' => (int)($row['total_count'] ?? 0),
            ];
        }

        return $distribution;
    }

    protected function getFinanceTrend(string $startDateTime, string $endDateTime): array
    {
        $dates = $this->buildDateSeriesByRange($startDateTime, $endDateTime);
        $startDate = reset($dates) . ' 00:00:00';
        $endDate = end($dates) . ' 23:59:59';

        $rechargeRows = Db::name('common_pay_recharge')
            ->where('status', CommonPayRechargeModel::STATUS_PAY_SUCCESS)
            ->where('create_time', '>=', $startDate)
            ->where('create_time', '<=', $endDate)
            ->fieldRaw("DATE_FORMAT(create_time, '%Y-%m-%d') as stat_date, COALESCE(SUM(CASE WHEN COALESCE(actual_amount, 0) > 0 THEN actual_amount ELSE money END), 0) as total_amount")
            ->group("DATE_FORMAT(create_time, '%Y-%m-%d')")
            ->select()
            ->toArray();

        $withdrawRows = Db::name('common_pay_cash')
            ->where('status', CommonPayCashModel::STATUS_SUCCESS)
            ->where('create_time', '>=', $startDate)
            ->where('create_time', '<=', $endDate)
            ->fieldRaw("DATE_FORMAT(create_time, '%Y-%m-%d') as stat_date, COALESCE(SUM(CASE WHEN COALESCE(actual_amount, 0) > 0 THEN actual_amount WHEN COALESCE(money_actual, 0) > 0 THEN money_actual ELSE money END), 0) as total_amount")
            ->group("DATE_FORMAT(create_time, '%Y-%m-%d')")
            ->select()
            ->toArray();

        $rechargeMap = $this->keyTrendRows($rechargeRows);
        $withdrawMap = $this->keyTrendRows($withdrawRows);
        $trend = [];

        foreach ($dates as $date) {
            $rechargeAmount = (float)($rechargeMap[$date]['total_amount'] ?? 0);
            $withdrawAmount = (float)($withdrawMap[$date]['total_amount'] ?? 0);
            $trend[] = [
                'date' => $date,
                'recharge_amount' => $rechargeAmount,
                'withdraw_amount' => $withdrawAmount,
                'net_in_amount' => $rechargeAmount - $withdrawAmount,
            ];
        }

        return $trend;
    }

    protected function getChannelFlow(string $startTime, string $endTime): array
    {
        $rechargeRows = Db::name('common_pay_recharge')
            ->where('status', CommonPayRechargeModel::STATUS_PAY_SUCCESS)
            ->where('create_time', '>=', $startTime)
            ->where('create_time', '<=', $endTime)
            ->fieldRaw("CASE WHEN channel_name IS NULL OR channel_name = '' THEN '未配置渠道' ELSE channel_name END as channel_name, COALESCE(SUM(CASE WHEN COALESCE(actual_amount, 0) > 0 THEN actual_amount ELSE money END), 0) as total_amount")
            ->group("CASE WHEN channel_name IS NULL OR channel_name = '' THEN '未配置渠道' ELSE channel_name END")
            ->select()
            ->toArray();

        $withdrawRows = Db::name('common_pay_cash')
            ->where('status', CommonPayCashModel::STATUS_SUCCESS)
            ->where('create_time', '>=', $startTime)
            ->where('create_time', '<=', $endTime)
            ->fieldRaw("CASE WHEN channel_name IS NULL OR channel_name = '' THEN '未配置渠道' ELSE channel_name END as channel_name, COALESCE(SUM(CASE WHEN COALESCE(actual_amount, 0) > 0 THEN actual_amount WHEN COALESCE(money_actual, 0) > 0 THEN money_actual ELSE money END), 0) as total_amount")
            ->group("CASE WHEN channel_name IS NULL OR channel_name = '' THEN '未配置渠道' ELSE channel_name END")
            ->select()
            ->toArray();

        $map = [];
        foreach ($rechargeRows as $row) {
            $name = (string)($row['channel_name'] ?? '未配置渠道');
            $map[$name] = [
                'channel_name' => $name,
                'recharge_amount' => (float)($row['total_amount'] ?? 0),
                'withdraw_amount' => 0,
                'net_amount' => (float)($row['total_amount'] ?? 0),
            ];
        }

        foreach ($withdrawRows as $row) {
            $name = (string)($row['channel_name'] ?? '未配置渠道');
            if (!isset($map[$name])) {
                $map[$name] = [
                    'channel_name' => $name,
                    'recharge_amount' => 0,
                    'withdraw_amount' => 0,
                    'net_amount' => 0,
                ];
            }

            $withdrawAmount = (float)($row['total_amount'] ?? 0);
            $map[$name]['withdraw_amount'] = $withdrawAmount;
            $map[$name]['net_amount'] = (float)$map[$name]['recharge_amount'] - $withdrawAmount;
        }

        usort($map, static function ($left, $right) {
            return abs((float)$right['net_amount']) <=> abs((float)$left['net_amount']);
        });

        return array_slice(array_values($map), 0, 8);
    }
}
