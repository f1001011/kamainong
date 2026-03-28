<?php
declare(strict_types=1);

namespace app\controller\payment;

use app\controller\BaseCon;
use app\model\CommonPayCouponModel;

/**
 * 优惠券控制器
 * 负责处理用户优惠券相关的业务逻辑
 * 提供可用优惠券列表查询，用于用户查看可使用的支付优惠券
 */
class PayCouponCon extends BaseCon
{
    /**
     * 优惠券列表接口
     * 获取当前用户未使用且未过期的优惠券列表，按ID倒序排列
     * 用于用户在下单支付时选择使用优惠券
     * 
     * @return mixed 返回优惠券列表数据，包含优惠券金额、有效期、使用状态等
     */
    public function GetCouponList()
    {
        // 定义需要接收的参数字段：limit-查询数量(默认10条)
        $postField = 'limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取查询数量参数，默认为10条
        $limit = $post['limit'] ?? 10;
        // 获取当前登录用户的ID
        $uid = $this->request->UserID;
        
        // 构建查询条件：当前用户ID + 未使用状态 + 未过期
        $map = [
            'uid' => $uid, // 当前用户ID
            'status' => CommonPayCouponModel::STATUS_UNUSED, // 未使用状态
            'exp_time' => ['>=', date('Y-m-d H:i:s')], // 过期时间大于当前时间
        ];
        
        // 调用模型的不分页查询方法，按ID倒序排列，限制返回数量
        $list = CommonPayCouponModel::PageData($map, 'id desc', (int)$limit);
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
}
