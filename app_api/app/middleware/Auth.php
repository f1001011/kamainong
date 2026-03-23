<?php
namespace app\api\middleware;

class Auth
{
    public function handle($request, \Closure $next)
    {
        $token = $request->header('authorization') ?: $request->header('token');
        
        if (!$token) {
            return json(['code' => 204, 'message' => '请先登录', 'data' => []]);
        }
        
        $tokenInfo = \think\facade\Db::name('common_home_token')
            ->where('token', $token)
            ->find();
        
        if (!$tokenInfo) {
            return json(['code' => 204, 'message' => 'token无效', 'data' => []]);
        }
        
        $request->userId = $tokenInfo['user_id'];
        
        return $next($request);
    }
}
