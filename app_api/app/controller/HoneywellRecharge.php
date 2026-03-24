<?php
namespace app\controller;

use app\BaseController;
use app\model\Recharge;
use think\facade\Db;

/**
 * Honeywell 充值模块
 */
class HoneywellRecharge extends BaseController
{
    /**
     * 充值订单列表
     * GET /api/recharge/records
     */
    public function records()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        list($page, $pageSize) = $this->getPageParams();
        
        $result = Recharge::getRecords($userId, $page, $pageSize);
        
        $records = [];
        foreach ($result['list'] as $item) {
            $records[] = Recharge::format($item);
        }
        
        return $this->paginated($records, $result['total'], $page, $pageSize);
    }

    /**
     * 充值订单详情
     * GET /api/recharge/detail?id=xxx
     */
    public function detail()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $id = input('id', 0);
        $order = Recharge::getDetail($id, $userId);
        
        if (!$order) {
            return $this->error('RECHARGE_NOT_FOUND');
        }
        
        return $this->success(Recharge::format($order));
    }
    
    /**
     * 创建充值订单
     * POST /api/recharge/create
     */
    public function create()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $amount = input('amount', 0);
        $channelCode = input('channelCode', '');
        
        // 获取最低充值金额配置
        $minAmount = Db::name('common_sys_config')
            ->where('name', 'min_recharge')
            ->value('value', 8000);
        
        if ($amount < $minAmount) {
            return $this->error('RECHARGE_MINIMUM', ['min' => $minAmount]);
        }
        
        // 创建订单
        $orderNo = 'RC' . date('YmdHis') . rand(1000, 9999);
        $orderId = Db::name('common_pay_recharge')->insertGetId([
            'uid' => $userId,
            'order_no' => $orderNo,
            'money' => $amount,
            'actual_amount' => $amount,
            'pay_type' => $channelCode,
            'status' => Recharge::STATUS_PENDING,
            'create_time' => date('Y-m-d H:i:s'),
            'expire_at' => date('Y-m-d H:i:s', strtotime('+30 minutes'))
        ]);
        
        return $this->success([
            'orderId' => $orderId,
            'orderNo' => $orderNo,
            'amount' => number_format($amount, 2, '.', ''),
            'paymentUrl' => 'https://pay.example.com/' . $orderNo
        ]);
    }

    /**
     * 取消充值订单
     * POST /api/recharge/orders/:id/cancel
     */
    public function cancel()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $id = input('id', 0);
        $order = Db::name('common_pay_recharge')
            ->where('id', $id)
            ->where('uid', $userId)
            ->find();
        
        if (!$order) {
            return $this->error('RECHARGE_NOT_FOUND');
        }
        
        if ($order['status'] != Recharge::STATUS_PENDING) {
            return $this->error('RECHARGE_ALREADY_PAID');
        }
        
        Db::name('common_pay_recharge')
            ->where('id', $id)
            ->update(['status' => Recharge::STATUS_CANCELLED]);
        
        return $this->success();
    }
}
