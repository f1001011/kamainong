<?php

namespace app\model;

class CommonPayMoneyLogModel extends BaseModel
{
    protected $name = 'common_pay_money_log';

    const TYPE_INCOME = 1; // 收入
    const TYPE_EXPEND = 2; // 支出

    const MONEY_TYPE_BALANCE = 1; // 余额账户
    const MONEY_TYPE_INTEGRAL = 2; // 积分账户

    // 状态类型
    const STATUS_LOTTERY_REWARD = 106; // 抽奖奖励
    const STATUS_BUY_GOODS = 110; // 购买商品消费金额
    const STATUS_BUY_WARES = 111; // 购买积分商品消耗积分
    const STATUS_SIGN_REWARD = 112; // 签到奖励
    const STATUS_VIP_DAILY_REWARD = 113; // VIP每日奖励

    /**
     * 记录资金流水
     */
    public static function recordMoneyLog($userId, $type, $status, $moneyType, $money, $moneyBefore, $moneyEnd, $remark = '')
    {
        $model = new self();
        $model->save([
            'create_time' => date('Y-m-d H:i:s'),
            'type' => $type,
            'status' => $status,
            'money_type' => $moneyType,
            'money_before' => $moneyBefore,
            'money_end' => $moneyEnd,
            'money' => $money,
            'uid' => $userId,
            'rmark' => $remark,
        ]);
        return $model;
    }
}
