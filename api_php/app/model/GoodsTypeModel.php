<?php

namespace app\model;


class GoodsTypeModel extends BaseModel
{
    public $name = 'common_goods_type';

    //获取列表
    public static function page_list($map = [],$field= '*',$order = 'sort desc'){
        $where = [
            ['status','=',1]
        ];
        return self::where($map)->where($where)->order($order)->field($field)->select();
    }

    public static function page_one_value($id){
        if ($id <= 0){
            return '';
        }
        return  self::where('id',$id)->value('type_name');
    }

    public static function getOne($map = []){
        return self::where($map)->find();
    }
}