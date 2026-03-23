<?php
namespace app\controller;

use app\BaseController;
use app\model\Salary as SalaryModel;
use app\model\User;
use app\model\MoneyLog;
use think\facade\Db;

class Salary extends BaseController
{
    // 月薪配置
    public function config()
    {
        $list = SalaryModel::order('sort', 'asc')->select();
        return show(1, $list);
    }
    
    // 领取月薪
    public function claim()
    {
        $userId = request()->userId;
        $month = date('Y-m');
        
        // 检查本月是否已领取
        if (SalaryModel::checkMonthlyClaimed($userId, $month)) {
            return show(0, [], 1001);
        }
        
        // 计算团队LV1充值总额
        $teamRecharge = SalaryModel::getTeamRecharge($userId);
        
        // 获取符合条件的最高档位
        $config = SalaryModel::where('team_recharge_amount', '<=', $teamRecharge)
            ->order('team_recharge_amount', 'desc')
            ->find();
        
        if (!$config) {
            return show(0, [], 1001);
        }
        
        Db::startTrans();
        try {
            SalaryModel::recordClaim($userId, $teamRecharge, $config['reward_amount'], $month);
            
            // 增加余额并记录流水
            $result = User::changeMoney($userId, 'inc', 1, $config['reward_amount'], MoneyLog::STATUS_SALARY_REWARD, 0, '月薪奖励');
            if ($result['code'] == 0) {
                Db::rollback();
                return show(0, [], $result['msg']);
            }
            
            Db::commit();
            return show(1, ['amount' => $config['reward_amount']]);
        } catch (\Exception $e) {
            Db::rollback();
            return show(0, [], 1001);
        }
    }
}
