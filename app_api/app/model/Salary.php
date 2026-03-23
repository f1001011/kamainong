<?php
namespace app\api\model;

use think\Model;
use think\facade\Db;

class Salary extends Model
{
    protected $name = 'common_monthly_salary_config';
    
    // 检查本月是否已领取
    public static function checkMonthlyClaimed($userId, $month)
    {
        return Db::name('common_monthly_salary_log')
            ->where('user_id', $userId)
            ->where('claim_month', $month)
            ->find();
    }
    
    // 计算团队LV1充值总额
    public static function getTeamRecharge($userId)
    {
        return Db::name('common_user')
            ->where('agent_id_1', $userId)
            ->sum('total_recharge');
    }
    
    // 记录月薪领取
    public static function recordClaim($userId, $teamRecharge, $amount, $month)
    {
        return Db::name('common_monthly_salary_log')->insert([
            'user_id' => $userId,
            'team_recharge_amount' => $teamRecharge,
            'reward_amount' => $amount,
            'claim_month' => $month,
            'create_time' => date('Y-m-d H:i:s')
        ]);
    }
}
