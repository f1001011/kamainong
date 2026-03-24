<?php
namespace app\controller;

use app\BaseController;
use app\model\User;
use app\model\MoneyLog;
use think\facade\Db;

/**
 * Honeywell 订单/持仓模块
 */
class HoneywellOrder extends BaseController
{
    /**
     * 持仓列表
     * GET /api/honeywell_order/positions
     */
    public function positions()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return $this->unauthorized();
        }
        
        $orders = Db::name('common_goods_order')
            ->alias('o')
            ->leftJoin('common_goods g', 'o.goods_id = g.id')
            ->where('o.uid', $userId)
            ->where('o.status', 1)
            ->field('o.*, g.goods_name, g.period, g.income_times_per_day, g.income_per_time')
            ->order('o.id', 'desc')
            ->select()
            ->toArray();
        
        $list = [];
        foreach ($orders as $order) {
            // 计算已领取收益
            $claimedIncome = Db::name('common_income_claim_log')
                ->where('order_id', $order['id'])
                ->sum('money');
            
            $list[] = [
                'id' => (int)$order['id'],
                'productId' => (int)$order['goods_id'],
                'productName' => $order['goods_name'],
                'investAmount' => number_format($order['money'], 2, '.', ''),
                'totalIncome' => number_format($order['total_money'], 2, '.', ''),
                'claimedIncome' => number_format($claimedIncome, 2, '.', ''),
                'unclaimedIncome' => number_format($order['total_money'] - $claimedIncome, 2, '.', ''),
                'status' => 'ACTIVE',
                'startDate' => date('c', strtotime($order['create_time'])),
                'endDate' => date('c', strtotime($order['end_time'])),
                'canClaim' => $this->canClaimIncome($order['id'])
            ];
        }
        
        return json(['success' => true, 'data' => $list]);
    }
    
    /**
     * 检查是否可以领取收益
     */
    private function canClaimIncome($orderId)
    {
        $lastClaim = Db::name('common_income_claim_log')
            ->where('order_id', $orderId)
            ->order('id', 'desc')
            ->find();
        
        if (!$lastClaim) {
            return true;
        }
        
        // 检查是否超过领取间隔（这里简化处理，实际需要根据产品配置）
        $interval = 480; // 8小时
        return (time() - strtotime($lastClaim['create_time'])) > ($interval * 60);
    }

    /**
     * 持仓详情
     * GET /api/honeywell_order/detail/{id}
     */
    public function detail()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $id = input('id', 0);
        $order = Db::name('common_goods_order')->where('id', $id)->where('uid', $userId)->find();
        
        if (!$order) {
            return json(['success' => false, 'error' => ['code' => 'NOT_FOUND', 'message' => 'Orden no encontrada']]);
        }
        
        $product = Db::name('common_goods')->find($order['goods_id']);
        $claimedIncome = Db::name('common_income_claim_log')->where('order_id', $id)->sum('money');
        
        return json([
            'success' => true,
            'data' => [
                'id' => (int)$order['id'],
                'productName' => $product['goods_name'],
                'investAmount' => number_format($order['money'], 2, '.', ''),
                'totalIncome' => number_format($order['total_money'], 2, '.', ''),
                'claimedIncome' => number_format($claimedIncome, 2, '.', ''),
                'startDate' => date('c', strtotime($order['create_time'])),
                'endDate' => date('c', strtotime($order['end_time']))
            ]
        ]);
    }
    
    /**
     * 收益记录
     * GET /api/honeywell_order/incomes/{id}
     */
    public function incomes()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $orderId = input('id', 0);
        $page = input('page', 1);
        $pageSize = input('pageSize', 20);
        
        $list = Db::name('common_income_claim_log')
            ->where('order_id', $orderId)
            ->order('id', 'desc')
            ->page($page, $pageSize)
            ->select()
            ->toArray();
        
        $total = Db::name('common_income_claim_log')->where('order_id', $orderId)->count();
        
        $records = [];
        foreach ($list as $item) {
            $records[] = [
                'id' => (int)$item['id'],
                'amount' => number_format($item['money'], 2, '.', ''),
                'claimedAt' => date('c', strtotime($item['create_time']))
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
     * 领取收益
     * POST /api/honeywell_order/claim
     */
    public function claim()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $orderId = input('orderId', 0);
        
        // 加锁查询订单
        Db::startTrans();
        try {
            $order = Db::name('common_goods_order')->where('id', $orderId)->where('uid', $userId)->lock(true)->find();
            
            if (!$order) {
                throw new \Exception('订单不存在');
            }
            
            // 检查是否可以领取
            if (!$this->canClaimIncome($orderId)) {
                throw new \Exception('领取间隔未到');
            }
            
            $product = Db::name('common_goods')->find($order['goods_id']);
            $claimAmount = $product['income_per_time'];
            
            // 增加用户余额（使用User模型的changeMoney方法）
            $result = User::changeMoney($userId, 'inc', 1, $claimAmount, MoneyLog::STATUS_DAILY_INCOME, $orderId, '领取收益');
            
            if ($result['code'] != 1) {
                throw new \Exception('领取失败');
            }
            
            // 记录收益领取
            Db::name('common_income_claim_log')->insert([
                'uid' => $userId,
                'order_id' => $orderId,
                'money' => $claimAmount,
                'create_time' => date('Y-m-d H:i:s')
            ]);
            
            Db::commit();
            
            return json(['success' => true, 'data' => ['amount' => number_format($claimAmount, 2, '.', '')]]);
            
        } catch (\Exception $e) {
            Db::rollback();
            return json(['success' => false, 'error' => ['code' => 'CLAIM_FAILED', 'message' => $e->getMessage()]]);
        }
    }

    /**
     * 购买产品
     * POST /api/honeywell_order/buy
     */
    public function buy()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $productId = input('productId', 0);
        
        Db::startTrans();
        try {
            $product = Db::name('common_goods')->where('id', $productId)->lock(true)->find();
            if (!$product) {
                throw new \Exception('产品不存在');
            }
            
            // 扣除余额
            $result = User::changeMoney($userId, 'dec', 1, $product['goods_money'], MoneyLog::STATUS_BUY_GOODS, $productId, '购买产品');
            if ($result['code'] != 1) {
                throw new \Exception('余额不足');
            }
            
            // 创建订单
            $orderId = Db::name('common_goods_order')->insertGetId([
                'uid' => $userId,
                'goods_id' => $productId,
                'money' => $product['goods_money'],
                'total_money' => $product['total_money'],
                'status' => 1,
                'create_time' => date('Y-m-d H:i:s'),
                'end_time' => date('Y-m-d H:i:s', strtotime("+{$product['period']} days"))
            ]);
            
            // 标记首购
            Db::name('common_user')->where('id', $userId)->update(['first_purchase_done' => 1]);
            
            Db::commit();
            return json(['success' => true, 'data' => ['orderId' => $orderId]]);
            
        } catch (\Exception $e) {
            Db::rollback();
            return json(['success' => false, 'error' => ['code' => 'BUY_FAILED', 'message' => $e->getMessage()]]);
        }
    }
    
    /**
     * 获取当前用户ID
     */
    private function getUserId()
    {
        $token = request()->header('authorization');
        $token = str_replace('Bearer ', '', $token);
        if (empty($token)) return null;
        
        $tokenInfo = Db::name('common_home_token')->where('token', $token)->find();
        return $tokenInfo ? $tokenInfo['uid'] : null;
    }
    
    /**
     * 未授权响应
     */
    private function unauthorized()
    {
        return json(['success' => false, 'error' => ['code' => 'UNAUTHORIZED', 'message' => 'No autorizado']], 401);
    }
}
