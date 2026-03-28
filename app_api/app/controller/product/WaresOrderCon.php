<?php
declare(strict_types=1);

namespace app\controller\product;

use app\controller\BaseCon;
use app\model\CommonWaresOrderModel;

/**
 * 积分商品订单控制器
 * 负责处理积分商品订单相关的业务逻辑
 * 提供积分商品订单列表查询，用于用户查看积分兑换记录
 */
class WaresOrderCon extends BaseCon
{
    /**
     * 积分商品订单列表接口
     * 获取当前用户的积分商品订单列表，按ID倒序排列
     * 用于用户中心展示积分兑换历史记录
     * 
     * @return mixed 返回积分商品订单列表数据，包含商品信息、订单状态、收货地址、创建时间等
     */
    public function GetWaresOrderList()
    {
        // 定义需要接收的参数字段：page-当前页码, limit-每页数量
        $postField = 'page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取分页参数，默认为page=1, limit=10
        $page = $post['page'] ?? 1;
        $limit = $post['limit'] ?? 10;
        // 获取当前登录用户的ID
        $uid = $this->request->UserID;
        
        // 构建查询条件：当前用户ID
        $map = ['uid' => $uid];
        
        // 调用模型的分页查询方法，按ID倒序排列
        $list = CommonWaresOrderModel::PageList($map, '*', (int)$page, (int)$limit, 'id desc');
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
}
