<?php
declare(strict_types=1);

namespace app\controller\payment;

use app\controller\BaseCon;
use app\model\CommonPayMoneyLogModel;

/**
 * 后台资金流水控制器
 * 提供资金流水列表查询，支持按用户、时间范围、收支类型、钱包类型、状态类型筛选。
 */
class PayMoneyLogCon extends BaseCon
{
    /**
     * 资金流水列表接口
     * 默认按ID倒序，默认每页20条。
     *
     * @return mixed
     */
    public function GetMoneyLogList()
    {
        $postField = 'user_id,start_time,end_time,type,money_type,status,page,limit';
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

        $map = [];
        $userId = (int)($post['user_id'] ?? 0);
        if ($userId > 0) {
            $map['uid'] = $userId;
        }

        $this->appendTimeRange($map, 'create_time', $startTime ?: null, $endTime ?: null);

        $type = (int)($post['type'] ?? 0);
        if (in_array($type, [CommonPayMoneyLogModel::TYPE_INCOME, CommonPayMoneyLogModel::TYPE_EXPEND], true)) {
            $map['type'] = $type;
        }

        $moneyType = (int)($post['money_type'] ?? 0);
        if (in_array($moneyType, [CommonPayMoneyLogModel::MONEY_TYPE_BALANCE, CommonPayMoneyLogModel::MONEY_TYPE_INTEGRAL], true)) {
            $map['money_type'] = $moneyType;
        }

        $status = (int)($post['status'] ?? 0);
        if ($status > 0) {
            $map['status'] = $status;
        }

        $list = CommonPayMoneyLogModel::PageList($map, '*', $page, $limit, 'id desc');
        return Show(SUCCESS, $list);
    }

    /**
     * 资金流水统计接口
     *
     * @return mixed
     */
    public function GetMoneyLogStats()
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

        $query = CommonPayMoneyLogModel::where([]);
        if (!empty($startTime)) {
            $query->where('create_time', '>=', $startTime);
        }
        if (!empty($endTime)) {
            $query->where('create_time', '<=', $endTime);
        }

        $summary = $query
            ->fieldRaw(
                'COUNT(*) as total_count,' .
                'COUNT(DISTINCT uid) as user_count,' .
                'COALESCE(SUM(CASE WHEN type = ' . CommonPayMoneyLogModel::TYPE_INCOME . ' THEN money ELSE 0 END), 0) as income_amount,' .
                'COALESCE(SUM(CASE WHEN type = ' . CommonPayMoneyLogModel::TYPE_EXPEND . ' THEN money ELSE 0 END), 0) as expense_amount,' .
                'COALESCE(SUM(CASE WHEN money_type = ' . CommonPayMoneyLogModel::MONEY_TYPE_BALANCE . ' AND type = ' . CommonPayMoneyLogModel::TYPE_INCOME . ' THEN money ELSE 0 END), 0) as balance_income_amount,' .
                'COALESCE(SUM(CASE WHEN money_type = ' . CommonPayMoneyLogModel::MONEY_TYPE_BALANCE . ' AND type = ' . CommonPayMoneyLogModel::TYPE_EXPEND . ' THEN money ELSE 0 END), 0) as balance_expense_amount,' .
                'COALESCE(SUM(CASE WHEN money_type = ' . CommonPayMoneyLogModel::MONEY_TYPE_INTEGRAL . ' AND type = ' . CommonPayMoneyLogModel::TYPE_INCOME . ' THEN money ELSE 0 END), 0) as integral_income_amount,' .
                'COALESCE(SUM(CASE WHEN money_type = ' . CommonPayMoneyLogModel::MONEY_TYPE_INTEGRAL . ' AND type = ' . CommonPayMoneyLogModel::TYPE_EXPEND . ' THEN money ELSE 0 END), 0) as integral_expense_amount'
            )
            ->find();

        $incomeAmount = (float)($summary['income_amount'] ?? 0);
        $expenseAmount = (float)($summary['expense_amount'] ?? 0);

        return Show(SUCCESS, [
            'total_count' => (int)($summary['total_count'] ?? 0),
            'user_count' => (int)($summary['user_count'] ?? 0),
            'income_amount' => $incomeAmount,
            'expense_amount' => $expenseAmount,
            'net_amount' => $incomeAmount - $expenseAmount,
            'balance_income_amount' => (float)($summary['balance_income_amount'] ?? 0),
            'balance_expense_amount' => (float)($summary['balance_expense_amount'] ?? 0),
            'integral_income_amount' => (float)($summary['integral_income_amount'] ?? 0),
            'integral_expense_amount' => (float)($summary['integral_expense_amount'] ?? 0),
        ]);
    }
}
