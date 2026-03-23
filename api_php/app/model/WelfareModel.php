<?php

namespace app\model;

class WelfareModel extends BaseModel
{
    public $name = 'common_welfare';

    public static function page_list($where,$limit,$page,$order,$field='*')
    {
        return self::where($where)
            ->field($field)
            ->order($order)
            ->paginate(['list_rows'=>$limit,'page'=>$page], false)->each(function($item, $key){
                $item['img_path'] =  empty($item['img_path']) ? '':TC('image_url').$item['img_path'];
                $item['initiate_time'] =  date('Y-m-d',strtotime($item['create_time']));
                $item['content'] =  htmlspecialchars_decode($item['content']);
                $item['progress_content'] =  htmlspecialchars_decode($item['progress_content']);
                return $item;
            });
    }

    public static function getOne($map = []){
        $data = self::where($map)->find();
        if (empty($data)){
            return null;
        }
        $data['img_path'] = empty($data['img_path']) ? '':TC('image_url').$data['img_path'];
        $data['collection_agency_logo'] = empty($data['collection_agency_logo']) ? '':TC('image_url').$data['collection_agency_logo'];
        $data['executing_agency_logo'] = empty($data['executing_agency_logo']) ? '':TC('image_url').$data['executing_agency_logo'];
        $data['initiate_time'] =  date('Y-m-d',$data['initiate_time']);
        $data['content'] =  htmlspecialchars_decode($data['content']) . '<style>.neirong img{max-width:95%; 
    margin: 10px auto;
    display: block;}</style>';
        $data['progress_content'] =  '<div class="neirong">'.htmlspecialchars_decode($data['progress_content'])  . '</div><style>.neirong img{max-width:95%; 
    margin: 10px auto;
    display: block;}</style>';
        return $data;
    }

    public static function inserts($data){
        return self::insertGetId($data);
    }

    public static function accumulate($map = [],$amount = 0){
        $up['update_time'] = date('Y-m-d H:i:s');
        return self::where($map)->data($up)->inc('amount',$amount)->inc('people')->update();
    }
}