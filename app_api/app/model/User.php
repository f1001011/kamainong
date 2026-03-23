<?php
namespace app\model;

use think\Model;

class User extends Model
{
    protected $name = 'common_user';
    
    // 隐藏字段
    protected $hidden = ['pwd', 'withdraw_pwd'];
    
    // 获取用户信息
    public static function getUserInfo($userId)
    {
        return self::where('id', $userId)->find();
    }
    
    /**
     * 修改用户余额（带锁和流水记录）
     * @param int $userId 用户ID
     * @param string $type 'inc'增加 'dec'减少
     * @param int $moneyType 1余额 2积分
     * @param float $amount 金额
     * @param int $status 流水类型
     * @param int $sourceId 源头ID
     * @param string $rmark 备注
     * @return array ['code' => 1/0, 'msg' => '']
     */
    public static function changeMoney($userId, $type, $moneyType, $amount, $status, $sourceId = 0, $rmark = '')
    {
        $field = $moneyType == 1 ? 'money_balance' : 'money_integral';
        $incomeType = $type == 'inc' ? \app\model\MoneyLog::TYPE_INCOME : \app\model\MoneyLog::TYPE_EXPENSE;
        
        // 加锁查询
        $user = self::where('id', $userId)->lock(true)->find();
        if (!$user) {
            return ['code' => 0, 'msg' => 10001]; // 用户不存在
        }
        
        // 检查余额
        if ($type == 'dec' && $user[$field] < $amount) {
            return ['code' => 0, 'msg' => 10049]; // 余额不足
        }
        
        // 修改余额
        if ($type == 'inc') {
            self::where('id', $userId)->inc($field, $amount)->update();
        } else {
            self::where('id', $userId)->dec($field, $amount)->update();
        }
        
        // 记录流水
        \app\model\MoneyLog::create([
            'uid' => $userId,
            'type' => $incomeType,
            'status' => $status,
            'money_type' => $moneyType,
            'money_before' => $user[$field],
            'money_end' => $type == 'inc' ? $user[$field] + $amount : $user[$field] - $amount,
            'money' => $amount,
            'source_id' => $sourceId,
            'rmark' => $rmark,
            'create_time' => date('Y-m-d H:i:s')
        ]);
        
        return ['code' => 1, 'msg' => ''];
    }
}
