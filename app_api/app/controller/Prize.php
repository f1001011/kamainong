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
        return show(1, $config);
    }
    
    // 今日排名
    public function todayRank()
    {
        $rechargeRank = User::field('id,user_name,total_recharge')
            ->order('total_recharge', 'desc')
            ->limit(10)
            ->select();
        
        return show(1, ['recharge_rank' => $rechargeRank]);
    }
    
    // 获奖记录
    public function winners()
    {
        $list = PrizeModel::getWinners(20);
        return show(1, $list);
    }
}
