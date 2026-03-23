<?php
declare (strict_types = 1);

namespace app\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;
use think\facade\Db;

class InviteTaskCheck extends Command
{
    protected function configure()
    {
        $this->setName('InviteTaskCheck')
            ->setDescription('检查邀请任务完成情况');
    }

    protected function execute(Input $input, Output $output)
    {
        $output->writeln('开始检查邀请任务...');
        
        $weekStart = date('Y-m-d', strtotime('this week'));
        
        // 获取所有任务配置
        $tasks = Db::name('common_invite_task_config')
            ->where('status', 1)
            ->select();
        
        // 获取本周有邀请的用户
        $users = Db::name('common_user_invite_week')
            ->where('week_start', $weekStart)
            ->select();
        
        $rewardCount = 0;
        foreach ($users as $user) {
            foreach ($tasks as $task) {
                // 检查是否已完成
                $completed = Db::name('common_invite_task_log')
                    ->where('user_id', $user['user_id'])
                    ->where('task_id', $task['id'])
                    ->where('week_start', $weekStart)
                    ->find();
                
                if ($completed) continue;
                
                // 检查是否达成条件
                $count = $task['task_group'] == 1 ? $user['lv2_count'] : $user['lv1_count'];
                
                if ($count >= $task['required_count']) {
                    // 发放奖励
                    Db::name('common_invite_task_log')->insert([
                        'user_id' => $user['user_id'],
                        'task_id' => $task['id'],
                        'task_group' => $task['task_group'],
                        'invite_count' => $count,
                        'reward_amount' => $task['reward_amount'],
                        'week_start' => $weekStart,
                        'create_time' => date('Y-m-d H:i:s'),
                        'status' => 1
                    ]);
                    
                    // 增加用户余额
                    Db::name('common_user')
                        ->where('id', $user['user_id'])
                        ->inc('money_balance', $task['reward_amount'])
                        ->update();
                    
                    $rewardCount++;
                }
            }
        }
        
        $output->writeln("检查完成，共发放 {$rewardCount} 个任务奖励");
    }
}
