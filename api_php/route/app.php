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
    Route::get('user/info', 'api.User/info');
    Route::get('user/balance', 'api.User/balance');
    Route::post('user/change_password', 'api.User/changePassword');
    
    // 产品相关
    Route::get('product/list', 'api.Product/list');
    Route::get('product/detail', 'api.Product/detail');
    
    // 订单相关
    Route::post('order/buy', 'api.Order/buy');
    Route::get('order/my_orders', 'api.Order/myOrders');
    Route::get('order/detail', 'api.Order/detail');
    
    // VIP相关
    Route::get('vip/config', 'api.Vip/config');
    Route::post('vip/check_upgrade', 'api.Vip/checkUpgrade');
    Route::post('vip/daily_reward', 'api.Vip/dailyReward');
    
    // 收益相关
    Route::get('income/list', 'api.Income/list');
    Route::get('income/available', 'api.Income/available');
    Route::post('income/claim', 'api.Income/claim');
    
    // 月薪相关
    Route::get('salary/config', 'api.Salary/config');
    Route::post('salary/claim', 'api.Salary/claim');
    
    // 代理相关
    Route::get('agent/config', 'api.Agent/config');
    Route::get('agent/my_team', 'api.Agent/myTeam');
    
    // 奖池相关
    Route::get('prize/config', 'api.Prize/config');
    Route::get('prize/today_rank', 'api.Prize/todayRank');
    Route::get('prize/winners', 'api.Prize/winners');

})->middleware(\app\middleware\Auth::class);

//不需要权限验证
Route::group('/api', function(){
    // 认证相关
    Route::post('login', 'api.Auth/login');
    Route::post('register', 'api.Auth/register');
})->middleware(think\middleware\AllowCrossDomain::class);

