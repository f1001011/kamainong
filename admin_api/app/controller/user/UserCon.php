<?php
declare(strict_types=1);

namespace app\controller\user;

use app\controller\BaseCon;
use app\model\CommonPayMoneyLogModel;
use app\model\CommonUserModel;
use think\exception\ValidateException;
use think\facade\Db;

/**
 * 后台用户管理控制器
 * 负责处理用户列表展示、基础信息修改、状态切换、余额调整、积分调整等后台操作。
 */
class UserCon extends BaseCon
{
    /**
     * 用户列表接口
     * 支持按用户ID、账号、手机号、VIP等级、冻结状态、在线状态、注册时间范围筛选。
     * 默认按ID倒序，默认每页20条。
     *
     * @return mixed
     */
    public function GetUserList()
    {
        $postField = 'user_id,user_name,phone,level_vip,status,state,start_time,end_time,page,limit';
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

        $query = CommonUserModel::where([]);

        $userId = (int)($post['user_id'] ?? 0);
        if ($userId > 0) {
            $query->where('id', $userId);
        }

        $userName = trim((string)($post['user_name'] ?? ''));
        if ($userName !== '') {
            $query->whereLike('user_name', '%' . $userName . '%');
        }

        $phone = trim((string)($post['phone'] ?? ''));
        if ($phone !== '') {
            $query->whereLike('phone', '%' . $phone . '%');
        }

        $levelVip = $post['level_vip'] ?? '';
        if ($levelVip !== '' && $levelVip !== null && is_numeric($levelVip)) {
            $query->where('level_vip', '>=', (int)$levelVip);
        }

        $status = $post['status'] ?? '';
        if ($status !== '' && $status !== null && is_numeric($status)) {
            $query->where('status', (int)$status);
        }

        $state = $post['state'] ?? '';
        if ($state !== '' && $state !== null && is_numeric($state)) {
            $query->where('state', (int)$state);
        }

        if (!empty($startTime)) {
            $query->where('create_time', '>=', $startTime);
        }

        if (!empty($endTime)) {
            $query->where('create_time', '<=', $endTime);
        }

        $field = 'id,user_no,user_name,nickname,phone,pwd,status,state,level_vip,current_experience,money_balance,money_integral,money_team,total_recharge,total_withdraw,total_red,is_real_name,is_fictitious,is_withdraw,agent_id_1,agent_id_2,agent_id_3,create_time';
        $list = $query
            ->field($field)
            ->order('id desc')
            ->paginate([
                'list_rows' => $limit,
                'page' => $page,
                'query' => request()->param(),
            ]);

        $list->each(function ($item) {
            $item['pwd_text'] = $this->decodePasswordForDisplay((string)($item['pwd'] ?? ''));
            return $item;
        });

        return Show(SUCCESS, $list);
    }


    /**
     * 将用户密码转为后台展示可读文本。
     * 优先兼容当前使用的 ShiftEncode；若遇到旧数据为 md5，则保留原值展示。
     */
    private function decodePasswordForDisplay(string $pwd): string
    {
        if ($pwd === '') {
            return '';
        }

        // 兼容旧库中可能遗留的 md5 密码
        if (preg_match('/^[a-f0-9]{32}$/i', $pwd)) {
            return $pwd;
        }

        $decoded = base64_decode($pwd, true);
        if ($decoded === false) {
            return $pwd;
        }

        $result = ShiftDecode($pwd);

        // 避免异常编码结果直接污染展示
        if (!mb_check_encoding($result, 'UTF-8') && !preg_match('/^[\x20-\x7E]+$/', $result)) {
            return $pwd;
        }

        return $result;
    }

    /**
     * 用户基础信息修改接口
     * 支持单独修改账号、手机号、昵称、VIP等级、登录密码。
     * 传了哪个字段就修改哪个字段，不要求一次性全部传入。
     *
     * @return mixed
     */
    public function UpdateBaseInfo()
    {
        $postField = 'id,user_name,phone,nickname,level_vip,pwd';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        try {
            validate(\app\validate\UserValidate::class)->scene('updateBase')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $user = CommonUserModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$user) {
            return Show(ERROR, [], 10017);
        }

        $updateData = [];

        $userName = trim((string)($post['user_name'] ?? ''));
        if ($userName !== '') {
            $updateData['user_name'] = $userName;
        }

        $phone = trim((string)($post['phone'] ?? ''));
        if ($phone !== '') {
            $existsPhone = CommonUserModel::where('phone', $phone)
                ->where('id', '<>', (int)$post['id'])
                ->find();
            if ($existsPhone) {
                return Show(ERROR, [], 10007);
            }
            $updateData['phone'] = $phone;
        }

        $nickname = trim((string)($post['nickname'] ?? ''));
        if ($nickname !== '') {
            $updateData['nickname'] = $nickname;
        }

        $levelVip = $post['level_vip'] ?? '';
        if ($levelVip !== '' && $levelVip !== null && is_numeric($levelVip)) {
            $updateData['level_vip'] = (int)$levelVip;
        }

        $pwd = (string)($post['pwd'] ?? '');
        if ($pwd !== '') {
            // 后台修改用户密码时，使用与前台注册/登录一致的 ShiftEncode 加密方式。
            $updateData['pwd'] = ShiftEncode($pwd);
        }

        if (empty($updateData)) {
            return Show(ERROR, [], 10137);
        }

        CommonUserModel::where('id', (int)$post['id'])->update($updateData);
        return Show(SUCCESS, [], 10130);
    }

    /**
     * 用户冻结状态修改接口
     * 前端可做成单独按钮切换，仅修改 common_user.status。
     *
     * @return mixed
     */
    public function UpdateStatus()
    {
        $postField = 'id,status';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        try {
            validate(\app\validate\UserValidate::class)->scene('updateStatus')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $user = CommonUserModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$user) {
            return Show(ERROR, [], 10017);
        }

        CommonUserModel::where('id', (int)$post['id'])->update([
            'status' => (int)$post['status'],
        ]);

        return Show(SUCCESS, [], 10131);
    }

    /**
     * 用户在线状态修改接口
     * 前端可做成单独按钮切换，仅修改 common_user.state。
     *
     * @return mixed
     */
    public function UpdateState()
    {
        $postField = 'id,state';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        try {
            validate(\app\validate\UserValidate::class)->scene('updateState')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $user = CommonUserModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$user) {
            return Show(ERROR, [], 10017);
        }

        CommonUserModel::where('id', (int)$post['id'])->update([
            'state' => (int)$post['state'],
        ]);

        return Show(SUCCESS, [], 10132);
    }

    /**
     * 用户余额修改接口
     * 支持管理员通过 action=inc 或 dec 单独增加/扣除余额，并同步写入资金流水。
     *
     * @return mixed
     */
    public function UpdateBalance()
    {
        $postField = 'id,action,amount';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        try {
            validate(\app\validate\UserValidate::class)->scene('updateBalance')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $user = CommonUserModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$user) {
            return Show(ERROR, [], 10017);
        }

        $adminId = (int)($this->request->UserID ?? 0);
        $amount = (float)$post['amount'];
        $action = (string)$post['action'];

        Db::startTrans();
        try {
            $moneyBefore = (float)($user['money_balance'] ?? 0);

            if ($action === 'inc') {
                $result = CommonUserModel::incMoney((int)$post['id'], $amount);
                if (!$result) {
                    throw new \Exception('', 10135);
                }

                $moneyEnd = $moneyBefore + $amount;
                CommonPayMoneyLogModel::recordMoneyLog(
                    (int)$post['id'],
                    CommonPayMoneyLogModel::TYPE_INCOME,
                    CommonPayMoneyLogModel::STATUS_ADMIN_INC_BALANCE,
                    CommonPayMoneyLogModel::MONEY_TYPE_BALANCE,
                    $amount,
                    $moneyBefore,
                    $moneyEnd,
                    '管理员增加余额',
                    $adminId
                );
            } else {
                $result = CommonUserModel::decMoney((int)$post['id'], $amount);
                if (!$result) {
                    throw new \Exception('', 10135);
                }

                $moneyEnd = $moneyBefore - $amount;
                CommonPayMoneyLogModel::recordMoneyLog(
                    (int)$post['id'],
                    CommonPayMoneyLogModel::TYPE_EXPEND,
                    CommonPayMoneyLogModel::STATUS_ADMIN_DEC_BALANCE,
                    CommonPayMoneyLogModel::MONEY_TYPE_BALANCE,
                    $amount,
                    $moneyBefore,
                    $moneyEnd,
                    '管理员扣除余额',
                    $adminId
                );
            }

            Db::commit();
            return Show(SUCCESS, ['money_before' => $moneyBefore, 'money_end' => $moneyEnd], 10133);
        } catch (\Throwable $e) {
            Db::rollback();
            $code = (int)$e->getCode();
            if ($code > 0) {
                return Show(ERROR, [], $code);
            }

            return Show(ERROR, [], 10135);
        }
    }

    /**
     * 用户积分修改接口
     * 支持管理员通过 action=inc 或 dec 单独增加/扣除积分，并同步写入资金流水。
     *
     * @return mixed
     */
    public function UpdateIntegral()
    {
        $postField = 'id,action,amount';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        try {
            validate(\app\validate\UserValidate::class)->scene('updateIntegral')->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $user = CommonUserModel::PageDataOne(['id' => (int)$post['id']]);
        if (!$user) {
            return Show(ERROR, [], 10017);
        }

        $adminId = (int)($this->request->UserID ?? 0);
        $amount = (float)$post['amount'];
        $action = (string)$post['action'];

        Db::startTrans();
        try {
            $integralBefore = (float)($user['money_integral'] ?? 0);

            if ($action === 'inc') {
                $result = CommonUserModel::incIntegral((int)$post['id'], $amount);
                if (!$result) {
                    throw new \Exception('', 10136);
                }

                $integralEnd = $integralBefore + $amount;
                CommonPayMoneyLogModel::recordMoneyLog(
                    (int)$post['id'],
                    CommonPayMoneyLogModel::TYPE_INCOME,
                    CommonPayMoneyLogModel::STATUS_ADMIN_INC_INTEGRAL,
                    CommonPayMoneyLogModel::MONEY_TYPE_INTEGRAL,
                    $amount,
                    $integralBefore,
                    $integralEnd,
                    '管理员增加积分',
                    $adminId
                );
            } else {
                $result = CommonUserModel::decIntegral((int)$post['id'], $amount);
                if (!$result) {
                    throw new \Exception('', 10136);
                }

                $integralEnd = $integralBefore - $amount;
                CommonPayMoneyLogModel::recordMoneyLog(
                    (int)$post['id'],
                    CommonPayMoneyLogModel::TYPE_EXPEND,
                    CommonPayMoneyLogModel::STATUS_ADMIN_DEC_INTEGRAL,
                    CommonPayMoneyLogModel::MONEY_TYPE_INTEGRAL,
                    $amount,
                    $integralBefore,
                    $integralEnd,
                    '管理员扣除积分',
                    $adminId
                );
            }

            Db::commit();
            return Show(SUCCESS, ['integral_before' => $integralBefore, 'integral_end' => $integralEnd], 10134);
        } catch (\Throwable $e) {
            Db::rollback();
            $code = (int)$e->getCode();
            if ($code > 0) {
                return Show(ERROR, [], $code);
            }

            return Show(ERROR, [], 10136);
        }
    }
}
