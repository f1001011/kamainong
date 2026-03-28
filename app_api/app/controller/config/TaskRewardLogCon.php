<?php
declare(strict_types=1);

namespace app\controller\config;

use app\controller\BaseCon;
use app\model\CommonTaskRewardLogModel;

/**
 * 任务奖励记录控制器
 * 负责处理用户任务奖励领取记录相关的业务逻辑
 * 提供任务奖励领取历史查询，用于用户查看已完成任务的奖励获取情况
 */
class TaskRewardLogCon extends BaseCon
{
    /**
     * 任务奖励记录列表接口
     * 获取当前用户已领取的任务奖励记录，按ID倒序排列
     * 用于用户中心展示任务奖励领取历史
     * 
     * @return mixed 返回任务奖励记录列表数据，包含任务名称、奖励金额、领取时间等
     */
    public function GetTaskRewardLogList()
    {
        // 定义需要接收的参数字段：page-当前页码, limit-每页数量
        $postField = 'page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取分页参数，默认为page=1, limit=20
        $page = $post['page'] ?? 1;
        $limit = $post['limit'] ?? 20;
        // 获取当前登录用户的ID
        $userId = $this->request->UserID;
        
        // 构建查询条件：当前用户ID
        $map = ['user_id' => $userId];
        
        // 调用模型的分页查询方法，按ID倒序排列
        $list = CommonTaskRewardLogModel::PageList($map, '*', (int)$page, (int)$limit, 'id desc');
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
}
