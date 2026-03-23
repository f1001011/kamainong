<?php
namespace app\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;

class PrizeDraw extends Command
{
    protected function configure()
    {
        $this->setName('prize:draw')
            ->setDescription('奖池开奖 - 每天早上5点执行');
    }

    protected function execute(Input $input, Output $output)
    {
        $output->writeln('开始奖池开奖...');
        
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        
        // 条件1: LV1团队当天充值最高
        $winner1 = db('common_user')
            ->where('team_recharge_today', '>', 0)
            ->order('team_recharge_today desc')
            ->limit(1)
            ->find();
        
        if ($winner1) {
            $this->giveReward($winner1['id'], 1388, '一等奖');
            $output->writeln("一等奖: 用户 {$winner1['id']}");
        }
        
        // 条件2: 个人当天累计充值最高
        $winner2 = db('common_pay_recharge')
            ->where('create_time', '>=', strtotime($yesterday))
            ->field('user_id, sum(money) as total')
            ->group('user_id')
            ->order('total desc')
            ->limit(1)
            ->find();
        
        if ($winner2) {
            $this->giveReward($winner2['user_id'], 888, '二等奖');
            $output->writeln("二等奖: 用户 {$winner2['user_id']}");
        }
        
        // 条件3: 个人当天邀请人数最高
        $winner3 = db('common_user')
            ->where('invite_count_today', '>', 0)
            ->order('invite_count_today desc')
            ->limit(1)
            ->find();
        
        if ($winner3) {
            $this->giveReward($winner3['id'], 688, '三等奖');
            $output->writeln("三等奖: 用户 {$winner3['id']}");
        }
        
        // 重置今日统计
        db('common_user')->update([
            'team_recharge_today' => 0,
            'invite_count_today' => 0
        ]);
        
        $output->writeln('开奖完成！');
    }
    
    private function giveReward($userId, $amount, $rank)
    {
        db('common_user')->where('id', $userId)->inc('money_balance', $amount)->update();
        
        db('common_prize_pool_log')->insert([
            'user_id' => $userId,
            'money' => $amount,
            'rank' => $rank,
            'create_time' => time()
        ]);
    }
}
