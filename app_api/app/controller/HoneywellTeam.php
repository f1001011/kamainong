<?php
namespace app\controller;

use app\BaseController;
use app\model\User;
use app\model\Agent;

/**
 * Honeywell 团队模块
 */
class HoneywellTeam extends BaseController
{
    /**
     * 团队统计
     * GET /api/honeywell_team/stats
     */
    public function stats()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        // 统计各级团队人数
        $level1 = User::where('agent_id_1', $userId)->count();
        $level2 = User::where('agent_id_2', $userId)->count();
        $level3 = User::where('agent_id_3', $userId)->count();
        
        // 统计团队充值
        $totalRecharge = User::where('agent_id_1', $userId)
            ->whereOr('agent_id_2', $userId)
            ->whereOr('agent_id_3', $userId)
            ->sum('total_recharge');
        
        // 统计返佣
        $totalCommission = \think\facade\Db::name('money_fanyong_log')
            ->where('uid', $userId)
            ->sum('money');
        
        return json([
            'success' => true,
            'data' => [
                'totalMembers' => $level1 + $level2 + $level3,
                'level1Members' => $level1,
                'level2Members' => $level2,
                'level3Members' => $level3,
                'totalRecharge' => number_format($totalRecharge, 2, '.', ''),
                'totalCommission' => number_format($totalCommission, 2, '.', '')
            ]
        ]);
    }

    /**
     * 团队成员列表
     * GET /api/honeywell_team/members
     */
    public function members()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $page = input('page', 1);
        $pageSize = input('pageSize', 20);
        $level = input('level', 1);
        
        $field = 'agent_id_' . $level;
        
        $list = User::where($field, $userId)
            ->field('id, phone, total_recharge, create_time')
            ->page($page, $pageSize)
            ->select()
            ->toArray();
        
        $total = User::where($field, $userId)->count();
        
        $members = [];
        foreach ($list as $item) {
            $members[] = [
                'id' => (int)$item['id'],
                'phone' => $item['phone'],
                'level' => (int)$level,
                'rechargeAmount' => number_format($item['total_recharge'], 2, '.', ''),
                'registerTime' => date('c', strtotime($item['create_time']))
            ];
        }
        
        return json([
            'success' => true,
            'data' => [
                'list' => $members,
                'pagination' => ['total' => (int)$total, 'page' => (int)$page, 'pageSize' => (int)$pageSize]
            ]
        ]);
    }

    /**
     * 返佣记录
     */
    public function commissions()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $page = input('page', 1);
        $pageSize = input('pageSize', 20);
        
        $list = \think\facade\Db::name('money_fanyong_log')
            ->where('uid', $userId)
            ->order('id', 'desc')
            ->page($page, $pageSize)
            ->select()
            ->toArray();
        
        $total = \think\facade\Db::name('money_fanyong_log')->where('uid', $userId)->count();
        
        $records = [];
        foreach ($list as $item) {
            $records[] = [
                'id' => (int)$item['id'],
                'amount' => number_format($item['money'], 2, '.', ''),
                'fromUserId' => (int)$item['from_uid'],
                'level' => (int)$item['level'],
                'createdAt' => date('c', strtotime($item['create_time']))
            ];
        }
        
        return json([
            'success' => true,
            'data' => ['list' => $records, 'pagination' => ['total' => (int)$total, 'page' => (int)$page, 'pageSize' => (int)$pageSize]]
        ]);
    }
    
    /**
     * 邀请信息
     */
    public function inviteInfo()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $user = User::find($userId);
        
        return json([
            'success' => true,
            'data' => [
                'inviteCode' => $user['invitation_code'] ?? '',
                'inviteUrl' => 'https://aviva-cm.com/register?code=' . ($user['invitation_code'] ?? '')
            ]
        ]);
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
