<?php

namespace app\model;


use app\model\GoodsDayModel as GoodsDay;
use app\model\GoodsTypeModel as GoodsType;

class WaresOrderModel extends BaseModel
{
    public $name = 'common_wares_order';

   public static function page_list($where,$limit,$page,$order,$field='*')
{
    return self::where($where)
        ->field($field)
        ->order($order)
        ->paginate(['list_rows'=>$limit,'page'=>$page], false)->each(function($item, $key){

            $item['head_img'] =  empty($item['head_img']) ? '' : $item['head_img'];
            $item['head_img'] = str_replace(TC('replace_img_prefix'), TC('image_url'), $item['head_img']);
            $item['content'] = str_replace(TC('replace_img_prefix'), TC('image_url'), htmlspecialchars_decode($item['content']));
            switch ($item['status']){
                case 0:$item['status_text'] = '下单';break;
                case 1:$item['status_text'] = '发货中';break;
                case 2:$item['status_text'] = '运输中';break;
                case 3:$item['status_text'] = '签收';break;
                case 4:$item['status_text'] = '拒签';break;
            }
            return $item;
        });
}

    public static function getOne($map = []){
       return self::where($map)->find();
    }

    public static function inserts($data){
       return self::insertGetId($data);
    }
}