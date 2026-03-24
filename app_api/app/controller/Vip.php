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
    public function config()
    {
        $userId = request()->userId;

        $user = User::where('id', $userId)->find();
        $level = intval($user['level_vip']);

        $totalBuyCount = Order::where('user_id', $userId)->count();

        $currentConfig = VipModel::where('vip', $level)->find();
        $nextConfig = VipModel::where('vip', '>', $level)->order('vip', 'asc')->find();

        $currentNeed = $currentConfig ? intval($currentConfig['buy_goods_num']) : 0;
        $nextNeed = $nextConfig ? intval($nextConfig['buy_goods_num']) : 0;

        $result = [
            'level' => $level,
            'label' => 'LV' . $level,
            'total_buy_count' => intval($totalBuyCount),
            'current_buy_count' => intval($totalBuyCount),
            'next_buy_count' => $nextNeed,
            'next_need' => $nextNeed > 0 ? max(0, $nextNeed - intval($totalBuyCount)) : 0,
            'reward_money' => $currentConfig ? floatval($currentConfig['reward_money']) : 0,
        ];

        return show(1, $result);
    }

    public function buyLog()
    {
        $userId = request()->userId;

        $list = Order::field('id,goods_name,goods_money,create_time')
            ->where('user_id', $userId)
            ->order('create_time', 'desc')
            ->select();

        return show(1, $list);
    }

    public function checkUpgrade()
    {
        $userId = request()->userId;

        $user = User::where('id', $userId)->find();
        $currentVip = $user['level_vip'];

        $nextVip = VipModel::where('vip', '>', $currentVip)
            ->order('vip', 'asc')
            ->find();

        if (!$nextVip) {
            return show(1, ['can_upgrade' => false]);
        }

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

    public function dailyReward()
    {
        $userId = request()->userId;

        $user = User::where('id', $userId)->find();

        if ($user['level_vip'] == 0) {
            return show(0, [], 1001);
        }

        $today = date('Y-m-d');
        $claimed = VipModel::checkDailyClaimed($userId, $today);

        if ($claimed) {
            return show(0, [], 40001);
        }

        $vipConfig = VipModel::where('vip', $user['level_vip'])->find();

        Db::startTrans();
        try {
            VipModel::recordDailyReward($userId, $user['level_vip'], $vipConfig['reward_money'], $today);

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
