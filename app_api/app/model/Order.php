<?php
namespace app\model;

use think\Model;

class Order extends Model
{
    protected $name = 'common_goods_order';
    
    // 订单状态常量
    const STATUS_PENDING = 0;    // 待支付
    const STATUS_ACTIVE = 1;     // 进行中
    const STATUS_COMPLETED = 2;  // 已完成
    const STATUS_CANCELLED = 3;  // 已取消
    
    /**
     * 获取状态文本
     */
    public static function getStatusText($status)
    {
        $statusMap = [
            self::STATUS_PENDING => '待支付',
            self::STATUS_ACTIVE => '进行中',
            self::STATUS_COMPLETED => '已完成',
            self::STATUS_CANCELLED => '已取消',
        ];
        
        return $statusMap[$status] ?? '未知状态';
    }
    
    public static function getMyOrders($userId)
    {
        return self::where('user_id', $userId)
            ->order('create_time', 'desc')
            ->select();
    }
}
