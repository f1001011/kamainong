<?php

namespace app\controller;

use app\model\CommonHomeTokenModel;
use app\model\CommonUserModel;
use think\exception\ValidateException;
use think\facade\Db;

/**
 * 登录注册控制器
 * 负责处理用户登录、注册相关的业务逻辑
 * 提供用户注册、登录验证、Token生成等功能
 */
class LoginCon extends BaseCon
{
    /**
     * 用户注册接口
     * 新用户注册账号，支持邀请码绑定上级关系
     * 处理流程：参数验证 -> 检查手机号是否已注册 -> 处理邀请关系 -> 创建用户 -> 生成Token -> 返回结果
     * 
     * @return mixed 返回注册结果，包含Token和用户信息
     */
    public function Register()
    {
        // 定义需要接收的参数字段：phone-手机号, pwd-密码, invitation_code-邀请码(可选)
        $postField = 'phone,pwd,invitation_code';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        // 邀请码转换为大写并去除空格
        $post['invitation_code'] = isset($post['invitation_code']) ? strtoupper(trim((string)$post['invitation_code'])) : '';

        // 1. 参数验证，使用验证器进行校验
        try {
            validate(\app\validate\LoginValidate::class)->scene('register')->check($post);
        } catch (ValidateException $e) {
            // 验证失败，返回错误信息
            return Show(ERROR, [], $e->getError());
        }

        // 2. 检查手机号是否已注册
        $existsUser = CommonUserModel::PageDataOne(['phone' => $post['phone']]);
        if ($existsUser) {
            return Show(ERROR, [], 10007);
        }

        // 3. 处理邀请码，若填写了邀请码则查询邀请人信息
        $inviter = null;
        if (!empty($post['invitation_code'])) {
            // 根据邀请码查询邀请人
            $inviter = CommonUserModel::PageDataOne(['invitation_code' => $post['invitation_code']]);
            // 若邀请码不存在，则返回错误提示
            if (!$inviter) {
                return Show(ERROR, [], 10057);
            }
        }

        // 获取当前时间
        $now = date('Y-m-d H:i:s');
        
        // 4. 开启事务，创建用户账号
        Db::startTrans();
        try {
            // 4.1 构建用户基础数据
            $insertData = [
                'user_no' => 0, // 用户编号暂时为0，后续更新
                'user_name' => 'user_' . time() . mt_rand(100, 999), // 用户名：user_时间戳随机数
                'create_time' => $now, // 创建时间
                'pwd' => ShiftEncode($post['pwd']), // 密码加密存储
                'withdraw_pwd' => ShiftEncode($post['pwd']), // 提现密码默认与登录密码相同
                'status' => CommonUserModel::STATUS_NORMAL, // 正常状态
                'state' => CommonUserModel::STATE_OFFLINE, // 离线状态
                'is_real_name' => CommonUserModel::IS_REAL_NAME_NONE, // 未实名
                'market_uid' => 0, // 业务员ID默认为0
                'is_fictitious' => CommonUserModel::IS_FICTITIOUS_NO, // 非虚拟账号
                'phone' => $post['phone'], // 手机号
                'user_team' => 0, // 所属团队默认为0
                'ip' => (string)$this->request->ip(), // 注册IP地址
                'is_withdraw' => CommonUserModel::IS_WITHDRAW_YES, // 可提现
                'invitation_code' => '', // 邀请码暂时为空，后续更新
            ];

            // 4.2 若存在邀请人，则绑定上下级关系
            if ($inviter) {
                $insertData['agent_id'] = (int)$inviter['id']; // 上级ID
                $insertData['agent_id_1'] = (int)$inviter['id']; // 一级上级
                $insertData['agent_id_2'] = (int)($inviter['agent_id_1'] ?? 0); // 二级上级
                $insertData['agent_id_3'] = (int)($inviter['agent_id_2'] ?? 0); // 三级上级
            }

            // 4.3 创建用户记录
            $newUser = new CommonUserModel();
            $newUser->save($insertData);
            // 获取新用户ID
            $newUserId = (int)$newUser->id;

            // 4.4 生成用户编号和邀请码（基于用户ID确保唯一）
            $userNo = $newUserId + USER_NO_OFFSET; // 用户编号 = ID + 偏移量
            // 邀请码改为基于 user_no 生成，确保与用户编号一一对应、天然唯一
            $invitationCode = $userNo;
            // 无邀请码时，创建新的团队ID（使用自己的 user_no）
            $userTeam = $userNo;
            // 有邀请码且上级存在团队号时，继承上级团队ID
            if ($inviter && !empty($inviter['user_team'])) {
                $userTeam = (int)$inviter['user_team'];
            }

            // 4.5 更新用户编号、团队ID和邀请码
            CommonUserModel::update([
                'id' => $newUserId,
                'user_no' => $userNo,
                'user_team' => $userTeam,
                'invitation_code' => $invitationCode,
            ]);

            // 4.6 生成登录Token
            $token = ApiToken($newUserId);
            // 保存Token到数据库
            $tokenModel = new CommonHomeTokenModel();
            $tokenModel->save([
                'token' => $token,
                'create_time' => $now,
                'user_id' => $newUserId,
            ]);

            // 提交事务，确认所有数据变更
            Db::commit();

            // 4.7 获取完整的用户信息并返回
            $userInfo = CommonUserModel::PageDataOne(['id' => $newUserId]);
            if ($userInfo) {
                // 移除敏感信息
                unset($userInfo['pwd'], $userInfo['withdraw_pwd']);
            }

            // 返回成功数据，包含Token和用户信息
            return Show(SUCCESS, ['token' => $token, 'user_info' => $userInfo], 10058);
        } catch (\Throwable $e) {
            // 捕获异常，回滚所有数据变更
            Db::rollback();
            // 返回错误提示
            return Show(ERROR, [], 10061);
        }

    }

    /**
     * 用户登录接口
     * 用户使用手机号和密码登录，验证通过后生成Token
     * 处理流程：参数验证 -> 查询用户 -> 验证密码 -> 生成Token -> 返回结果
     * 
     * @return mixed 返回登录结果，包含Token和用户信息
     */
    public function Login()
    {
        // 定义需要接收的参数字段：phone-手机号, pwd-密码
        $postField = 'phone,pwd';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        // 1. 参数验证，使用验证器进行校验
        try {
            validate(\app\validate\LoginValidate::class)->scene('login')->check($post);
        } catch (ValidateException $e) {
            // 验证失败，返回错误信息
            return Show(ERROR, [], $e->getError());
        }

        // 2. 根据手机号查询用户信息
        $userInfo = CommonUserModel::PageDataOne(['phone' => $post['phone']]);
        // 若用户不存在，则返回错误提示
        if (!$userInfo) {
            return Show(ERROR, [], 10000);
        }

        // 3. 检查用户账号是否被冻结
        if ((int)$userInfo['status'] === CommonUserModel::STATUS_FREEZE) {
            return Show(ERROR, [], 10002);
        }

        // 4. 验证密码是否正确
        if ($userInfo['pwd'] !== ShiftEncode($post['pwd'])) {
            return Show(ERROR, [], 10001);
        }

        // 5. 生成登录Token
        $now = date('Y-m-d H:i:s');
        $token = ApiToken((int)$userInfo['id']);

        // 5.1 先删除该用户之前的Token（保证单点登录）
        CommonHomeTokenModel::where(['user_id' => (int)$userInfo['id']])->delete();
        // 5.2 保存新的Token
        $tokenModel = new CommonHomeTokenModel();
        $tokenModel->save([
            'token' => $token,
            'create_time' => $now,
            'user_id' => (int)$userInfo['id'],
        ]);

        // 6. 移除敏感信息并返回结果
        unset($userInfo['pwd'], $userInfo['withdraw_pwd']);
        // 返回成功数据，包含Token和用户信息
        return Show(SUCCESS, ['token' => $token, 'user_info' => $userInfo], 10059);
    }
}
