<?php
namespace app\controller;

use app\BaseController;
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
     * GET /api/honeywell_withdraw/records
     */
    public function records()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $page = input('page', 1);
        $pageSize = input('pageSize', 20);
        
        $list = Db::name('common_pay_cash')
            ->where('uid', $userId)
            ->order('id', 'desc')
            ->page($page, $pageSize)
            ->select()
            ->toArray();
        
        $total = Db::name('common_pay_cash')->where('uid', $userId)->count();
        
        $records = [];
        foreach ($list as $item) {
            $records[] = [
                'id' => (int)$item['id'],
                'orderNo' => $item['order_no'] ?? '',
                'amount' => number_format($item['money'], 2, '.', ''),
                'fee' => number_format($item['fee'] ?? 0, 2, '.', ''),
                'actualAmount' => number_format($item['actual_amount'] ?? $item['money'], 2, '.', ''),
                'status' => $this->mapWithdrawStatus($item['status']),
                'createdAt' => date('c', strtotime($item['create_time']))
            ];
        }
        
        return json([
            'success' => true,
            'data' => [
                'list' => $records,
                'pagination' => ['total' => (int)$total, 'page' => (int)$page, 'pageSize' => (int)$pageSize]
            ]
        ]);
    }

    /**
     * 提现订单详情
     */
    public function detail()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $id = input('id', 0);
        $order = Db::name('common_pay_cash')->where('id', $id)->where('uid', $userId)->find();
        
        if (!$order) {
            return json(['success' => false, 'error' => ['code' => 'NOT_FOUND', 'message' => 'Orden no encontrada']]);
        }
        
        return json([
            'success' => true,
            'data' => [
                'id' => (int)$order['id'],
                'orderNo' => $order['order_no'] ?? '',
                'amount' => number_format($order['money'], 2, '.', ''),
                'fee' => number_format($order['fee'] ?? 0, 2, '.', ''),
                'actualAmount' => number_format($order['actual_amount'] ?? $order['money'], 2, '.', ''),
                'status' => $this->mapWithdrawStatus($order['status']),
                'rejectReason' => $order['reject_reason'] ?? null,
                'createdAt' => date('c', strtotime($order['create_time']))
            ]
        ]);
    }

    /**
     * 创建提现订单
     */
    public function create()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $amount = input('amount', 0);
        
        if ($amount < 500) {
            return json(['success' => false, 'error' => ['code' => 'AMOUNT_TOO_LOW', 'message' => 'Monto mínimo 500 XAF']]);
        }
        
        Db::startTrans();
        try {
            $user = User::where('id', $userId)->lock(true)->find();
            
            // 检查首购
            if (!$user['first_purchase_done']) {
                throw new \Exception('Debe comprar un producto primero');
            }
            
            // 计算手续费
            $fee = $amount * 0.1;
            $actualAmount = $amount - $fee;
            
            // 扣除余额并冻结
            $result = User::changeMoney($userId, 'dec', 1, $amount, MoneyLog::STATUS_WITHDRAW, 0, '提现');
            if ($result['code'] != 1) {
                throw new \Exception('Saldo insuficiente');
            }
            
            // 增加冻结余额
            Db::name('common_user')->where('id', $userId)->inc('money_freeze', $amount)->update();
            
            $orderNo = date('YmdHis') . rand(1000, 9999);
            $orderId = Db::name('common_pay_cash')->insertGetId([
                'uid' => $userId,
                'order_no' => $orderNo,
                'money' => $amount,
                'fee' => $fee,
                'actual_amount' => $actualAmount,
                'status' => 0,
                'create_time' => date('Y-m-d H:i:s')
            ]);
            
            Db::commit();
            return json(['success' => true, 'data' => ['orderId' => $orderId]]);
            
        } catch (\Exception $e) {
            Db::rollback();
            return json(['success' => false, 'error' => ['code' => 'WITHDRAW_FAILED', 'message' => $e->getMessage()]]);
        }
    }

    /**
     * 检查提现权限
     */
    public function canWithdraw()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $user = User::find($userId);
        
        $canWithdraw = (bool)$user['first_purchase_done'];
        $reason = $canWithdraw ? null : 'Debe comprar un producto primero';
        
        return json([
            'success' => true,
            'data' => [
                'canWithdraw' => $canWithdraw,
                'reason' => $reason
            ]
        ]);
    }
    
    private function mapWithdrawStatus($status)
    {
        $map = [0 => 'PENDING', 1 => 'PROCESSING', 2 => 'SUCCESS', 3 => 'REJECTED'];
        return $map[$status] ?? 'PENDING';
    }
    
    private function getUserId()
    {
        $token = request()->header('authorization');
        $token = str_replace('Bearer ', '', $token);
        if (empty($token)) return null;
        
        $tokenInfo = \think\facade\Db::name('common_home_token')->where('token', $token)->find();
        return $tokenInfo ? $tokenInfo['uid'] : null;
    }
    
    private function unauthorized()
    {
        return json(['success' => false, 'error' => ['code' => 'UNAUTHORIZED', 'message' => 'No autorizado']], 401);
    }
}
