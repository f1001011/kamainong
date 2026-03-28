<?php
declare(strict_types=1);

namespace app\controller\activity;

use app\controller\BaseCon;
use app\model\CommonUserSignLogModel;

/**
 * 签到记录控制器
 * 负责处理用户签到记录相关的业务逻辑
 * 提供签到历史查询，用于用户查看签到记录和累计签到天数
 */
class UserSignLogCon extends BaseCon
{
    /**
     * 签到记录列表接口
     * 获取当前用户的签到历史记录，按ID倒序排列
     * 用于用户中心展示签到历史和累计签到天数
     * 
     * @return mixed 返回签到记录列表数据，包含签到日期、奖励金额、连续签到天数等
     */
    public function GetSignLogList()
    {
        // 定义需要接收的参数字段：page-当前页码, limit-每页数量
        $postField = 'page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取分页参数，默认为page=1, limit=20
        $page = $post['page'] ?? 1;
        $limit = $post['limit'] ?? 20;
        // 获取当前登录用户的ID
        $uid = $this->request->UserID;
        
        // 构建查询条件：当前用户ID
        $map = ['uid' => $uid];
        
        // 调用模型的分页查询方法，按ID倒序排列
        $list = CommonUserSignLogModel::PageList($map, '*', (int)$page, (int)$limit, 'id desc');
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
}
