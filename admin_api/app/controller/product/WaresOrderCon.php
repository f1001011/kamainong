<?php
declare(strict_types=1);

namespace app\controller\product;

use app\controller\BaseCon;
use app\model\CommonWaresOrderModel;

/**
 * 后台积分商品订单控制器
 * 提供积分商品订单列表查询，支持按用户、时间范围、状态、商品ID、订单号筛选。
 */
class WaresOrderCon extends BaseCon
{
    /**
     * 积分商品订单列表接口
     * 默认按ID倒序，默认每页20条。
     *
     * @return mixed
     */
    public function GetWaresOrderList()
    {
        $postField = 'user_id,start_time,end_time,status,wares_id,wares_no,page,limit';
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
            $map['uid'] = $userId;
        }

        $this->appendTimeRange($map, 'create_time', $startTime ?: null, $endTime ?: null);

        $status = $post['status'] ?? '';
        if ($status !== '' && $status !== null && is_numeric($status)) {
            $map['status'] = (int)$status;
        }

        $waresId = (int)($post['wares_id'] ?? 0);
        if ($waresId > 0) {
            $map['wares_id'] = $waresId;
        }

        $waresNo = trim((string)($post['wares_no'] ?? ''));
        if ($waresNo !== '') {
            $map['wares_no'] = $waresNo;
        }

        $list = CommonWaresOrderModel::PageList($map, '*', $page, $limit, 'id desc');
        return Show(SUCCESS, $list);
    }
}
