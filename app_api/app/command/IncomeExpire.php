<?php
declare (strict_types = 1);

namespace app\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;
use think\facade\Db;

class IncomeExpire extends Command
{
    protected function configure()
    {
        $this->setName('IncomeExpire')
            ->setDescription('处理过期收益');
    }

    protected function execute(Input $input, Output $output)
    {
        $output->writeln('开始处理过期收益...');
        
        // 将过期未领取的收益标记为已过期
        $count = Db::name('common_income_claim_log')
            ->where('status', 0)
            ->where('expire_time', '<', date('Y-m-d H:i:s'))
            ->update(['status' => 2]);
        
        $output->writeln("处理完成，共 {$count} 条收益已过期");
    }
}
