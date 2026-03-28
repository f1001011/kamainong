<?php

namespace app\model;

class CommonUserModel extends BaseModel
{
    protected $name = 'common_user';

    const STATUS_FREEZE = 0; // 冻结
    const STATUS_NORMAL = 1; // 正常
    const STATUS_DELETE = -1; // 删除

    const STATE_OFFLINE = 0; // 不在线
    const STATE_ONLINE = 1; // 在线

    const IS_REAL_NAME_NONE = 0; // 未实名
    const IS_REAL_NAME_APPLY = 1; // 提交申请
    const IS_REAL_NAME_PASS = 2; // 审核通过
    const IS_REAL_NAME_REJECT = 3; // 审核拒绝

    const IS_FICTITIOUS_NO = 0; // 真实账号
    const IS_FICTITIOUS_YES = 1; // 虚拟账号

    const IS_WITHDRAW_NO = 0; // 不可提现
    const IS_WITHDRAW_YES = 1; // 可提现

    /**
     * 增加用户余额
     */
    public static function incMoney($userId, $amount)
    {
        return self::where('id', $userId)->inc('money_balance', $amount)->update();
    }

    /**
     * 减少用户余额
     */
    public static function decMoney($userId, $amount)
    {
        return self::where('id', $userId)
            ->where('money_balance', '>=', $amount)
            ->dec('money_balance', $amount)
            ->update();
    }

    /**
     * 增加用户积分
     */
    public static function incIntegral($userId, $amount)
    {
        return self::where('id', $userId)->inc('money_integral', $amount)->update();
    }

    /**
     * 减少用户积分
     */
    public static function decIntegral($userId, $amount)
    {
        return self::where('id', $userId)
            ->where('money_integral', '>=', $amount)
            ->dec('money_integral', $amount)
            ->update();
    }
}
