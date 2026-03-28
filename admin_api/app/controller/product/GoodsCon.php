<?php
declare(strict_types=1);

namespace app\controller\product;

use app\controller\BaseCon;
use app\model\CommonGoodsModel;
use think\exception\ValidateException;

/**
 * 后台商品管理控制器
 * 提供项目商品的列表、新增、修改、删除功能。
 */
class GoodsCon extends BaseCon
{
    /**
     * 商品列表接口
     * 支持按商品ID、商品名称、状态、分类、VIP等级、返利方式、创建时间范围筛选。
     *
     * @return mixed
     */
    public function GetGoodsList()
    {
        $postField = 'id,goods_name,status,goods_type_id,level_vip,red_way,start_time,end_time,page,limit';
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

        $query = CommonGoodsModel::where('del', CommonGoodsModel::DEL_NO);

        $id = (int)($post['id'] ?? 0);
        if ($id > 0) {
            $query->where('id', $id);
        }

        $goodsName = trim((string)($post['goods_name'] ?? ''));
        if ($goodsName !== '') {
            $query->whereLike('goods_name', '%' . $goodsName . '%');
        }

        $status = $post['status'] ?? '';
        if ($status !== '' && $status !== null && is_numeric($status)) {
            $query->where('status', (int)$status);
        }

        $goodsTypeId = (int)($post['goods_type_id'] ?? 0);
        if ($goodsTypeId > 0) {
            $query->where('goods_type_id', $goodsTypeId);
        }

        $levelVip = $post['level_vip'] ?? '';
        if ($levelVip !== '' && $levelVip !== null && is_numeric($levelVip)) {
            $query->where('level_vip', (int)$levelVip);
        }

        $redWay = $post['red_way'] ?? '';
        if ($redWay !== '' && $redWay !== null && is_numeric($redWay)) {
            $query->where('red_way', (int)$redWay);
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
     * 商品新增接口
     *
     * @return mixed
     */
    public function AddGoods()
    {
        $post = $this->getGoodsPostData();

        try {
            validate(\app\validate\ProductValidate::class)->scene('goodsAdd')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $insertData = $this->buildGoodsSaveData($post, false);
        $insertData['create_time'] = date('Y-m-d H:i:s');
        $insertData['del'] = CommonGoodsModel::DEL_NO;

        $model = new CommonGoodsModel();
        $model->save($insertData);

        return Show(SUCCESS, ['id' => (int)$model->id], 10150);
    }

    /**
     * 商品修改接口
     *
     * @return mixed
     */
    public function UpdateGoods()
    {
        $post = $this->getGoodsPostData();

        try {
            validate(\app\validate\ProductValidate::class)->scene('goodsUpdate')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $goods = CommonGoodsModel::PageDataOne([
            'id' => (int)$post['id'],
            'del' => CommonGoodsModel::DEL_NO,
        ]);
        if (!$goods) {
            return Show(ERROR, [], 10153);
        }

        $updateData = $this->buildGoodsSaveData($post, true);
        if (empty($updateData)) {
            return Show(ERROR, [], 10157);
        }

        CommonGoodsModel::where('id', (int)$post['id'])->update($updateData);
        return Show(SUCCESS, [], 10151);
    }

    /**
     * 商品删除接口
     * goods 表有 del 字段，后台删除采用逻辑删除。
     *
     * @return mixed
     */
    public function DeleteGoods()
    {
        $postField = 'id';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        try {
            validate(\app\validate\ProductValidate::class)->scene('goodsDelete')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $goods = CommonGoodsModel::PageDataOne([
            'id' => (int)$post['id'],
            'del' => CommonGoodsModel::DEL_NO,
        ]);
        if (!$goods) {
            return Show(ERROR, [], 10153);
        }

        CommonGoodsModel::where('id', (int)$post['id'])->update([
            'del' => CommonGoodsModel::DEL_YES,
        ]);

        return Show(SUCCESS, [], 10152);
    }

    /**
     * 获取商品表单参数
     *
     * @return array
     */
    protected function getGoodsPostData(): array
    {
        $postField = 'id,goods_type_id,goods_name,goods_money,project_scale,day_red,income_times_per_day,income_per_time,total_money,revenue_lv,period,status,red_way,warrant,head_img,bottom_img,is_examine,sort,is_coupon,progress_rate,goods_agent_1,goods_agent_2,goods_agent_3,buy_num,level_vip,minute_claim';
        return $this->request->only(explode(',', $postField), 'post', null);
    }

    /**
     * 组装商品保存数据
     *
     * @param array $post 请求参数
     * @param bool $isUpdate 是否为修改
     * @return array
     */
    protected function buildGoodsSaveData(array $post, bool $isUpdate): array
    {
        $fieldMap = [
            'goods_type_id', 'goods_name', 'goods_money', 'project_scale', 'day_red',
            'income_times_per_day', 'income_per_time', 'total_money', 'revenue_lv',
            'period', 'status', 'red_way', 'warrant', 'head_img', 'bottom_img',
            'is_examine', 'sort', 'is_coupon', 'progress_rate', 'goods_agent_1',
            'goods_agent_2', 'goods_agent_3', 'buy_num', 'level_vip', 'minute_claim',
        ];

        $data = [];
        foreach ($fieldMap as $field) {
            if (!$isUpdate || array_key_exists($field, $post)) {
                $value = $post[$field] ?? null;
                if ($isUpdate && ($value === null || $value === '')) {
                    continue;
                }

                if (in_array($field, ['goods_name', 'warrant', 'head_img', 'bottom_img'], true)) {
                    $data[$field] = trim((string)$value);
                } elseif (in_array($field, ['goods_type_id', 'income_times_per_day', 'period', 'status', 'red_way', 'is_examine', 'sort', 'is_coupon', 'buy_num', 'level_vip', 'minute_claim'], true)) {
                    $data[$field] = (int)$value;
                } else {
                    $data[$field] = (float)$value;
                }
            }
        }

        return $data;
    }
}
