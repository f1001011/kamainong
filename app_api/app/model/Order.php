<?php
namespace app\api\model;

use think\Model;

class Order extends Model
{
    protected $name = 'common_goods_order';
    
    public static function getMyOrders($userId)
    {
        return self::where('user_id', $userId)
            ->order('create_time', 'desc')
            ->select();
    }
}
