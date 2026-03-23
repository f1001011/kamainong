<?php


namespace app\model;


use think\Model;

class AgentPath extends Model
{
    public $name = 'common_agent_path';
    public static function max_user(){
        $find = self::order('uid desc')->find();
        if (empty($find)){
            return 0;
        }
        return $find->uid;
    }
}