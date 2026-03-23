<?php

use think\facade\Route;

//Route::get('new/<id>','News/read'); // 定义GET请求路由规则
//Route::post('new/<id>','News/update'); // 定义POST请求路由规则
//Route::put('new/:id','News/update'); // 定义PUT请求路由规则
//Route::delete('new/:id','News/delete'); // 定义DELETE请求路由规则
//Route::any('new/:id','News/read'); // 所有请求都支持的路由规则

//需要权限验证
Route::group('api', function(){
    Route::get('/qrcode','/api.User/UserQrcode');//二维码
    Route::get('/down_qrcode','/api.User/ThighDownload');//下载用户二维码
    Route::get('/user','/api.User/Index');//用户信息
    Route::post('/withdrawal','/api.User/WithdrawalAdd');//用户提现
    Route::post('/team_withdrawal','/api.User/TeamWithdrawalAdd');//用户团队提现
    Route::post('/recharge','/api.User/RechargeAdd');//用户充值
    Route::get('/sign','/api.User/sign');//用户签到
    Route::get('/my_sign','/api.User/MySign');//用户签到
//    Route::get('/customer','/api.User/customer');//客服
    Route::get('/user_team','/api.User/UserTeam');//我的团队
    Route::get('/user_list_team','/api.User/UserListTeam');//我的团队
    Route::get('/user_one_team','/api.User/UserOneTeam');//指定下一级
    Route::post('/address','/api.User/address');//收货地址
    Route::get('/my_address','/api.User/MyAddress');//收货地址
    Route::post('/edit_address','/api.User/EditAddress');//收货地址
    Route::post('/del_address','/api.User/DelAddress');//收货地址
    Route::post('/bank','/api.User/bank');//银行卡绑定
    Route::post('/edit_bank','/api.User/EditBank');//银行卡绑定
    Route::post('/del_bank','/api.User/DelBank');//银行卡绑定
    Route::post('/my_bank','/api.User/MyBank');//我的银行卡
    Route::post('/subordinate','/api.User/UserSubordinate');//我的下级人数
    Route::post('/withdraw_pwd','/api.User/WithdrawPwd');//提现密码绑定

    Route::post('upload','/api.User/UploadImages');

    Route::post('/pwd','/api.User/UpdatePwd');//修改密码

    Route::get('/income','/api.User/Income');//收益
    Route::get('log/invest','/api.User/Invest');//投注记录 我的投资订单
    Route::get('log/list','/api.User/MoneyLogList');//用户积分，碳票碳汇绿币
    Route::get('log/agent_invest','/api.User/UserGoodsList');//下级的投注记录
    Route::get('log/income','/api.User/LogIncome');//收益记录
    Route::get('log/withdrawal','/api.User/Withdrawal');//提现记录
    Route::get('log/rebate','/api.User/rebate');//返佣记录
    Route::get('log/withdrawal_application','/api.User/WithdrawalApplication');//提现申请

    Route::get('log/my_wares_order','/api.User/MyWaresOrder');//我的积分兑换商品订单


    Route::get('wares/list','/api.Wares/WaresList');//积分商品列表
    Route::post('wares/order','/api.Wares/WaresOrder')->middleware(\app\middleware\Verify::class);//积分下单
    Route::get('wares/one','/api.Wares/WaresOne');//积分商品详情
    Route::get('wares/my','/api.Wares/WaresMy');//我兑换的商品


    Route::get('goods/goods_type','/api.Goods/GoodsType');//产品分类
    Route::get('goods/goods_list','/api.Goods/GoodsList');//产品列表
    Route::get('goods/experience_list','/api.Goods/ExperienceProductList');//体验产品列表
    Route::get('goods/goods_money','/api.Goods/GoodsMoney');//产品价格列表
    Route::get('goods/goods_one','/api.Goods/GoodsOne');//商品详情
    Route::get('goods/goods_day','/api.Goods/GoodsDay');//商品天数
    Route::get('pay/list','/api.Goods/PayList');//支付方式
    Route::post('pay/order','/api.Goods/PlaceAnOrder')->middleware(\app\middleware\Verify::class);//下单

    Route::get('thigh_image','/api.ImageContract/index');

    Route::get('set_amount','/api.Welfare/SetAmount');//公益设置的捐赠数
    Route::get('welfare/list','/api.Welfare/ArticleList');//公益文章列表
    Route::post('welfare/donate','/api.Welfare/Donate');//公益捐款
    Route::get('welfare/details','/api.Welfare/Details');//公益设置的捐赠数
    Route::get('welfare/allowance','/api.Welfare/allowance');//团队津贴展示
    Route::get('welfare/donate_log','/api.Welfare/donate_log');//所有捐款记录
    Route::post('welfare/user_donate_log','/api.Welfare/user_donate_log');//个人捐款记录
    Route::post('welfare/received','/api.Welfare/received')->middleware(\app\middleware\Verify::class);//团队津贴领取

    Route::post('user/service','/api.User/C_service');//专属客服查询
    Route::post('user/sculpture','/api.User/sculpture');//用户头像
    Route::post('user/head_edit','/api.User/headEdit');//修改用户头像
})->middleware(\app\middleware\Auth::class);

//不需要权限验证
Route::group('/api', function(){
    Route::get('thigh_down','/api.ImageContract/ThighDownload');
    Route::post('/login','/api.Login/login');//登录
    Route::post('/forget','/api.Login/forget');//修改密码
    Route::post('/register','/api.Login/register');//注册
    Route::get('/banner','/api.Index/banner');//banner图
    Route::get('notice/count','/api.Index/CountNotice');
    Route::get('/article','/api.Index/article');//新闻
    Route::get('/article_details','/api.Index/ArticleDetails');//新闻详情
    Route::get('/introduction','/api.Index/Introduction');//平台攻略
    Route::get('/notice','/api.Index/notice');//公告
    Route::get('/verify','api.Login/verify');//验证码
    Route::get('/customer','/api.Index/CustomerService');//客服
    Route::get('/v','/api.Login/version');//版本
    Route::get('/menu/status', 'api.Index/MenuStatus'); //收益菜单图标状态
    Route::get('goods/income', '/api.Goods/income');    //收益明细
    Route::post('/phone_verify', '/api.Index/phoneVerify');    //手机发送验证码
})->middleware(think\middleware\AllowCrossDomain::class);

Route::get('/v','/api.Login/version');//版本 解决前端兼容问题
