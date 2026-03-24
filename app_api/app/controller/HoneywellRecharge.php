<?php
namespace app\controller;

use app\model\User;
use app\model\Recharge;
use think\facade\Db;

/**
 * Honeywell 充值模块
 */
class HoneywellRecharge extends HoneywellBase
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
        
        // 使用 paginate 方法
        $result = Db::name('common_pay_recharge')
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
            $records[] = Recharge::format($item);
        }
        
        return $this->paginated($records, $total, $page, $pageSize);
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

    /**
     * 充值通道列表
     * GET /api/recharge/channels
     */
    public function channels()
    {
        $configs = Db::name('common_sys_config')->column('value', 'name');
        
        $minAmount = (int)($configs['min_recharge'] ?? 8000);
        $maxAmount = (int)($configs['max_recharge'] ?? 10000000);
        
        // 预设金额
        $presets = [1000, 3000, 5000, 10000, 20000, 50000];
        
        // 支付通道（从数据库读取）
        $paymentChannels = Db::name('common_payment_channel')
            ->where('status', 1)
            ->select()
            ->toArray();
        
        $channels = [];
        foreach ($paymentChannels as $channel) {
            $channels[] = [
                'id' => (int)$channel['id'],
                'code' => $channel['channel_code'],
                'name' => $channel['channel_name'],
                'icon' => $channel['channel_icon'] ?? '',
                'description' => $channel['channel_desc'] ?? ''
            ];
        }
        
        // 如果没有配置通道，返回默认通道
        if (empty($channels)) {
            $channels = [
                ['id' => 1, 'code' => 'default', 'name' => 'Paiement par défaut', 'icon' => '', 'description' => '']
            ];
        }
        
        return $this->success([
            'channels' => $channels,
            'presets' => $presets,
            'minAmount' => (string)$minAmount,
            'maxAmount' => (string)$maxAmount,
            'tips' => 'Le dépôt sera crédité sous 5 minutes'
        ]);
    }
}
