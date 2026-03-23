<?php

namespace app\model;

class UserWelfareModel extends BaseModel
{
    public $name = 'common_user_welfare_log';

    public static function page_list($where,$limit,$page,$time,$order,$field='*')
    {
        $list = self::alias('a')
            ->join('common_welfare b', 'a.wid = b.id', 'left')
            ->where($where);
        if (!empty($time)){
            $list = $list->whereMonth('a.create_time',$time);
        }

        return $list->field($field)
            ->order($order)
            ->paginate(['list_rows'=>$limit,'page'=>$page], false)->each(function($item, $key){
                $item ->img_path =  empty($item->img_path) ? '':TC('image_url').$item['img_path'];
                return $item;
            });
    }

    public static function inserts($data){
        return self::insertGetId($data);
    }

    public static function countMoney($map,$time){
        $self =  self::where($map);
        if (!empty($time)){
            $self = $self->whereMonth('create_time',$time);
        }
        return  $self->where($map)->sum('amount');
    }
}