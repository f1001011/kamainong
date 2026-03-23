<?php
namespace app\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;

class VipUpgrade extends Command
{
    protected function configure()
    {
        $this->setName('vip:upgrade')
            ->setDescription('VIP升级检测 - 每小时执行');
    }

    protected function execute(Input $input, Output $output)
    {
        $output->writeln('开始检测VIP升级...');
        
        // 获取VIP配置
        $vipConfigs = db('common_vip')
            ->order('level asc')
            ->select()
            ->toArray();
        
        // 获取所有用户
        $users = db('common_user')->select();
        
        $upgradeCount = 0;
        foreach ($users as $user) {
            // 统计用户购买的产品数量（按产品类型）
            $productCounts = db('common_order')
                ->where('user_id', $user['id'])
                ->where('status', 1)
                ->field('goods_id, count(*) as count')
                ->group('goods_id')
                ->select()
                ->toArray();
            
            // 检查是否满足VIP升级条件
            foreach ($vipConfigs as $vip) {
                if ($this->checkVipCondition($productCounts, $vip)) {
                    if ($user['vip_level'] < $vip['level']) {
                        db('common_user')->where('id', $user['id'])->update([
                            'vip_level' => $vip['level']
                        ]);
                        
                        db('common_vip_log')->insert([
                            'user_id' => $user['id'],
                            'vip_level' => $vip['level'],
                            'create_time' => time()
                        ]);
                        
                        $upgradeCount++;
                        $output->writeln("用户 {$user['id']} 升级到 VIP{$vip['level']}");
                    }
                }
            }
        }
        
        $output->writeln("VIP升级检测完成，共 {$upgradeCount} 人升级");
    }
    
    private function checkVipCondition($productCounts, $vip)
    {
        // 检查是否购买了指定产品的2个
        $requiredProductId = $vip['required_product_id'] ?? 0;
        if (!$requiredProductId) return false;
        
        foreach ($productCounts as $pc) {
            if ($pc['goods_id'] == $requiredProductId && $pc['count'] >= 2) {
                return true;
            }
        }
        
        return false;
    }
}
