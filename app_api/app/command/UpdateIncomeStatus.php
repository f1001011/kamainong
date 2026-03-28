<?php
declare (strict_types = 1);

namespace app\command;

use app\model\Income;
use app\model\Order;
use think\console\Command;
use think\console\Input;
use think\console\Output;
use think\facade\Db;

/**
 * 生成次日收益记录（每天23:00执行）
 * 提前生成第二天所有可领取的收益，用户从00:00开始就能看到
 * 支持分批处理，避免数据量大时超时
 */
class UpdateIncomeStatus extends Command
{
    protected $batchSize = 500; // 每批处理数量
    
    protected function configure()
    {
        $this->setName('cron:update_income_status')
            ->setDescription('生成次日收益记录（每天23:00执行）');
    }

    protected function execute(Input $input, Output $output)
    {
        $now = time();
        $tomorrow = date('Y-m-d', strtotime('+1 day'));
        $totalCount = 0;
        $offset = 0;
        
        $output->writeln("开始生成次日({$tomorrow})收益记录...");
        
        while (true) {
            // 分批获取订单
            $orders = Db::name('common_goods_order')
                ->alias('o')
                ->join('common_goods g', 'o.goods_id = g.id')
                ->where('o.status', Order::STATUS_ACTIVE)
                ->where('o.end_time', '>', strtotime($tomorrow))
                ->where('o.create_time', '<', strtotime('today'))
                ->field('o.id,o.user_id,o.goods_id,o.create_time,g.income_times_per_day,g.minute_claim,g.income_per_time')
                ->limit($offset, $this->batchSize)
                ->select()
                ->toArray();
            
            if (empty($orders)) {
                break;
            }
            
            $insertData = [];
            
            foreach ($orders as $order) {
                $times = $this->calculateClaimTimes($order['income_times_per_day'], $order['minute_claim']);
                
                foreach ($times as $index => $claimTime) {
                    $availableTime = strtotime("$tomorrow $claimTime");
                    
                    $insertData[] = [
                        'user_id' => $order['user_id'],
                        'order_id' => $order['id'],
                        'claim_amount' => $order['income_per_time'],
                        'claim_date' => $tomorrow,
                        'claim_index' => $index,
                        'status' => Income::STATUS_WAITING,  // 使用常量
                        'available_time' => $availableTime,
                        'expire_time' => $availableTime + 86400,
                        'create_time' => $now
                    ];
                }
            }
            
            // 批量插入
            if (!empty($insertData)) {
                Db::name('common_income_claim_log')->insertAll($insertData);
                $totalCount += count($insertData);
            }
            
            $offset += $this->batchSize;
            $output->writeln("已处理 {$offset} 条订单...");
            
            // 休息一下，避免CPU过高
            usleep(100000); // 0.1秒
        }
        
        $output->writeln("次日收益生成完成，共 {$totalCount} 条记录");
    }
    
    /**
     * 计算可领取时间点
     */
    private function calculateClaimTimes($timesPerDay, $minuteClaim)
    {
        $times = [];
        
        if ($minuteClaim == 0) {
            $times[] = '00:00:00';
        } else {
            for ($i = 0; $i < $timesPerDay; $i++) {
                $minutes = $i * $minuteClaim;
                $hours = floor($minutes / 60);
                $mins = $minutes % 60;
                $times[] = sprintf('%02d:%02d:00', $hours, $mins);
            }
        }
        
        return $times;
    }
}
