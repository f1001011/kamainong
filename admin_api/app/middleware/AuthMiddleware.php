<?php
namespace app\middleware;

use app\model\CommonAdminModel;
use app\model\CommonAdminTokenModel;

class AuthMiddleware
{
    public function handle($request, \Closure $next)
    {
        $token = $request->header('authorization') ?: $request->header('token');
        
        if (!$token) {
            return Show(ERROR_TOKEN,[],10015);
        }
        
        $tokenInfo = CommonAdminTokenModel::PageDataOne(['token' => $token]);
        
        if (!$tokenInfo) {
            return Show(ERROR_TOKEN,[],10015);
        }

        $adminInfo = CommonAdminModel::PageDataOne(['id' => (int)$tokenInfo['admin_uid']], 'id,user_name');
        if (!$adminInfo) {
            return Show(ERROR_TOKEN,[],10015);
        }
        
        // admin_api 统一使用管理员token，这里写入 AdminID 供后台接口识别当前登录管理员。
        // 为兼容当前已写的后台代码，也同步赋值给 UserID，避免已有代码取不到管理员ID。
        $request->AdminID = (int)$adminInfo['id'];
        $request->AdminName = (string)($adminInfo['user_name'] ?? '');
        
        return $next($request);
    }
}
