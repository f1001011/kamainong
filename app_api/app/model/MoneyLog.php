<?php
namespace app\model;

use think\Model;

class MoneyLog extends Model
{
    protected $name = 'common_pay_money_log';
    
    // 资金类型
    const MONEY_TYPE_BALANCE = 1; // 余额
    const MONEY_TYPE_INTEGRAL = 2; // 积分
    
    // 收支类型
    const TYPE_INCOME = 1; // 收入
    const TYPE_EXPENSE = 2; // 支出
    
    // 详细类型（status）
    const STATUS_RECHARGE = 101; // 充值
    const STATUS_SIGNIN = 102; // 签到
    const STATUS_DAILY_INCOME = 103; // 每日收益
    const STATUS_AGENT_COMMISSION = 104; // 代理返佣
    const STATUS_VIP_REWARD = 105; // VIP奖励
    const STATUS_SALARY_REWARD = 106; // 月薪奖励
    const STATUS_PRIZE_REWARD = 107; // 奖池奖励
    const STATUS_LOTTERY_REWARD = 108; // 转盘奖励
    
    const STATUS_BUY_GOODS = 110; // 购买商品
    const STATUS_BUY_GOODS_INTEGRAL = 111; // 购买商品消耗积分
    
    const STATUS_WITHDRAW = 201; // 提现
    
    /**
     * 记录资金流水（带锁）
     */
    public static function record($userId, $type, $status, $moneyType, $money, $sourceId = 0, $rmark = '')
    {
        // 使用悲观锁查询用户
        $user = \app\model\User::where('id', $userId)->lock(true)->find();
        
        if (!$user) {
            throw new \Exception('用户不存在');
        }
        
        $moneyBefore = $moneyType == self::MONEY_TYPE_BALANCE ? $user['money_balance'] : $user['money_integral'];
        $moneyEnd = $type == self::TYPE_INCOME ? $moneyBefore + $money : $moneyBefore - $money;
        
        // 检查余额是否足够（支出时）
        if ($type == self::TYPE_EXPENSE && $moneyBefore < $money) {
            throw new \Exception('余额不足');
        }
        
        return self::create([
            'uid' => $userId,
            'type' => $type,
            'status' => $status,
            'money_type' => $moneyType,
            'money_before' => $moneyBefore,
            'money_end' => $moneyEnd,
            'money' => $money,
            'source_id' => $sourceId,
            'rmark' => $rmark,
            'create_time' => date('Y-m-d H:i:s')
        ]);
    }
}
