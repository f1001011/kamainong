<?php
declare (strict_types = 1);

namespace app\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;
use think\facade\Db;

/**
 * 转盘次数重置（每天00:00执行）
 */
class ResetLottery extends Command
{
    protected function configure()
    {
        $this->setName('cron:reset_lottery')
            ->setDescription('重置转盘次数');
    }

    protected function execute(Input $input, Output $output)
    {
        // 重置所有用户的今日转盘次数
        $count = Db::name('common_lottery_chance')
            ->where('today_used', '>', 0)
            ->update(['today_used' => 0]);
        
        $output->writeln("转盘次数重置完成，{$count} 个用户已重置");
    }
}
