<?php
namespace app\api\controller;

use app\BaseController;
use app\api\model\Vip as VipModel;
use app\api\model\User;
use app\api\model\Order;
use think\facade\Db;

class Vip extends BaseController
{
    // VIP配置列表
    public function config()
    {
        $list = VipModel::order('vip', 'asc')->select();
        return json(['code' => 200, 'data' => $list]);
    }
    
    // 检测VIP升级
    public function checkUpgrade()
    {
        $userId = request()->userId;
        
        // 获取用户当前VIP等级
        $user = User::where('id', $userId)->find();
        $currentVip = $user['level_vip'];
        
        // 获取下一级VIP配置
        $nextVip = VipModel::where('vip', '>', $currentVip)
            ->order('vip', 'asc')
            ->find();
        
        if (!$nextVip) {
            return json(['code' => 200, 'msg' => '已是最高等级', 'data' => ['can_upgrade' => false]]);
        }
        
        // 检查是否购买了足够的产品
        $count = Order::where('user_id', $userId)
            ->where('goods_id', $nextVip['buy_goods_id'])
            ->count();
        
        $canUpgrade = $count >= $nextVip['buy_goods_num'];
        
        return json(['code' => 200, 'data' => [
            'can_upgrade' => $canUpgrade,
            'next_vip' => $nextVip,
            'current_count' => $count
        ]]);
    }

    // VIP每日奖励领取
    public function dailyReward()
    {
        $userId = request()->userId;
        
        $user = User::where('id', $userId)->find();
        
        if ($user['level_vip'] == 0) {
            return json(['code' => 400, 'msg' => '您还不是VIP会员']);
        }
        
        // 检查今天是否已领取
        $today = date('Y-m-d');
        $claimed = VipModel::checkDailyClaimed($userId, $today);
        
        if ($claimed) {
            return json(['code' => 400, 'msg' => '今日已领取']);
        }
        
        // 获取VIP配置
        $vipConfig = VipModel::where('vip', $user['level_vip'])->find();
        
        Db::startTrans();
        try {
            // 记录领取
            VipModel::recordDailyReward($userId, $user['level_vip'], $vipConfig['reward_money'], $today);
            
            // 增加余额
            User::where('id', $userId)->inc('money_balance', $vipConfig['reward_money'])->update();
            
            Db::commit();
            return json(['code' => 200, 'msg' => '领取成功', 'data' => ['amount' => $vipConfig['reward_money']]]);
        } catch (\Exception $e) {
            Db::rollback();
            return json(['code' => 500, 'msg' => '领取失败']);
        }
    }
}
