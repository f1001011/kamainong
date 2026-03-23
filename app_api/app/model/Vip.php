<?php
namespace app\api\model;

use think\Model;
use think\facade\Db;

class Vip extends Model
{
    protected $name = 'common_vip';
    
    // 检查今日是否已领取
    public static function checkDailyClaimed($userId, $date)
    {
        return Db::name('common_vip_daily_reward_log')
            ->where('user_id', $userId)
            ->where('claim_date', $date)
            ->find();
    }
    
    // 记录每日奖励
    public static function recordDailyReward($userId, $vipLevel, $amount, $date)
    {
        return Db::name('common_vip_daily_reward_log')->insert([
            'user_id' => $userId,
            'vip_level' => $vipLevel,
            'reward_amount' => $amount,
            'claim_date' => $date,
            'create_time' => date('Y-m-d H:i:s')
        ]);
    }
}
