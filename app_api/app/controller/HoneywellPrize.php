<?php
namespace app\controller;

use app\BaseController;
use app\model\User;
use app\model\MoneyLog;
use app\model\Prize;

/**
 * Honeywell 奖池模块
 */
class HoneywellPrize extends BaseController
{
    /**
     * 奖池状态
     */
    public function status()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $today = date('Y-m-d');
        
        // 获取今日排名数据
        $myRank = $this->getMyRank($userId, $today);
        
        $configs = Prize::order('rank', 'asc')->select()->toArray();
        
        $tiers = [];
        foreach ($configs as $config) {
            $claimed = \think\facade\Db::name('common_prize_pool_log')
                ->where('uid', $userId)
                ->where('config_id', $config['id'])
                ->where('prize_date', $today)
                ->find();
            
            $status = $myRank == $config['rank'] && !$claimed ? 'CLAIMABLE' : 'LOCKED';
            if ($claimed) $status = 'CLAIMED';
            
            $tiers[] = [
                'tierId' => (int)$config['id'],
                'rank' => (int)$config['rank'],
                'reward' => number_format($config['reward_amount'], 2, '.', ''),
                'status' => $status
            ];
        }
        
        return json(['success' => true, 'data' => ['myRank' => $myRank, 'tiers' => $tiers]]);
    }

    /**
     * 领取奖池奖励
     */
    public function claim()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $tierId = input('tierId', 0);
        $today = date('Y-m-d');
        
        \think\facade\Db::startTrans();
        try {
            $config = Prize::where('id', $tierId)->lock(true)->find();
            if (!$config) throw new \Exception('配置不存在');
            
            $myRank = $this->getMyRank($userId, $today);
            if ($myRank != $config['rank']) throw new \Exception('No cumple requisitos');
            
            $claimed = \think\facade\Db::name('common_prize_pool_log')
                ->where('uid', $userId)
                ->where('prize_date', $today)
                ->find();
            
            if ($claimed) throw new \Exception('Ya reclamado');
            
            User::changeMoney($userId, 'inc', 1, $config['reward_amount'], MoneyLog::STATUS_PRIZE_REWARD, $tierId, '奖池奖励');
            
            \think\facade\Db::name('common_prize_pool_log')->insert([
                'uid' => $userId,
                'config_id' => $tierId,
                'reward_amount' => $config['reward_amount'],
                'prize_date' => $today,
                'create_time' => date('Y-m-d H:i:s')
            ]);
            
            \think\facade\Db::commit();
            return json(['success' => true, 'data' => ['amount' => number_format($config['reward_amount'], 2, '.', '')]]);
            
        } catch (\Exception $e) {
            \think\facade\Db::rollback();
            return json(['success' => false, 'error' => ['code' => 'CLAIM_FAILED', 'message' => $e->getMessage()]]);
        }
    }

    private function getMyRank($userId, $date)
    {
        // 简化实现：返回0表示未上榜
        return 0;
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
