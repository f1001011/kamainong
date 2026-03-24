<?php
declare (strict_types = 1);

namespace app\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;
use think\facade\Db;

/**
 * 月薪重置（每月1日00:00执行）
 */
class ResetSalary extends Command
{
    protected function configure()
    {
        $this->setName('cron:reset_salary')
            ->setDescription('重置月薪奖励');
    }

    protected function execute(Input $input, Output $output)
    {
        $monthStart = date('Y-m-01');
        
        // 将上月的领取记录标记为过期
        Db::name('common_monthly_salary_log')
            ->where('salary_month', '<', date('Y-m'))
            ->where('status', 0)
            ->update(['status' => 2]);
        
        // 重置所有用户的月薪领取状态
        $count = Db::name('common_user')
            ->where('1=1')
            ->update(['monthly_claimed' => 0]);
        
        $output->writeln("月薪重置完成，{$count} 个用户已重置");
    }
}
