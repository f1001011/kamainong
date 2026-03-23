<?php
namespace app\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;

class ProductIncome extends Command
{
    protected function configure()
    {
        $this->setName('product:income')
            ->setDescription('产品收益生成任务 - 每天凌晨执行');
    }

    protected function execute(Input $input, Output $output)
    {
        $output->writeln('开始生成产品收益...');
        
        // 查询所有进行中的订单
        $orders = db('common_goods_order')
            ->where('status', 1)
            ->where('end_time', '>', time())
            ->select();
        
        $count = 0;
        foreach ($orders as $order) {
            // 生成收益记录
            $income = [
                'user_id' => $order['user_id'],
                'order_id' => $order['id'],
                'money' => $order['day_money'],
                'type' => 1,
                'status' => 0,
                'expire_time' => time() + 86400,
                'create_time' => time()
            ];
            
            db('common_income_claim_log')->insert($income);
            $count++;
        }
        
        $output->writeln("完成！共生成 {$count} 条收益记录");
    }
}
