<?php
namespace app\controller;

use app\BaseController;
use app\api\model\User as UserModel;

class User extends BaseController
{
    // 获取用户信息
    public function info()
    {
        $userId = request()->userId;
        
        $user = UserModel::field('id,user_name,nickname,phone,money_balance,level_vip,agent_level,agent_level_name,total_recharge,total_red')
            ->where('id', $userId)
            ->find();
        
        return show(1, $user);
    }
    
    // 获取余额
    public function balance()
    {
        $userId = request()->userId;
        
        $balance = UserModel::where('id', $userId)->value('money_balance');
        
        return show(1, ['balance' => $balance]);
    }
    
    // 修改密码
    public function changePassword()
    {
        $userId = request()->userId;
        $oldPwd = input('old_pwd');
        $newPwd = input('new_pwd');
        
        $user = UserModel::where('id', $userId)->find();
        
        if (md5($oldPwd) != $user['pwd']) {
            return show(0, [], 10024);
        }
        
        UserModel::where('id', $userId)->update(['pwd' => md5($newPwd)]);
        
        return show(1, [], 10025);
    }
}
