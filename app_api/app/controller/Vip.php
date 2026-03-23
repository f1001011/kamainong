<?php
namespace app\controller;

use app\BaseController;
use app\model\Vip as VipModel;
use app\model\User;
use app\model\Order;
use app\model\MoneyLog;
use think\facade\Db;

class Vip extends BaseController
{
    // VIP配置列表
    public function config()
    {
        $list = VipModel::order('vip', 'asc')->select();
        return show(1, $list);
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
            return show(1, ['can_upgrade' => false]);
        }
        
        // 检查是否购买了足够的产品
        $count = Order::where('user_id', $userId)
            ->where('goods_id', $nextVip['buy_goods_id'])
            ->count();
        
        $canUpgrade = $count >= $nextVip['buy_goods_num'];
        
        return show(1, [
            'can_upgrade' => $canUpgrade,
            'next_vip' => $nextVip,
            'current_count' => $count
        ]);
    }

    // VIP每日奖励领取
    public function dailyReward()
    {
        $userId = request()->userId;
        
        $user = User::where('id', $userId)->find();
        
        if ($user['level_vip'] == 0) {
            return show(0, [], 1001);
        }
        
        // 检查今天是否已领取
        $today = date('Y-m-d');
        $claimed = VipModel::checkDailyClaimed($userId, $today);
        
        if ($claimed) {
            return show(0, [], 40001);
        }
        
        // 获取VIP配置
        $vipConfig = VipModel::where('vip', $user['level_vip'])->find();
        
        Db::startTrans();
        try {
            // 记录领取
            VipModel::recordDailyReward($userId, $user['level_vip'], $vipConfig['reward_money'], $today);
            
            // 增加余额并记录流水
            $result = User::changeMoney($userId, 'inc', 1, $vipConfig['reward_money'], MoneyLog::STATUS_VIP_REWARD, 0, 'VIP每日奖励');
            if ($result['code'] == 0) {
                Db::rollback();
                return show(0, [], $result['msg']);
            }
            
            Db::commit();
            return show(1, ['amount' => $vipConfig['reward_money']], 40002);
        } catch (\Exception $e) {
            Db::rollback();
            return show(0, [], 1001);
        }
    }
}
