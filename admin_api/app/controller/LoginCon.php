<?php

namespace app\controller;

use app\model\CommonAdminModel;
use app\model\CommonAdminTokenModel;
use think\exception\ValidateException;

class LoginCon extends BaseCon
{
    /**
     * 后台管理员登录接口
     * 使用管理员账号和密码登录，密码加密方式与前台用户保持一致，登录成功后写入 admin_token。
     *
     * @return mixed
     */
    public function Login()
    {
        $postField = 'user_name,pwd';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        try {
            validate(\app\validate\LoginValidate::class)->scene('adminLogin')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $adminInfo = CommonAdminModel::PageDataOne(['user_name' => $post['user_name']]);
        if (!$adminInfo) {
            return Show(ERROR, [], 10140);
        }

        // 后台管理员密码加密方式与 app_api 用户密码保持一致，统一使用 ShiftEncode 比对。
        if ((string)$adminInfo['pwd'] !== ShiftEncode((string)$post['pwd'])) {
            return Show(ERROR, [], 10141);
        }

        // 单点登录：先清除该管理员历史token，再生成新token。
        CommonAdminTokenModel::where('admin_uid', (int)$adminInfo['id'])->delete();

        $token = ApiToken((int)$adminInfo['id']);
        $tokenModel = new CommonAdminTokenModel();
        $tokenModel->save([
            'token' => $token,
            'create_time' => date('Y-m-d H:i:s'),
            'admin_uid' => (int)$adminInfo['id'],
            'type' => CommonAdminTokenModel::TYPE_SINGLE_LOGIN,
        ]);

        unset($adminInfo['pwd'], $adminInfo['operate_pwd']);

        return Show(SUCCESS, [
            'token' => $token,
            'admin_info' => $adminInfo,
        ], 10142);
    }
}
