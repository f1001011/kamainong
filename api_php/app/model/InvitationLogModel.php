<?php

namespace app\model;

class InvitationLogModel extends BaseModel
{
    public $name = 'money_invitation_log';

   public static function page_list($where,$order,$field='*')
    {
        return self::where($where)->field($field)->order($order)->select();
    }

    public static function task_num($map = []){

        return self::where($map)->sum('reward');
    }

    public static function received($map=[],$time=''){
        return self::where($map)->whereTime('create_time','>=',$time)->count();
    }

    public static function inserts($data){
       return self::insertGetId($data);
    }

   
}