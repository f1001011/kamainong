<?php
namespace app\controller;

use app\BaseController;
use app\model\Withdraw;
use app\model\User;
use app\model\MoneyLog;
use think\facade\Db;

/**
 * Honeywell 提现模块
 */
class HoneywellWithdraw extends BaseController
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
        
        $result = Withdraw::getRecords($userId, $page, $pageSize);
        
        $records = [];
        foreach ($result['list'] as $item) {
            $records[] = Withdraw::format($item);
        }
        
        return $this->paginated($records, $result['total'], $page, $pageSize);
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
}
