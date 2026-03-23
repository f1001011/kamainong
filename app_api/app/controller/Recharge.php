<?php
namespace app\controller;

use app\BaseController;
use think\facade\Db;

class Recharge extends BaseController
{
    // 获取充值渠道
    public function channels()
    {
        $channels = Db::name('common_pay_channel')
            ->where('type', 1)
            ->where('status', 1)
            ->field('id,name,channel_name')
            ->select();
        
        return show(1, ['channels' => $channels]);
    }
    
    // 创建充值订单
    public function create()
    {
        $userId = request()->userId;
        $money = input('money');
        $channelId = input('channel_id');
        $imageUrl = input('image_url', '');
        
        if (!$money || $money <= 0) {
            return show(0, [], '请输入正确的充值金额');
        }
        
        $user = Db::name('common_user')->where('id', $userId)->find();
        
        $orderNo = 'R' . date('YmdHis') . rand(1000, 9999);
        
        Db::name('common_pay_recharge')->insert([
            'uid' => $userId,
            'money' => $money,
            'money_before' => $user['money_balance'],
            'channel_id' => $channelId,
            'image_url' => $imageUrl,
            'order_no' => $orderNo,
            'status' => 0,
            'create_time' => date('Y-m-d H:i:s')
        ]);
        
        return show(1, ['order_no' => $orderNo], '充值订单已创建');
    }
    
    // 充值历史
    public function history()
    {
        $userId = request()->userId;
        
        $list = Db::name('common_pay_recharge')
            ->where('uid', $userId)
            ->order('id desc')
            ->limit(50)
            ->select();
        
        return show(1, ['list' => $list]);
    }
}
