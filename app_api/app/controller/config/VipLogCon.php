<?php
declare(strict_types=1);

namespace app\controller\config;

use app\controller\BaseCon;
use app\model\CommonVipLogModel;

/**
 * VIP日志控制器
 * 负责处理VIP等级变更记录相关的业务逻辑
 * 提供VIP升级/降级历史查询，用于用户查看VIP等级变更记录
 */
class VipLogCon extends BaseCon
{
    /**
     * VIP日志列表接口
     * 获取VIP等级变更记录列表，按ID倒序排列
     * 用于用户中心展示VIP等级成长记录，包括升级时间、变化前后等级等信息
     * 
     * @return mixed 返回VIP日志列表数据，包含变更时间、变更前后等级、经验值变化等
     */
    public function GetVipLogList()
    {
        // 定义需要接收的参数字段：page-当前页码, limit-每页数量
        $postField = 'page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取分页参数，默认为page=1, limit=10
        $page = $post['page'] ?? 1;
        $limit = $post['limit'] ?? 10;
        
        // 调用模型的分页查询方法，按ID倒序排列
        $list = CommonVipLogModel::PageList([], '*', (int)$page, (int)$limit, 'id desc');
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
}
