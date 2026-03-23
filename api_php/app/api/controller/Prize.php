<?php
namespace app\api\controller;

use app\BaseController;
use app\api\model\Prize as PrizeModel;
use app\api\model\User;

class Prize extends BaseController
{
    // 奖池配置
    public function config()
    {
        $config = PrizeModel::find();
        return json(['code' => 200, 'data' => $config]);
    }
    
    // 今日排名
    public function todayRank()
    {
        $rechargeRank = User::field('id,user_name,total_recharge')
            ->order('total_recharge', 'desc')
            ->limit(10)
            ->select();
        
        return json(['code' => 200, 'data' => ['recharge_rank' => $rechargeRank]]);
    }
    
    // 获奖记录
    public function winners()
    {
        $list = PrizeModel::getWinners(20);
        return json(['code' => 200, 'data' => $list]);
    }
}
