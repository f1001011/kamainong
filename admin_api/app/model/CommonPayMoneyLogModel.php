<?php

namespace app\model;

class CommonPayMoneyLogModel extends BaseModel
{
    protected $name = 'common_pay_money_log';

    const TYPE_INCOME = 1; // 收入
    const TYPE_EXPEND = 2; // 支出

    const MONEY_TYPE_BALANCE = 1; // 余额账户
    const MONEY_TYPE_INTEGRAL = 2; // 积分账户

    const STATUS_RECHARGE = 101; // 充值到账
    const STATUS_WITHDRAW = 201; // 提现扣款
    const STATUS_WITHDRAW_REJECT_REFUND = 202; // 提现拒绝退回余额

    const STATUS_ADMIN_INC_BALANCE = 120; // 管理员增加余额
    const STATUS_ADMIN_DEC_BALANCE = 121; // 管理员扣除余额
    const STATUS_ADMIN_INC_INTEGRAL = 122; // 管理员增加积分
    const STATUS_ADMIN_DEC_INTEGRAL = 123; // 管理员扣除积分

    /**
     * 记录资金流水
     */
    public static function recordMoneyLog(
        $userId,
        $type,
        $status,
        $moneyType,
        $money,
        $moneyBefore,
        $moneyEnd,
        $remark = '',
        $sourceId = 0
    ) {
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
            'source_id' => $sourceId,
            'market_uid' => 0,
            'rmark' => $remark,
        ]);

        return $model;
    }
}
