<?php
declare (strict_types = 1);

namespace app\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;
use think\facade\Db;

class IncomeCalculate extends Command
{
    protected function configure()
    {
        $this->setName('IncomeCalculate')
            ->setDescription('每日凌晨计算产品收益');
    }

    protected function execute(Input $input, Output $output)
    {
        $output->writeln('开始计算收益...');
        
        // 获取所有进行中的订单
        $orders = Db::name('common_order')
            ->where('status', 1)
            ->where('end_time', '>', date('Y-m-d H:i:s'))
            ->select();
        
        $count = 0;
        foreach ($orders as $order) {
            // 生成收益记录
            $expireTime = date('Y-m-d H:i:s', strtotime('+24 hours'));
            
            Db::name('common_income_claim_log')->insert([
                'user_id' => $order['user_id'],
                'order_id' => $order['id'],
                'claim_amount' => $order['day_red'],
                'status' => 0,
                'expire_time' => $expireTime,
                'create_time' => date('Y-m-d H:i:s')
            ]);
            
            $count++;
        }
        
        $output->writeln("收益计算完成，共生成 {$count} 条记录");
    }
}
