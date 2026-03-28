<?php
declare(strict_types=1);

namespace app\controller\payment;

use app\controller\BaseCon;
use app\model\CommonPayChannelModel;
use app\model\CommonPayCashModel;
use app\model\CommonPayMoneyLogModel;
use app\model\CommonUserModel;
use think\exception\ValidateException;
use think\facade\Db;

/**
 * 后台提现记录控制器
 * 提供提现记录列表查询，支持按用户、时间范围、状态、渠道、订单号筛选。
 */
class PayCashCon extends BaseCon
{
    /**
     * 提现记录列表接口
     * 默认按ID倒序，默认每页20条。
     *
     * @return mixed
     */
    public function GetCashList()
    {
        $postField = 'user_id,start_time,end_time,status,channel_id,order_on,page,limit';
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
            $map['u_id'] = $userId;
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

        $orderOn = trim((string)($post['order_on'] ?? ''));
        if ($orderOn !== '') {
            $map['order_on'] = $orderOn;
        }

        $list = CommonPayCashModel::PageList($map, '*', $page, $limit, 'id desc');
        return Show(SUCCESS, $list);
    }

    /**
     * 提现统计接口
     *
     * @return mixed
     */
    public function GetCashStats()
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

        $query = CommonPayCashModel::where([]);
        if (!empty($startTime)) {
            $query->where('create_time', '>=', $startTime);
        }
        if (!empty($endTime)) {
            $query->where('create_time', '<=', $endTime);
        }

        $summary = $query
            ->fieldRaw(
                'COUNT(*) as total_count,' .
                'COUNT(DISTINCT u_id) as user_count,' .
                'SUM(CASE WHEN status = ' . CommonPayCashModel::STATUS_APPLY . ' THEN 1 ELSE 0 END) as applying_count,' .
                'SUM(CASE WHEN status = ' . CommonPayCashModel::STATUS_SUCCESS . ' THEN 1 ELSE 0 END) as success_count,' .
                'SUM(CASE WHEN status = ' . CommonPayCashModel::STATUS_REJECT . ' THEN 1 ELSE 0 END) as reject_count,' .
                'COALESCE(SUM(money), 0) as apply_amount,' .
                'COALESCE(SUM(CASE WHEN status = ' . CommonPayCashModel::STATUS_SUCCESS . ' THEN CASE WHEN COALESCE(actual_amount, 0) > 0 THEN actual_amount WHEN COALESCE(money_actual, 0) > 0 THEN money_actual ELSE money END ELSE 0 END), 0) as success_amount,' .
                'COALESCE(SUM(CASE WHEN status = ' . CommonPayCashModel::STATUS_SUCCESS . ' THEN CASE WHEN COALESCE(fee, 0) > 0 THEN fee ELSE COALESCE(money_fee, 0) END ELSE 0 END), 0) as fee_amount'
            )
            ->find();

        return Show(SUCCESS, [
            'total_count' => (int)($summary['total_count'] ?? 0),
            'user_count' => (int)($summary['user_count'] ?? 0),
            'applying_count' => (int)($summary['applying_count'] ?? 0),
            'success_count' => (int)($summary['success_count'] ?? 0),
            'reject_count' => (int)($summary['reject_count'] ?? 0),
            'apply_amount' => (float)($summary['apply_amount'] ?? 0),
            'success_amount' => (float)($summary['success_amount'] ?? 0),
            'fee_amount' => (float)($summary['fee_amount'] ?? 0),
        ]);
    }

    /**
     * 提现订单修改接口
     * 后台可用来修正提现订单信息、渠道信息、审核状态。
     * 当提现状态从申请中改为拒绝时，会把提现金额退回用户余额并写入资金流水。
     *
     * @return mixed
     */
    public function UpdateCashOrder()
    {
        $post = $this->getCashPostData();

        try {
            validate(\app\validate\PaymentValidate::class)->scene('cashUpdate')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $order = CommonPayCashModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$order) {
            return Show(ERROR, [], 10164);
        }

        $updateData = $this->buildCashUpdateData($post);
        if (empty($updateData)) {
            return Show(ERROR, [], 10157);
        }

        $adminId = (int)($this->request->AdminID ?? $this->request->UserID ?? 0);
        $currentStatus = (int)$order['status'];
        $newStatus = array_key_exists('status', $updateData) ? (int)$updateData['status'] : $currentStatus;

        if (array_key_exists('status', $updateData) && !in_array($newStatus, [
            CommonPayCashModel::STATUS_APPLY,
            CommonPayCashModel::STATUS_SUCCESS,
            CommonPayCashModel::STATUS_REJECT,
        ], true)) {
            return Show(ERROR, [], 10025);
        }

        if (
            $currentStatus !== CommonPayCashModel::STATUS_APPLY
            && $newStatus !== $currentStatus
        ) {
            return Show(ERROR, [], 10165);
        }

        if (
            $currentStatus !== CommonPayCashModel::STATUS_APPLY
            && (array_key_exists('money', $updateData) || array_key_exists('actual_amount', $updateData))
        ) {
            return Show(ERROR, [], 10165);
        }

        if (!empty($updateData['channel_id']) && empty($updateData['channel_name'])) {
            $channel = CommonPayChannelModel::PageDataOne([
                'id' => (int)$updateData['channel_id'],
                'type' => CommonPayChannelModel::TYPE_WITHDRAW,
            ]);
            if (!$channel) {
                return Show(ERROR, [], 10166);
            }

            $updateData['channel_name'] = $channel['name'];
        }

        Db::startTrans();
        try {
            if (
                $currentStatus === CommonPayCashModel::STATUS_APPLY
                && $newStatus === CommonPayCashModel::STATUS_REJECT
            ) {
                $user = CommonUserModel::PageDataOne(['id' => (int)$order['u_id']]);
                if (!$user) {
                    throw new \Exception('', 10017);
                }

                $refundAmount = $this->resolveCashRefundAmount($updateData, $order);
                if ($refundAmount <= 0) {
                    throw new \Exception('', 10025);
                }
                $moneyBefore = (float)($user['money_balance'] ?? 0);
                $result = CommonUserModel::incMoney((int)$order['u_id'], $refundAmount);
                if (!$result) {
                    throw new \Exception('', 10168);
                }

                $moneyEnd = $moneyBefore + $refundAmount;
                $updateData['admin_uid'] = $adminId;
                $updateData['success_time'] = $updateData['success_time'] ?? date('Y-m-d H:i:s');
                $updateData['money_before'] = $moneyBefore;
                $updateData['money_end'] = $moneyEnd;

                CommonPayMoneyLogModel::recordMoneyLog(
                    (int)$order['u_id'],
                    CommonPayMoneyLogModel::TYPE_INCOME,
                    CommonPayMoneyLogModel::STATUS_WITHDRAW_REJECT_REFUND,
                    CommonPayMoneyLogModel::MONEY_TYPE_BALANCE,
                    $refundAmount,
                    $moneyBefore,
                    $moneyEnd,
                    '管理员拒绝提现，余额退回',
                    (int)$order['id']
                );
            } elseif (
                $currentStatus === CommonPayCashModel::STATUS_APPLY
                && $newStatus === CommonPayCashModel::STATUS_SUCCESS
            ) {
                $updateData['admin_uid'] = $adminId;
                $updateData['success_time'] = $updateData['success_time'] ?? date('Y-m-d H:i:s');
            } elseif (array_key_exists('status', $updateData)) {
                $updateData['admin_uid'] = $adminId;
            }

            CommonPayCashModel::where('id', (int)$order['id'])->update($updateData);
            Db::commit();
            return Show(SUCCESS, [], 10167);
        } catch (\Throwable $e) {
            Db::rollback();
            $code = (int)$e->getCode();
            if ($code > 0) {
                return Show(ERROR, [], $code);
            }

            return Show(ERROR, [], 10168);
        }
    }

    /**
     * 获取提现订单修改参数
     *
     * @return array
     */
    protected function getCashPostData(): array
    {
        $postField = 'id,status,money,fee,actual_amount,channel_id,channel_name,order_on,pay_type,u_bank_name,u_back_card,u_back_user_name,reject_reason,trilateral_order,success_time,msg,is_status';
        return $this->request->only(explode(',', $postField), 'post', null);
    }

    /**
     * 组装提现订单修改数据
     * 提现订单支持后台按字段单独修正，不传的字段不覆盖。
     *
     * @param array $post 请求参数
     * @return array
     */
    protected function buildCashUpdateData(array $post): array
    {
        $intFields = ['status', 'channel_id', 'is_status'];
        $floatFields = ['money', 'fee', 'actual_amount'];
        $stringFields = [
            'channel_name', 'order_on', 'pay_type', 'u_bank_name', 'u_back_card',
            'u_back_user_name', 'reject_reason', 'trilateral_order',
            'success_time', 'msg',
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
     * 计算提现拒绝时的退回金额
     * 默认退回提现申请金额 money，因为用户提交提现时通常冻结或扣减的是申请金额。
     *
     * @param array $updateData 修改数据
     * @param array $order 订单原数据
     * @return float
     */
    protected function resolveCashRefundAmount(array $updateData, $order): float
    {
        if (array_key_exists('money', $updateData) && (float)$updateData['money'] > 0) {
            return (float)$updateData['money'];
        }

        return (float)($order['money'] ?? 0);
    }
}
