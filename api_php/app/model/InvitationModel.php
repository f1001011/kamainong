<?php

namespace app\model;

class InvitationModel extends BaseModel
{
    public $name = 'common_invitation';

   public static function page_list($where,$order,$field='*')
    {
        return self::where($where)->field($field)->order($order)->select()->toArray();
    }

    public static function task_ranking($num){
       $where[] = ['number','<=',$num];
        return self::where($where)->count();
    }

    public static function page_one($map = []){
        return self::where($map)->find();
    }


}