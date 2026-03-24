<?php
namespace app\controller;

use app\BaseController;
use app\model\User;
use think\facade\Db;

/**
 * 用户认证控制器
 */
class HoneywellAuth
{
    /**
     * 登录
     * POST /api/login
     */
    public function login()
    {
        $phone = input('phone', '');
        $password = input('password', '');

        // 参数验证
        if (empty($phone) || empty($password)) {
            return api_error('INVALID_PARAMS');
        }

        if (!preg_match('/^\d{9}$/', $phone)) {
            return api_error('INVALID_PHONE');
        }

        // 查询用户
        $user = Db::name('common_user')
            ->where('user_phone', $phone)
            ->where('status', 1)
            ->find();

        if (!$user || md5($password) !== $user['pwd']) {
            return api_error('INVALID_CREDENTIALS');
        }

        // 生成Token (30天有效期)
        $token = md5($user['id'] . time() . rand(1000, 9999));
        $expireTime = time() + 30 * 86400;

        // 保存Token
        Db::name('common_home_token')->insert([
            'token' => $token,
            'uid' => $user['id'],
            'create_time' => date('Y-m-d H:i:s'),
            'expire_time' => $expireTime
        ]);

        // 获取VIP等级
        $vipLog = Db::name('common_vip_log')
            ->where('uid', $user['id'])
            ->order('id', 'desc')
            ->find();
        $vipLevel = $vipLog ? (int)$vipLog['vip'] : 0;

        return $this->success([
            'token' => $token,
            'expireTime' => $expireTime,
            'user' => [
                'id' => (int)$user['id'],
                'phone' => $user['user_phone'],
                'nickname' => $user['nickname'] ?? '',
                'avatar' => $user['avatar'] ?? '',
                'availableBalance' => number_format($user['money_balance'] ?? $user['money'], 2, '.', ''),
                'frozenBalance' => number_format($user['frozen_balance'] ?? 0, 2, '.', ''),
                'inviteCode' => $user['invitation_code'],
                'vipLevel' => $vipLevel,
                'svipLevel' => $vipLevel,
                'firstPurchaseDone' => (bool)($user['first_purchase_done'] ?? 0),
                'status' => $user['status'] == 1 ? 'ACTIVE' : 'BANNED',
                'createdAt' => date('c', strtotime($user['create_time']))
            ]
        ]);
    }
    
    /**
     * 注册
     * POST /api/register
     */
    public function register()
    {
        $phone = input('phone', '');
        $password = input('password', '');
        $inviteCode = input('inviteCode', '');

        // 参数验证
        if (empty($phone) || empty($password)) {
            return $this->error('INVALID_PARAMS');
        }

        if (!preg_match('/^\d{9}$/', $phone)) {
            return $this->error('INVALID_PHONE');
        }

        // 检查手机号是否已存在
        $exists = Db::name('common_user')
            ->where('user_phone', $phone)
            ->find();
        
        if ($exists) {
            return $this->error('PHONE_EXISTS');
        }

        // 查找邀请人
        $parentId = 0;
        if (!empty($inviteCode)) {
            $parent = Db::name('common_user')
                ->where('invitation_code', $inviteCode)
                ->find();
            $parentId = $parent ? $parent['id'] : 0;
        }

        Db::startTrans();
        try {
            // 创建用户
            $userId = Db::name('common_user')->insertGetId([
                'user_phone' => $phone,
                'pwd' => md5($password),
                'invitation_code' => $this->generateInviteCode(),
                'parent_id' => $parentId,
                'status' => 1,
                'money_balance' => 0,
                'money_integral' => 0,
                'create_time' => date('Y-m-d H:i:s')
            ]);

            // 更新代理路径
            if ($parentId > 0) {
                $this->updateAgentPath($userId, $parentId);
            }

            Db::commit();

            // 生成Token
            return $this->login();

        } catch (\Exception $e) {
            Db::rollback();
            return $this->error('SYSTEM_ERROR');
        }
    }
    
    /**
     * 生成邀请码
     */
    private function generateInviteCode()
    {
        return 'U' . date('Ymd') . rand(1000, 9999);
    }
    
    /**
     * 更新代理路径
     */
    private function updateAgentPath($userId, $parentId)
    {
        // 获取父级的代理路径
        $parentPath = Db::name('common_agent_path')
            ->where('user_id', $parentId)
            ->select()
            ->toArray();
        
        // 添加当前用户到LV1
        Db::name('common_agent_path')->insert([
            'user_id' => $userId,
            'parent_id' => $parentId,
            'level' => 1
        ]);
        
        // 复制父级的其他层级路径
        foreach ($parentPath as $path) {
            Db::name('common_agent_path')->insert([
                'user_id' => $userId,
                'parent_id' => $path['parent_id'],
                'level' => $path['level'] + 1
            ]);
        }
    }
}
