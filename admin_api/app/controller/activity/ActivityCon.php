<?php
declare(strict_types=1);

namespace app\controller\activity;

use app\controller\BaseCon;
use app\model\CommonLotteryPrizeModel;
use app\model\CommonPrizePoolConfigModel;
use think\exception\ValidateException;
use think\facade\Db;

class ActivityCon extends BaseCon
{
    public function GetPrizePoolConfigList()
    {
        $postField = 'page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        [$page, $limit] = $this->getPageLimit($post);

        $list = CommonPrizePoolConfigModel::where([])
            ->order('id asc')
            ->paginate([
                'list_rows' => $limit,
                'page' => $page,
                'query' => request()->param(),
            ]);

        return Show(SUCCESS, $list);
    }

    public function AddPrizePoolConfig()
    {
        $post = $this->getPrizePoolPostData();

        try {
            validate(\app\validate\ActivityValidate::class)->scene('prizePoolAdd')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $model = new CommonPrizePoolConfigModel();
        $model->save($this->buildPrizePoolSaveData($post));

        return Show(SUCCESS, ['id' => (int)$model->id], 10200);
    }

    public function UpdatePrizePoolConfig()
    {
        $post = $this->getPrizePoolPostData();

        try {
            validate(\app\validate\ActivityValidate::class)->scene('prizePoolUpdate')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $config = CommonPrizePoolConfigModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$config) {
            return Show(ERROR, [], 10202);
        }

        CommonPrizePoolConfigModel::where('id', (int)$post['id'])->update($this->buildPrizePoolSaveData($post));
        return Show(SUCCESS, [], 10201);
    }

    public function GetPrizePoolLogList()
    {
        $postField = 'user_id,prize_level,status,start_time,end_time,page,limit';
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
        $query = Db::name('common_prize_pool_log')->alias('log')->field('log.*');

        $userId = (int)($post['user_id'] ?? 0);
        if ($userId > 0) {
            $query->where('log.user_id', $userId);
        }

        $prizeLevel = $post['prize_level'] ?? '';
        if ($prizeLevel !== '' && $prizeLevel !== null && is_numeric($prizeLevel)) {
            $query->where('log.prize_level', (int)$prizeLevel);
        }

        $status = $post['status'] ?? '';
        if ($status !== '' && $status !== null && is_numeric($status)) {
            $query->where('log.status', (int)$status);
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

    public function GetLotteryPrizeList()
    {
        $postField = 'id,name,type,status,page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        [$page, $limit] = $this->getPageLimit($post);

        $query = CommonLotteryPrizeModel::where([]);

        $id = (int)($post['id'] ?? 0);
        if ($id > 0) {
            $query->where('id', $id);
        }

        $name = trim((string)($post['name'] ?? ''));
        if ($name !== '') {
            $query->whereLike('name', '%' . $name . '%');
        }

        $type = $post['type'] ?? '';
        if ($type !== '' && $type !== null && is_numeric($type)) {
            $query->where('type', (int)$type);
        }

        $status = $post['status'] ?? '';
        if ($status !== '' && $status !== null && is_numeric($status)) {
            $query->where('status', (int)$status);
        }

        $list = $query
            ->order('id asc')
            ->paginate([
                'list_rows' => $limit,
                'page' => $page,
                'query' => request()->param(),
            ]);

        return Show(SUCCESS, $list);
    }

    public function AddLotteryPrize()
    {
        $post = $this->getLotteryPrizePostData();

        try {
            validate(\app\validate\ActivityValidate::class)->scene('lotteryPrizeAdd')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $insertData = $this->buildLotteryPrizeSaveData($post);
        $insertData['create_time'] = date('Y-m-d H:i:s');

        $model = new CommonLotteryPrizeModel();
        $model->save($insertData);

        return Show(SUCCESS, ['id' => (int)$model->id], 10203);
    }

    public function UpdateLotteryPrize()
    {
        $post = $this->getLotteryPrizePostData();

        try {
            validate(\app\validate\ActivityValidate::class)->scene('lotteryPrizeUpdate')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $prize = CommonLotteryPrizeModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$prize) {
            return Show(ERROR, [], 10206);
        }

        CommonLotteryPrizeModel::where('id', (int)$post['id'])->update($this->buildLotteryPrizeSaveData($post));
        return Show(SUCCESS, [], 10204);
    }

    public function DeleteLotteryPrize()
    {
        $postField = 'id';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        try {
            validate(\app\validate\ActivityValidate::class)->scene('lotteryPrizeDelete')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $prize = CommonLotteryPrizeModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$prize) {
            return Show(ERROR, [], 10206);
        }

        CommonLotteryPrizeModel::destroy((int)$post['id']);
        return Show(SUCCESS, [], 10205);
    }

    public function GetLotteryLogList()
    {
        $postField = 'user_id,prize_type,start_time,end_time,page,limit';
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

        $query = Db::name('common_lottery_log')
            ->alias('log')
            ->leftJoin($prefix . 'common_user u', 'u.id = log.user_id')
            ->field('log.id,log.user_id,log.prize_id,log.prize_name,log.prize_type,log.amount,log.create_time,u.user_name,u.nickname,u.phone');

        $userId = (int)($post['user_id'] ?? 0);
        if ($userId > 0) {
            $query->where('log.user_id', $userId);
        }

        $prizeType = $post['prize_type'] ?? '';
        if ($prizeType !== '' && $prizeType !== null && is_numeric($prizeType)) {
            $query->where('log.prize_type', (int)$prizeType);
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

    public function GetLotteryChanceList()
    {
        $postField = 'user_id,start_time,end_time,page,limit';
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

        $query = Db::name('common_lottery_chance')
            ->alias('chance')
            ->leftJoin($prefix . 'common_user u', 'u.id = chance.user_id')
            ->field('chance.id,chance.user_id,chance.total_chance,chance.used_chance,chance.today_chance,chance.rest_chance,chance.last_spin_date,chance.update_time,chance.expire_time,chance.create_time,u.user_name,u.nickname,u.phone');

        $userId = (int)($post['user_id'] ?? 0);
        if ($userId > 0) {
            $query->where('chance.user_id', $userId);
        }

        if (!empty($startTime)) {
            $query->where('chance.update_time', '>=', $startTime);
        }

        if (!empty($endTime)) {
            $query->where('chance.update_time', '<=', $endTime);
        }

        $list = $query
            ->order('chance.id desc')
            ->paginate([
                'list_rows' => $limit,
                'page' => $page,
                'query' => request()->param(),
            ]);

        return Show(SUCCESS, $list);
    }

    protected function getPrizePoolPostData(): array
    {
        $postField = 'id,daily_amount,prize_1_amount,prize_2_amount,prize_3_amount,draw_time';
        return $this->request->only(explode(',', $postField), 'post', null);
    }

    protected function buildPrizePoolSaveData(array $post): array
    {
        return [
            'daily_amount' => (float)$post['daily_amount'],
            'prize_1_amount' => (float)$post['prize_1_amount'],
            'prize_2_amount' => (float)$post['prize_2_amount'],
            'prize_3_amount' => (float)$post['prize_3_amount'],
            'draw_time' => trim((string)$post['draw_time']),
        ];
    }

    protected function getLotteryPrizePostData(): array
    {
        $postField = 'id,name,type,amount,probability,image,status';
        return $this->request->only(explode(',', $postField), 'post', null);
    }

    protected function buildLotteryPrizeSaveData(array $post): array
    {
        return [
            'name' => trim((string)$post['name']),
            'type' => (int)$post['type'],
            'amount' => (float)$post['amount'],
            'probability' => (float)$post['probability'],
            'image' => trim((string)($post['image'] ?? '')),
            'status' => (int)$post['status'],
        ];
    }
}
