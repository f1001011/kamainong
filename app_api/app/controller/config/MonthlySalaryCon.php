<?php
declare(strict_types=1);

namespace app\controller\config;

use app\controller\BaseCon;
use app\model\CommonMonthlySalaryLogModel;

/**
 * 月薪控制器
 * 负责处理用户月薪奖励相关的业务逻辑
 * 提供月薪领取记录查询，用于用户查看月薪奖励发放情况
 */
class MonthlySalaryCon extends BaseCon
{
    /**
     * 月薪发放记录列表接口
     * 获取当前用户的月薪领取记录，按ID倒序排列
     * 用于用户中心展示月薪奖励领取历史
     * 
     * @return mixed 返回月薪记录列表数据，包含领取月份、团队充值金额、奖励金额、领取状态等
     */
    public function GetSalaryLog()
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
        $list = CommonMonthlySalaryLogModel::PageList($map, '*', (int)$page, (int)$limit, 'id desc');
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
}
