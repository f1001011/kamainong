<?php
declare(strict_types=1);

namespace app\controller\task;

use app\controller\BaseCon;
use app\model\CommonTaskConfigModel;
use think\exception\ValidateException;
use think\facade\Db;

class TaskCon extends BaseCon
{
    public function GetTaskConfigList()
    {
        $postField = 'id,task_group,invite_level,status,page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        [$page, $limit] = $this->getPageLimit($post);

        $query = CommonTaskConfigModel::where([]);

        $id = (int)($post['id'] ?? 0);
        if ($id > 0) {
            $query->where('id', $id);
        }

        $taskGroup = $post['task_group'] ?? '';
        if ($taskGroup !== '' && $taskGroup !== null && is_numeric($taskGroup)) {
            $query->where('task_group', (int)$taskGroup);
        }

        $inviteLevel = trim((string)($post['invite_level'] ?? ''));
        if ($inviteLevel !== '') {
            $query->where('invite_level', $inviteLevel);
        }

        $status = $post['status'] ?? '';
        if ($status !== '' && $status !== null && is_numeric($status)) {
            $query->where('status', (int)$status);
        }

        $list = $query
            ->order('task_group asc, sort asc, id asc')
            ->paginate([
                'list_rows' => $limit,
                'page' => $page,
                'query' => request()->param(),
            ]);

        return Show(SUCCESS, $list);
    }

    public function AddTaskConfig()
    {
        $post = $this->getTaskConfigPostData();

        try {
            validate(\app\validate\TaskValidate::class)->scene('configAdd')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $model = new CommonTaskConfigModel();
        $model->save($this->buildTaskConfigSaveData($post));

        return Show(SUCCESS, ['id' => (int)$model->id], 10190);
    }

    public function UpdateTaskConfig()
    {
        $post = $this->getTaskConfigPostData();

        try {
            validate(\app\validate\TaskValidate::class)->scene('configUpdate')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $config = CommonTaskConfigModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$config) {
            return Show(ERROR, [], 10193);
        }

        CommonTaskConfigModel::where('id', (int)$post['id'])->update($this->buildTaskConfigSaveData($post));
        return Show(SUCCESS, [], 10191);
    }

    public function DeleteTaskConfig()
    {
        $postField = 'id';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        try {
            validate(\app\validate\TaskValidate::class)->scene('configDelete')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $config = CommonTaskConfigModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$config) {
            return Show(ERROR, [], 10193);
        }

        CommonTaskConfigModel::destroy((int)$post['id']);
        return Show(SUCCESS, [], 10192);
    }

    public function GetTaskProgressList()
    {
        $postField = 'user_id,task_id,task_group,is_completed,is_claimed,start_time,end_time,page,limit';
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

        $query = Db::name('common_task_progress')
            ->alias('progress')
            ->leftJoin($prefix . 'common_user u', 'u.id = progress.user_id')
            ->leftJoin($prefix . 'common_task_config task', 'task.id = progress.task_id')
            ->field('progress.id,progress.user_id,progress.task_id,progress.current_progress,progress.is_completed,progress.is_claimed,progress.completed_time,progress.claimed_time,progress.week_start_date,progress.update_time,task.task_group,task.task_name,task.invite_level,task.reward_amount,u.user_name,u.nickname,u.phone');

        $userId = (int)($post['user_id'] ?? 0);
        if ($userId > 0) {
            $query->where('progress.user_id', $userId);
        }

        $taskId = (int)($post['task_id'] ?? 0);
        if ($taskId > 0) {
            $query->where('progress.task_id', $taskId);
        }

        $taskGroup = $post['task_group'] ?? '';
        if ($taskGroup !== '' && $taskGroup !== null && is_numeric($taskGroup)) {
            $query->where('task.task_group', (int)$taskGroup);
        }

        $isCompleted = $post['is_completed'] ?? '';
        if ($isCompleted !== '' && $isCompleted !== null && is_numeric($isCompleted)) {
            $query->where('progress.is_completed', (int)$isCompleted);
        }

        $isClaimed = $post['is_claimed'] ?? '';
        if ($isClaimed !== '' && $isClaimed !== null && is_numeric($isClaimed)) {
            $query->where('progress.is_claimed', (int)$isClaimed);
        }

        if (!empty($startTime)) {
            $query->where('progress.update_time', '>=', $startTime);
        }

        if (!empty($endTime)) {
            $query->where('progress.update_time', '<=', $endTime);
        }

        $list = $query
            ->order('progress.id desc')
            ->paginate([
                'list_rows' => $limit,
                'page' => $page,
                'query' => request()->param(),
            ]);

        return Show(SUCCESS, $list);
    }

    public function GetTaskRewardLogList()
    {
        $postField = 'user_id,task_id,start_time,end_time,page,limit';
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

        $query = Db::name('common_task_reward_log')
            ->alias('log')
            ->leftJoin($prefix . 'common_user u', 'u.id = log.user_id')
            ->leftJoin($prefix . 'common_task_config task', 'task.id = log.task_id')
            ->field('log.id,log.user_id,log.task_id,log.reward_amount,log.week_start_date,log.create_time,log.task_name,task.task_group,task.invite_level,u.user_name,u.nickname,u.phone');

        $userId = (int)($post['user_id'] ?? 0);
        if ($userId > 0) {
            $query->where('log.user_id', $userId);
        }

        $taskId = (int)($post['task_id'] ?? 0);
        if ($taskId > 0) {
            $query->where('log.task_id', $taskId);
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

    public function GetTaskRewardStats()
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

        $prefix = (string)config('database.connections.mysql.prefix');
        $query = Db::name('common_task_reward_log')
            ->alias('log')
            ->leftJoin($prefix . 'common_task_config task', 'task.id = log.task_id');

        if (!empty($startTime)) {
            $query->where('log.create_time', '>=', $startTime);
        }

        if (!empty($endTime)) {
            $query->where('log.create_time', '<=', $endTime);
        }

        $summary = $query
            ->fieldRaw('COUNT(*) as total_count, COUNT(DISTINCT log.user_id) as user_count, COUNT(DISTINCT log.task_id) as task_count, COALESCE(SUM(log.reward_amount), 0) as reward_amount')
            ->find();

        return Show(SUCCESS, [
            'total_count' => (int)($summary['total_count'] ?? 0),
            'user_count' => (int)($summary['user_count'] ?? 0),
            'task_count' => (int)($summary['task_count'] ?? 0),
            'reward_amount' => (float)($summary['reward_amount'] ?? 0),
        ]);
    }

    protected function getTaskConfigPostData(): array
    {
        $postField = 'id,task_group,task_name,required_invites,invite_level,reward_amount,sort,status';
        return $this->request->only(explode(',', $postField), 'post', null);
    }

    protected function buildTaskConfigSaveData(array $post): array
    {
        return [
            'task_group' => (int)$post['task_group'],
            'task_name' => trim((string)$post['task_name']),
            'required_invites' => (int)$post['required_invites'],
            'invite_level' => trim((string)$post['invite_level']),
            'reward_amount' => (float)$post['reward_amount'],
            'sort' => (int)$post['sort'],
            'status' => (int)$post['status'],
        ];
    }
}
