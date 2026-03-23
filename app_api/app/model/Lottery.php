<?php
namespace app\model;

use think\Model;

class Lottery extends Model
{
    protected $name = 'common_lottery_prize';
    
    /**
     * 抽奖算法
     */
    public static function drawPrize()
    {
        $prizes = self::where('status', 1)->select()->toArray();
        
        $rand = mt_rand(1, 10000) / 100;
        $current = 0;
        
        foreach ($prizes as $prize) {
            $current += $prize['probability'];
            if ($rand <= $current) {
                return $prize;
            }
        }
        
        return $prizes[0];
    }
}
