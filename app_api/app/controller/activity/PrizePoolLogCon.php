<?php
declare(strict_types=1);

namespace app\controller\activity;

use app\controller\BaseCon;
use app\model\CommonPrizePoolLogModel;

/**
 * 奖池记录控制器
 * 负责处理每日奖池获奖记录相关的业务逻辑
 * 提供奖池中奖记录查询，用于用户查看每日奖池中奖信息
 */
class PrizePoolLogCon extends BaseCon
{
    /**
     * 奖池获奖记录列表接口
     * 获取当前用户的奖池中奖记录，按ID倒序排列
     * 用于用户中心展示每日奖池中奖历史
     * 
     * @return mixed 返回奖池记录列表数据，包含奖项等级、奖励金额、获奖日期、领取状态等
     */
    public function GetPrizePoolLogList()
    {
        // 定义需要接收的参数字段：page-当前页码, limit-每页数量
        $postField = 'page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取分页参数，默认为page=1, limit=10
        $page = $post['page'] ?? 1;
        $limit = $post['limit'] ?? 10;
        // 获取当前登录用户的ID
        $userId = $this->request->UserID;
        
        // 构建查询条件：当前用户ID
        $map = ['user_id' => $userId];
        
        // 调用模型的分页查询方法，按ID倒序排列
        $list = CommonPrizePoolLogModel::PageList($map, '*', (int)$page, (int)$limit, 'id desc');
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
}
