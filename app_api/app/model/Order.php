<?php
namespace app\model;

use think\Model;
use think\facade\Db;

class Order extends Model
{
    protected $name = 'common_goods_order';
    
    // 订单状态常量
    const STATUS_PENDING = 0;    // 待支付
    const STATUS_ACTIVE = 1;     // 进行中
    const STATUS_COMPLETED = 2;  // 已完成
    const STATUS_CANCELLED = 3;  // 已取消
    
    /**
     * 获取用户持仓列表
     */
    public static function getPositions($userId)
    {
        return self::alias('o')
            ->join('common_goods g', 'o.goods_id = g.id')
            ->where('o.uid', $userId)
            ->where('o.status', self::STATUS_ACTIVE)
            ->field('o.*, g.goods_name, g.period, g.income_times_per_day, g.income_per_time, g.day_red, g.total_money')
            ->order('o.id', 'desc')
            ->select();
    }
    
    /**
     * 获取持仓详情
     */
    public static function getDetail($orderId, $userId)
    {
        return self::alias('o')
            ->join('common_goods g', 'o.goods_id = g.id')
            ->where('o.id', $orderId)
            ->where('o.uid', $userId)
            ->field('o.*, g.goods_name, g.period, g.income_times_per_day, g.income_per_time, g.day_red, g.total_money')
            ->find();
    }
    
    /**
     * 格式化持仓数据
     */
    public static function format($order, $userId = null)
    {
        // 计算已领取收益
        $claimedIncome = Db::name('common_income_claim_log')
            ->where('order_id', $order['id'])
            ->where('status', 1)
            ->sum('claim_amount');
        
        // 查询可领取的收益
        $claimableIncome = Db::name('common_income_claim_log')
            ->where('order_id', $order['id'])
            ->where('status', 0)
            ->where('available_time', '<=', time())
            ->where('expire_time', '>', time())
            ->select();
        
        $claimableCount = count($claimableIncome);
        
        return [
            'id' => (int)$order['id'],
            'productId' => (int)$order['goods_id'],
            'productName' => $order['goods_name'],
            'investAmount' => number_format($order['money'], 2, '.', ''),
            'totalIncome' => number_format($order['total_money'], 2, '.', ''),
            'claimedIncome' => number_format($claimedIncome ?? 0, 2, '.', ''),
            'unclaimedIncome' => number_format(($order['total_money'] ?? 0) - ($claimedIncome ?? 0), 2, '.', ''),
            'claimableCount' => $claimableCount,
            'status' => 'ACTIVE',
            'startDate' => date('c', strtotime($order['create_time'])),
            'endDate' => date('c', strtotime($order['end_time'])),
            'progress' => $order['total_money'] > 0 ? round(($claimedIncome / $order['total_money']) * 100, 2) : 0
        ];
    }
    
    /**
     * 创建订单
     */
    public static function create($userId, $productId, $money)
    {
        $product = Db::name('common_goods')->where('id', $productId)->find();
        if (!$product) {
            return ['code' => 0, 'msg' => 'PRODUCT_NOT_FOUND'];
        }
        
        $now = time();
        $endTime = $now + ($product['period'] * 24 * 3600);
        
        $orderId = Db::name('common_goods_order')->insertGetId([
            'uid' => $userId,
            'goods_id' => $productId,
            'money' => $money,
            'total_money' => $money * $product['day_red'] / $product['goods_money'],
            'day_red' => $product['day_red'],
            'status' => self::STATUS_ACTIVE,
            'create_time' => date('Y-m-d H:i:s', $now),
            'end_time' => date('Y-m-d H:i:s', $endTime)
        ]);
        
        return ['code' => 1, 'order_id' => $orderId];
    }
    
    /**
     * 获取状态文本
     */
    public static function getStatusText($status)
    {
        $map = [
            self::STATUS_PENDING => 'PENDING',
            self::STATUS_ACTIVE => 'ACTIVE',
            self::STATUS_COMPLETED => 'COMPLETED',
            self::STATUS_CANCELLED => 'CANCELLED'
        ];
        return $map[$status] ?? 'UNKNOWN';
    }
}
