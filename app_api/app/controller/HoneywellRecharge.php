<?php
namespace app\controller;

use app\BaseController;
use app\model\User;
use think\facade\Db;

/**
 * Honeywell 充值模块
 */
class HoneywellRecharge extends BaseController
{
    /**
     * 充值订单列表
     * GET /api/honeywell_recharge/records
     */
    public function records()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $page = input('page', 1);
        $pageSize = input('pageSize', 20);
        
        $list = Db::name('common_pay_recharge')
            ->where('uid', $userId)
            ->order('id', 'desc')
            ->page($page, $pageSize)
            ->select()
            ->toArray();
        
        $total = Db::name('common_pay_recharge')->where('uid', $userId)->count();
        
        $records = [];
        foreach ($list as $item) {
            $records[] = [
                'id' => (int)$item['id'],
                'orderNo' => $item['order_no'] ?? '',
                'amount' => number_format($item['money'], 2, '.', ''),
                'actualAmount' => number_format($item['actual_amount'] ?? $item['money'], 2, '.', ''),
                'channelName' => $item['pay_type'] ?? '',
                'status' => $this->mapRechargeStatus($item['status']),
                'createdAt' => date('c', strtotime($item['create_time'])),
                'paidAt' => $item['pay_time'] ? date('c', strtotime($item['pay_time'])) : null
            ];
        }
        
        return json([
            'success' => true,
            'data' => [
                'list' => $records,
                'pagination' => [
                    'total' => (int)$total,
                    'page' => (int)$page,
                    'pageSize' => (int)$pageSize
                ]
            ]
        ]);
    }

    /**
     * 充值订单详情
     * GET /api/honeywell_recharge/detail
     */
    public function detail()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $id = input('id', 0);
        $order = Db::name('common_pay_recharge')->where('id', $id)->where('uid', $userId)->find();
        
        if (!$order) {
            return json(['success' => false, 'error' => ['code' => 'NOT_FOUND', 'message' => 'Orden no encontrada']]);
        }
        
        return json([
            'success' => true,
            'data' => [
                'id' => (int)$order['id'],
                'orderNo' => $order['order_no'] ?? '',
                'amount' => number_format($order['money'], 2, '.', ''),
                'actualAmount' => number_format($order['actual_amount'] ?? $order['money'], 2, '.', ''),
                'status' => $this->mapRechargeStatus($order['status']),
                'paymentUrl' => $order['pay_url'] ?? null,
                'createdAt' => date('c', strtotime($order['create_time'])),
                'expireAt' => $order['expire_at'] ? date('c', strtotime($order['expire_at'])) : null
            ]
        ]);
    }
    
    /**
     * 创建充值订单
     * POST /api/honeywell_recharge/create
     */
    public function create()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $amount = input('amount', 0);
        $channelCode = input('channelCode', '');
        
        if ($amount < 8000) {
            return json(['success' => false, 'error' => ['code' => 'AMOUNT_TOO_LOW', 'message' => 'Monto mínimo 8000 XAF']]);
        }
        
        // 创建订单
        $orderNo = date('YmdHis') . rand(1000, 9999);
        $orderId = Db::name('common_pay_recharge')->insertGetId([
            'uid' => $userId,
            'order_no' => $orderNo,
            'money' => $amount,
            'actual_amount' => $amount,
            'pay_type' => $channelCode,
            'status' => 0,
            'create_time' => date('Y-m-d H:i:s'),
            'expire_at' => date('Y-m-d H:i:s', strtotime('+30 minutes'))
        ]);
        
        return json([
            'success' => true,
            'data' => [
                'orderId' => $orderId,
                'orderNo' => $orderNo,
                'paymentUrl' => 'https://pay.example.com/' . $orderNo
            ]
        ]);
    }

    /**
     * 取消充值订单
     * POST /api/honeywell_recharge/cancel
     */
    public function cancel()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $id = input('id', 0);
        $order = Db::name('common_pay_recharge')->where('id', $id)->where('uid', $userId)->find();
        
        if (!$order) {
            return json(['success' => false, 'error' => ['code' => 'NOT_FOUND', 'message' => 'Orden no encontrada']]);
        }
        
        if ($order['status'] != 0) {
            return json(['success' => false, 'error' => ['code' => 'CANNOT_CANCEL', 'message' => 'No se puede cancelar']]);
        }
        
        Db::name('common_pay_recharge')->where('id', $id)->update(['status' => 3]);
        
        return json(['success' => true, 'data' => null]);
    }
    
    /**
     * 映射充值状态
     */
    private function mapRechargeStatus($status)
    {
        $map = [0 => 'PENDING', 1 => 'SUCCESS', 2 => 'FAILED', 3 => 'CANCELLED'];
        return $map[$status] ?? 'PENDING';
    }
    
    private function getUserId()
    {
        $token = request()->header('authorization');
        $token = str_replace('Bearer ', '', $token);
        if (empty($token)) return null;
        
        $tokenInfo = Db::name('common_home_token')->where('token', $token)->find();
        return $tokenInfo ? $tokenInfo['uid'] : null;
    }
    
    private function unauthorized()
    {
        return json(['success' => false, 'error' => ['code' => 'UNAUTHORIZED', 'message' => 'No autorizado']], 401);
    }
}
