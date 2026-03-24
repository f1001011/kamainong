<?php
namespace app\controller;

use app\BaseController;
use app\model\User;
use app\model\MoneyLog;
use think\facade\Db;

/**
 * 用户认证控制器
 */
class HoneywellAuth extends BaseController
{
    /**
     * 登录接口
     * POST /api/honeywell/auth/login
     */
    public function login()
    {
        $phone = input('phone', '');
        $password = input('password', '');

        // 参数验证
        if (empty($phone) || empty($password)) {
            return json([
                'success' => false,
                'error' => ['code' => 'INVALID_PARAMS', 'message' => 'يرجى إدخال رقم الهاتف وكلمة المرور']
            ]);
        }

        if (!preg_match('/^\d{9}$/', $phone)) {
            return json([
                'success' => false,
                'error' => ['code' => 'INVALID_PHONE', 'message' => 'صيغة رقم الهاتف غير صحيحة']
            ]);
        }

        // 查询用户
        $user = User::where('user_phone', $phone)
            ->where('status', 1)
            ->find();

        if (!$user || md5($password) !== $user['pwd']) {
            return json([
                'success' => false,
                'error' => ['code' => 'WRONG_CREDENTIALS', 'message' => 'رقم الهاتف أو كلمة المرور غير صحيحة']
            ]);
        }

        // 生成Token
        $token = md5($user['id'] . time() . rand(1000, 9999));

        // 保存Token
        Db::name('common_home_token')->insert([
            'token' => $token,
            'uid' => $user['id'],
            'create_time' => date('Y-m-d H:i:s')
        ]);

        // 获取VIP等级
        $vipLog = Db::name('common_vip_log')
            ->where('uid', $user['id'])
            ->order('id', 'desc')
            ->find();
        $vipLevel = $vipLog ? (int)$vipLog['vip'] : 0;

        return json([
            'success' => true,
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => (int)$user['id'],
                    'phone' => $user['user_phone'],
                    'nickname' => $user['nickname'],
                    'avatar' => $user['avatar'],
                    'availableBalance' => number_format($user['money'], 2, '.', ''),
                    'frozenBalance' => number_format($user['frozen_balance'] ?? 0, 2, '.', ''),
                    'inviteCode' => $user['invitation_code'],
                    'vipLevel' => $vipLevel,
                    'svipLevel' => $vipLevel,
                    'firstPurchaseDone' => (bool)($user['first_purchase_done'] ?? 0),
                    'status' => $user['status'] == 1 ? 'ACTIVE' : 'BANNED',
                    'createdAt' => date('c', strtotime($user['create_time']))
                ]
            ]
        ]);
    }
}
