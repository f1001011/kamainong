<?php

namespace app\model;

class CommonWaresOrderModel extends BaseModel
{
    protected $name = 'common_wares_order';

    const STATUS_ORDERED = 0; // 下单
    const STATUS_DELIVERING = 1; // 发货中
    const STATUS_IN_TRANSIT = 2; // 运输中
    const STATUS_SIGNED = 3; // 签收
    const STATUS_REJECT_SIGN = 4; // 拒签

    /**
     * 创建积分商品订单
     */
    public static function createOrder($uid, $wares, $address, $phone)
    {
        $waresNo = 'WARES' . time() . mt_rand(1000, 9999);
        
        $model = new self();
        $model->save([
            'wares_id' => $wares['id'],
            'wares_type_id' => $wares['wares_type_id'],
            'wares_spec' => $wares['wares_spec'],
            'head_img' => $wares['head_img'],
            'uid' => $uid,
            'address_id' => 0,
            'address' => $address,
            'wares_money' => $wares['wares_money'],
            'create_time' => date('Y-m-d H:i:s'),
            'wares_no' => $waresNo,
            'success_time' => null,
            'status' => self::STATUS_ORDERED,
            'phone' => $phone,
        ]);
        
        return $model;
    }
}
