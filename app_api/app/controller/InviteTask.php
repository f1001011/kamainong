<?php
namespace app\api\controller;

use app\BaseController;
use think\facade\Db;

class InviteTask extends BaseController
{
    // 获取任务配置
    public function config()
    {
        $list = Db::name('common_invite_task_config')
            ->where('status', 1)
            ->order('task_group asc, sort asc')
            ->select();
        
        return show(1, $list);
    }
    
    // 获取我的任务进度
    public function myProgress()
    {
        $userId = request()->userId;
        $weekStart = date('Y-m-d', strtotime('this week'));
        
        // 获取本周统计
        $stats = Db::name('common_user_invite_week')
            ->where('user_id', $userId)
            ->where('week_start', $weekStart)
            ->find();
        
        if (!$stats) {
            $stats = ['lv1_count' => 0, 'lv2_count' => 0];
        }
        
        // 获取已完成的任务
        $completed = Db::name('common_invite_task_log')
            ->where('user_id', $userId)
            ->where('week_start', $weekStart)
            ->column('task_id');
        
        return show(1, [
            'lv1_count' => $stats['lv1_count'],
            'lv2_count' => $stats['lv2_count'],
            'completed_tasks' => $completed
        ]);
    }
}
