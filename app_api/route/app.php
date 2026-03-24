<?php

use think\facade\Route;

// ========================================
// Honeywell 接口路由
// ========================================

// 认证接口（无需token）
Route::post('api/login', 'Honeywell/login');
Route::post('api/register', 'Honeywell/register');

// 需要token的接口
Route::group('api', function(){
    // 用户
    Route::get('user/profile', 'Honeywell/userProfile');
    
    // 配置
    Route::get('global-config', 'HoneywellConfig/global');
    Route::get('texts', 'HoneywellConfig/texts');
    Route::get('config/products', 'HoneywellConfig/products');
    Route::get('config/animation', 'HoneywellConfig/animation');
    Route::get('config/versions', 'HoneywellConfig/versions');
    
    // 产品
    Route::get('products', 'HoneywellProduct/list');
    
    // 订单/持仓
    Route::get('order/positions', 'HoneywellOrder/positions');
    Route::get('order/detail', 'HoneywellOrder/detail');
    Route::get('order/incomes', 'HoneywellOrder/incomes');
    Route::post('order/claim', 'HoneywellOrder/claim');
    Route::post('order/buy', 'HoneywellOrder/buy');
    
    // 充值
    Route::get('recharge/records', 'HoneywellRecharge/records');
    Route::get('recharge/detail', 'HoneywellRecharge/detail');
    Route::post('recharge/create', 'HoneywellRecharge/create');
    Route::post('recharge/orders/:id/cancel', 'HoneywellRecharge/cancel');
    
    // 提现
    Route::get('withdraw/records', 'HoneywellWithdraw/records');
    Route::get('withdraw/detail', 'HoneywellWithdraw/detail');
    Route::post('withdraw/create', 'HoneywellWithdraw/create');
    Route::get('withdraw/can_withdraw', 'HoneywellWithdraw/canWithdraw');
    
    // 交易记录
    Route::get('transaction/list', 'HoneywellTransaction/list');
    
    // 团队
    Route::get('team/stats', 'HoneywellTeam/stats');
    Route::get('team/members', 'HoneywellTeam/members');
    Route::get('team/commissions', 'HoneywellTeam/commissions');
    Route::get('team/invite_info', 'HoneywellTeam/inviteInfo');
    
    // 签到
    Route::get('signin/status', 'HoneywellSignin/status');
    Route::post('signin/sign', 'HoneywellSignin/sign');
    Route::get('signin/records', 'HoneywellSignin/records');
    
    // VIP
    Route::get('vip/status', 'HoneywellVip/status');
    Route::post('vip/claim', 'HoneywellVip/claim');
    Route::get('vip/rewards', 'HoneywellVip/rewards');
    
    // SVIP (新增)
    Route::get('svip/status', 'HoneywellVip/svipStatus');
    Route::post('svip/claim', 'HoneywellVip/svipClaim');
    Route::get('svip/rewards', 'HoneywellVip/svipRewards');
    
    // 任务
    Route::get('task/invite', 'HoneywellTask/invite');
    Route::post('task/claim_invite', 'HoneywellTask/claimInvite');
    Route::get('task/collection', 'HoneywellTask/collection');
    Route::post('task/claim_collection', 'HoneywellTask/claimCollection');
    
    // 月薪/周薪
    Route::get('salary/status', 'HoneywellSalary/status');
    Route::post('salary/claim', 'HoneywellSalary/claim');
    Route::get('weekly-salary/status', 'HoneywellSalary/weeklyStatus');
    Route::post('weekly-salary/claim', 'HoneywellSalary/weeklyClaim');
    
    // 奖池
    Route::get('prize/status', 'HoneywellPrize/status');
    Route::post('prize/claim', 'HoneywellPrize/claim');
    Route::get('prize-pool/status', 'HoneywellPrize/poolStatus');
    Route::post('prize-pool/claim', 'HoneywellPrize/poolClaim');
    
    // 转盘
    Route::get('lottery/status', 'HoneywellLottery/status');
    Route::get('lottery/prizes', 'HoneywellLottery/prizes');
    Route::post('lottery/spin', 'HoneywellLottery/spin');
    
    // 社区
    Route::get('community/posts', 'HoneywellCommunity/posts');
    Route::post('community/posts', 'HoneywellCommunity/create');
    Route::get('community/posts/:id', 'HoneywellCommunity/detail');
    Route::post('community/posts/:id/like', 'HoneywellCommunity/like');
    Route::post('community/posts/:id/comments', 'HoneywellCommunity/comment');
    Route::get('community/my_posts', 'HoneywellCommunity/myPosts');
    Route::get('community/completed-withdraws', 'HoneywellCommunity/completedWithdraws');
    
    // 礼品码
    Route::post('gift/redeem', 'HoneywellGift/redeem');
    Route::get('gift/history', 'HoneywellGift/history');
    
    // 通知
    Route::get('notifications', 'HoneywellNotification/list');
    Route::get('notifications/:id', 'HoneywellNotification/detail');
    Route::get('notifications/unread-count', 'HoneywellNotification/unreadCount');
    Route::post('notifications/:id/read', 'HoneywellNotification/read');
    Route::post('notifications/read-all', 'HoneywellNotification/readAll');
    
    // 其他
    Route::get('other/banners', 'HoneywellOther/banners');
    Route::get('other/announcements', 'HoneywellOther/announcements');
    Route::get('other/about_us', 'HoneywellOther/aboutUs');
    Route::get('other/service_links', 'HoneywellOther/serviceLinks');
});
