<?php
declare(strict_types=1);

namespace app\controller\config;

use app\controller\BaseCon;
use app\model\CommonSysConfigModel;
use think\exception\ValidateException;

class SysConfigCon extends BaseCon
{
    /**
     * 系统配置列表
     *
     * @return mixed
     */
    public function GetConfigList()
    {
        $postField = 'id,name,mark,page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        [$page, $limit] = $this->getPageLimit($post);

        $query = CommonSysConfigModel::where([]);

        $id = (int)($post['id'] ?? 0);
        if ($id > 0) {
            $query->where('id', $id);
        }

        $name = trim((string)($post['name'] ?? ''));
        if ($name !== '') {
            $query->whereLike('name', '%' . $name . '%');
        }

        $mark = trim((string)($post['mark'] ?? ''));
        if ($mark !== '') {
            $query->whereLike('mark', '%' . $mark . '%');
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
     * 新增系统配置
     *
     * @return mixed
     */
    public function AddConfig()
    {
        $post = $this->getConfigPostData();

        if (trim((string)($post['name'] ?? '')) === '') {
            return Show(ERROR, [], 10025);
        }

        try {
            validate(\app\validate\SysConfigValidate::class)->scene('add')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $model = new CommonSysConfigModel();
        $model->save([
            'name' => trim((string)$post['name']),
            'value' => array_key_exists('value', $post) && $post['value'] !== null ? (string)$post['value'] : '',
            'mark' => array_key_exists('mark', $post) && $post['mark'] !== null ? (string)$post['mark'] : '',
        ]);

        return Show(SUCCESS, ['id' => (int)$model->id], 10169);
    }

    /**
     * 修改系统配置
     *
     * @return mixed
     */
    public function UpdateConfig()
    {
        $post = $this->getConfigPostData();

        try {
            validate(\app\validate\SysConfigValidate::class)->scene('update')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $config = CommonSysConfigModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$config) {
            return Show(ERROR, [], 10173);
        }

        $updateData = [];

        if (array_key_exists('name', $post) && $post['name'] !== null) {
            if (trim((string)$post['name']) === '') {
                return Show(ERROR, [], 10025);
            }
            $updateData['name'] = trim((string)$post['name']);
        }

        if (array_key_exists('value', $post)) {
            $updateData['value'] = $post['value'] !== null ? (string)$post['value'] : '';
        }

        if (array_key_exists('mark', $post)) {
            $updateData['mark'] = $post['mark'] !== null ? (string)$post['mark'] : '';
        }

        if (empty($updateData)) {
            return Show(ERROR, [], 10157);
        }

        CommonSysConfigModel::where('id', (int)$post['id'])->update($updateData);
        return Show(SUCCESS, [], 10170);
    }

    /**
     * 获取系统配置提交参数
     *
     * @return array
     */
    protected function getConfigPostData(): array
    {
        $postField = 'id,name,value,mark';
        return $this->request->only(explode(',', $postField), 'post', null);
    }
}
