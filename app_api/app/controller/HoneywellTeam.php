<?php
namespace app\controller;

use app\BaseController;
use app\model\User;
use think\facade\Db;

/**
 * Honeywell 团队模块
 */
class HoneywellTeam extends BaseController
{
    /**
     * 团队统计
     * GET /api/team/stats
     */
    public function stats()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        // 统计各级团队人数
        $level1 = User::where('agent_id_1', $userId)->count();
        $level2 = User::where('agent_id_2', $userId)->count();
        $level3 = User::where('agent_id_3', $userId)->count();
        
        // 统计团队充值（LV1）
        $totalRecharge = User::where('agent_id_1', $userId)->sum('total_recharge');
        
        // 统计返佣
        $totalCommission = Db::name('money_fanyong_log')
            ->where('uid', $userId)
            ->sum('money');
        
        return $this->success([
            'totalMembers' => $level1 + $level2 + $level3,
            'level1Members' => $level1,
            'level2Members' => $level2,
            'level3Members' => $level3,
            'totalRecharge' => number_format($totalRecharge ?? 0, 2, '.', ''),
            'totalCommission' => number_format($totalCommission ?? 0, 2, '.', '')
        ]);
    }

    /**
     * 团队成员列表
     * GET /api/team/members?level=1
     */
    public function members()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        list($page, $pageSize) = $this->getPageParams();
        $level = input('level', 1);
        
        $field = 'agent_id_' . $level;
        
        $query = User::where($field, $userId);
        $total = $query->count();
        
        $list = $query->field('id, user_phone, total_recharge, create_time')
            ->page($page, $pageSize)
            ->select()
            ->toArray();
        
        $members = [];
        foreach ($list as $item) {
            $members[] = [
                'id' => (int)$item['id'],
                'phone' => $item['user_phone'] ?? '',
                'level' => (int)$level,
                'rechargeAmount' => number_format($item['total_recharge'] ?? 0, 2, '.', ''),
                'registerTime' => date('c', strtotime($item['create_time']))
            ];
        }
        
        return $this->paginated($members, $total, $page, $pageSize);
    }

    /**
     * 返佣记录
     * GET /api/team/commissions
     */
    public function commissions()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        list($page, $pageSize) = $this->getPageParams();
        
        $query = Db::name('money_fanyong_log')->where('uid', $userId);
        $total = $query->count();
        
        $list = $query->order('id', 'desc')
            ->page($page, $pageSize)
            ->select()
            ->toArray();
        
        $records = [];
        foreach ($list as $item) {
            $records[] = [
                'id' => (int)$item['id'],
                'amount' => number_format($item['money'], 2, '.', ''),
                'type' => $item['type'] == 1 ? 'INVITE' : 'LEVEL',
                'remark' => $item['remark'] ?? '',
                'createdAt' => date('c', strtotime($item['create_time']))
            ];
        }
        
        return $this->paginated($records, $total, $page, $pageSize);
    }
    
    /**
     * 邀请信息
     * GET /api/team/invite_info
     */
    public function inviteInfo()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $user = User::where('id', $userId)->find();
        
        return $this->success([
            'inviteCode' => $user['invitation_code'],
            'inviteLink' => 'https://example.com/register?code=' . $user['invitation_code']
        ]);
    }
}
