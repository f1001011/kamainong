<?php
declare(strict_types=1);

namespace app\controller\payment;

use app\controller\BaseCon;
use app\model\CommonPayChannelModel;
use think\exception\ValidateException;

/**
 * 后台支付渠道控制器
 * 统一管理充值渠道和提现渠道的配置参数。
 */
class PayChannelCon extends BaseCon
{
    /**
     * 支付渠道列表接口
     * 支持按渠道ID、渠道类型、渠道名称、状态、创建时间范围筛选。
     *
     * @return mixed
     */
    public function GetChannelList()
    {
        $postField = 'id,type,name,status,start_time,end_time,page,limit';
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

        $query = CommonPayChannelModel::where([]);

        $id = (int)($post['id'] ?? 0);
        if ($id > 0) {
            $query->where('id', $id);
        }

        $type = $post['type'] ?? '';
        if ($type !== '' && $type !== null && is_numeric($type)) {
            $query->where('type', (int)$type);
        }

        $name = trim((string)($post['name'] ?? ''));
        if ($name !== '') {
            $query->whereLike('name', '%' . $name . '%');
        }

        $status = $post['status'] ?? '';
        if ($status !== '' && $status !== null && is_numeric($status)) {
            $query->where('status', (int)$status);
        }

        if (!empty($startTime)) {
            $query->where('create_time', '>=', $startTime);
        }

        if (!empty($endTime)) {
            $query->where('create_time', '<=', $endTime);
        }

        $list = $query
            ->order('id desc')
            ->paginate([
                'list_rows' => $limit,
                'page' => $page,
                'query' => request()->param(),
            ]);

        return Show(SUCCESS, $list);
    }

    /**
     * 支付渠道新增接口
     *
     * @return mixed
     */
    public function AddChannel()
    {
        $post = $this->getChannelPostData();
        $post['channel_status'] = $post['status'] ?? null;

        if (
            ($post['type'] ?? null) === null || ($post['type'] ?? '') === ''
            || trim((string)($post['name'] ?? '')) === ''
            || ($post['json_value'] ?? null) === null
            || ($post['status'] ?? null) === null || ($post['status'] ?? '') === ''
        ) {
            return Show(ERROR, [], 10025);
        }

        try {
            validate(\app\validate\PaymentValidate::class)->scene('channelAdd')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $model = new CommonPayChannelModel();
        $model->save([
            'type' => (int)$post['type'],
            'name' => trim((string)$post['name']),
            'json_value' => (string)$post['json_value'],
            'status' => (int)$post['status'],
            'create_time' => date('Y-m-d H:i:s'),
        ]);

        return Show(SUCCESS, ['id' => (int)$model->id], 10169);
    }

    /**
     * 支付渠道修改接口
     * 渠道配置主要维护名称、上下架状态、json 参数内容。
     *
     * @return mixed
     */
    public function UpdateChannel()
    {
        $post = $this->getChannelPostData();
        $post['channel_status'] = $post['status'] ?? null;

        try {
            validate(\app\validate\PaymentValidate::class)->scene('channelUpdate')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $channel = CommonPayChannelModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$channel) {
            return Show(ERROR, [], 10173);
        }

        $updateData = [];

        if (array_key_exists('type', $post) && $post['type'] !== null && $post['type'] !== '') {
            $updateData['type'] = (int)$post['type'];
        }

        if (array_key_exists('name', $post) && $post['name'] !== null) {
            $updateData['name'] = trim((string)$post['name']);
        }

        if (array_key_exists('json_value', $post) && $post['json_value'] !== null) {
            $updateData['json_value'] = (string)$post['json_value'];
        }

        if (array_key_exists('status', $post) && $post['status'] !== null && $post['status'] !== '') {
            $updateData['status'] = (int)$post['status'];
        }

        if (empty($updateData)) {
            return Show(ERROR, [], 10157);
        }

        if (isset($updateData['type']) && !in_array((int)$updateData['type'], [
            CommonPayChannelModel::TYPE_RECHARGE,
            CommonPayChannelModel::TYPE_WITHDRAW,
        ], true)) {
            return Show(ERROR, [], 10025);
        }

        CommonPayChannelModel::where('id', (int)$post['id'])->update($updateData);
        return Show(SUCCESS, [], 10170);
    }

    /**
     * 支付渠道删除接口
     *
     * @return mixed
     */
    public function DeleteChannel()
    {
        $postField = 'id';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        try {
            validate(\app\validate\PaymentValidate::class)->scene('channelDelete')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $channel = CommonPayChannelModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$channel) {
            return Show(ERROR, [], 10173);
        }

        CommonPayChannelModel::destroy((int)$post['id']);
        return Show(SUCCESS, [], 10171);
    }

    /**
     * 获取支付渠道参数
     *
     * @return array
     */
    protected function getChannelPostData(): array
    {
        $postField = 'id,type,name,json_value,status';
        return $this->request->only(explode(',', $postField), 'post', null);
    }
}
