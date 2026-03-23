<?php

namespace app\model;


class BannerModel extends BaseModel
{
    public $name = 'common_ads';

    //获取列表
    public static function page_list($map = [],$field= '*',$order = 'sort asc'){
        $where = [
          ['status','=',1]
        ];
        $list = self::where($map)->where($where)->order($order)->field($field)->select();

        foreach($list as &$item){
            $item['content'] = str_replace(TC('replace_img_prefix'), TC('image_url'), $item['content']);
            $item['content'] = str_replace('<p>', '<p style="">', $item['content']);
        }

        return $list;
    }

    public  static function getImgAttr($value){
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
    public function getProgressContentAttr($value){
        if (empty($value)){
            return $value;
        }
        return htmlspecialchars_decode($value);
    }
}