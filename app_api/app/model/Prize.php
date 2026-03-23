<?php
namespace app\model;

use think\Model;
use think\facade\Db;

class Prize extends Model
{
    protected $name = 'common_prize_pool_config';
    
    // 获取获奖记录
    public static function getWinners($limit = 20)
    {
        return Db::name('common_prize_pool_log')
            ->order('prize_date', 'desc')
            ->limit($limit)
            ->select();
    }
}
