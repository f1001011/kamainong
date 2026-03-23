<?php
namespace app\controller;

use app\BaseController;
use app\api\model\Recharge as RechargeModel;

class Recharge extends BaseController
{
    // 获取充值渠道
    public function channels()
    {
        $channels = [
            ['id' => 1, 'name' => 'Bank Card', 'code' => 'bank'],
            ['id' => 2, 'name' => 'Mobile Money', 'code' => 'mobile'],
        ];
        
        return show(1, $channels);
    }
    
    // 创建充值订单
    public function create()
    {
        $userId = request()->userId;
        $amount = input('amount');
        $channel = input('channel');
        
        $data = [
            'user_id' => $userId,
            'amount' => $amount,
            'channel' => $channel,
            'status' => 'pending',
            'created_at' => time()
        ];
        
        RechargeModel::insert($data);
        
        return show(1, [], '充值订单已创建');
    }
    
    // 充值历史
    public function history()
    {
        $userId = request()->userId;
        
        $list = RechargeModel::where('user_id', $userId)
            ->order('id desc')
            ->select();
        
        return show(1, $list);
    }
}
