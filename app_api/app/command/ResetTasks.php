<?php
declare (strict_types = 1);

namespace app\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;
use think\facade\Db;

/**
 * 任务进度重置（每周一00:00执行）
 */
class ResetTasks extends Command
{
    protected function configure()
    {
        $this->setName('cron:reset_tasks')
            ->setDescription('重置任务进度');
    }

    protected function execute(Input $input, Output $output)
    {
        $weekStart = date('Y-m-d', strtotime('monday this week'));
        
        // 将所有任务进度重置
        $count = Db::name('common_task_progress')
            ->where('1=1')
            ->update([
                'current_count' => 0,
                'is_completed' => 0,
                'update_time' => time()
            ]);
        
        $output->writeln("任务进度重置完成，{$count} 条记录已重置");
    }
}
