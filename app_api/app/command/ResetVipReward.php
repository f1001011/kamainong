<?php
declare (strict_types = 1);

namespace app\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;
use think\facade\Db;

/**
 * VIP每日奖励重置（每天00:00执行）
 */
class ResetVipReward extends Command
{
    protected function configure()
    {
        $this->setName('cron:reset_vip_reward')
            ->setDescription('重置VIP每日奖励');
    }

    protected function execute(Input $input, Output $output)
    {
        $today = date('Y-m-d');
        
        // 将昨天的领取记录标记为过期
        $count = Db::name('common_vip_daily_reward_log')
            ->where('claim_date', '<', $today)
            ->where('status', 0)
            ->update(['status' => 2]);
        
        $output->writeln("VIP奖励重置完成，{$count} 条记录已过期");
    }
}
