<?php
declare(strict_types=1);

namespace app\controller\payment;

use app\controller\BaseCon;
use app\model\CommonPayChannelModel;
use app\model\CommonPayMoneyLogModel;
use app\model\CommonPayRechargeModel;
use app\model\CommonUserModel;
use think\exception\ValidateException;
use think\facade\Db;

/**
 * 后台充值记录控制器
 * 提供充值记录列表查询，支持按用户、时间范围、状态、渠道、订单号筛选。
 */
class PayRechargeCon extends BaseCon
{
    /**
     * 充值记录列表接口
     * 默认按ID倒序，默认每页20条。
     *
     * @return mixed
     */
    public function GetRechargeList()
    {
        $postField = 'user_id,start_time,end_time,status,channel_id,order_no,page,limit';
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

        $channelId = (int)($post['channel_id'] ?? 0);
        if ($channelId > 0) {
            $map['channel_id'] = $channelId;
        }

        $orderNo = trim((string)($post['order_no'] ?? ''));
        if ($orderNo !== '') {
            $map['order_no'] = $orderNo;
        }

        $list = CommonPayRechargeModel::PageList($map, '*', $page, $limit, 'id desc');
        return Show(SUCCESS, $list);
    }

    /**
     * 充值统计接口
     *
     * @return mixed
     */
    public function GetRechargeStats()
    {
        $postField = 'start_time,end_time';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        $startTime = $this->normalizeSearchTime($post['start_time'] ?? null);
        if (($post['start_time'] ?? '') !== '' && $startTime === false) {
            return Show(ERROR, [], 10025);
        }

        $endTime = $this->normalizeSearchTime($post['end_time'] ?? null, true);
        if (($post['end_time'] ?? '') !== '' && $endTime === false) {
            return Show(ERROR, [], 10025);
        }

        $query = CommonPayRechargeModel::where([]);
        if (!empty($startTime)) {
            $query->where('create_time', '>=', $startTime);
        }
        if (!empty($endTime)) {
            $query->where('create_time', '<=', $endTime);
        }

        $summary = $query
            ->fieldRaw(
                'COUNT(*) as total_count,' .
                'COUNT(DISTINCT uid) as user_count,' .
                'SUM(CASE WHEN status = ' . CommonPayRechargeModel::STATUS_PAY_SUCCESS . ' THEN 1 ELSE 0 END) as success_count,' .
                'SUM(CASE WHEN status IN (' . CommonPayRechargeModel::STATUS_CREATE . ',' . CommonPayRechargeModel::STATUS_WAIT_PAY . ') THEN 1 ELSE 0 END) as pending_count,' .
                'SUM(CASE WHEN status = ' . CommonPayRechargeModel::STATUS_PAY_FAIL . ' THEN 1 ELSE 0 END) as failed_count,' .
                'COALESCE(SUM(money), 0) as apply_amount,' .
                'COALESCE(SUM(CASE WHEN status = ' . CommonPayRechargeModel::STATUS_PAY_SUCCESS . ' THEN CASE WHEN COALESCE(actual_amount, 0) > 0 THEN actual_amount ELSE money END ELSE 0 END), 0) as success_amount'
            )
            ->find();

        return Show(SUCCESS, [
            'total_count' => (int)($summary['total_count'] ?? 0),
            'user_count' => (int)($summary['user_count'] ?? 0),
            'success_count' => (int)($summary['success_count'] ?? 0),
            'pending_count' => (int)($summary['pending_count'] ?? 0),
            'failed_count' => (int)($summary['failed_count'] ?? 0),
            'apply_amount' => (float)($summary['apply_amount'] ?? 0),
            'success_amount' => (float)($summary['success_amount'] ?? 0),
        ]);
    }

    /**
     * 充值订单修改接口
     * 后台可用来修正订单信息、修改渠道信息、调整订单状态。
     * 当订单状态由未到账变为已到账时，会同步给用户增加余额并写入资金流水。
     *
     * @return mixed
     */
    public function UpdateRechargeOrder()
    {
        $post = $this->getRechargePostData();

        try {
            validate(\app\validate\PaymentValidate::class)->scene('rechargeUpdate')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $order = CommonPayRechargeModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$order) {
            return Show(ERROR, [], 10160);
        }

        $updateData = $this->buildRechargeUpdateData($post);
        if (empty($updateData)) {
            return Show(ERROR, [], 10157);
        }

        $adminId = (int)($this->request->AdminID ?? $this->request->UserID ?? 0);
        $currentStatus = (int)$order['status'];
        $newStatus = array_key_exists('status', $updateData) ? (int)$updateData['status'] : $currentStatus;

        if (array_key_exists('status', $updateData) && !in_array($newStatus, [
            CommonPayRechargeModel::STATUS_CREATE,
            CommonPayRechargeModel::STATUS_WAIT_PAY,
            CommonPayRechargeModel::STATUS_PAY_SUCCESS,
            CommonPayRechargeModel::STATUS_PAY_FAIL,
        ], true)) {
            return Show(ERROR, [], 10025);
        }

        if (
            $currentStatus === CommonPayRechargeModel::STATUS_PAY_SUCCESS
            && (
                ($newStatus !== $currentStatus)
                || array_key_exists('money', $updateData)
                || array_key_exists('actual_amount', $updateData)
            )
        ) {
            return Show(ERROR, [], 10162);
        }

        if (!empty($updateData['channel_id']) && empty($updateData['channel_name'])) {
            $channel = CommonPayChannelModel::PageDataOne([
                'id' => (int)$updateData['channel_id'],
                'type' => CommonPayChannelModel::TYPE_RECHARGE,
            ]);
            if (!$channel) {
                return Show(ERROR, [], 10166);
            }

            $updateData['channel_name'] = $channel['name'];
        }

        Db::startTrans();
        try {
            if (
                $currentStatus !== CommonPayRechargeModel::STATUS_PAY_SUCCESS
                && $newStatus === CommonPayRechargeModel::STATUS_PAY_SUCCESS
            ) {
                $user = CommonUserModel::PageDataOne(['id' => (int)$order['uid']]);
                if (!$user) {
                    throw new \Exception('', 10017);
                }

                $amount = $this->resolveRechargeAmount($updateData, $order);
                if ($amount <= 0) {
                    throw new \Exception('', 10025);
                }
                $moneyBefore = (float)($user['money_balance'] ?? 0);
                $result = CommonUserModel::incMoney((int)$order['uid'], $amount);
                if (!$result) {
                    throw new \Exception('', 10163);
                }

                $moneyEnd = $moneyBefore + $amount;
                $updateData['actual_amount'] = $amount;
                $updateData['money_before'] = $moneyBefore;
                $updateData['money_end'] = $moneyEnd;
                $updateData['success_time'] = $updateData['success_time'] ?? date('Y-m-d H:i:s');
                $updateData['admin_uid'] = $adminId;

                CommonPayMoneyLogModel::recordMoneyLog(
                    (int)$order['uid'],
                    CommonPayMoneyLogModel::TYPE_INCOME,
                    CommonPayMoneyLogModel::STATUS_RECHARGE,
                    CommonPayMoneyLogModel::MONEY_TYPE_BALANCE,
                    $amount,
                    $moneyBefore,
                    $moneyEnd,
                    '管理员审核充值到账',
                    (int)$order['id']
                );
            } elseif (array_key_exists('status', $updateData)) {
                $updateData['admin_uid'] = $adminId;
                if ($newStatus === CommonPayRechargeModel::STATUS_PAY_FAIL) {
                    $updateData['success_time'] = $updateData['success_time'] ?? date('Y-m-d H:i:s');
                }
            }

            CommonPayRechargeModel::where('id', (int)$order['id'])->update($updateData);
            Db::commit();
            return Show(SUCCESS, [], 10161);
        } catch (\Throwable $e) {
            Db::rollback();
            $code = (int)$e->getCode();
            if ($code > 0) {
                return Show(ERROR, [], $code);
            }

            return Show(ERROR, [], 10163);
        }
    }

    /**
     * 获取充值订单修改参数
     *
     * @return array
     */
    protected function getRechargePostData(): array
    {
        $postField = 'id,status,money,actual_amount,channel_id,channel_name,order_no,sys_bank_id,u_bank_name,u_bank_user_name,u_bank_card,reject_reason,trilateral_order,image_url,expire_at,success_time';
        return $this->request->only(explode(',', $postField), 'post', null);
    }

    /**
     * 组装充值订单修改数据
     * 后台订单修改采用“传什么改什么”的方式，未传字段不覆盖原值。
     *
     * @param array $post 请求参数
     * @return array
     */
    protected function buildRechargeUpdateData(array $post): array
    {
        $intFields = ['status', 'channel_id'];
        $floatFields = ['money', 'actual_amount'];
        $stringFields = [
            'channel_name', 'order_no', 'sys_bank_id', 'u_bank_name',
            'u_bank_user_name', 'u_bank_card', 'reject_reason',
            'trilateral_order', 'image_url', 'expire_at', 'success_time',
        ];

        $data = [];

        foreach ($intFields as $field) {
            if (!array_key_exists($field, $post) || $post[$field] === null || $post[$field] === '') {
                continue;
            }
            $data[$field] = (int)$post[$field];
        }

        foreach ($floatFields as $field) {
            if (!array_key_exists($field, $post) || $post[$field] === null || $post[$field] === '') {
                continue;
            }
            $data[$field] = (float)$post[$field];
        }

        foreach ($stringFields as $field) {
            if (!array_key_exists($field, $post) || $post[$field] === null) {
                continue;
            }
            $data[$field] = trim((string)$post[$field]);
        }

        return $data;
    }

    /**
     * 计算充值到账金额
     * 优先使用本次传入的实际到账金额，其次使用订单原本的实际到账金额。
     * 如果都没有，则回退到订单充值金额。
     *
     * @param array $updateData 修改数据
     * @param array $order 订单原数据
     * @return float
     */
    protected function resolveRechargeAmount(array $updateData, $order): float
    {
        if (array_key_exists('actual_amount', $updateData) && (float)$updateData['actual_amount'] > 0) {
            return (float)$updateData['actual_amount'];
        }

        if ((float)($order['actual_amount'] ?? 0) > 0) {
            return (float)$order['actual_amount'];
        }

        if (array_key_exists('money', $updateData) && (float)$updateData['money'] > 0) {
            return (float)$updateData['money'];
        }

        return (float)($order['money'] ?? 0);
    }
}
