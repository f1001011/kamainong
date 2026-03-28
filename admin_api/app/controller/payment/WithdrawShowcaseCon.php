<?php
declare(strict_types=1);

namespace app\controller\payment;

use app\controller\BaseCon;
use app\model\CommonWithdrawCommentModel;
use app\model\CommonWithdrawLikeModel;
use app\model\CommonUserModel;
use app\model\CommonWithdrawShowcaseModel;
use think\facade\Db;

/**
 * 后台提现凭证展示控制器
 * 只负责查询展示用户上传的提现凭证，不涉及审核处理。
 */
class WithdrawShowcaseCon extends BaseCon
{
    /**
     * 提现凭证列表接口
     * 支持按用户ID、提现订单ID、状态、创建时间范围筛选。
     *
     * @return mixed
     */
    public function GetShowcaseList()
    {
        $postField = 'user_id,withdraw_id,status,start_time,end_time,page,limit';
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

        $query = CommonWithdrawShowcaseModel::where([]);

        $userId = (int)($post['user_id'] ?? 0);
        if ($userId > 0) {
            $query->where('user_id', $userId);
        }

        $withdrawId = (int)($post['withdraw_id'] ?? 0);
        if ($withdrawId > 0) {
            $query->where('withdraw_id', $withdrawId);
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

        $result = $list->toArray();
        $items = $result['data'] ?? [];
        if (!empty($items)) {
            $userIds = array_values(array_unique(array_filter(array_column($items, 'user_id'))));
            $userMap = [];
            if (!empty($userIds)) {
                $users = CommonUserModel::whereIn('id', $userIds)
                    ->field('id,user_name,nickname,phone')
                    ->select()
                    ->toArray();

                foreach ($users as $user) {
                    $userMap[(int)$user['id']] = $user;
                }
            }

            foreach ($items as &$item) {
                $userInfo = $userMap[(int)$item['user_id']] ?? [];
                $item['user_name'] = $userInfo['user_name'] ?? '';
                $item['nickname'] = $userInfo['nickname'] ?? '';
                $item['phone'] = $userInfo['phone'] ?? '';
            }

            $result['data'] = $items;
        }

        return Show(SUCCESS, $result);
    }

    public function GetShowcaseStats()
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

        $query = CommonWithdrawShowcaseModel::where([]);
        if (!empty($startTime)) {
            $query->where('create_time', '>=', $startTime);
        }
        if (!empty($endTime)) {
            $query->where('create_time', '<=', $endTime);
        }

        $summary = (clone $query)
            ->fieldRaw(
                'COUNT(*) as total_count,' .
                'COUNT(DISTINCT user_id) as user_count,' .
                'SUM(CASE WHEN status = ' . CommonWithdrawShowcaseModel::STATUS_SHOW . ' THEN 1 ELSE 0 END) as show_count,' .
                'SUM(CASE WHEN status = ' . CommonWithdrawShowcaseModel::STATUS_HIDE . ' THEN 1 ELSE 0 END) as hide_count,' .
                'COALESCE(SUM(amount), 0) as amount_total'
            )
            ->find();

        $showcaseIds = (clone $query)->column('id');
        $commentTotal = 0;
        $likeTotal = 0;
        if (!empty($showcaseIds)) {
            $commentTotal = (int)CommonWithdrawCommentModel::whereIn('showcase_id', $showcaseIds)->count();
            $likeTotal = (int)CommonWithdrawLikeModel::whereIn('showcase_id', $showcaseIds)->count();
        }

        return Show(SUCCESS, [
            'total_count' => (int)($summary['total_count'] ?? 0),
            'user_count' => (int)($summary['user_count'] ?? 0),
            'show_count' => (int)($summary['show_count'] ?? 0),
            'hide_count' => (int)($summary['hide_count'] ?? 0),
            'amount_total' => (float)($summary['amount_total'] ?? 0),
            'comment_total' => $commentTotal,
            'like_total' => $likeTotal,
        ]);
    }

    public function GetShowcaseDetail()
    {
        $postField = 'id';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        $id = (int)($post['id'] ?? 0);
        if ($id <= 0) {
            return Show(ERROR, [], 'id_required');
        }

        $detail = CommonWithdrawShowcaseModel::PageDataOne(['id' => $id]);
        if (!$detail) {
            return Show(ERROR, [], 'showcase_not_found');
        }

        $user = CommonUserModel::PageDataOne(['id' => (int)$detail['user_id']], 'id,user_name,nickname,phone');
        $detail['user_name'] = $user['user_name'] ?? '';
        $detail['nickname'] = $user['nickname'] ?? '';
        $detail['phone'] = $user['phone'] ?? '';
        $detail['like_count'] = CommonWithdrawLikeModel::where('showcase_id', $id)->count();
        $detail['comment_count'] = CommonWithdrawCommentModel::where('showcase_id', $id)->count();

        return Show(SUCCESS, $detail);
    }

    public function AddShowcase()
    {
        $postField = 'user_id,withdraw_id,voucher_image,amount,status';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        $userId = (int)($post['user_id'] ?? 0);
        $withdrawId = (int)($post['withdraw_id'] ?? 0);
        $voucherImage = trim((string)($post['voucher_image'] ?? ''));
        if ($userId <= 0 || $withdrawId <= 0 || $voucherImage === '') {
            return Show(ERROR, [], 'user_id、withdraw_id、voucher_image 必填');
        }

        $model = new CommonWithdrawShowcaseModel();
        $model->save([
            'user_id' => $userId,
            'withdraw_id' => $withdrawId,
            'voucher_image' => $voucherImage,
            'amount' => (float)($post['amount'] ?? 0),
            'status' => (int)($post['status'] ?? CommonWithdrawShowcaseModel::STATUS_SHOW),
            'create_time' => date('Y-m-d H:i:s'),
        ]);

        return Show(SUCCESS, ['id' => (int)$model->id], '展示记录已新增');
    }

    public function UpdateShowcase()
    {
        $postField = 'id,user_id,withdraw_id,voucher_image,amount,status';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        $id = (int)($post['id'] ?? 0);
        if ($id <= 0) {
            return Show(ERROR, [], 'id_required');
        }

        $showcase = CommonWithdrawShowcaseModel::PageDataOne(['id' => $id]);
        if (!$showcase) {
            return Show(ERROR, [], 'showcase_not_found');
        }

        $updateData = [];
        if (array_key_exists('user_id', $post) && $post['user_id'] !== null && $post['user_id'] !== '') {
            $updateData['user_id'] = (int)$post['user_id'];
        }
        if (array_key_exists('withdraw_id', $post) && $post['withdraw_id'] !== null && $post['withdraw_id'] !== '') {
            $updateData['withdraw_id'] = (int)$post['withdraw_id'];
        }
        if (array_key_exists('voucher_image', $post)) {
            $updateData['voucher_image'] = trim((string)$post['voucher_image']);
        }
        if (array_key_exists('amount', $post) && $post['amount'] !== null && $post['amount'] !== '') {
            $updateData['amount'] = (float)$post['amount'];
        }
        if (array_key_exists('status', $post) && $post['status'] !== null && $post['status'] !== '') {
            $updateData['status'] = (int)$post['status'];
        }

        CommonWithdrawShowcaseModel::where('id', $id)->update($updateData);
        return Show(SUCCESS, [], '展示记录已更新');
    }

    public function DeleteShowcase()
    {
        $postField = 'id';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        $id = (int)($post['id'] ?? 0);
        if ($id <= 0) {
            return Show(ERROR, [], 'id_required');
        }

        $showcase = CommonWithdrawShowcaseModel::PageDataOne(['id' => $id]);
        if (!$showcase) {
            return Show(ERROR, [], 'showcase_not_found');
        }

        CommonWithdrawCommentModel::where('showcase_id', $id)->delete();
        CommonWithdrawLikeModel::where('showcase_id', $id)->delete();
        CommonWithdrawShowcaseModel::destroy($id);
        return Show(SUCCESS, [], '展示记录已删除');
    }

    public function GetCommentList()
    {
        $postField = 'showcase_id,user_id,page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        [$page, $limit] = $this->getPageLimit($post);
        $prefix = (string)config('database.connections.mysql.prefix');

        $query = Db::name('common_withdraw_comment')
            ->alias('comment')
            ->leftJoin($prefix . 'common_user u', 'u.id = comment.user_id')
            ->field('comment.id,comment.showcase_id,comment.user_id,comment.content,comment.create_time,u.user_name,u.nickname,u.phone');

        $showcaseId = (int)($post['showcase_id'] ?? 0);
        if ($showcaseId > 0) {
            $query->where('comment.showcase_id', $showcaseId);
        }

        $userId = (int)($post['user_id'] ?? 0);
        if ($userId > 0) {
            $query->where('comment.user_id', $userId);
        }

        $list = $query
            ->order('comment.id desc')
            ->paginate([
                'list_rows' => $limit,
                'page' => $page,
                'query' => request()->param(),
            ]);

        return Show(SUCCESS, $list);
    }

    public function AddComment()
    {
        $postField = 'showcase_id,user_id,content';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        $showcaseId = (int)($post['showcase_id'] ?? 0);
        $userId = (int)($post['user_id'] ?? 0);
        $content = trim((string)($post['content'] ?? ''));
        if ($showcaseId <= 0 || $userId <= 0 || $content === '') {
            return Show(ERROR, [], 'showcase_id、user_id、content 必填');
        }

        $showcase = CommonWithdrawShowcaseModel::PageDataOne(['id' => $showcaseId]);
        if (!$showcase) {
            return Show(ERROR, [], 'showcase_not_found');
        }

        $model = new CommonWithdrawCommentModel();
        $model->save([
            'showcase_id' => $showcaseId,
            'user_id' => $userId,
            'content' => $content,
            'create_time' => date('Y-m-d H:i:s'),
        ]);

        return Show(SUCCESS, ['id' => (int)$model->id], '评论已新增');
    }

    public function UpdateComment()
    {
        $postField = 'id,content';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        $id = (int)($post['id'] ?? 0);
        $content = trim((string)($post['content'] ?? ''));
        if ($id <= 0 || $content === '') {
            return Show(ERROR, [], 'id 和 content 必填');
        }

        $comment = CommonWithdrawCommentModel::PageDataOne(['id' => $id]);
        if (!$comment) {
            return Show(ERROR, [], 'comment_not_found');
        }

        CommonWithdrawCommentModel::where('id', $id)->update(['content' => $content]);
        return Show(SUCCESS, [], '评论已更新');
    }

    public function DeleteComment()
    {
        $postField = 'id';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        $id = (int)($post['id'] ?? 0);
        if ($id <= 0) {
            return Show(ERROR, [], 'id_required');
        }

        $comment = CommonWithdrawCommentModel::PageDataOne(['id' => $id]);
        if (!$comment) {
            return Show(ERROR, [], 'comment_not_found');
        }

        CommonWithdrawCommentModel::destroy($id);
        return Show(SUCCESS, [], '评论已删除');
    }
}
