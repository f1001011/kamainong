<?php
namespace app\api\middleware;

class Auth
{
    public function handle($request, \Closure $next)
    {
        $token = $request->header('token');
        
        if (!$token) {
            return json(['code' => 401, 'msg' => '请先登录']);
        }
        
        $tokenInfo = \think\facade\Db::name('common_home_token')
            ->where('token', $token)
            ->find();
        
        if (!$tokenInfo) {
            return json(['code' => 401, 'msg' => 'token无效']);
        }
        
        $request->userId = $tokenInfo['user_id'];
        
        return $next($request);
    }
}
