<?php
declare(strict_types=1);

namespace app\controller\payment;

use app\controller\BaseCon;
use app\model\CommonPayRechargeModel;

/**
 * 充值控制器
 * 负责处理用户充值记录相关的业务逻辑
 * 提供充值记录查询，用于用户查看充值历史和状态
 */
class PayRechargeCon extends BaseCon
{
    /**
     * 充值记录列表接口
     * 获取当前用户的充值记录列表，按ID倒序排列
     * 用于用户中心展示充值历史记录
     * 
     * @return mixed 返回充值记录列表数据，包含充值金额、支付方式、订单状态、创建时间等
     */
    public function GetRechargeList()
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
        $list = CommonPayRechargeModel::PageList($map, '*', (int)$page, (int)$limit, 'id desc');
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
}
