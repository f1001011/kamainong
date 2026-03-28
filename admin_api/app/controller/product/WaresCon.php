<?php
declare(strict_types=1);

namespace app\controller\product;

use app\controller\BaseCon;
use app\model\CommonWaresModel;
use think\exception\ValidateException;

/**
 * 后台兑换商品管理控制器
 * 提供兑换商品列表、新增、修改、删除功能。
 */
class WaresCon extends BaseCon
{
    /**
     * 兑换商品列表接口
     * 支持按商品ID、商品名称、状态、分类、兑换类型、创建时间范围筛选。
     *
     * @return mixed
     */
    public function GetWaresList()
    {
        $postField = 'id,wares_name,status,wares_type_id,is_type,start_time,end_time,page,limit';
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

        $query = CommonWaresModel::where([]);

        $id = (int)($post['id'] ?? 0);
        if ($id > 0) {
            $query->where('id', $id);
        }

        $waresName = trim((string)($post['wares_name'] ?? ''));
        if ($waresName !== '') {
            $query->whereLike('wares_name', '%' . $waresName . '%');
        }

        $status = $post['status'] ?? '';
        if ($status !== '' && $status !== null && is_numeric($status)) {
            $query->where('status', (int)$status);
        }

        $waresTypeId = (int)($post['wares_type_id'] ?? 0);
        if ($waresTypeId > 0) {
            $query->where('wares_type_id', $waresTypeId);
        }

        $isType = $post['is_type'] ?? '';
        if ($isType !== '' && $isType !== null && is_numeric($isType)) {
            $query->where('is_type', (int)$isType);
        }

        if (!empty($startTime)) {
            $query->where('create_time', '>=', $startTime);
        }

        if (!empty($endTime)) {
            $query->where('create_time', '<=', $endTime);
        }

        $list = $query
            ->order('sort asc, id desc')
            ->paginate([
                'list_rows' => $limit,
                'page' => $page,
                'query' => request()->param(),
            ]);

        return Show(SUCCESS, $list);
    }

    /**
     * 兑换商品新增接口
     *
     * @return mixed
     */
    public function AddWares()
    {
        $post = $this->getWaresPostData();

        try {
            $validate = validate(\app\validate\ProductValidate::class);
            $validate->scene('waresAdd')->check($this->transformWaresValidateData($post));
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $insertData = $this->buildWaresSaveData($post, false);
        $insertData['create_time'] = date('Y-m-d H:i:s');

        $model = new CommonWaresModel();
        $model->save($insertData);

        return Show(SUCCESS, ['id' => (int)$model->id], 10154);
    }

    /**
     * 兑换商品修改接口
     *
     * @return mixed
     */
    public function UpdateWares()
    {
        $post = $this->getWaresPostData();

        try {
            $validate = validate(\app\validate\ProductValidate::class);
            $validate->scene('waresUpdate')->check($this->transformWaresValidateData($post));
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $wares = CommonWaresModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$wares) {
            return Show(ERROR, [], 10156);
        }

        $updateData = $this->buildWaresSaveData($post, true);
        if (empty($updateData)) {
            return Show(ERROR, [], 10157);
        }

        CommonWaresModel::where('id', (int)$post['id'])->update($updateData);
        return Show(SUCCESS, [], 10155);
    }

    /**
     * 兑换商品删除接口
     * wares 表没有 del 字段，后台删除采用物理删除。
     *
     * @return mixed
     */
    public function DeleteWares()
    {
        $postField = 'id';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        try {
            validate(\app\validate\ProductValidate::class)->scene('waresDelete')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $wares = CommonWaresModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$wares) {
            return Show(ERROR, [], 10156);
        }

        CommonWaresModel::destroy((int)$post['id']);
        return Show(SUCCESS, [], 10158);
    }

    /**
     * 获取兑换商品表单参数
     *
     * @return array
     */
    protected function getWaresPostData(): array
    {
        $postField = 'id,wares_type_id,wares_name,wares_money,wares_spec,head_img,content,status,sort,is_type';
        return $this->request->only(explode(',', $postField), 'post', null);
    }

    /**
     * 兑换商品保存数据组装
     *
     * @param array $post 请求参数
     * @param bool $isUpdate 是否为修改
     * @return array
     */
    protected function buildWaresSaveData(array $post, bool $isUpdate): array
    {
        $fieldMap = [
            'wares_type_id', 'wares_name', 'wares_money', 'wares_spec',
            'head_img', 'content', 'status', 'sort', 'is_type',
        ];

        $data = [];
        foreach ($fieldMap as $field) {
            if (!$isUpdate || array_key_exists($field, $post)) {
                $value = $post[$field] ?? null;
                if ($isUpdate && ($value === null || $value === '')) {
                    continue;
                }

                if (in_array($field, ['wares_name', 'wares_spec', 'head_img', 'content'], true)) {
                    $data[$field] = (string)$value;
                } elseif (in_array($field, ['wares_type_id', 'status', 'sort', 'is_type'], true)) {
                    $data[$field] = (int)$value;
                } else {
                    $data[$field] = (float)$value;
                }
            }
        }

        return $data;
    }

    /**
     * 转换兑换商品验证字段。
     * 复用 ProductValidate 时，把 wares 的 status/sort 单独映射，避免与 goods 共用字段名冲突。
     *
     * @param array $post 请求参数
     * @return array
     */
    protected function transformWaresValidateData(array $post): array
    {
        $post['wares_status'] = $post['status'] ?? null;
        $post['wares_sort'] = $post['sort'] ?? null;
        return $post;
    }
}
