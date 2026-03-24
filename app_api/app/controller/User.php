<?php
namespace app\controller;

use app\BaseController;
use app\model\MoneyLog;
use app\model\User as UserModel;
use think\facade\Db;

class User extends BaseController
{
    // 获取用户信息
    public function info()
    {
        $userId = request()->userId;

        $user = UserModel::field('id,user_name,nickname,phone,money_balance,money_freeze,money_integral,level_vip,agent_level,agent_level_name,total_recharge,total_red')
            ->where('id', $userId)
            ->find();

        return show(1, $user);
    }

    // 获取余额
    public function balance()
    {
        $userId = request()->userId;

        $balance = UserModel::where('id', $userId)->value('money_balance');

        return show(1, ['balance' => $balance]);
    }

    // 余额统计
    public function moneySummary()
    {
        $userId = request()->userId;

        $todayIncome = Db::name('common_pay_money_log')
            ->where('uid', $userId)
            ->where('money_type', 1)
            ->where('type', 1)
            ->whereTime('create_time', 'today')
            ->sum('money');

        $monthIncome = Db::name('common_pay_money_log')
            ->where('uid', $userId)
            ->where('money_type', 1)
            ->where('type', 1)
            ->whereTime('create_time', 'month')
            ->sum('money');

        $monthExpense = Db::name('common_pay_money_log')
            ->where('uid', $userId)
            ->where('money_type', 1)
            ->where('type', 2)
            ->whereTime('create_time', 'month')
            ->sum('money');

        return show(1, [
            'today_income' => floatval($todayIncome),
            'month_income' => floatval($monthIncome),
            'month_expense' => floatval($monthExpense),
        ]);
    }

    // 资金流水
    public function moneyLogs()
    {
        $userId = request()->userId;
        $page = max(1, input('page/d', 1));
        $pageSize = max(1, min(50, input('page_size/d', 10)));
        $moneyType = input('money_type/d', 1);

        $listQuery = Db::name('common_pay_money_log')->where('uid', $userId);
        $countQuery = Db::name('common_pay_money_log')->where('uid', $userId);

        if ($moneyType > 0) {
            $listQuery->where('money_type', $moneyType);
            $countQuery->where('money_type', $moneyType);
        }

        $list = $listQuery
            ->field('id,type,status,money_type,money_before,money_end,money,rmark,create_time')
            ->order('id', 'desc')
            ->page($page, $pageSize)
            ->select();

        $total = $countQuery->count();

        return show(1, [
            'list' => $list,
            'page' => $page,
            'page_size' => $pageSize,
            'total' => $total,
            'has_more' => $page * $pageSize < $total,
        ]);
    }

    // 每日签到
    public function signIn()
    {
        $userId = request()->userId;

        $already = Db::name('common_user_sign_log')
            ->where('uid', $userId)
            ->whereTime('create_time', 'today')
            ->find();

        if ($already) {
            return show(0, [], 10051);
        }

        $reward = 10;

        Db::startTrans();
        try {
            Db::name('common_user_sign_log')->insert([
                'uid' => $userId,
                'money' => $reward,
                'create_time' => date('Y-m-d H:i:s'),
            ]);

            $result = UserModel::changeMoney($userId, 'inc', 1, $reward, MoneyLog::STATUS_SIGNIN, 0, '每日签到奖励');
            if ($result['code'] == 0) {
                Db::rollback();
                return show(0, [], $result['msg']);
            }

            Db::commit();
            return show(1, ['amount' => $reward]);
        } catch (\Exception $e) {
            Db::rollback();
            return show(0, [], 1001);
        }
    }

    // 修改密码
    public function changePassword()
    {
        $userId = request()->userId;
        $oldPwd = input('old_pwd');
        $newPwd = input('new_pwd');

        $user = UserModel::where('id', $userId)->find();

        if (md5($oldPwd) != $user['pwd']) {
            return show(0, [], 10024);
        }

        UserModel::where('id', $userId)->update(['pwd' => md5($newPwd)]);

        return show(1, [], 10025);
    }
}
