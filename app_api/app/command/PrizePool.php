<?php
declare (strict_types = 1);

namespace app\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;
use think\facade\Db;

/**
 * 奖池开奖（每天05:00执行）
 */
class PrizePool extends Command
{
    protected function configure()
    {
        $this->setName('cron:prize_pool')
            ->setDescription('奖池开奖');
    }

    protected function execute(Input $input, Output $output)
    {
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        $yesterdayStart = strtotime($yesterday . ' 00:00:00');
        $yesterdayEnd = strtotime($yesterday . ' 23:59:59');
        
        // 一等奖：个人LV1团队当天充值最高
        $first = $this->getFirstPrize($yesterdayStart, $yesterdayEnd);
        
        // 二等奖：个人当天累计充值最高
        $second = $this->getSecondPrize($yesterdayStart, $yesterdayEnd);
        
        // 三等奖：个人当天邀请人数最高
        $third = $this->getThirdPrize($yesterdayStart, $yesterdayEnd);
        
        // 发放奖金
        $prizes = [
            ['user_id' => $first, 'amount' => 1388, 'type' => 1],
            ['user_id' => $second, 'amount' => 888, 'type' => 2],
            ['user_id' => $third, 'amount' => 688, 'type' => 3]
        ];
        
        foreach ($prizes as $prize) {
            if ($prize['user_id']) {
                $this->awardPrize($prize['user_id'], $prize['amount'], $prize['type'], $yesterday);
            }
        }
        
        $output->writeln("奖池开奖完成");
    }
    
    private function getFirstPrize($start, $end)
    {
        $result = Db::name('common_pay_recharge')
            ->alias('r')
            ->join('common_agent_path p', 'r.uid = p.parent_id')
            ->where('r.status', 1)
            ->where('r.create_time', 'between', [$start, $end])
            ->where('p.level', 1)
            ->field('r.uid, SUM(r.money) as total')
            ->group('r.uid')
            ->order('total', 'desc')
            ->find();
        
        return $result ? $result['uid'] : null;
    }
    
    private function getSecondPrize($start, $end)
    {
        $result = Db::name('common_pay_recharge')
            ->where('status', 1)
            ->where('create_time', 'between', [$start, $end])
            ->field('uid, SUM(money) as total')
            ->group('uid')
            ->order('total', 'desc')
            ->find();
        
        return $result ? $result['uid'] : null;
    }
    
    private function getThirdPrize($start, $end)
    {
        $result = Db::name('common_user')
            ->where('create_time', 'between', [$start, $end])
            ->field('parent_id, COUNT(*) as total')
            ->group('parent_id')
            ->order('total', 'desc')
            ->find();
        
        return $result ? $result['parent_id'] : null;
    }
    
    private function awardPrize($userId, $amount, $type, $date)
    {
        Db::startTrans();
        try {
            // 增加用户余额
            Db::name('common_user')->where('id', $userId)->inc('money', $amount)->update();
            
            // 记录奖池日志
            Db::name('common_prize_pool_log')->insert([
                'user_id' => $userId,
                'prize_type' => $type,
                'amount' => $amount,
                'prize_date' => $date,
                'create_time' => time()
            ]);
            
            Db::commit();
        } catch (\Exception $e) {
            Db::rollback();
        }
    }
}
