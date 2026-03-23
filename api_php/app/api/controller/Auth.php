<?php
namespace app\api\controller;

use app\BaseController;
use app\api\model\User;
use think\facade\Db;

class Auth extends BaseController
{
    // 登录
    public function login()
    {
        $phone = input('phone');
        $pwd = input('pwd');
        
        if (!$phone || !$pwd) {
            return json(['code' => 400, 'msg' => '手机号和密码不能为空']);
        }
        
        $user = User::where('phone', $phone)
            ->where('status', 1)
            ->find();
        
        if (!$user || md5($pwd) != $user['pwd']) {
            return json(['code' => 401, 'msg' => '手机号或密码错误']);
        }
        
        // 生成token
        $token = md5($user['id'] . time() . rand(1000, 9999));
        
        Db::name('common_home_token')->insert([
            'token' => $token,
            'user_id' => $user['id'],
            'create_time' => date('Y-m-d H:i:s')
        ]);
        
        return json([
            'code' => 200,
            'msg' => '登录成功',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'phone' => $user['phone'],
                    'nickname' => $user['nickname'],
                    'level_vip' => $user['level_vip']
                ]
            ]
        ]);
    }

    // 注册
    public function register()
    {
        $phone = input('phone');
        $pwd = input('pwd');
        
        if (!$phone || !$pwd) {
            return json(['code' => 400, 'msg' => '手机号和密码不能为空']);
        }
        
        // 检查手机号是否已注册
        $exists = User::where('phone', $phone)->find();
        if ($exists) {
            return json(['code' => 400, 'msg' => '手机号已注册']);
        }
        
        // 创建用户
        $userId = User::insertGetId([
            'user_no' => time() . rand(1000, 9999),
            'user_name' => 'user_' . substr($phone, -4),
            'phone' => $phone,
            'pwd' => md5($pwd),
            'withdraw_pwd' => base64_encode($pwd),
            'create_time' => date('Y-m-d H:i:s'),
            'ip' => request()->ip()
        ]);
        
        return json(['code' => 200, 'msg' => '注册成功', 'data' => ['user_id' => $userId]]);
    }
}
