<?php
declare(strict_types=1);

namespace app\controller\config;

use app\controller\BaseCon;
use app\model\CommonVipDailyRewardLogModel;

/**
 * VIP每日工资控制器
 * 负责处理VIP每日奖励领取记录相关的业务逻辑
 * 提供VIP每日奖励领取历史查询，用于用户查看每日VIP收益领取情况
 */
class VipDailyRewardLogCon extends BaseCon
{
    /**
     * VIP每日工资列表接口
     * 获取当前用户VIP每日奖励领取记录，按ID倒序排列
     * 用于用户中心展示每日VIP收益领取历史
     * 
     * @return mixed 返回VIP每日工资列表数据，包含领取日期、奖励金额、VIP等级等
     */
    public function GetVipDailyRewardLogList()
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
        $list = CommonVipDailyRewardLogModel::PageList($map, '*', (int)$page, (int)$limit, 'id desc');
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
}
