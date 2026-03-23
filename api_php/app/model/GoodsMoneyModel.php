<?php


namespace app\model;


use think\Model;

class GoodsMoneyModel extends Model
{
    public $name = 'common_goods_money';

    public static function page_list($where,$limit,$page,$order)
    {
        return self::where($where)
            ->order($order)
            ->paginate(['list_rows'=>$limit,'page'=>$page], false)->each(function($item, $key){
                //$item['goods_name'] =  GoodsModel::getGoodsName($item['goods_id']);
                $item['money'] =  intval($item['money']);
                return $item;
            });
    }

    public static function getOne($map = []){
        return self::where($map)->find();
    }
}