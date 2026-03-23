<?php
namespace app\api\model;

use think\Model;

class User extends Model
{
    protected $name = 'common_user';
    
    // 隐藏字段
    protected $hidden = ['pwd', 'withdraw_pwd'];
    
    // 获取用户信息
    public static function getUserInfo($userId)
    {
        return self::where('id', $userId)->find();
    }
}
