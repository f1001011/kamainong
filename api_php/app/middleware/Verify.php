<?php
declare (strict_types = 1);

namespace app\middleware;

class Verify
{
    /**
     * 处理请求
     *
     * @param \think\Request $request
     * @param \Closure       $next
     * @return Response
     */
    public function handle($request, \Closure $next)
    {
        sleep(2);
        // 1 处理重复请求，
        if (!isset($request->UserInfo['id'])){
            return response(show(0, [], 'login'));
        }
        ####################################################
        //每个请求都会带一个token
//        $sub_token = session('sub_token');
//        session('sub_token',null);
//        if ($sub_token !== $request->param('sub_token')){
//            //不相等的时候是重复提交
//            return response(show(0, [], '操作频繁，请稍等'));
//        }
        ####################################################
        // 重复请求处理
        $OrderRepeat =  cache('order_repeat_'.$request->UserInfo['id']);
        if (empty($OrderRepeat)){
            cache('order_repeat_'.$request->UserInfo['id'],time(),5);
            return $next($request);
        }else{
            return response(show(0, [], lang(10016)));
        }
        return $next($request);
    }
}
