<?php
declare (strict_types=1);

namespace app\middleware;


use app\model\TokenModel;
use app\model\UserModel;

class Auth
{
    /**
     * 处理请求
     *
     * @param \think\Request $request
     * @param \Closure $next
     * @return Response
     */
    public function handle($request, \Closure $next)
    {

        //获取请求信息
        $token = $request->header('token');
        if (empty($token)) {
            return response(show(204, [], lang(10015)));
        }

        $sign = $request->header('sign');
        if (empty($sign)) {
            return response(show(204, [], lang(10015)));
        }
        $time = $request->header('time');
        //当前时间戳
        if (empty($time) || $time+20 <= time()) {
            return response(show(204, [], lang(10015)));
        }

        //查询token 是否存在
        $find = TokenModel::page_one([['token', '=', $token]]);//token 后期可保存到 redis
        if (empty($find)) {
            return response(show(204 ,[], lang(10015)));
        }


        //检查sign  是否正确
        if ($sign  != md5($token.'&'.TC('sign_merch').'&'.$time)) {
            return response(show(204 ,[], lang(10015)));
        }

        //查询用户信息
        // if (cache('UserInfo' . $find['user_id'])) { //用户信息 后期可保存到 redis
        //     $UserInfo = $request->UserInfo = cache('UserInfo' . $find['user_id']);
        // } else {
        //     $UserInfo = UserModel::page_one([['id', '=', $find['user_id']]]);
        //     if (empty($UserInfo)) {
        //         return response(show(204, [], '登录过期'));
        //     } else {
        //         cache('UserInfo' . $UserInfo['id'], $UserInfo, 1000);
        //     }
        //     $request->UserInfo = $UserInfo;
        // }

        $UserInfo = UserModel::page_one([['id', '=', $find['user_id']]]);
        $request->UserInfo = $UserInfo;

//        if ($UserInfo['is_real_name'] == 3) {
//            return response(show(205 ,[], '实名失败，请联系客服'));
//        }

        return $next($request);
    }
}
