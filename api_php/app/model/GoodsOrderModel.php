<?php

namespace app\model;


class GoodsOrderModel extends BaseModel
{
    public $name = 'common_goods_order';

    /**
     * @param $map 用户ID status >=0
     * @param $time 查询的时间
     */
    public static function orderLog($map = [], $time = '', $page = 0, $limit = 10, $field = '*', $order = 'id desc')
    {
        $self = self::where($map);
        if (!empty($time)) {
            $self = $self->whereMonth('create_time', $time);
        }
        return $self->field($field)->order($order)->paginate([
            'list_rows' => $limit,
            'page' => $page
        ]);
    }

    //查询购买产品的人数
    public static function buyerCount($ArrayColumnId = [])
    {
        //统计 购买的人数
        return self::whereIn('uid', $ArrayColumnId)->group('uid')->count();
    }

    public static function inserts($data = []){
        return self::insertGetId($data);
    }

    public static function countMoney($map,$time){
        $self =  self::where($map);
        if (!empty($time)){
            $self = $self->whereMonth('create_time',$time);
        }
        return  $self->where($map)->sum('order_money');
    }

    public static function PageSel($map,$field = '*'){
        return self::where($map)->field($field)->select()->toArray();
    }
}