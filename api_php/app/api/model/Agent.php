<?php
namespace app\api\model;

use think\Model;
use think\facade\Db;

class Agent extends Model
{
    protected $name = 'common_agent_level_config';
    
    // 获取团队统计
    public static function getTeamStats($userId)
    {
        $lv1 = Db::name('common_user')->where('agent_id_1', $userId)->count();
        $lv2 = Db::name('common_user')->where('agent_id_2', $userId)->count();
        $lv3 = Db::name('common_user')->where('agent_id_3', $userId)->count();
        
        return [
            'lv1' => $lv1,
            'lv2' => $lv2,
            'lv3' => $lv3,
            'total' => $lv1 + $lv2 + $lv3
        ];
    }
}
