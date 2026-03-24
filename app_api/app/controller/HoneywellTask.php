<?php
namespace app\controller;

use app\model\User;
use think\facade\Db;

/**
 * Honeywell 任务模块
 */
class HoneywellTask extends HoneywellBase
{
    /**
     * 邀请任务数据
     */
    public function invite()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        // 统计有效邀请人数（已充值）
        $validInviteCount = User::where('agent_id_1', $userId)
            ->where('total_recharge', '>', 0)
            ->count();
        
        // 获取任务配置
        $tasks = \think\facade\Db::name('common_task_config')
            ->where('task_group', 1)
            ->where('status', 1)
            ->order('sort', 'asc')
            ->select()
            ->toArray();
        
        $tiers = [];
        foreach ($tasks as $task) {
            $progress = \think\facade\Db::name('common_task_progress')
                ->where('user_id', $userId)
                ->where('task_id', $task['id'])
                ->find();
            
            $status = 'LOCKED';
            if ($progress) {
                if ($progress['is_claimed']) {
                    $status = 'CLAIMED';
                } elseif ($progress['is_completed']) {
                    $status = 'CLAIMABLE';
                }
            } elseif ($validInviteCount >= $task['required_invites']) {
                $status = 'CLAIMABLE';
            }
            
            $tiers[] = [
                'taskId' => (int)$task['id'],
                'requiredCount' => (int)$task['required_invites'],
                'reward' => number_format($task['reward_amount'], 2, '.', ''),
                'status' => $status
            ];
        }
        
        return json([
            'success' => true,
            'data' => [
                'validInviteCount' => $validInviteCount,
                'tiers' => $tiers
            ]
        ]);
    }

    /**
     * 领取邀请奖励
     */
    public function claimInvite()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $taskId = input('taskId', 0);
        
        \think\facade\Db::startTrans();
        try {
            $task = \think\facade\Db::name('common_task_config')->where('id', $taskId)->lock(true)->find();
            if (!$task) throw new \Exception('任务不存在');
            
            $progress = \think\facade\Db::name('common_task_progress')
                ->where('user_id', $userId)
                ->where('task_id', $taskId)
                ->find();
            
            if ($progress && $progress['is_claimed']) {
                throw new \Exception('Ya reclamado');
            }
            
            $validCount = User::where('agent_id_1', $userId)->where('total_recharge', '>', 0)->count();
            if ($validCount < $task['required_invites']) {
                throw new \Exception('No cumple requisitos');
            }
            
            User::changeMoney($userId, 'inc', 1, $task['reward_amount'], MoneyLog::STATUS_AGENT_COMMISSION, $taskId, '邀请任务奖励');
            
            if ($progress) {
                \think\facade\Db::name('common_task_progress')->where('id', $progress['id'])->update([
                    'is_completed' => 1,
                    'is_claimed' => 1,
                    'claimed_time' => date('Y-m-d H:i:s')
                ]);
            } else {
                \think\facade\Db::name('common_task_progress')->insert([
                    'user_id' => $userId,
                    'task_id' => $taskId,
                    'current_progress' => $validCount,
                    'is_completed' => 1,
                    'is_claimed' => 1,
                    'week_start_date' => date('Y-m-d'),
                    'claimed_time' => date('Y-m-d H:i:s')
                ]);
            }
            
            \think\facade\Db::name('common_task_reward_log')->insert([
                'user_id' => $userId,
                'task_id' => $taskId,
                'reward_amount' => $task['reward_amount'],
                'week_start_date' => date('Y-m-d'),
                'create_time' => date('Y-m-d H:i:s')
            ]);
            
            \think\facade\Db::commit();
            return json(['success' => true, 'data' => ['amount' => number_format($task['reward_amount'], 2, '.', '')]]);
            
        } catch (\Exception $e) {
            \think\facade\Db::rollback();
            return json(['success' => false, 'error' => ['code' => 'CLAIM_FAILED', 'message' => $e->getMessage()]]);
        }
    }

    /**
     * 集卡任务数据
     */
    public function collection()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        return json([
            'success' => true,
            'data' => [
                'collectedCount' => 0,
                'tiers' => []
            ]
        ]);
    }

    /**
     * 活动列表
     * GET /api/activities
     */
    public function list()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        // 获取所有启用的活动
        $activities = \think\facade\Db::name('common_activity')
            ->where('status', 1)
            ->order('sort', 'asc')
            ->select()
            ->toArray();
        
        $list = [];
        foreach ($activities as $activity) {
            // 检查是否有可领取奖励
            $hasClaimable = false;
            
            // 根据活动类型检查
            if ($activity['activity_code'] == 'invite') {
                $validCount = User::where('agent_id_1', $userId)->where('total_recharge', '>', 0)->count();
                $unclaimed = \think\facade\Db::name('common_task_progress')
                    ->where('user_id', $userId)
                    ->where('is_completed', 1)
                    ->where('is_claimed', 0)
                    ->count();
                $hasClaimable = $validCount > 0 && $unclaimed > 0;
            }
            
            $list[] = [
                'code' => $activity['activity_code'],
                'name' => $activity['activity_name'],
                'description' => $activity['activity_desc'] ?? '',
                'icon' => $activity['activity_icon'] ?? '',
                'hasClaimable' => $hasClaimable,
                'sortOrder' => (int)$activity['sort']
            ];
        }
        
        return $this->success(['list' => $list]);
    }
    
    /**
     * 领取集卡奖励
     */
    public function claimCollection()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        return json(['success' => false, 'error' => ['code' => 'NOT_IMPLEMENTED', 'message' => 'No implementado']]);
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
