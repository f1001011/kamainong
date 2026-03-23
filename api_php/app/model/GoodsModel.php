<?php

namespace app\model;


use app\model\GoodsDayModel as GoodsDay;
use app\model\GoodsTypeModel as GoodsType;

class GoodsModel extends BaseModel
{
    public $name = 'common_goods';

   public static function page_list($where,$limit,$page,$order,$field='*')
{
    return self::where($where)
        ->field($field)
        ->order($order)
        ->paginate(['list_rows'=>$limit,'page'=>$page], false)->each(function($item, $key){
            $item['red_way_text'] =  self::getRedWay($item['red_way']);
            $item['goods_type_name'] =  GoodsType::page_one_value($item['goods_type_id']);
            $item['head_img'] =  TC('image_url').$item['head_img'];
            $item['bottom_img'] =  TC('image_url').$item['bottom_img'];
            $item['goods_money'] =  intval($item['goods_money']);
            $item['project_scale'] =  intval($item['project_scale']);
            return $item;
        });
}

    public static function page_sel_list($map,$order='a.id asc'){
        return self::where($map)->alias('a')->order($order)->leftJoin((new GoodsType())->name .' b','a.goods_type_id=b.id')->field('a.*,b.type_name')->select();
    }


    //获取投注类型
    public static function getRedWay($RedWay){
        $str = '';
        switch ($RedWay){
            case 1:$str = '到期还本还息';break;
        }
        return $str;
    }

    public static function getGoodsName($id){
        if (empty($id) || $id <=0){
            return '';
        }
        return self::where('id',$id)->value('goods_name');
    }

    public static function getOne($map = []){
       $find=  self::where($map)->find();
       if (!empty($find)){
           $find['head_img'] =  TC('image_url').$find['head_img'];
           $find['bottom_img'] =  TC('image_url').$find['bottom_img'];
           $find['day_red'] =  intval($find['day_red']);
           $find['goods_money'] =  intval($find['goods_money']);
           $find['project_scale'] =  intval($find['project_scale']);
           $find['progress_rate'] =  intval($find['progress_rate']);
       }
       return $find;
    }

    public function getCntGroupByGoodsTypeId(){
        $where = [
            ['status', '=', 1],
            ['del', '=', 0],
        ];
        return self::where($where)->field('goods_type_id as id, count(id) as cnt')->group('goods_type_id')->select();
    }
}