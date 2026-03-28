<?php
// +----------------------------------------------------------------------
// | ThinkPHP [ WE CAN DO IT JUST THINK ]
// +----------------------------------------------------------------------
// | Copyright (c) 2006~2018 http://thinkphp.cn All rights reserved.
// +----------------------------------------------------------------------
// | Licensed ( http://www.apache.org/licenses/LICENSE-2.0 )
// +----------------------------------------------------------------------
// | Author: liu21st <liu21st@gmail.com>
// +----------------------------------------------------------------------
use app\middleware\AuthMiddleware;
use think\facade\Route;

// ========================================
// 需要token的接口（用户需登录）
// 通用参数: page=当前页(默认1), limit=每页数量(默认20)
// ========================================
Route::group('api', function(){
    
    // ----------------------------------------
    // 4. 邮件列表
    // 说明: 查询is_send已发送的，按照未读和id倒序排序
    // 参数: page, limit
    // ----------------------------------------
    Route::post('email/list', \app\controller\config\EmailCon::class . '@GetEmailList');

    // ----------------------------------------
    // 邮件标记已读
    // 说明: 将指定邮件标记为已读状态
    // 参数: id(邮件ID)
    // ----------------------------------------
    Route::post('email/mark/read', \app\controller\config\EmailCon::class . '@MarkRead');

    // ----------------------------------------
    // 通知列表
    // 说明: 查询当前用户的所有通知，按未读和创建时间倒序排序
    // 参数: page, limit
    // ----------------------------------------
    Route::post('notification/list', \app\controller\config\NotificationCon::class . '@GetNotificationList');

    // ----------------------------------------
    // 通知标记已读
    // 说明: 将指定通知标记为已读状态
    // 参数: id(通知ID)
    // ----------------------------------------
    Route::post('notification/mark/read', \app\controller\config\NotificationCon::class . '@MarkRead');

    // ----------------------------------------
    // 签到
    // 说明: 用户签到->发放奖励->写入签到记录->返回奖励金额
    // 参数: 无
    // ----------------------------------------
    Route::post('sign/do', \app\controller\activity\UserSignCon::class . '@DoSign');

    // ----------------------------------------
    // 签到信息
    // 说明: 获取用户签到状态、连续签到天数、明日奖励预览
    // 参数: 无
    // ----------------------------------------
    Route::post('sign/info', \app\controller\activity\UserSignCon::class . '@GetSignInfo');

    // ----------------------------------------
    // 签到记录列表
    // 说明: 获取用户签到历史记录，按id倒序
    // 参数: page, limit
    // ----------------------------------------
    Route::post('sign/log', \app\controller\activity\UserSignLogCon::class . '@GetSignLogList');
    
    // ----------------------------------------
    // 6. 订单列表
    // 说明: 查询用户的订单，status正序和id倒序，联表查goods信息
    // 参数: page, limit
    // ----------------------------------------
    Route::post('goods/order/list', \app\controller\product\GoodsOrderCon::class . '@GetOrderList');
    
    // ----------------------------------------
    // 购买商品
    // 说明: 扣除用户金额->写入资金记录->创建订单->返回订单信息
    // 参数: goods_id(商品ID), num(购买数量，默认1)
    // ----------------------------------------
    Route::post('goods/buy', \app\controller\product\GoodsCon::class . '@BuyGoods');
    
    // ----------------------------------------
    // 7. 待领取收益列表
    // 说明: 查询待领取，时间大于领取时间，按快过期时间排前面，联表查商品和订单信息
    // 参数: page, limit
    // ----------------------------------------
    Route::post('income/claim/pending', \app\controller\product\IncomeClaimLogCon::class . '@GetPendingList');

    // ----------------------------------------
    // 领取收益
    // 说明: 查找最近即将过期的待领取记录->增加用户余额->写入流水->更新记录状态->返回待领取数量
    // 参数: 无
    // ----------------------------------------
    Route::post('income/claim', \app\controller\product\GoodsOrderCon::class . '@ClaimIncome');

    // ----------------------------------------
    // 获取待领取数量
    // 说明: 查询用户所有待领取收益数量
    // 参数: 无
    // ----------------------------------------
    Route::post('income/pending/count', \app\controller\product\GoodsOrderCon::class . '@GetPendingClaimCount');

    // ----------------------------------------
    // 购买记录（含待领取数量）
    // 说明: 查询用户订单，status=0正常分红中，附带待领取数量
    // 参数: page, limit
    // ----------------------------------------
    Route::post('goods/buy/record', \app\controller\product\GoodsOrderCon::class . '@GetBuyRecordList');
    
    // ----------------------------------------
    // 8. 抽奖次数
    // 说明: 查询rest_chance大于0且未过期的，全部查出不过期，过期时间正序排序
    // 参数: 无
    // ----------------------------------------
    Route::post('lottery/chance', \app\controller\activity\LotteryCon::class . '@GetLotteryChance');
    
    // ----------------------------------------
    // 9. 抽奖历史
    // 说明: 查询获得奖品历史，id倒序
    // 参数: page, limit
    // ----------------------------------------
    Route::post('lottery/log', \app\controller\activity\LotteryCon::class . '@GetLotteryLog');
    
    // ----------------------------------------
    // 40. 抽奖
    // 说明: 检查资格->获取奖品(<=10000)->写入记录->返回结果
    // 参数: 无
    // ----------------------------------------
    Route::post('lottery/do', \app\controller\activity\LotteryCon::class . '@DoLottery');
    
    // ----------------------------------------
    // 11. 月薪发放记录
    // 说明: 默认每页20条
    // 参数: page, limit
    // ----------------------------------------
    Route::post('monthly/salary/log', \app\controller\config\MonthlySalaryCon::class . '@GetSalaryLog');
    
    // ----------------------------------------
    // 12. 通知列表
    // 说明: 按照未读排在前面
    // 参数: page, limit
    // ----------------------------------------
    Route::post('notification/list', \app\controller\config\NotificationCon::class . '@GetNotificationList');
    
    // ----------------------------------------
    // 13. 提现记录
    // 说明: 每页20条，id倒序
    // 参数: page, limit
    // ----------------------------------------
    Route::post('pay/cash/list', \app\controller\payment\PayCashCon::class . '@GetCashList');

    // ----------------------------------------
    // 上传提现凭证
    // 说明: 上传提现成功凭证图片，一条提现记录只允许上传一次
    // 参数: withdraw_id, voucher_image(file)
    // ----------------------------------------
    Route::post('pay/cash/upload', \app\controller\payment\PayCashCon::class . '@UploadVoucher');
    
    // ----------------------------------------
    // 14. 优惠券列表
    // 说明: 只查询10条，过期的不显示，id倒序
    // 参数: limit(默认10)
    // ----------------------------------------
    Route::post('pay/coupon/list', \app\controller\payment\PayCouponCon::class . '@GetCouponList');
    
    // ----------------------------------------
    // 15. 资金流水
    // 说明: 根据money_type条件查询，id倒序
    // 参数: money_type(可选), page, limit
    // ----------------------------------------
    Route::post('pay/money/log', \app\controller\payment\PayMoneyLogCon::class . '@GetMoneyLogList');
    
    // ----------------------------------------
    // 16. 充值记录
    // 说明: 倒序，每页20条
    // 参数: page, limit
    // ----------------------------------------
    Route::post('pay/recharge/list', \app\controller\payment\PayRechargeCon::class . '@GetRechargeList');
    
    // ----------------------------------------
    // 18. 充值凭证列表
    // 说明: 查询通过的，需要查询用户昵称
    // 参数: 无
    // ----------------------------------------
    Route::post('recharge/voucher/list', \app\controller\payment\RechargeVoucherCon::class . '@GetVoucherList');
    
    // ----------------------------------------
    // 20. 任务配置列表
    // 说明: 需要附带查询用户邀请的下面1,2,3级中大于等于lv1的人数
    // 参数: 无
    // ----------------------------------------
    Route::post('task/config/list', \app\controller\config\TaskConfigCon::class . '@GetTaskConfigList');
    
    // ----------------------------------------
    // 21. 任务奖励记录
    // 说明: 倒序，默认20条
    // 参数: page, limit
    // ----------------------------------------
    Route::post('task/reward/log', \app\controller\config\TaskRewardLogCon::class . '@GetTaskRewardLogList');
    
    // ----------------------------------------
    // 22. 签到记录
    // 说明: 倒序，默认20条
    // 参数: page, limit
    // ----------------------------------------
    Route::post('sign/log', \app\controller\activity\UserSignLogCon::class . '@GetSignLogList');
    
    // ----------------------------------------
    // 24. VIP每日工资列表
    // 说明: 倒序，默认20条
    // 参数: page, limit
    // ----------------------------------------
    Route::post('vip/daily/reward/log', \app\controller\config\VipDailyRewardLogCon::class . '@GetVipDailyRewardLogList');

    // ----------------------------------------
    // VIP每日奖励领取
    // 说明: 根据当前用户VIP等级领取每日奖励，并按配置发放到余额或积分
    // 参数: 无
    // ----------------------------------------
    Route::post('vip/daily/reward/claim', \app\controller\config\VipCon::class . '@ClaimDailyReward');
    
    // ----------------------------------------
    // 37. 积分商品订单列表
    // 说明: 每页10条
    // 参数: page, limit
    // ----------------------------------------
    Route::post('wares/order/list', \app\controller\product\WaresOrderCon::class . '@GetWaresOrderList');
    
    // ----------------------------------------
    // 购买/兑换积分商品
    // 说明: 扣除用户积分->写入资金记录->创建订单->返回订单信息
    // 参数: wares_id(商品ID), address(收货地址), phone(联系电话)
    // ----------------------------------------
    Route::post('wares/buy', \app\controller\product\WaresCon::class . '@BuyWares');
    
    // ----------------------------------------
    // 17. 奖池获奖记录
    // 说明: 每页10条
    // 参数: page, limit
    // ----------------------------------------
    Route::post('prize/pool/log', \app\controller\activity\PrizePoolLogCon::class . '@GetPrizePoolLogList');
    
    // ----------------------------------------
    // 39. 返佣记录
    // 说明: 每页20条，倒序
    // 参数: page, limit
    // ----------------------------------------
    Route::post('fanyong/log', \app\controller\logger\MoneyFanyongLogCon::class . '@GetFanyongLogList');
    
    // ----------------------------------------
    // 5. 商品详情
    // 说明: 根据id查询，需要判定是否上架
    // 参数: id
    // ----------------------------------------
    Route::post('goods/detail', \app\controller\product\GoodsCon::class . '@GetGoodsDetail');
    
    // ----------------------------------------
    // 26. 积分商品详情
    // 说明: 根据id查询，需要判定是否上架
    // 参数: id
    // ----------------------------------------
    Route::post('wares/detail', \app\controller\product\WaresCon::class . '@GetWaresDetail');
    
    // ----------------------------------------
    // 38. 展示详情
    // 说明: 需要统计点赞数，如果传入plpage和pllimit则同时返回评论列表
    // 参数: id(必传), plpage(评论分页-当前页), pllimit(评论分页-每页数量)
    // ----------------------------------------
    Route::post('showcase/detail', \app\controller\activity\WithdrawShowcaseCon::class . '@GetShowcaseDetail');
    
    // ----------------------------------------
    // 38. 评论列表(独立接口)
    // 说明: 评论列表每页20条
    // 参数: showcase_id, page, limit
    // ----------------------------------------
    Route::post('showcase/comment', \app\controller\activity\WithdrawShowcaseCon::class . '@GetCommentList');

    // ----------------------------------------
    // 38. 展示列表
    // 说明: 展示表每页10条，需要统计点赞数
    // 参数: page, limit
    // ----------------------------------------
    Route::post('showcase/list', \app\controller\activity\WithdrawShowcaseCon::class . '@GetShowcaseList');
})->middleware([AuthMiddleware::class]);

// ========================================
// 不需要token的接口（公开接口）
// ========================================
Route::group('api', function(){
    
    // ----------------------------------------
    // 登录
    // 参数: phone, pwd
    // ----------------------------------------
    Route::post('login', \app\controller\LoginCon::class . '@Login');
    
    // ----------------------------------------
    // 注册
    // 参数: phone, pwd, invitation_code(可选)
    // ----------------------------------------
    Route::post('register', \app\controller\LoginCon::class . '@Register');
    
    // ----------------------------------------
    // 3. Banner列表
    // 说明: 直接全部查询，按照sort排序，status=1，不需要分页
    // 参数: 无
    // ----------------------------------------
    Route::post('banner/list', \app\controller\config\AdsCon::class . '@GetBannerList');
    
    // ----------------------------------------
    // 10. 奖品列表
    // 说明: 全部查询只查询启用的
    // 参数: 无
    // ----------------------------------------
    Route::post('lottery/prize', \app\controller\activity\LotteryCon::class . '@GetPrizeList');
    
    // ----------------------------------------
    // 19. 系统配置
    // 说明: 需要传入name字段，如果没有默认全部查询出来
    // 参数: name(可选)
    // ----------------------------------------
    Route::post('sys/config', \app\controller\config\SysConfigCon::class . '@GetConfigList');
    
    // ----------------------------------------
    // 23. VIP等级列表
    // 说明: VIP等级正序，全部查询
    // 参数: 无
    // ----------------------------------------
    Route::post('vip/list', \app\controller\config\VipCon::class . '@GetVipList');
    
    // ----------------------------------------
    // 25. VIP日志
    // 说明: 倒序，默认每页10条
    // 参数: page, limit
    // ----------------------------------------
    Route::post('vip/log', \app\controller\config\VipLogCon::class . '@GetVipLogList');
    
    // ----------------------------------------
    // 5. 商品列表
    // 说明: 按照sort排序，status可选参数1和2，没传或其他全部显示，默认每页20条
    // 参数: status(可选), page, limit
    // ----------------------------------------
    Route::post('goods/list', \app\controller\product\GoodsCon::class . '@GetGoodsList');
    
    // ----------------------------------------
    // 26. 积分商品列表
    // 说明: 每页20条，只显示上架
    // 参数: page, limit
    // ----------------------------------------
    Route::post('wares/list', \app\controller\product\WaresCon::class . '@GetWaresList');
    

});
