<?php
namespace app\controller;

use app\BaseController;
use app\model\Order;
use app\model\Income;
use app\model\Product;
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
     * GET /api/order/positions
     */
    public function positions()
    {
        $userId = $this->getUserId();
        if (!$userId) {
            return $this->unauthorized();
        }
        
        $orders = Order::getPositions($userId);
        
        $list = [];
        foreach ($orders as $order) {
            $list[] = Order::format($order);
        }
        
        return $this->success($list);
    }
    
    /**
     * 持仓详情
     * GET /api/order/detail?id=xxx
     */
    public function detail()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $id = input('id', 0);
        $order = Order::getDetail($id, $userId);
        
        if (!$order) {
            return $this->error('ORDER_NOT_FOUND');
        }
        
        return $this->success(Order::format($order));
    }
    
    /**
     * 收益记录
     * GET /api/order/incomes?id=xxx
     */
    public function incomes()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $orderId = input('id', 0);
        list($page, $pageSize) = $this->getPageParams();
        
        $query = Db::name('common_income_claim_log')
            ->where('order_id', $orderId);
        
        $total = $query->count();
        $list = $query->order('id', 'desc')
            ->page($page, $pageSize)
            ->select()
            ->toArray();
        
        $records = [];
        foreach ($list as $item) {
            $records[] = [
                'id' => (int)$item['id'],
                'amount' => number_format($item['claim_amount'], 2, '.', ''),
                'status' => Income::getStatusText($item['status']),
                'availableAt' => $item['available_time'] ? date('c', $item['available_time']) : null,
                'claimedAt' => $item['claim_time'] ? date('c', $item['claim_time']) : null,
                'expiredAt' => $item['expire_time'] ? date('c', $item['expire_time']) : null
            ];
        }
        
        return $this->paginated($records, $total, $page, $pageSize);
    }
    
    /**
     * 领取收益
     * POST /api/order/claim
     */
    public function claim()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $incomeId = input('incomeId', 0);
        
        // 获取收益记录
        $income = Db::name('common_income_claim_log')
            ->where('id', $incomeId)
            ->where('user_id', $userId)
            ->where('status', Income::STATUS_WAITING)
            ->where('available_time', '<=', time())
            ->where('expire_time', '>', time())
            ->find();
        
        if (!$income) {
            return $this->error('INCOME_NOT_AVAILABLE');
        }
        
        Db::startTrans();
        try {
            // 增加用户余额
            $result = User::changeMoney(
                $userId, 
                'inc', 
                1, 
                $income['claim_amount'], 
                MoneyLog::STATUS_DAILY_INCOME, 
                $incomeId, 
                '领取收益'
            );
            
            if ($result['code'] != 1) {
                throw new \Exception($result['msg']);
            }
            
            // 更新收益状态
            Db::name('common_income_claim_log')
                ->where('id', $incomeId)
                ->update([
                    'status' => Income::STATUS_CLAIMED,
                    'claim_time' => time()
                ]);
            
            Db::commit();
            
            return $this->success([
                'amount' => number_format($income['claim_amount'], 2, '.', ''),
                'balance' => number_format($result['balance'] ?? 0, 2, '.', '')
            ]);
            
        } catch (\Exception $e) {
            Db::rollback();
            return $this->error('SYSTEM_ERROR');
        }
    }
    
    /**
     * 购买产品
     * POST /api/order/buy
     */
    public function buy()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $productId = input('productId', 0);
        $money = input('money', 0);
        
        $product = Product::getDetail($productId);
        if (!$product) {
            return $this->error('PRODUCT_NOT_FOUND');
        }
        
        Db::startTrans();
        try {
            // 扣除余额
            $result = User::changeMoney(
                $userId, 
                'dec', 
                1, 
                $money, 
                MoneyLog::STATUS_BUY_GOODS, 
                $productId, 
                '购买产品'
            );
            
            if ($result['code'] != 1) {
                throw new \Exception($result['msg']);
            }
            
            // 计算总收益
            $totalIncome = $money * $product['day_red'] / $product['goods_money'];
            
            // 创建订单
            $orderId = Db::name('common_goods_order')->insertGetId([
                'uid' => $userId,
                'goods_id' => $productId,
                'money' => $money,
                'total_money' => $totalIncome,
                'day_red' => $product['day_red'],
                'status' => Order::STATUS_ACTIVE,
                'create_time' => date('Y-m-d H:i:s'),
                'end_time' => date('Y-m-d H:i:s', time() + $product['period'] * 86400)
            ]);
            
            // 标记首购
            Db::name('common_user')->where('id', $userId)->update(['first_purchase_done' => 1]);
            
            Db::commit();
            
            return $this->success(['orderId' => $orderId]);
            
        } catch (\Exception $e) {
            Db::rollback();
            return $this->error('SYSTEM_ERROR');
        }
    }
}
