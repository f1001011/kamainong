<?php
namespace app\controller;

use app\BaseController;
use app\model\User;
use app\model\MoneyLog;
use app\model\Salary;

/**
 * Honeywell 月薪模块
 */
class HoneywellSalary extends BaseController
{
    /**
     * 月薪状态
     */
    public function status()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $currentMonth = date('Y-m');
        
        // 统计本月团队LV1充值
        $teamRecharge = User::where('agent_id_1', $userId)
            ->where('total_recharge', '>', 0)
            ->sum('total_recharge');
        
        $configs = Salary::order('required_amount', 'asc')->select()->toArray();
        
        $tiers = [];
        foreach ($configs as $config) {
            $claimed = \think\facade\Db::name('common_monthly_salary_log')
                ->where('uid', $userId)
                ->where('config_id', $config['id'])
                ->where('claim_month', $currentMonth)
                ->find();
            
            $status = 'LOCKED';
            if ($claimed) {
                $status = 'CLAIMED';
            } elseif ($teamRecharge >= $config['required_amount']) {
                $status = 'CLAIMABLE';
            }
            
            $tiers[] = [
                'tierId' => (int)$config['id'],
                'requiredAmount' => number_format($config['required_amount'], 2, '.', ''),
                'reward' => number_format($config['reward_amount'], 2, '.', ''),
                'status' => $status
            ];
        }
        
        return json(['success' => true, 'data' => ['teamRecharge' => number_format($teamRecharge, 2, '.', ''), 'tiers' => $tiers]]);
    }

    /**
     * 领取月薪
     */
    public function claim()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $tierId = input('tierId', 0);
        $currentMonth = date('Y-m');
        
        \think\facade\Db::startTrans();
        try {
            $config = Salary::where('id', $tierId)->lock(true)->find();
            if (!$config) throw new \Exception('配置不存在');
            
            $claimed = \think\facade\Db::name('common_monthly_salary_log')
                ->where('uid', $userId)
                ->where('claim_month', $currentMonth)
                ->find();
            
            if ($claimed) throw new \Exception('Ya reclamado este mes');
            
            $teamRecharge = User::where('agent_id_1', $userId)->sum('total_recharge');
            if ($teamRecharge < $config['required_amount']) throw new \Exception('No cumple requisitos');
            
            User::changeMoney($userId, 'inc', 1, $config['reward_amount'], MoneyLog::STATUS_SALARY_REWARD, $tierId, '月薪奖励');
            
            \think\facade\Db::name('common_monthly_salary_log')->insert([
                'uid' => $userId,
                'config_id' => $tierId,
                'reward_amount' => $config['reward_amount'],
                'claim_month' => $currentMonth,
                'create_time' => date('Y-m-d H:i:s')
            ]);
            
            \think\facade\Db::commit();
            return json(['success' => true, 'data' => ['amount' => number_format($config['reward_amount'], 2, '.', '')]]);
            
        } catch (\Exception $e) {
            \think\facade\Db::rollback();
            return json(['success' => false, 'error' => ['code' => 'CLAIM_FAILED', 'message' => $e->getMessage()]]);
        }
    }
    
    /**
     * 周薪状态
     */
    public function weeklyStatus()
    {
        return $this->status();
    }
    
    /**
     * 领取周薪
     */
    public function weeklyClaim()
    {
        return $this->claim();
    }
    
    private function getUserId()
    {
        $token = request()->header('authorization');
        $token = str_replace('Bearer ', '', $token);
        if (empty($token)) return null;
        
        $tokenInfo = \think\facade\Db::name('common_home_token')->where('token', $token)->find();
        return $tokenInfo ? $tokenInfo['uid'] : null;
    }
    
    private function unauthorized()
    {
        return json(['success' => false, 'error' => ['code' => 'UNAUTHORIZED', 'message' => 'No autorizado']], 401);
    }
}
