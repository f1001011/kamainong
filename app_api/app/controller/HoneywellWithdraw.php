<?php
namespace app\controller;

use app\model\User;
use app\model\Withdraw;
use think\facade\Db;

/**
 * Honeywell 提现模块
 */
class HoneywellWithdraw extends HoneywellBase
{
    /**
     * 提现订单列表
     * GET /api/withdraw/records
     */
    public function records()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        list($page, $pageSize) = $this->getPageParams();
        
        // 使用 paginate 方法
        $result = Db::name('common_pay_cash')
            ->where('uid', $userId)
            ->order('id', 'desc')
            ->paginate([
                'list_rows' => $pageSize,
                'page' => $page,
            ]);
        
        $total = $result->total();
        $list = $result->items()->toArray();
        
        $records = [];
        foreach ($list as $item) {
            $records[] = Withdraw::format($item);
        }
        
        return $this->paginated($records, $total, $page, $pageSize);
    }

    /**
     * 提现订单详情
     * GET /api/withdraw/detail?id=xxx
     */
    public function detail()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $id = input('id', 0);
        $order = Withdraw::getDetail($id, $userId);
        
        if (!$order) {
            return $this->error('WITHDRAW_NOT_FOUND');
        }
        
        return $this->success(Withdraw::format($order));
    }

    /**
     * 创建提现订单
     * POST /api/withdraw/create
     */
    public function create()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $amount = input('amount', 0);
        $bankCardId = input('bankCardId', 0);
        
        // 获取最低提现金额配置
        $minAmount = Db::name('common_sys_config')
            ->where('name', 'min_withdraw')
            ->value('value', 500);
        
        if ($amount < $minAmount) {
            return $this->error('WITHDRAW_MINIMUM', ['min' => $minAmount]);
        }
        
        // 检查提现权限
        $check = Withdraw::canWithdraw($userId);
        if (!$check['can']) {
            return $this->error($check['reason']);
        }
        
        Db::startTrans();
        try {
            $user = User::where('id', $userId)->lock(true)->find();
            
            // 检查余额
            $balance = $user['money_balance'] ?? $user['money'];
            if ($balance < $amount) {
                throw new \Exception('余额不足');
            }
            
            // 计算手续费 10%
            $fee = $amount * 0.1;
            $actualAmount = $amount - $fee;
            
            // 扣除余额
            User::changeMoney($userId, 'dec', 1, $amount, MoneyLog::STATUS_WITHDRAW, 0, '提现申请');
            
            $orderNo = 'WD' . date('YmdHis') . rand(1000, 9999);
            $orderId = Db::name('common_pay_cash')->insertGetId([
                'uid' => $userId,
                'order_no' => $orderNo,
                'money' => $amount,
                'fee' => $fee,
                'actual_amount' => $actualAmount,
                'bank_card_id' => $bankCardId,
                'status' => Withdraw::STATUS_PENDING,
                'create_time' => date('Y-m-d H:i:s')
            ]);
            
            Db::commit();
            
            return $this->success([
                'orderId' => $orderId,
                'orderNo' => $orderNo,
                'amount' => number_format($amount, 2, '.', ''),
                'fee' => number_format($fee, 2, '.', ''),
                'actualAmount' => number_format($actualAmount, 2, '.', '')
            ]);
            
        } catch (\Exception $e) {
            Db::rollback();
            return $this->error('SYSTEM_ERROR');
        }
    }

    /**
     * 检查提现权限
     * GET /api/withdraw/can_withdraw
     */
    public function canWithdraw()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $check = Withdraw::canWithdraw($userId);
        
        return $this->success([
            'canWithdraw' => $check['can'],
            'reason' => $check['can'] ? null : $check['reason']
        ]);
    }

    /**
     * 提现条件检查（前端 /withdraw/check）
     * GET /api/withdraw/check
     */
    public function check()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $configs = Db::name('common_sys_config')->column('value', 'name');
        $user = Db::name('common_user')->where('id', $userId)->find();
        
        $now = date('H:i:s');
        $withdrawStart = $configs['withdraw_start_time'] ?? '10:00';
        $withdrawEnd = $configs['withdraw_end_time'] ?? '18:00';
        $dailyLimit = (int)($configs['withdraw_daily_limit'] ?? 1);
        $minAmount = (int)($configs['min_withdraw'] ?? 500);
        $maxAmount = (int)($configs['max_withdraw'] ?? 1000000);
        $feePercent = (float)($configs['withdraw_tax_rate'] ?? 0.1);
        
        // 检查时间
        $inTimeRange = ($now >= $withdrawStart && $now <= $withdrawEnd);
        
        // 检查每日次数
        $todayCount = Db::name('common_pay_cash')
            ->where('uid', $userId)
            ->where('status', '<>', 2)  // 非已拒绝
            ->whereTime('create_time', 'today')
            ->count();
        
        // 检查是否充值过
        $hasRecharged = (bool)Db::name('common_pay_recharge')
            ->where('uid', $userId)
            ->where('status', 1)  // 已支付
            ->count();
        
        // 检查是否购买过付费产品
        $hasPurchasedPaid = (bool)Db::name('common_goods_order')
            ->where('uid', $userId)
            ->where('status', 1)
            ->count();
        
        // 提现门槛
        $thresholdMet = $hasRecharged || $hasPurchasedPaid;
        
        // 不可提现原因
        $reason = null;
        if (!$thresholdMet) {
            $reason = 'THRESHOLD_NOT_MET';
        } elseif (!$hasRecharged) {
            $reason = 'NOT_RECHARGED';
        } elseif (!$inTimeRange) {
            $reason = 'TIME_INVALID';
        } elseif ($todayCount >= $dailyLimit) {
            $reason = 'LIMIT_EXCEEDED';
        }
        
        // 快捷金额
        $quickAmounts = [1000, 3000, 5000, 10000, 20000];
        
        $canWithdraw = ($thresholdMet && $inTimeRange && $todayCount < $dailyLimit);
        
        return $this->success([
            'canWithdraw' => $canWithdraw,
            'reason' => $reason,
            'hasRecharged' => $hasRecharged,
            'hasPurchasedPaid' => $hasPurchasedPaid,
            'availableBalance' => number_format($user['money_balance'] ?? $user['money'] ?? 0, 2, '.', ''),
            'feePercent' => $feePercent * 100,
            'minAmount' => (string)$minAmount,
            'maxAmount' => (string)$maxAmount,
            'timeRange' => $withdrawStart . ' - ' . $withdrawEnd,
            'inTimeRange' => $inTimeRange,
            'todayCount' => $todayCount,
            'dailyLimit' => $dailyLimit,
            'quickAmounts' => $quickAmounts,
            'tips' => 'Les retraits sont traités sous 24 heures'
        ]);
    }
}
