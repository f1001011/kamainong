<?php
declare(strict_types=1);

namespace app\controller\vip;

use app\controller\BaseCon;
use app\model\CommonAgentLevelConfigModel;
use app\model\CommonVipLogModel;
use app\model\CommonVipModel;
use think\exception\ValidateException;
use think\facade\Db;

class VipCon extends BaseCon
{
    public function GetVipList()
    {
        $postField = 'id,vip,page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        [$page, $limit] = $this->getPageLimit($post);

        $query = CommonVipModel::where([]);

        $id = (int)($post['id'] ?? 0);
        if ($id > 0) {
            $query->where('id', $id);
        }

        $vip = $post['vip'] ?? '';
        if ($vip !== '' && $vip !== null && is_numeric($vip)) {
            $query->where('vip', (int)$vip);
        }

        $list = $query
            ->order('vip asc, id asc')
            ->paginate([
                'list_rows' => $limit,
                'page' => $page,
                'query' => request()->param(),
            ]);

        return Show(SUCCESS, $list);
    }

    public function AddVip()
    {
        $post = $this->getVipPostData();

        try {
            validate(\app\validate\VipValidate::class)->scene('vipAdd')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $insertData = $this->buildVipSaveData($post);
        $model = new CommonVipModel();
        $model->save($insertData);

        return Show(SUCCESS, ['id' => (int)$model->id], 10180);
    }

    public function UpdateVip()
    {
        $post = $this->getVipPostData();

        try {
            validate(\app\validate\VipValidate::class)->scene('vipUpdate')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $vip = CommonVipModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$vip) {
            return Show(ERROR, [], 10183);
        }

        $updateData = $this->buildVipSaveData($post);
        CommonVipModel::where('id', (int)$post['id'])->update($updateData);

        return Show(SUCCESS, [], 10181);
    }

    public function DeleteVip()
    {
        $postField = 'id';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        try {
            validate(\app\validate\VipValidate::class)->scene('vipDelete')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $vip = CommonVipModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$vip) {
            return Show(ERROR, [], 10183);
        }

        CommonVipModel::destroy((int)$post['id']);
        return Show(SUCCESS, [], 10182);
    }

    public function GetVipLogList()
    {
        $postField = 'start_level,end_level,start_time,end_time,page,limit';
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
        $query = CommonVipLogModel::where([]);

        $startLevel = $post['start_level'] ?? '';
        if ($startLevel !== '' && $startLevel !== null && is_numeric($startLevel)) {
            $query->where('start_level', (int)$startLevel);
        }

        $endLevel = $post['end_level'] ?? '';
        if ($endLevel !== '' && $endLevel !== null && is_numeric($endLevel)) {
            $query->where('end_level', (int)$endLevel);
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

    public function GetVipDailyRewardLogList()
    {
        $postField = 'user_id,vip_level,start_time,end_time,page,limit';
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
        $prefix = (string)config('database.connections.mysql.prefix');

        $query = Db::name('common_vip_daily_reward_log')
            ->alias('log')
            ->leftJoin($prefix . 'common_user u', 'u.id = log.user_id')
            ->field('log.id,log.user_id,log.vip_level,log.reward_amount,log.claim_date,log.create_time,u.user_name,u.nickname,u.phone');

        $userId = (int)($post['user_id'] ?? 0);
        if ($userId > 0) {
            $query->where('log.user_id', $userId);
        }

        $vipLevel = $post['vip_level'] ?? '';
        if ($vipLevel !== '' && $vipLevel !== null && is_numeric($vipLevel)) {
            $query->where('log.vip_level', (int)$vipLevel);
        }

        if (!empty($startTime)) {
            $query->where('log.create_time', '>=', $startTime);
        }

        if (!empty($endTime)) {
            $query->where('log.create_time', '<=', $endTime);
        }

        $list = $query
            ->order('log.id desc')
            ->paginate([
                'list_rows' => $limit,
                'page' => $page,
                'query' => request()->param(),
            ]);

        return Show(SUCCESS, $list);
    }

    public function GetAgentLevelConfigList()
    {
        $postField = 'id,level,member_type,page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        [$page, $limit] = $this->getPageLimit($post);

        $query = CommonAgentLevelConfigModel::where([]);

        $id = (int)($post['id'] ?? 0);
        if ($id > 0) {
            $query->where('id', $id);
        }

        $level = $post['level'] ?? '';
        if ($level !== '' && $level !== null && is_numeric($level)) {
            $query->where('level', (int)$level);
        }

        $memberType = trim((string)($post['member_type'] ?? ''));
        if ($memberType !== '') {
            $query->where('member_type', $memberType);
        }

        $list = $query
            ->order('level asc, id asc')
            ->paginate([
                'list_rows' => $limit,
                'page' => $page,
                'query' => request()->param(),
            ]);

        return Show(SUCCESS, $list);
    }

    public function AddAgentLevelConfig()
    {
        $post = $this->getAgentPostData();

        try {
            validate(\app\validate\VipValidate::class)->scene('agentAdd')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $insertData = $this->buildAgentSaveData($post);
        $model = new CommonAgentLevelConfigModel();
        $model->save($insertData);

        return Show(SUCCESS, ['id' => (int)$model->id], 10184);
    }

    public function UpdateAgentLevelConfig()
    {
        $post = $this->getAgentPostData();

        try {
            validate(\app\validate\VipValidate::class)->scene('agentUpdate')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $config = CommonAgentLevelConfigModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$config) {
            return Show(ERROR, [], 10186);
        }

        $updateData = $this->buildAgentSaveData($post);
        CommonAgentLevelConfigModel::where('id', (int)$post['id'])->update($updateData);

        return Show(SUCCESS, [], 10185);
    }

    public function DeleteAgentLevelConfig()
    {
        $postField = 'id';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        try {
            validate(\app\validate\VipValidate::class)->scene('agentDelete')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $config = CommonAgentLevelConfigModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$config) {
            return Show(ERROR, [], 10186);
        }

        CommonAgentLevelConfigModel::destroy((int)$post['id']);
        return Show(SUCCESS, [], 10187);
    }

    protected function getVipPostData(): array
    {
        $postField = 'id,vip,experience,reward_money,buy_goods_id,buy_goods_num';
        return $this->request->only(explode(',', $postField), 'post', null);
    }

    protected function buildVipSaveData(array $post): array
    {
        return [
            'vip' => (int)$post['vip'],
            'experience' => (int)$post['experience'],
            'reward_money' => (float)$post['reward_money'],
            'buy_goods_id' => (int)$post['buy_goods_id'],
            'buy_goods_num' => (int)$post['buy_goods_num'],
        ];
    }

    protected function getAgentPostData(): array
    {
        $postField = 'id,level,level_name,required_members,member_type,reward_amount';
        return $this->request->only(explode(',', $postField), 'post', null);
    }

    protected function buildAgentSaveData(array $post): array
    {
        return [
            'level' => (int)$post['level'],
            'level_name' => trim((string)$post['level_name']),
            'required_members' => (int)$post['required_members'],
            'member_type' => trim((string)$post['member_type']),
            'reward_amount' => (float)$post['reward_amount'],
        ];
    }
}
