<?php
declare(strict_types=1);

namespace app\controller\product;

use app\controller\BaseCon;
use app\model\CommonIncomeClaimLogModel;
use app\model\CommonGoodsModel;
use app\model\CommonGoodsOrderModel;

/**
 * 收益领取记录控制器
 * 负责处理用户收益领取记录相关的业务逻辑
 * 提供待领取收益列表查询，关联商品和订单信息
 */
class IncomeClaimLogCon extends BaseCon
{
    /**
     * 待领取收益列表接口
     * 获取当前用户待领取的收益记录列表（未过期且待领取状态），按过期时间升序排列
     * 同时联表查询商品信息和订单信息
     * 用于用户查看待领取的收益明细
     * 
     * @return mixed 返回待领取收益列表数据，包含领取金额、过期时间、商品信息、订单信息等
     */
    public function GetPendingList()
    {
        // 定义需要接收的参数字段：page-当前页码, limit-每页数量
        $postField = 'page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取分页参数，默认为page=1, limit=20
        $page = $post['page'] ?? 1;
        $limit = $post['limit'] ?? 20;
        // 获取当前登录用户的ID
        $userId = $this->request->UserID;
        
        // 构建查询条件：当前用户ID + 待领取状态 + 未过期
        $map = [
            'user_id' => $userId, // 当前用户ID
            'status' => CommonIncomeClaimLogModel::STATUS_PENDING, // 待领取状态
            'expire_time' => ['>=', date('Y-m-d H:i:s')], // 过期时间大于当前时间
        ];
        
        // 调用模型的分页查询方法，按过期时间升序、ID倒序排列
        $list = CommonIncomeClaimLogModel::PageList(
            $map, 
            '*', 
            (int)$page, 
            (int)$limit, 
            'expire_time asc, id desc'
        );
        
        // 若查询结果不为空，则处理每条数据，关联查询商品信息和订单信息
        if ($list) {
            foreach ($list as &$item) {
                // 根据商品ID查询商品详细信息
                $goodsInfo = CommonGoodsModel::PageDataOne(
                    ['id' => $item['goods_id']], 
                    'id,goods_name,head_img,goods_money,period,revenue_lv,day_red'
                );
                // 根据订单ID查询订单详细信息
                $orderInfo = CommonGoodsOrderModel::PageDataOne(
                    ['id' => $item['order_id']], 
                    'id,order_no,goods_name,order_money,total_red_money,already_red_money,surplus_red_money'
                );
                // 将商品信息和订单信息赋值给数据，若不存在则为空对象
                $item['goods_info'] = $goodsInfo ?: (object)[];
                $item['order_info'] = $orderInfo ?: (object)[];
            }
        }
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
}
