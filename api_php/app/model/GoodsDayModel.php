<?php


namespace app\model;


use think\Model;

class GoodsDayModel extends Model
{
    public $name = 'common_goods_day';

    public static function page_list($where,$limit,$page,$order)
    {
        return self::where($where)
            ->order($order)
            ->paginate(['list_rows'=>$limit,'page'=>$page], false)->each(function($item, $key){
                $item['goods_name'] =  GoodsModel::getGoodsName($item['goods_id']);
                $item['income'] =  intval($item['income']);
                $item['total_red_money'] =  intval($item['total_red_money']);
                $item['withdrawable_money'] =  intval($item['withdrawable_money']);
                return $item;
            });
    }

    public static function getOne($map = []){
        return self::where($map)->find();
    }
}