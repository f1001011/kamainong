<?php

namespace app\model;


use app\model\GoodsDayModel as GoodsDay;
use app\model\GoodsTypeModel as GoodsType;

class WaresModel extends BaseModel
{
    public $name = 'common_wares';

   public static function page_list($where,$limit,$page,$order,$field='*')
{
    return self::where($where)
        ->field($field)
        ->order($order)
        ->paginate(['list_rows'=>$limit,'page'=>$page], false)->each(function($item, $key){
            $item['head_img'] =  TC('image_url').$item['head_img'];
            $item['content'] = str_replace(TC('replace_img_prefix'), TC('image_url'), htmlspecialchars_decode($item['content']));//htmlspecialchars_decode($item['content']);//
            $item['wares_money'] =  intval($item['wares_money']);
            return $item;
        });
}

    public static function getOne($map = []){
       $info = self::where($map)->find();
       $info['head_img'] = TC('image_url').$info['head_img'];
       $info['content'] = str_replace(TC('replace_img_prefix'), TC('image_url'), htmlspecialchars_decode($info['content']));
       return $info;
    }

    public function getWaresNameListByIds($ids){
       $where[] = ['id', 'in', $ids];
       return self::where($where)->field('id, wares_name')->select();
    }
}