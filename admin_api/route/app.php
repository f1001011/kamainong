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
use app\middleware\AdminLogMiddleware;
use think\facade\Route;
// 需要token的接口
Route::group('api', function(){
    // 用户列表
    Route::post('user/list', \app\controller\user\UserCon::class . '@GetUserList');


    // 用户基础信息修改
    Route::post('user/update/base', \app\controller\user\UserCon::class . '@UpdateBaseInfo');

    // 用户冻结状态修改
    Route::post('user/update/status', \app\controller\user\UserCon::class . '@UpdateStatus');

    // 用户在线状态修改
    Route::post('user/update/state', \app\controller\user\UserCon::class . '@UpdateState');

    // 用户余额修改
    Route::post('user/update/balance', \app\controller\user\UserCon::class . '@UpdateBalance');

    // 用户积分修改
    Route::post('user/update/integral', \app\controller\user\UserCon::class . '@UpdateIntegral');

    // 资金流水记录
    Route::post('pay/money/log/list', \app\controller\payment\PayMoneyLogCon::class . '@GetMoneyLogList');

    // 资金流水统计
    Route::post('pay/money/log/stats', \app\controller\payment\PayMoneyLogCon::class . '@GetMoneyLogStats');

    // 充值记录
    Route::post('pay/recharge/list', \app\controller\payment\PayRechargeCon::class . '@GetRechargeList');

    // 充值统计
    Route::post('pay/recharge/stats', \app\controller\payment\PayRechargeCon::class . '@GetRechargeStats');

    // 充值订单修改
    Route::post('pay/recharge/update', \app\controller\payment\PayRechargeCon::class . '@UpdateRechargeOrder');

    // 提现记录
    Route::post('pay/cash/list', \app\controller\payment\PayCashCon::class . '@GetCashList');

    // 提现统计
    Route::post('pay/cash/stats', \app\controller\payment\PayCashCon::class . '@GetCashStats');

    // 提现订单修改
    Route::post('pay/cash/update', \app\controller\payment\PayCashCon::class . '@UpdateCashOrder');

    // 支付渠道列表
    Route::post('pay/channel/list', \app\controller\payment\PayChannelCon::class . '@GetChannelList');

    // 支付渠道新增
    Route::post('pay/channel/add', \app\controller\payment\PayChannelCon::class . '@AddChannel');

    // 支付渠道修改
    Route::post('pay/channel/update', \app\controller\payment\PayChannelCon::class . '@UpdateChannel');

    // 支付渠道删除
    Route::post('pay/channel/delete', \app\controller\payment\PayChannelCon::class . '@DeleteChannel');

    // 提现凭证展示列表
    Route::post('withdraw/showcase/list', \app\controller\payment\WithdrawShowcaseCon::class . '@GetShowcaseList');

    // 提现凭证展示统计
    Route::post('withdraw/showcase/stats', \app\controller\payment\WithdrawShowcaseCon::class . '@GetShowcaseStats');

    // 提现凭证详情
    Route::post('withdraw/showcase/detail', \app\controller\payment\WithdrawShowcaseCon::class . '@GetShowcaseDetail');

    // 提现凭证新增
    Route::post('withdraw/showcase/add', \app\controller\payment\WithdrawShowcaseCon::class . '@AddShowcase');

    // 提现凭证修改
    Route::post('withdraw/showcase/update', \app\controller\payment\WithdrawShowcaseCon::class . '@UpdateShowcase');

    // 提现凭证删除
    Route::post('withdraw/showcase/delete', \app\controller\payment\WithdrawShowcaseCon::class . '@DeleteShowcase');

    // 提现凭证评论列表
    Route::post('withdraw/showcase/comment/list', \app\controller\payment\WithdrawShowcaseCon::class . '@GetCommentList');

    // 提现凭证评论新增
    Route::post('withdraw/showcase/comment/add', \app\controller\payment\WithdrawShowcaseCon::class . '@AddComment');

    // 提现凭证评论修改
    Route::post('withdraw/showcase/comment/update', \app\controller\payment\WithdrawShowcaseCon::class . '@UpdateComment');

    // 提现凭证评论删除
    Route::post('withdraw/showcase/comment/delete', \app\controller\payment\WithdrawShowcaseCon::class . '@DeleteComment');

    // 优惠券列表
    Route::post('pay/coupon/list', \app\controller\payment\FinanceRecordCon::class . '@GetCouponList');

    // 优惠券统计
    Route::post('pay/coupon/stats', \app\controller\payment\FinanceRecordCon::class . '@GetCouponStats');

    // 充值凭证列表
    Route::post('recharge/voucher/list', \app\controller\payment\FinanceRecordCon::class . '@GetRechargeVoucherList');

    // 充值凭证统计
    Route::post('recharge/voucher/stats', \app\controller\payment\FinanceRecordCon::class . '@GetRechargeVoucherStats');

    // 商品订单记录
    Route::post('goods/order/list', \app\controller\product\GoodsOrderCon::class . '@GetOrderList');

    // 收益领取记录
    Route::post('income/claim/log/list', \app\controller\product\IncomeClaimLogCon::class . '@GetClaimLogList');

    // 积分商品订单记录
    Route::post('wares/order/list', \app\controller\product\WaresOrderCon::class . '@GetWaresOrderList');

    // 商品列表
    Route::post('goods/list', \app\controller\product\GoodsCon::class . '@GetGoodsList');

    // 商品新增
    Route::post('goods/add', \app\controller\product\GoodsCon::class . '@AddGoods');

    // 商品修改
    Route::post('goods/update', \app\controller\product\GoodsCon::class . '@UpdateGoods');

    // 商品删除
    Route::post('goods/delete', \app\controller\product\GoodsCon::class . '@DeleteGoods');

    // 兑换商品列表
    Route::post('wares/list', \app\controller\product\WaresCon::class . '@GetWaresList');

    // 兑换商品新增
    Route::post('wares/add', \app\controller\product\WaresCon::class . '@AddWares');

    // 兑换商品修改
    Route::post('wares/update', \app\controller\product\WaresCon::class . '@UpdateWares');

    // 兑换商品删除
    Route::post('wares/delete', \app\controller\product\WaresCon::class . '@DeleteWares');

    // 通用图片上传
    Route::post('file/upload/img', \app\controller\common\FileCon::class . '@UploadImg');

    // 通用视频上传
    Route::post('file/upload/video', \app\controller\common\FileCon::class . '@UploadVideo');

    // VIP配置列表
    Route::post('vip/list', \app\controller\vip\VipCon::class . '@GetVipList');

    // VIP配置新增
    Route::post('vip/add', \app\controller\vip\VipCon::class . '@AddVip');

    // VIP配置修改
    Route::post('vip/update', \app\controller\vip\VipCon::class . '@UpdateVip');

    // VIP配置删除
    Route::post('vip/delete', \app\controller\vip\VipCon::class . '@DeleteVip');

    // VIP变更日志
    Route::post('vip/log/list', \app\controller\vip\VipCon::class . '@GetVipLogList');

    // VIP每日奖励日志
    Route::post('vip/daily/reward/log/list', \app\controller\vip\VipCon::class . '@GetVipDailyRewardLogList');

    // 代理等级配置列表
    Route::post('agent/level/config/list', \app\controller\vip\VipCon::class . '@GetAgentLevelConfigList');

    // 代理等级配置新增
    Route::post('agent/level/config/add', \app\controller\vip\VipCon::class . '@AddAgentLevelConfig');

    // 代理等级配置修改
    Route::post('agent/level/config/update', \app\controller\vip\VipCon::class . '@UpdateAgentLevelConfig');

    // 代理等级配置删除
    Route::post('agent/level/config/delete', \app\controller\vip\VipCon::class . '@DeleteAgentLevelConfig');

    // 周任务配置列表
    Route::post('task/config/list', \app\controller\task\TaskCon::class . '@GetTaskConfigList');

    // 周任务配置新增
    Route::post('task/config/add', \app\controller\task\TaskCon::class . '@AddTaskConfig');

    // 周任务配置修改
    Route::post('task/config/update', \app\controller\task\TaskCon::class . '@UpdateTaskConfig');

    // 周任务配置删除
    Route::post('task/config/delete', \app\controller\task\TaskCon::class . '@DeleteTaskConfig');

    // 周任务进度列表
    Route::post('task/progress/list', \app\controller\task\TaskCon::class . '@GetTaskProgressList');

    // 周任务奖励记录
    Route::post('task/reward/log/list', \app\controller\task\TaskCon::class . '@GetTaskRewardLogList');

    // 周任务奖励统计
    Route::post('task/reward/log/stats', \app\controller\task\TaskCon::class . '@GetTaskRewardStats');

    // 系统配置列表
    Route::post('config/list', \app\controller\config\SysConfigCon::class . '@GetConfigList');

    // 系统配置新增
    Route::post('config/add', \app\controller\config\SysConfigCon::class . '@AddConfig');

    // 系统配置修改
    Route::post('config/update', \app\controller\config\SysConfigCon::class . '@UpdateConfig');

    // 奖池配置列表
    Route::post('prize/pool/config/list', \app\controller\activity\ActivityCon::class . '@GetPrizePoolConfigList');

    // 奖池配置新增
    Route::post('prize/pool/config/add', \app\controller\activity\ActivityCon::class . '@AddPrizePoolConfig');

    // 奖池配置修改
    Route::post('prize/pool/config/update', \app\controller\activity\ActivityCon::class . '@UpdatePrizePoolConfig');

    // 奖池开奖记录
    Route::post('prize/pool/log/list', \app\controller\activity\ActivityCon::class . '@GetPrizePoolLogList');

    // 转盘奖品列表
    Route::post('lottery/prize/list', \app\controller\activity\ActivityCon::class . '@GetLotteryPrizeList');

    // 转盘奖品新增
    Route::post('lottery/prize/add', \app\controller\activity\ActivityCon::class . '@AddLotteryPrize');

    // 转盘奖品修改
    Route::post('lottery/prize/update', \app\controller\activity\ActivityCon::class . '@UpdateLotteryPrize');

    // 转盘奖品删除
    Route::post('lottery/prize/delete', \app\controller\activity\ActivityCon::class . '@DeleteLotteryPrize');

    // 转盘开奖记录
    Route::post('lottery/log/list', \app\controller\activity\ActivityCon::class . '@GetLotteryLogList');

    // 转盘次数列表
    Route::post('lottery/chance/list', \app\controller\activity\ActivityCon::class . '@GetLotteryChanceList');

    // 邮件列表
    Route::post('content/email/list', \app\controller\content\ContentCon::class . '@GetEmailList');

    // 邮件新增
    Route::post('content/email/add', \app\controller\content\ContentCon::class . '@AddEmail');

    // 邮件修改
    Route::post('content/email/update', \app\controller\content\ContentCon::class . '@UpdateEmail');

    // 邮件发送
    Route::post('content/email/send', \app\controller\content\ContentCon::class . '@SendEmail');

    // 邮件删除
    Route::post('content/email/delete', \app\controller\content\ContentCon::class . '@DeleteEmail');

    // 通知列表
    Route::post('content/notification/list', \app\controller\content\ContentCon::class . '@GetNotificationList');

    // 通知新增
    Route::post('content/notification/add', \app\controller\content\ContentCon::class . '@AddNotification');

    // 通知修改
    Route::post('content/notification/update', \app\controller\content\ContentCon::class . '@UpdateNotification');

    // 通知删除
    Route::post('content/notification/delete', \app\controller\content\ContentCon::class . '@DeleteNotification');

    // 签到记录
    Route::post('report/sign/list', \app\controller\report\RecordCon::class . '@GetSignLogList');

    // 签到统计
    Route::post('report/sign/stats', \app\controller\report\RecordCon::class . '@GetSignStats');

    // 月薪记录
    Route::post('report/monthly/salary/list', \app\controller\report\RecordCon::class . '@GetMonthlySalaryLogList');

    // 月薪统计
    Route::post('report/monthly/salary/stats', \app\controller\report\RecordCon::class . '@GetMonthlySalaryStats');

    // 返佣记录
    Route::post('report/commission/list', \app\controller\report\RecordCon::class . '@GetCommissionLogList');

    // 返佣统计
    Route::post('report/commission/stats', \app\controller\report\RecordCon::class . '@GetCommissionStats');

    // 财务报表
    Route::post('report/finance/summary', \app\controller\report\RecordCon::class . '@GetFinanceSummary');

    // 控制台总览
    Route::post('dashboard/overview', \app\controller\report\DashboardCon::class . '@GetOverview');

})->middleware([AuthMiddleware::class, AdminLogMiddleware::class]);

Route::group('api', function(){

    // 管理员登录
    Route::post('login', \app\controller\LoginCon::class . '@Login');

});
