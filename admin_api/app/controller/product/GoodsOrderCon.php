<?php
declare(strict_types=1);

namespace app\controller\product;

use app\controller\BaseCon;
use app\model\CommonGoodsOrderModel;

/**
 * 后台商品订单控制器
 * 提供商品订单列表查询，支持按用户、时间范围、状态、商品ID、订单号筛选。
 */
class GoodsOrderCon extends BaseCon
{
    /**
     * 商品订单列表接口
     * 默认按ID倒序，默认每页20条。
     *
     * @return mixed
     */
    public function GetOrderList()
    {
        $postField = 'user_id,start_time,end_time,status,goods_id,order_no,page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        $startTime = $this->normalizeSearchTime($post['start_time'] ?? null);
        if (($post['start_time'] ?? '') !== '' && $startTime === false) {
            return Show(ERROR, [], 10025);
        }

        $endTime = $this->normalizeSearchTime($post['end_time'] ?? null, true);
        if (($post['end_time'] ?? '') !== '' && $endTime === false) {
            return Show(ERROR, [], 10025);
        }

        [$page, $limit] = $this->getPageLimit($post);

        $map = [];
        $userId = (int)($post['user_id'] ?? 0);
        if ($userId > 0) {
            $map['user_id'] = $userId;
        }

        $this->appendTimeRange($map, 'create_time', $startTime ?: null, $endTime ?: null);

        $status = $post['status'] ?? '';
        if ($status !== '' && $status !== null && is_numeric($status)) {
            $map['status'] = (int)$status;
        }

        $goodsId = (int)($post['goods_id'] ?? 0);
        if ($goodsId > 0) {
            $map['goods_id'] = $goodsId;
        }

        $orderNo = trim((string)($post['order_no'] ?? ''));
        if ($orderNo !== '') {
            $map['order_no'] = $orderNo;
        }

        $list = CommonGoodsOrderModel::PageList($map, '*', $page, $limit, 'id desc');
        return Show(SUCCESS, $list);
    }
}
