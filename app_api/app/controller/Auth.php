<?php
namespace app\controller;

use app\BaseController;
use app\model\User;
use think\facade\Db;

class Auth extends BaseController
{
    // 登录
    public function login()
    {
        $phone = input('phone');
        $pwd = input('pwd');
        
        if (!$phone || !$pwd) {
            return show(0, [], 10016);
        }
        
        $user = User::where('phone', $phone)
            ->where('status', 1)
            ->find();
        
        if (!$user || md5($pwd) != $user['pwd']) {
            return show(0, [], 10017);
        }
        
        // 生成token
        $token = md5($user['id'] . time() . rand(1000, 9999));
        
        Db::name('common_home_token')->insert([
            'token' => $token,
            'user_id' => $user['id'],
            'create_time' => date('Y-m-d H:i:s')
        ]);
        
        return show(1, [
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'phone' => $user['phone'],
                'nickname' => $user['nickname'],
                'level_vip' => $user['level_vip']
            ]
        ], 10018);
    }

    // 注册
    public function register()
    {
        $phone = input('phone');
        $pwd = input('pwd');
        $agentId = input('agent_id', 0);
        
        if (!$phone || !$pwd) {
            return show(0, [], 10016);
        }
        
        // 检查手机号是否已注册
        $exists = User::where('phone', $phone)->find();
        if ($exists) {
            return show(0, [], 10007);
        }
        
        // 处理上级关系
        $agent_id_1 = 0;
        $agent_id_2 = 0;
        $agent_id_3 = 0;
        $user_team = time() . rand(1000, 9999); // 默认生成团队号
        
        if ($agentId > 0) {
            $parent = User::find($agentId);
            if ($parent) {
                $agent_id_1 = $agentId;
                $agent_id_2 = $parent['agent_id_1'];
                $agent_id_3 = $parent['agent_id_2'];
                $user_team = $parent['user_team'];
            }
        }
        
        // 创建用户
        $userId = User::insertGetId([
            'user_no' => time() . rand(1000, 9999),
            'user_name' => 'user_' . substr($phone, -4),
            'phone' => $phone,
            'pwd' => md5($pwd),
            'withdraw_pwd' => base64_encode($pwd),
            'agent_id' => $agentId,
            'agent_id_1' => $agent_id_1,
            'agent_id_2' => $agent_id_2,
            'agent_id_3' => $agent_id_3,
            'user_team' => $user_team,
            'create_time' => date('Y-m-d H:i:s'),
            'ip' => request()->ip()
        ]);
        
        return show(1, ['user_id' => $userId], 10019);
    }
}
