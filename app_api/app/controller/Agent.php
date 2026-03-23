<?php
namespace app\controller;

use app\BaseController;
use app\api\model\Agent as AgentModel;

class Agent extends BaseController
{
    // 代理级别配置
    public function config()
    {
        $list = AgentModel::order('level', 'asc')->select();
        return show(1, $list);
    }
    
    // 我的团队
    public function myTeam()
    {
        $userId = request()->userId;
        $stats = AgentModel::getTeamStats($userId);
        return show(1, $stats);
    }
}
