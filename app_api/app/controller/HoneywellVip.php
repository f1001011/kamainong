<?php
namespace app\controller;

use app\BaseController;
use app\model\User;
use app\model\Vip;
use app\model\MoneyLog;

/**
 * Honeywell VIP模块
 */
class HoneywellVip extends BaseController
{
    /**
     * VIP状态
     */
    public function status()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $vipLog = \think\facade\Db::name('common_vip_log')
            ->where('uid', $userId)
            ->order('id', 'desc')
            ->find();
        
        $currentLevel = $vipLog ? (int)$vipLog['vip'] : 0;
        
        $vipConfig = Vip::where('vip', $currentLevel)->find();
        $dailyReward = $vipConfig ? $vipConfig['reward_money'] : 0;
        
        $today = date('Y-m-d');
        $claimed = \think\facade\Db::name('common_vip_daily_reward_log')
            ->where('uid', $userId)
            ->where('claim_date', $today)
            ->find();
        
        return json([
            'success' => true,
            'data' => [
                'currentLevel' => $currentLevel,
                'dailyReward' => number_format($dailyReward, 2, '.', ''),
                'canClaim' => !$claimed && $currentLevel > 0,
                'lastClaimTime' => $claimed ? date('c', strtotime($claimed['create_time'])) : null
            ]
        ]);
    }

    /**
     * 领取VIP奖励
     */
    public function claim()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $vipLog = \think\facade\Db::name('common_vip_log')->where('uid', $userId)->order('id', 'desc')->find();
        $currentLevel = $vipLog ? (int)$vipLog['vip'] : 0;
        
        if ($currentLevel == 0) {
            return json(['success' => false, 'error' => ['code' => 'NO_VIP', 'message' => 'No eres VIP']]);
        }
        
        $today = date('Y-m-d');
        $claimed = \think\facade\Db::name('common_vip_daily_reward_log')->where('uid', $userId)->where('claim_date', $today)->find();
        
        if ($claimed) {
            return json(['success' => false, 'error' => ['code' => 'ALREADY_CLAIMED', 'message' => 'Ya reclamado hoy']]);
        }
        
        $vipConfig = Vip::where('vip', $currentLevel)->find();
        $reward = $vipConfig['reward_money'];
        
        \think\facade\Db::startTrans();
        try {
            User::changeMoney($userId, 'inc', 1, $reward, MoneyLog::STATUS_VIP_REWARD, 0, 'VIP奖励');
            
            \think\facade\Db::name('common_vip_daily_reward_log')->insert([
                'uid' => $userId,
                'vip_level' => $currentLevel,
                'reward_money' => $reward,
                'claim_date' => $today,
                'create_time' => date('Y-m-d H:i:s')
            ]);
            
            \think\facade\Db::commit();
            return json(['success' => true, 'data' => ['amount' => number_format($reward, 2, '.', '')]]);
            
        } catch (\Exception $e) {
            \think\facade\Db::rollback();
            return json(['success' => false, 'error' => ['code' => 'CLAIM_FAILED', 'message' => $e->getMessage()]]);
        }
    }

    /**
     * VIP奖励记录
     */
    public function rewards()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $page = input('page', 1);
        $pageSize = input('pageSize', 20);
        
        $list = \think\facade\Db::name('common_vip_daily_reward_log')
            ->where('uid', $userId)
            ->order('id', 'desc')
            ->page($page, $pageSize)
            ->select()
            ->toArray();
        
        $total = \think\facade\Db::name('common_vip_daily_reward_log')->where('uid', $userId)->count();
        
        $records = [];
        foreach ($list as $item) {
            $records[] = [
                'id' => (int)$item['id'],
                'level' => (int)$item['vip_level'],
                'amount' => number_format($item['reward_money'], 2, '.', ''),
                'claimedAt' => date('c', strtotime($item['create_time']))
            ];
        }
        
        return json([
            'success' => true,
            'data' => ['list' => $records, 'pagination' => ['total' => (int)$total, 'page' => (int)$page, 'pageSize' => (int)$pageSize]]
        ]);
    }
    
    /**
     * SVIP状态
     */
    public function svipStatus()
    {
        return $this->status();
    }
    
    /**
     * 领取SVIP奖励
     */
    public function svipClaim()
    {
        return $this->claim();
    }
    
    /**
     * SVIP奖励记录
     */
    public function svipRewards()
    {
        return $this->rewards();
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
