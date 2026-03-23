<?php

namespace app\model;


use think\facade\Db;

class ArticleModel extends BaseModel
{
    public $name = 'common_article';

    //获取列表
    public static function page_list($map = [],$field= '*',$order = 'create_time desc'){
        $where = [
//            ['status','=',1]
        ];
        return self::where($map)
            ->where($where)
            ->field($field)
            ->order($order)
            ->orderRaw('rand()')
            ->limit(10)
            ->select();
        //return Db::query('SELECT * FROM `ntp_common_article` ORDER BY RAND() LIMIT 5');
    }

    //获取列表
    public static function page_one($map = [],$field= '*'){
        return self::where($map)->field($field)->find();
    }

    public  static function getThumbUrlAttr($value){
        if (empty($value)){
            return '';
        }
        return self::$imageUrl.$value;
    }
    public function getContentAttr($value){
        if (empty($value)){
            return $value;
        }
        return htmlspecialchars_decode($value);
    }
}