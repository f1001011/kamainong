<?php
namespace app\middleware;

use app\model\CommonHomeTokenModel;

class AuthMiddleware
{
    public function handle($request, \Closure $next)
    {
        $token = $request->header('authorization') ?: $request->header('token');
        
        if (!$token) {
            return Show(ERROR_TOKEN,[],10015);
        }
        
        $tokenInfo = CommonHomeTokenModel::PageDataOne(['token'=>$token]);
        
        if (!$tokenInfo) {
            return Show(ERROR_TOKEN,[],10015);
        }
        
        $request->UserID = $tokenInfo['user_id'];
        
        return $next($request);
    }
}
