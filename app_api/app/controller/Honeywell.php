<?php
namespace app\controller;

use app\model\User;
use think\facade\Db;

/**
 * Honeywell 用户主控制器
 */
class Honeywell extends HoneywellBase
{
    /**
     * 登录接口
     * POST /api/honeywell/login
     */
    public function login()
    {
        $phone = input('phone', '');
        $password = input('password', '');
        
        // 参数验证
        if (empty($phone) || empty($password)) {
            return json([
                'success' => false,
                'error' => ['code' => 'INVALID_PARAMS', 'message' => 'Parámetros inválidos']
            ]);
        }
        
        // 查询用户
        $user = User::where('phone', $phone)->where('status', 1)->find();
        
        if (!$user || md5($password) !== $user['pwd']) {
            return json([
                'success' => false,
                'error' => ['code' => 'WRONG_CREDENTIALS', 'message' => 'Credenciales incorrectas']
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
        $vipLog = Db::name('common_vip_log')->where('uid', $user['id'])->order('id', 'desc')->find();
        $vipLevel = $vipLog ? (int)$vipLog['vip'] : 0;
        
        return json([
            'success' => true,
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => (int)$user['id'],
                    'phone' => $user['phone'],
                    'nickname' => $user['nickname'],
                    'avatar' => $user['head_img'],
                    'availableBalance' => number_format($user['money_balance'], 2, '.', ''),
                    'frozenBalance' => number_format($user['money_freeze'], 2, '.', ''),
                    'inviteCode' => $user['invitation_code'] ?? '',
                    'vipLevel' => $vipLevel,
                    'svipLevel' => $vipLevel,
                    'firstPurchaseDone' => (bool)($user['first_purchase_done'] ?? 0),
                    'status' => $user['status'] == 1 ? 'ACTIVE' : 'BANNED',
                    'createdAt' => date('c', strtotime($user['create_time']))
                ]
            ]
        ]);
    }

    /**
     * 注册接口
     * POST /api/honeywell/register
     */
    public function register()
    {
        $phone = input('phone', '');
        $password = input('password', '');
        $inviteCode = input('inviteCode', '');
        
        if (empty($phone) || empty($password)) {
            return json([
                'success' => false,
                'error' => ['code' => 'INVALID_PARAMS', 'message' => 'Parámetros inválidos']
            ]);
        }
        
        // 检查手机号是否已注册
        $exists = User::where('phone', $phone)->find();
        if ($exists) {
            return json([
                'success' => false,
                'error' => ['code' => 'PHONE_EXISTS', 'message' => 'El teléfono ya está registrado']
            ]);
        }
        
        // 处理邀请码
        $agentId1 = 0;
        $agentId2 = 0;
        $agentId3 = 0;
        
        if (!empty($inviteCode)) {
            $parent = User::where('invitation_code', $inviteCode)->find();
            if ($parent) {
                $agentId1 = $parent['id'];
                $agentId2 = $parent['agent_id_1'];
                $agentId3 = $parent['agent_id_2'];
            }
        }
        
        // 创建用户
        $userId = Db::name('common_user')->insertGetId([
            'user_no' => time() . rand(1000, 9999),
            'user_name' => 'user_' . time(),
            'phone' => $phone,
            'pwd' => md5($password),
            'withdraw_pwd' => base64_encode($password),
            'invitation_code' => $this->generateInviteCode(),
            'agent_id_1' => $agentId1,
            'agent_id_2' => $agentId2,
            'agent_id_3' => $agentId3,
            'user_team' => time() . rand(1000, 9999),
            'ip' => request()->ip(),
            'create_time' => date('Y-m-d H:i:s')
        ]);
        
        // 生成Token
        $token = md5($userId . time() . rand(1000, 9999));
        Db::name('common_home_token')->insert([
            'token' => $token,
            'uid' => $userId,
            'create_time' => date('Y-m-d H:i:s')
        ]);
        
        $user = User::find($userId);
        
        return json([
            'success' => true,
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $userId,
                    'phone' => $phone,
                    'inviteCode' => $user['invitation_code']
                ]
            ]
        ]);
    }
    
    /**
     * 生成邀请码
     */
    private function generateInviteCode()
    {
        do {
            $code = strtoupper(substr(md5(time() . rand(1000, 9999)), 0, 8));
            $exists = User::where('invitation_code', $code)->find();
        } while ($exists);
        
        return $code;
    }

    /**
     * 获取用户信息
     * GET /api/honeywell/userProfile
     */
    public function userProfile()
    {
        $token = request()->header('authorization');
        $token = str_replace('Bearer ', '', $token);
        
        if (empty($token)) {
            return json([
                'success' => false,
                'error' => ['code' => 'UNAUTHORIZED', 'message' => 'No autorizado']
            ], 401);
        }
        
        $tokenInfo = Db::name('common_home_token')->where('token', $token)->find();
        if (!$tokenInfo) {
            return json([
                'success' => false,
                'error' => ['code' => 'INVALID_TOKEN', 'message' => 'Token inválido']
            ], 401);
        }
        
        $user = User::find($tokenInfo['uid']);
        if (!$user) {
            return json([
                'success' => false,
                'error' => ['code' => 'USER_NOT_FOUND', 'message' => 'Usuario no encontrado']
            ], 404);
        }
        
        $vipLog = Db::name('common_vip_log')->where('uid', $user['id'])->order('id', 'desc')->find();
        $vipLevel = $vipLog ? (int)$vipLog['vip'] : 0;
        
        return json([
            'success' => true,
            'data' => [
                'id' => (int)$user['id'],
                'phone' => $user['phone'],
                'nickname' => $user['nickname'],
                'avatar' => $user['head_img'],
                'availableBalance' => number_format($user['money_balance'], 2, '.', ''),
                'frozenBalance' => number_format($user['money_freeze'], 2, '.', ''),
                'totalEarnings' => number_format($user['total_red'], 2, '.', ''),
                'totalRecharge' => number_format($user['total_recharge'], 2, '.', ''),
                'totalWithdraw' => number_format($user['total_withdraw'], 2, '.', ''),
                'inviteCode' => $user['invitation_code'] ?? '',
                'vipLevel' => $vipLevel,
                'svipLevel' => $vipLevel,
                'firstPurchaseDone' => (bool)($user['first_purchase_done'] ?? 0),
                'status' => $user['status'] == 1 ? 'ACTIVE' : 'BANNED',
                'createdAt' => date('c', strtotime($user['create_time']))
            ]
        ]);
    }

    /**
     * 更新用户资料
     * PUT /api/user/profile
     */
    public function updateProfile()
    {
        $token = request()->header('authorization');
        $token = str_replace('Bearer ', '', $token);
        
        if (empty($token)) {
            return json(['success' => false, 'error' => ['code' => 'UNAUTHORIZED', 'message' => 'No autorizado']], 401);
        }
        
        $tokenInfo = Db::name('common_home_token')->where('token', $token)->find();
        if (!$tokenInfo) {
            return json(['success' => false, 'error' => ['code' => 'INVALID_TOKEN', 'message' => 'Token inválido']], 401);
        }
        
        $userId = $tokenInfo['uid'];
        $nickname = input('nickname', '');
        
        // 更新昵称
        if (!empty($nickname)) {
            Db::name('common_user')->where('id', $userId)->update(['nickname' => $nickname]);
        }
        
        return json(['success' => true, 'data' => ['message' => 'Profil mis à jour']]);
    }

    /**
     * 更新密码
     * PUT /api/user/password
     */
    public function updatePassword()
    {
        $token = request()->header('authorization');
        $token = str_replace('Bearer ', '', $token);
        
        if (empty($token)) {
            return json(['success' => false, 'error' => ['code' => 'UNAUTHORIZED', 'message' => 'No autorizado']], 401);
        }
        
        $tokenInfo = Db::name('common_home_token')->where('token', $token)->find();
        if (!$tokenInfo) {
            return json(['success' => false, 'error' => ['code' => 'INVALID_TOKEN', 'message' => 'Token inválido']], 401);
        }
        
        $userId = $tokenInfo['uid'];
        $oldPassword = input('oldPassword', '');
        $newPassword = input('newPassword', '');
        
        if (empty($oldPassword) || empty($newPassword)) {
            return json(['success' => false, 'error' => ['code' => 'INVALID_PARAMS', 'message' => 'Paramètres invalides']]);
        }
        
        $user = Db::name('common_user')->where('id', $userId)->find();
        
        // 验证旧密码
        if (md5($oldPassword) !== $user['pwd']) {
            return json(['success' => false, 'error' => ['code' => 'WRONG_PASSWORD', 'message' => 'Ancien mot de passe incorrect']]);
        }
        
        // 更新密码
        Db::name('common_user')->where('id', $userId)->update([
            'pwd' => md5($newPassword)
        ]);
        
        return json(['success' => true, 'data' => ['message' => 'Mot de passe mis à jour']]);
    }

    /**
     * 退出登录
     * POST /api/auth/logout
     */
    public function logout()
    {
        $token = request()->header('authorization');
        $token = str_replace('Bearer ', '', $token);
        
        if (!empty($token)) {
            Db::name('common_home_token')->where('token', $token)->delete();
        }
        
        return json(['success' => true, 'data' => ['message' => 'Déconnexion réussie']]);
    }

    /**
     * 上传文件
     * POST /api/upload
     */
    public function upload()
    {
        $userId = $this->getUserIdFromToken();
        if (!$userId) {
            return json(['success' => false, 'error' => ['code' => 'UNAUTHORIZED', 'message' => 'No autorizado']], 401);
        }
        
        $file = request()->file('file');
        if (!$file) {
            return json(['success' => false, 'error' => ['code' => 'NO_FILE', 'message' => 'Aucun fichier']]);
        }
        
        try {
            $savename = \think\facade\Filesystem::disk('public')->putFile('uploads', $file);
            $url = '/storage/' . $savename;
            
            return json(['success' => true, 'data' => ['url' => $url]]);
        } catch (\Exception $e) {
            return json(['success' => false, 'error' => ['code' => 'UPLOAD_FAILED', 'message' => $e->getMessage()]]);
        }
    }

    /**
     * 从Token获取用户ID
     */
    private function getUserIdFromToken()
    {
        $token = request()->header('authorization');
        $token = str_replace('Bearer ', '', $token);
        if (empty($token)) return null;
        
        $tokenInfo = Db::name('common_home_token')->where('token', $token)->find();
        return $tokenInfo ? $tokenInfo['uid'] : null;
    }
}
