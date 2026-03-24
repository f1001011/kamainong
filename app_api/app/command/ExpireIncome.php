<?php
declare (strict_types = 1);

namespace app\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;
use think\facade\Db;
use app\model\Income;

/**
 * 收益过期处理（每分钟执行）
 * 过期时间=可领取时间+24小时，所以过期时间也是分散的，需要每分钟检查
 * 支持分批处理，避免数据量大时锁表太久
 */
class ExpireIncome extends Command
{
    protected $batchSize = 1000; // 每批处理数量
    
    protected function configure()
    {
        $this->setName('cron:expire_income')
            ->setDescription('处理过期收益（每分钟执行）');
    }

    protected function execute(Input $input, Output $output)
    {
        $now = time();
        $totalCount = 0;
        
        while (true) {
            // 分批查询并更新过期收益
            $ids = Db::name('common_income_claim_log')
                ->where('status', Income::STATUS_WAITING)
                ->where('expire_time', '<', $now)
                ->limit($this->batchSize)
                ->column('id');
            
            if (empty($ids)) {
                break;
            }
            
            $count = Db::name('common_income_claim_log')
                ->whereIn('id', $ids)
                ->update([
                    'status' => Income::STATUS_EXPIRED,
                    'update_time' => $now
                ]);
            
            $totalCount += $count;
            
            // 如果返回数量少于批次大小，说明处理完了
            if ($count < $this->batchSize) {
                break;
            }
            
            // 休息一下
            usleep(100000);
        }
        
        $output->writeln("收益过期处理完成，共 {$totalCount} 条记录已过期");
    }
}
