<?php
declare(strict_types=1);

namespace app\controller\product;

use app\controller\BaseCon;
use app\model\CommonIncomeClaimLogModel;

/**
 * 后台收益领取记录控制器
 * 提供收益领取记录列表查询，支持按用户、时间范围、状态、订单ID、商品ID筛选。
 */
class IncomeClaimLogCon extends BaseCon
{
    /**
     * 收益领取记录列表接口
     * 默认按ID倒序，默认每页20条。
     *
     * @return mixed
     */
    public function GetClaimLogList()
    {
        $postField = 'user_id,start_time,end_time,status,order_id,goods_id,page,limit';
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

        $orderId = (int)($post['order_id'] ?? 0);
        if ($orderId > 0) {
            $map['order_id'] = $orderId;
        }

        $goodsId = (int)($post['goods_id'] ?? 0);
        if ($goodsId > 0) {
            $map['goods_id'] = $goodsId;
        }

        $list = CommonIncomeClaimLogModel::PageList($map, '*', $page, $limit, 'id desc');
        return Show(SUCCESS, $list);
    }
}
