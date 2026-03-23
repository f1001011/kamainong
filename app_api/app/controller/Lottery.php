<?php

namespace app\controller;

use app\BaseController;
use app\model\MoneyLog;
use app\model\User;
use think\facade\Db;

class Lottery extends BaseController
{
    // 获取转盘配置
    public function config()
    {
        $prizes = Db::name('common_lottery_prize')
            ->where('status', 1)
            ->field('id,name,type,amount,probability,image')
            ->select();

        return show(1, ['prizes' => $prizes]);
    }

    // 获取用户转盘次数
    public function getChance()
    {
        $userId = $this->request->userId;

        $chance = Db::name('common_lottery_chance')
            ->where('user_id', $userId)
            ->find();

        if (!$chance) {
            $chance = [
                'total_chance' => 0,
                'used_chance' => 0,
                'today_chance' => 0
            ];
        }

        // 检查是否跨天，重置今日次数
        if ($chance && $chance['last_spin_date'] != date('Y-m-d')) {
            Db::name('common_lottery_chance')
                ->where('user_id', $userId)
                ->update(['today_chance' => 0]);
            $chance['today_chance'] = 0;
        }

        $remaining = $chance['total_chance'] - $chance['used_chance'];
        $todayRemaining = max(0, 5 - $chance['today_chance']);

        return show(1, [
            'remaining' => $remaining,
            'today_remaining' => $todayRemaining
        ]);
    }

    // 抽奖
    public function spin()
    {
        $userId = $this->request->userId;

        // 检查次数
        $chance = Db::name('common_lottery_chance')->where('user_id', $userId)->find();

        if (!$chance || $chance['total_chance'] <= $chance['used_chance']) {
            return show(0, [], '抽奖次数不足');
        }

        // 检查今日次数
        if ($chance['last_spin_date'] == date('Y-m-d') && $chance['today_chance'] >= 5) {
            return show(0, [], '今日抽奖次数已用完');
        }

        // 抽奖逻辑
        $prize = \app\model\Lottery::drawPrize();

        if (!$prize) {
            return show(0, [], '抽奖失败');
        }

        Db::startTrans();
        try {
            // 扣除次数
            Db::name('common_lottery_chance')->where('user_id', $userId)->update([
                'used_chance' => Db::raw('used_chance + 1'),
                'today_chance' => $chance['last_spin_date'] == date('Y-m-d') ? Db::raw('today_chance + 1') : 1,
                'last_spin_date' => date('Y-m-d')
            ]);

            // 记录中奖
            Db::name('common_lottery_log')->insert([
                'user_id' => $userId,
                'prize_id' => $prize['id'],
                'prize_name' => $prize['name'],
                'prize_type' => $prize['type'],
                'amount' => $prize['amount'],
                'create_time' => date('Y-m-d H:i:s')
            ]);

            // 发放奖励
            if ($prize['type'] == 1) {
                $result = User::changeMoney($userId, 'inc', 1, $prize['amount'], MoneyLog::STATUS_LOTTERY_REWARD, $prize['id'], '转盘中奖：' . $prize['name']);
                if ($result['code'] == 0) {
                    Db::rollback();
                    return show(0, [], $result['msg']);
                }
            }
            
            Db::commit();
            return show(1, ['prize' => $prize], '恭喜中奖');
        } catch (\Exception $e) {
            Db::rollback();
            return show(0, [], '抽奖失败');
        }
    }

    // 中奖记录
    public function history()
    {
        $userId = $this->request->userId;

        $list = Db::name('common_lottery_log')
            ->where('user_id', $userId)
            ->order('create_time desc')
            ->limit(50)
            ->select();

        return show(1, ['list' => $list]);
    }
}
