<?php

use think\facade\Route;

// ========================================
// Honeywell Web API 路由
// ========================================

// 认证接口（无需token）
Route::post('api/login', 'Honeywell/login');
Route::post('api/register', 'Honeywell/register');

// 需要token的接口
Route::group('api', function(){
    // ========== 用户 ==========
    Route::get('user/profile', 'Honeywell/userProfile');
    Route::put('user/profile', 'Honeywell/updateProfile');
    Route::put('user/password', 'Honeywell/updatePassword');
    
    // ========== 认证相关 ==========
    Route::post('auth/logout', 'Honeywell/logout');
    Route::post('signin', 'HoneywellSignin/sign');  // 前端: /signin
    Route::post('signin/sign', 'HoneywellSignin/sign');  // 兼容
    
    // ========== 配置 ==========
    Route::get('global-config', 'HoneywellConfig/global');
    Route::get('texts', 'HoneywellConfig/texts');
    Route::get('config/products', 'HoneywellConfig/products');
    Route::get('config/animation', 'HoneywellConfig/animation');
    Route::get('config/versions', 'HoneywellConfig/versions');
    Route::get('config/home', 'HoneywellConfig/home');  // 首页配置
    Route::get('config/profile', 'HoneywellConfig/profile');  // 个人资料配置
    
    // ========== 产品 ==========
    Route::get('products', 'HoneywellProduct/list');
    
    // ========== 持仓/订单 ==========
    Route::get('positions', 'HoneywellOrder/positions');  // 前端: /positions
    Route::get('order/positions', 'HoneywellOrder/positions');  // 兼容
    Route::get('order/detail', 'HoneywellOrder/detail');
    Route::get('order/incomes', 'HoneywellOrder/incomes');
    Route::post('order/claim', 'HoneywellOrder/claim');
    Route::post('order/buy', 'HoneywellOrder/buy');
    
    // ========== 充值 ==========
    Route::get('recharge/channels', 'HoneywellRecharge/channels');
    Route::get('recharge/records', 'HoneywellRecharge/records');
    Route::get('recharge/orders/:id', 'HoneywellRecharge/detail');  // 前端: /recharge/orders/:id
    Route::get('recharge/detail', 'HoneywellRecharge/detail');  // 兼容
    Route::post('recharge/create', 'HoneywellRecharge/create');
    Route::post('recharge/orders/:id/cancel', 'HoneywellRecharge/cancel');
    
    // ========== 银行卡 ==========
    Route::get('bank-cards', 'HoneywellBankCard/list');
    Route::post('bank-cards', 'HoneywellBankCard/add');
    Route::delete('bank-cards/:id', 'HoneywellBankCard/delete');
    
    // ========== 提现 ==========
    Route::get('withdraw/check', 'HoneywellWithdraw/check');  // 前端: /withdraw/check
    Route::get('withdraw/records', 'HoneywellWithdraw/records');
    Route::get('withdraw/orders/:id', 'HoneywellWithdraw/detail');  // 前端: /withdraw/orders/:id
    Route::get('withdraw/detail', 'HoneywellWithdraw/detail');  // 兼容
    Route::post('withdraw/create', 'HoneywellWithdraw/create');
    Route::get('withdraw/can_withdraw', 'HoneywellWithdraw/canWithdraw');
    
    // ========== 交易记录 ==========
    Route::get('transaction/list', 'HoneywellTransaction/list');
    
    // ========== 团队 ==========
    Route::get('team/stats', 'HoneywellTeam/stats');
    Route::get('team/members', 'HoneywellTeam/members');
    Route::get('team/commissions', 'HoneywellTeam/commissions');
    Route::get('team/invite_info', 'HoneywellTeam/inviteInfo');
    Route::get('invite/info', 'HoneywellTeam/inviteInfo');  // 前端: /invite/info
    
    // ========== 签到 ==========
    Route::get('signin/status', 'HoneywellSignin/status');
    Route::post('signin/sign', 'HoneywellSignin/sign');
    Route::get('signin/records', 'HoneywellSignin/records');
    
    // ========== VIP ==========
    Route::get('vip/status', 'HoneywellVip/status');
    Route::post('vip/claim', 'HoneywellVip/claim');
    Route::get('vip/rewards', 'HoneywellVip/rewards');
    
    // ========== SVIP ==========
    Route::get('svip/status', 'HoneywellVip/svipStatus');
    Route::post('svip/claim', 'HoneywellVip/svipClaim');
    Route::get('svip/rewards', 'HoneywellVip/svipRewards');
    
    // ========== 任务/活动 ==========
    Route::get('activities', 'HoneywellTask/list');  // 活动列表
    Route::get('activities/invite', 'HoneywellTask/invite');
    Route::post('activities/invite/claim', 'HoneywellTask/claimInvite');
    Route::get('activities/collection', 'HoneywellTask/collection');
    Route::post('activities/collection/claim', 'HoneywellTask/claimCollection');
    
    // ========== 月薪/周薪 ==========
    Route::get('salary/status', 'HoneywellSalary/status');
    Route::post('salary/claim', 'HoneywellSalary/claim');
    Route::get('weekly-salary/status', 'HoneywellSalary/weeklyStatus');
    Route::post('weekly-salary/claim', 'HoneywellSalary/weeklyClaim');
    
    // ========== 奖池 ==========
    Route::get('prize/status', 'HoneywellPrize/status');
    Route::post('prize/claim', 'HoneywellPrize/claim');
    Route::get('prize-pool/status', 'HoneywellPrize/poolStatus');
    Route::post('prize-pool/claim', 'HoneywellPrize/poolClaim');
    
    // ========== 转盘 ==========
    Route::get('lottery/status', 'HoneywellLottery/status');
    Route::get('lottery/prizes', 'HoneywellLottery/prizes');
    Route::post('lottery/spin', 'HoneywellLottery/spin');
    // 前端兼容: /spin-wheel/*
    Route::get('spin-wheel/status', 'HoneywellLottery/status');
    Route::get('spin-wheel/prizes', 'HoneywellLottery/prizes');
    Route::post('spin-wheel/spin', 'HoneywellLottery/spin');
    
    // ========== 社区 ==========
    Route::get('community/posts', 'HoneywellCommunity/posts');
    Route::post('community/posts', 'HoneywellCommunity/create');
    Route::get('community/posts/:id', 'HoneywellCommunity/detail');
    Route::post('community/posts/:id/like', 'HoneywellCommunity/like');
    Route::post('community/posts/:id/comments', 'HoneywellCommunity/comment');
    Route::get('community/my-posts', 'HoneywellCommunity/myPosts');  // 前端: /community/my-posts
    Route::get('community/my_posts', 'HoneywellCommunity/myPosts');  // 兼容下划线
    Route::get('community/completed-withdraws', 'HoneywellCommunity/completedWithdraws');
    
    // ========== 礼品码 ==========
    Route::post('gift/redeem', 'HoneywellGift/redeem');
    Route::get('gift/history', 'HoneywellGift/history');
    Route::get('gift-code/history', 'HoneywellGift/history');  // 前端: /gift-code/history
    Route::post('gift-code/redeem', 'HoneywellGift/redeem');  // 前端: /gift-code/redeem
    
    // ========== 通知 ==========
    Route::get('notifications', 'HoneywellNotification/list');
    Route::get('notifications/:id', 'HoneywellNotification/detail');
    Route::get('notifications/unread-count', 'HoneywellNotification/unreadCount');
    Route::post('notifications/:id/read', 'HoneywellNotification/read');
    Route::post('notifications/read-all', 'HoneywellNotification/readAll');
    
    // ========== 其他 ==========
    Route::get('banners', 'HoneywellOther/banners');
    Route::get('announcements', 'HoneywellOther/announcements');
    Route::get('about-us', 'HoneywellOther/aboutUs');
    Route::get('about_us', 'HoneywellOther/aboutUs');  // 兼容
    Route::get('service-links', 'HoneywellOther/serviceLinks');
    Route::get('service_links', 'HoneywellOther/serviceLinks');  // 兼容
    Route::get('pages/about_us', 'HoneywellOther/aboutUs');  // 前端: /pages/about_us
    Route::get('pages/about-us', 'HoneywellOther/aboutUs');  // 兼容
    
    // ========== 上传 ==========
    Route::post('upload', 'Honeywell/upload');
});
