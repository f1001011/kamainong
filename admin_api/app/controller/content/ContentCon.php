<?php
declare(strict_types=1);

namespace app\controller\content;

use app\controller\BaseCon;
use app\model\CommonEmailModel;
use app\model\CommonNotificationModel;
use think\facade\Db;

class ContentCon extends BaseCon
{
    public function GetEmailList()
    {
        $postField = 'user_id,title,is_send,is_read,start_time,end_time,page,limit';
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

        $query = Db::name('common_email')
            ->alias('email')
            ->leftJoin($prefix . 'common_user u', 'u.id = email.user_id')
            ->field('email.id,email.user_id,email.title,email.content,email.is_send,email.is_read,email.send_time,email.create_time,email.update_time,u.user_name,u.nickname,u.phone');

        $userId = (int)($post['user_id'] ?? 0);
        if ($userId > 0) {
            $query->where('email.user_id', $userId);
        }

        $title = trim((string)($post['title'] ?? ''));
        if ($title !== '') {
            $query->whereLike('email.title', '%' . $title . '%');
        }

        $isSend = $post['is_send'] ?? '';
        if ($isSend !== '' && $isSend !== null && is_numeric($isSend)) {
            $query->where('email.is_send', (int)$isSend);
        }

        $isRead = $post['is_read'] ?? '';
        if ($isRead !== '' && $isRead !== null && is_numeric($isRead)) {
            $query->where('email.is_read', (int)$isRead);
        }

        if (!empty($startTime)) {
            $query->where('email.create_time', '>=', $startTime);
        }

        if (!empty($endTime)) {
            $query->where('email.create_time', '<=', $endTime);
        }

        $list = $query
            ->order('email.id desc')
            ->paginate([
                'list_rows' => $limit,
                'page' => $page,
                'query' => request()->param(),
            ]);

        return Show(SUCCESS, $list);
    }

    public function AddEmail()
    {
        $postField = 'user_id,title,content,is_send,is_read,send_time';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        $userId = (int)($post['user_id'] ?? 0);
        $title = trim((string)($post['title'] ?? ''));
        if ($userId <= 0 || $title === '') {
            return Show(ERROR, [], 'user_id 和 title 必填');
        }

        $now = date('Y-m-d H:i:s');
        $isSend = (int)($post['is_send'] ?? CommonEmailModel::IS_SEND_YES);
        $sendTime = $this->normalizeSearchTime($post['send_time'] ?? null);
        if (($post['send_time'] ?? '') !== '' && $sendTime === false) {
            return Show(ERROR, [], 10025);
        }

        $model = new CommonEmailModel();
        $model->save([
            'user_id' => $userId,
            'title' => $title,
            'content' => trim((string)($post['content'] ?? '')),
            'is_send' => $isSend,
            'is_read' => (int)($post['is_read'] ?? CommonEmailModel::IS_READ_NO),
            'send_time' => $isSend === CommonEmailModel::IS_SEND_YES ? ($sendTime ?: $now) : null,
            'create_time' => $now,
            'update_time' => $now,
        ]);

        return Show(SUCCESS, ['id' => (int)$model->id], '邮件已新增');
    }

    public function UpdateEmail()
    {
        $postField = 'id,user_id,title,content,is_send,is_read,send_time';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        $id = (int)($post['id'] ?? 0);
        if ($id <= 0) {
            return Show(ERROR, [], 'id_required');
        }

        $email = CommonEmailModel::PageDataOne(['id' => $id]);
        if (!$email) {
            return Show(ERROR, [], 'email_not_found');
        }

        $updateData = [];
        if (array_key_exists('user_id', $post) && $post['user_id'] !== null && $post['user_id'] !== '') {
            $updateData['user_id'] = (int)$post['user_id'];
        }
        if (array_key_exists('title', $post)) {
            $updateData['title'] = trim((string)$post['title']);
        }
        if (array_key_exists('content', $post)) {
            $updateData['content'] = trim((string)$post['content']);
        }
        if (array_key_exists('is_send', $post) && $post['is_send'] !== null && $post['is_send'] !== '') {
            $updateData['is_send'] = (int)$post['is_send'];
        }
        if (array_key_exists('is_read', $post) && $post['is_read'] !== null && $post['is_read'] !== '') {
            $updateData['is_read'] = (int)$post['is_read'];
        }
        if (array_key_exists('send_time', $post)) {
            $sendTime = $this->normalizeSearchTime($post['send_time'] ?? null);
            if (($post['send_time'] ?? '') !== '' && $sendTime === false) {
                return Show(ERROR, [], 10025);
            }
            $updateData['send_time'] = $sendTime;
        }

        if (isset($updateData['title']) && $updateData['title'] === '') {
            return Show(ERROR, [], 'title_required');
        }

        if (isset($updateData['user_id']) && $updateData['user_id'] <= 0) {
            return Show(ERROR, [], 'user_id_required');
        }

        if (($updateData['is_send'] ?? (int)$email['is_send']) === CommonEmailModel::IS_SEND_YES && empty($updateData['send_time']) && empty($email['send_time'])) {
            $updateData['send_time'] = date('Y-m-d H:i:s');
        }

        $updateData['update_time'] = date('Y-m-d H:i:s');
        CommonEmailModel::where('id', $id)->update($updateData);

        return Show(SUCCESS, [], '邮件已更新');
    }

    public function SendEmail()
    {
        $postField = 'id';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        $id = (int)($post['id'] ?? 0);
        if ($id <= 0) {
            return Show(ERROR, [], 'id_required');
        }

        $email = CommonEmailModel::PageDataOne(['id' => $id]);
        if (!$email) {
            return Show(ERROR, [], 'email_not_found');
        }

        $now = date('Y-m-d H:i:s');
        CommonEmailModel::where('id', $id)->update([
            'is_send' => CommonEmailModel::IS_SEND_YES,
            'send_time' => $now,
            'update_time' => $now,
        ]);

        return Show(SUCCESS, [], '邮件已发送');
    }

    public function DeleteEmail()
    {
        $postField = 'id';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        $id = (int)($post['id'] ?? 0);
        if ($id <= 0) {
            return Show(ERROR, [], 'id_required');
        }

        $email = CommonEmailModel::PageDataOne(['id' => $id]);
        if (!$email) {
            return Show(ERROR, [], 'email_not_found');
        }

        CommonEmailModel::destroy($id);
        return Show(SUCCESS, [], '邮件已删除');
    }

    public function GetNotificationList()
    {
        $postField = 'uid,title,type,is_read,start_time,end_time,page,limit';
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

        $query = Db::name('common_notification')
            ->alias('notice')
            ->leftJoin($prefix . 'common_user u', 'u.id = notice.uid')
            ->field('notice.id,notice.uid,notice.type,notice.title,notice.content,notice.is_read,notice.create_time,u.user_name,u.nickname,u.phone');

        $uid = (int)($post['uid'] ?? 0);
        if ($uid > 0) {
            $query->where('notice.uid', $uid);
        }

        $title = trim((string)($post['title'] ?? ''));
        if ($title !== '') {
            $query->whereLike('notice.title', '%' . $title . '%');
        }

        $type = $post['type'] ?? '';
        if ($type !== '' && $type !== null && is_numeric($type)) {
            $query->where('notice.type', (int)$type);
        }

        $isRead = $post['is_read'] ?? '';
        if ($isRead !== '' && $isRead !== null && is_numeric($isRead)) {
            $query->where('notice.is_read', (int)$isRead);
        }

        if (!empty($startTime)) {
            $query->where('notice.create_time', '>=', strtotime($startTime));
        }

        if (!empty($endTime)) {
            $query->where('notice.create_time', '<=', strtotime($endTime));
        }

        $list = $query
            ->order('notice.id desc')
            ->paginate([
                'list_rows' => $limit,
                'page' => $page,
                'query' => request()->param(),
            ]);

        $result = $list->toArray();
        foreach (($result['data'] ?? []) as &$item) {
            $item['create_time'] = !empty($item['create_time']) ? date('Y-m-d H:i:s', (int)$item['create_time']) : '';
        }

        return Show(SUCCESS, $result);
    }

    public function AddNotification()
    {
        $postField = 'uid,type,title,content,is_read';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        $uid = (int)($post['uid'] ?? 0);
        $title = trim((string)($post['title'] ?? ''));
        if ($uid <= 0 || $title === '') {
            return Show(ERROR, [], 'uid 和 title 必填');
        }

        $model = new CommonNotificationModel();
        $model->save([
            'uid' => $uid,
            'type' => (int)($post['type'] ?? 1),
            'title' => $title,
            'content' => trim((string)($post['content'] ?? '')),
            'is_read' => (int)($post['is_read'] ?? CommonNotificationModel::IS_READ_NO),
            'create_time' => time(),
        ]);

        return Show(SUCCESS, ['id' => (int)$model->id], '通知已发送');
    }

    public function UpdateNotification()
    {
        $postField = 'id,uid,type,title,content,is_read';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        $id = (int)($post['id'] ?? 0);
        if ($id <= 0) {
            return Show(ERROR, [], 'id_required');
        }

        $notification = CommonNotificationModel::PageDataOne(['id' => $id]);
        if (!$notification) {
            return Show(ERROR, [], 'notification_not_found');
        }

        $updateData = [];
        if (array_key_exists('uid', $post) && $post['uid'] !== null && $post['uid'] !== '') {
            $updateData['uid'] = (int)$post['uid'];
        }
        if (array_key_exists('type', $post) && $post['type'] !== null && $post['type'] !== '') {
            $updateData['type'] = (int)$post['type'];
        }
        if (array_key_exists('title', $post)) {
            $updateData['title'] = trim((string)$post['title']);
        }
        if (array_key_exists('content', $post)) {
            $updateData['content'] = trim((string)$post['content']);
        }
        if (array_key_exists('is_read', $post) && $post['is_read'] !== null && $post['is_read'] !== '') {
            $updateData['is_read'] = (int)$post['is_read'];
        }

        if (isset($updateData['uid']) && $updateData['uid'] <= 0) {
            return Show(ERROR, [], 'uid_required');
        }

        if (isset($updateData['title']) && $updateData['title'] === '') {
            return Show(ERROR, [], 'title_required');
        }

        CommonNotificationModel::where('id', $id)->update($updateData);
        return Show(SUCCESS, [], '通知已更新');
    }

    public function DeleteNotification()
    {
        $postField = 'id';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        $id = (int)($post['id'] ?? 0);
        if ($id <= 0) {
            return Show(ERROR, [], 'id_required');
        }

        $notification = CommonNotificationModel::PageDataOne(['id' => $id]);
        if (!$notification) {
            return Show(ERROR, [], 'notification_not_found');
        }

        CommonNotificationModel::destroy($id);
        return Show(SUCCESS, [], '通知已删除');
    }
}
