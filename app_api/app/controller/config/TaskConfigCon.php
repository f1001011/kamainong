<?php
declare(strict_types=1);

namespace app\controller\config;

use app\controller\BaseCon;
use app\model\CommonTaskConfigModel;
use app\model\CommonUserModel;

/**
 * 任务配置控制器
 * 负责处理任务配置和用户邀请统计相关的业务逻辑
 * 提供任务列表查询，并附带当前用户的邀请统计信息
 */
class TaskConfigCon extends BaseCon
{
    /**
     * 任务配置列表接口
     * 获取所有启用的任务配置列表，同时统计当前用户的各级邀请人数
     * 用于用户中心展示任务列表和邀请进度
     * 
     * @return mixed 返回任务配置列表数据，包含任务要求、奖励金额、用户邀请统计等
     */
    public function GetTaskConfigList()
    {
        // 获取当前登录用户的ID
        $userId = $this->request->UserID;
        
        // 构建查询条件：状态为启用
        $map = ['status' => CommonTaskConfigModel::STATUS_ENABLE];
        
        // 调用模型的不分页查询方法，按排序和ID正序排列
        $list = CommonTaskConfigModel::PageData($map, 'sort asc, id asc');
        
        // 若存在用户ID且查询结果不为空，则统计用户的邀请人数
        if ($userId && $list) {
            // 查询当前用户的代理信息
            $user = CommonUserModel::PageDataOne(
                ['id' => $userId], 
                'agent_id_1,agent_id_2,agent_id_3,level_vip'
            );
            
            // 初始化各级邀请人数统计
            $inviteCount1 = 0; // 一级邀请人数
            $inviteCount2 = 0; // 二级邀请人数
            $inviteCount3 = 0; // 三级邀请人数
            
            // 若用户存在，则统计各级邀请的VIP用户数量
            if ($user) {
                // 统计一级邀请人数(直接邀请的LV1及以上用户)
                if ($user['agent_id_1']) {
                    $inviteCount1 = CommonUserModel::where('agent_id', $user['agent_id_1'])
                        ->where('level_vip', '>=', 1)
                        ->count();
                }
                // 统计二级邀请人数
                if ($user['agent_id_2']) {
                    $inviteCount2 = CommonUserModel::where('agent_id', $user['agent_id_2'])
                        ->where('level_vip', '>=', 1)
                        ->count();
                }
                // 统计三级邀请人数
                if ($user['agent_id_3']) {
                    $inviteCount3 = CommonUserModel::where('agent_id', $user['agent_id_3'])
                        ->where('level_vip', '>=', 1)
                        ->count();
                }
            }
            
            // 将邀请统计信息添加到每个任务配置中
            foreach ($list as &$item) {
                $item['invite_count_lv'] = $inviteCount1 + $inviteCount2 + $inviteCount3; // 总邀请人数
                $item['invite_count_lv1'] = $inviteCount1; // 一级邀请人数
                $item['invite_count_lv2'] = $inviteCount2; // 二级邀请人数
                $item['invite_count_lv3'] = $inviteCount3; // 三级邀请人数
            }
        }
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
}
