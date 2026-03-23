<?php

use think\facade\Route;

//Route::get('new/<id>','News/read'); // 定义GET请求路由规则
//Route::post('new/<id>','News/update'); // 定义POST请求路由规则
//Route::put('new/:id','News/update'); // 定义PUT请求路由规则
//Route::delete('new/:id','News/delete'); // 定义DELETE请求路由规则
//Route::any('new/:id','News/read'); // 所有请求都支持的路由规则

//需要权限验证
Route::group('api', function(){
    // 用户相关
    Route::get('user/info', 'User/info');
    Route::get('user/balance', 'User/balance');
    Route::post('user/change_password', 'User/changePassword');
    
    // 产品相关
    Route::get('product/list', 'Product/list');
    Route::get('product/detail', 'Product/detail');
    
    // 订单相关
    Route::post('order/buy', 'Order/buy');
    Route::get('order/my_orders', 'Order/myOrders');
    Route::get('order/detail', 'Order/detail');
    
    // VIP相关
    Route::get('vip/config', 'Vip/config');
    Route::post('vip/check_upgrade', 'Vip/checkUpgrade');
    Route::post('vip/daily_reward', 'Vip/dailyReward');
    
    // 收益相关
    Route::get('income/list', 'Income/list');
    Route::get('income/available', 'Income/available');
    Route::post('income/claim', 'Income/claim');
    
    // 月薪相关
    Route::get('salary/config', 'Salary/config');
    Route::post('salary/claim', 'Salary/claim');
    
    // 代理相关
    Route::get('agent/config', 'Agent/config');
    Route::get('agent/my_team', 'Agent/myTeam');
    
    // 奖池相关
    Route::get('prize/config', 'Prize/config');
    Route::get('prize/today_rank', 'Prize/todayRank');
    Route::get('prize/winners', 'Prize/winners');

})->middleware(\app\api\middleware\Auth::class);

//不需要权限验证
Route::group('api', function(){
    // 认证相关
    Route::post('login', 'Auth/login');
    Route::post('register', 'Auth/register');
})->middleware(think\middleware\AllowCrossDomain::class);

