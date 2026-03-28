<?php

namespace app\model;

class CommonGoodsOrderModel extends BaseModel
{
    protected $name = 'common_goods_order';

    const IS_COUPON_NO = 0; // 未使用优惠券

    const STATUS_NORMAL = 0; // 正常分红中
    const STATUS_REBATE_FINISHED = 1; // 返佣完成
    const STATUS_DIVIDEND_FINISHED = 2; // 分红完成利息返回完成
    const STATUS_PRINCIPAL_FINISHED = 3; // 本金返回完成
    const STATUS_DELETE = -1; // 逻辑删除

    /**
     * 创建订单
     */
    public static function createOrder($userId, $userName, $goods, $orderNumber = 1)
    {
        $now = date('Y-m-d H:i:s');
        $orderNo = 'ORD' . time() . mt_rand(1000, 9999);
        
        $orderMoney = $goods['goods_money'] * $orderNumber;
        $totalRedMoney = $goods['total_money'] * $orderNumber;
        
        $model = new self();
        $model->save([
            'user_id' => $userId,
            'user_name' => $userName,
            'goods_name' => $goods['goods_name'],
            'goods_id' => $goods['id'],
            'goods_type_id' => $goods['goods_type_id'],
            'goods_money' => $goods['goods_money'],
            'goods_type_name' => $goods['goods_type_id'] == 1 ? 'Revenu fixe' : 'Periodic',
            'total_red_money' => $totalRedMoney,
            'already_red_money' => 0,
            'surplus_red_money' => $totalRedMoney,
            'red_day' => $goods['period'],
            'already_red_day' => 0,
            'surplus_red_day' => $goods['period'],
            'next_red_date' => $now,
            'last_red_date' => $now,
            'order_money' => $orderMoney,
            'order_number' => $orderNumber,
            'create_time' => $now,
            'update_time' => $now,
            'is_coupon' => self::IS_COUPON_NO,
            'coupon_money' => 0,
            'status' => self::STATUS_NORMAL,
            'order_no' => $orderNo,
            'one_money' => $goods['goods_money'],
        ]);
        
        return $model;
    }
}
