<?php
namespace app\api\controller;

use app\BaseController;
use app\api\model\Salary as SalaryModel;
use app\api\model\User;
use think\facade\Db;

class Salary extends BaseController
{
    // 月薪配置
    public function config()
    {
        $list = SalaryModel::order('sort', 'asc')->select();
        return json(['code' => 200, 'data' => $list]);
    }
    
    // 领取月薪
    public function claim()
    {
        $userId = request()->userId;
        $month = date('Y-m');
        
        // 检查本月是否已领取
        if (SalaryModel::checkMonthlyClaimed($userId, $month)) {
            return json(['code' => 400, 'msg' => '本月已领取']);
        }
        
        // 计算团队LV1充值总额
        $teamRecharge = SalaryModel::getTeamRecharge($userId);
        
        // 获取符合条件的最高档位
        $config = SalaryModel::where('team_recharge_amount', '<=', $teamRecharge)
            ->order('team_recharge_amount', 'desc')
            ->find();
        
        if (!$config) {
            return json(['code' => 400, 'msg' => '未达到领取条件']);
        }
        
        Db::startTrans();
        try {
            SalaryModel::recordClaim($userId, $teamRecharge, $config['reward_amount'], $month);
            User::where('id', $userId)->inc('money_balance', $config['reward_amount'])->update();
            
            Db::commit();
            return json(['code' => 200, 'msg' => '领取成功', 'data' => ['amount' => $config['reward_amount']]]);
        } catch (\Exception $e) {
            Db::rollback();
            return json(['code' => 500, 'msg' => '领取失败']);
        }
    }
}
