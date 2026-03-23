<?php

namespace app\model;


class NoticeModel extends BaseModel
{
    public $name = 'common_notice';

    //获取列表
    public static function page_list($map = [],$field= '*',$order = 'id desc'){
        $where = [
            ['status','=',1]
        ];
        return self::where($map)->where($where)->order($order)->field($field)->select();
    }

    public function getContentAttr($value){
        if (empty($value)){
            return $value;
        }
        return htmlspecialchars_decode($value);
    }

}