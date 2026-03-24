<?php
namespace app\controller;

use app\BaseController;
use app\model\MoneyLog;

/**
 * Honeywell 交易记录模块
 */
class HoneywellTransaction extends BaseController
{
    /**
     * 交易记录列表
     * GET /api/honeywell_transaction/list
     */
    public function list()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $page = input('page', 1);
        $pageSize = input('pageSize', 20);
        $type = input('type', 'all');
        
        $where = ['uid' => $userId];
        
        // 根据类型筛选
        if ($type === 'recharge') {
            $where['status'] = MoneyLog::STATUS_RECHARGE;
        } elseif ($type === 'withdraw') {
            $where['status'] = MoneyLog::STATUS_WITHDRAW;
        } elseif ($type === 'commission') {
            $where['status'] = MoneyLog::STATUS_AGENT_COMMISSION;
        } elseif ($type === 'income') {
            $where['status'] = MoneyLog::STATUS_DAILY_INCOME;
        }
        
        $list = MoneyLog::where($where)
            ->order('id', 'desc')
            ->page($page, $pageSize)
            ->select()
            ->toArray();
        
        $total = MoneyLog::where($where)->count();
        
        $records = [];
        foreach ($list as $item) {
            $records[] = [
                'id' => (int)$item['id'],
                'type' => $item['type'] == 1 ? 'INCOME' : 'EXPENSE',
                'amount' => number_format($item['money'], 2, '.', ''),
                'balance' => number_format($item['money_end'], 2, '.', ''),
                'remark' => $item['rmark'] ?? '',
                'createdAt' => date('c', strtotime($item['create_time']))
            ];
        }
        
        return json([
            'success' => true,
            'data' => [
                'list' => $records,
                'pagination' => ['total' => (int)$total, 'page' => (int)$page, 'pageSize' => (int)$pageSize]
            ]
        ]);
    }
    
    private function getUserId()
    {
        $token = request()->header('authorization');
        $token = str_replace('Bearer ', '', $token);
        if (empty($token)) return null;
        
        $tokenInfo = \think\facade\Db::name('common_home_token')->where('token', $token)->find();
        return $tokenInfo ? $tokenInfo['uid'] : null;
    }
    
    private function unauthorized()
    {
        return json(['success' => false, 'error' => ['code' => 'UNAUTHORIZED', 'message' => 'No autorizado']], 401);
    }
}
