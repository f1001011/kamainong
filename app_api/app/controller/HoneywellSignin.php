<?php
namespace app\controller;

use app\model\User;
use app\model\MoneyLog;
use think\facade\Db;

/**
 * Honeywell 签到模块
 */
class HoneywellSignin extends HoneywellBase
{
    /**
     * 签到状态
     */
    public function status()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $today = date('Y-m-d');
        $todayLog = Db::name('common_user_sign_log')
            ->where('uid', $userId)
            ->where('sign_date', $today)
            ->find();
        
        $continuousDays = $this->getContinuousDays($userId);
        
        return $this->success([
            'hasSigned' => (bool)$todayLog,
            'continuousDays' => $continuousDays,
            'reward' => 1
        ]);
    }

    /**
     * 执行签到
     */
    public function sign()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $today = date('Y-m-d');
        $exists = Db::name('common_user_sign_log')
            ->where('uid', $userId)
            ->where('sign_date', $today)
            ->find();
        
        if ($exists) {
            return $this->error('ALREADY_SIGNED');
        }
        
        Db::startTrans();
        try {
            // 增加积分
            User::changeMoney($userId, 'inc', 2, 1, MoneyLog::STATUS_SIGNIN, 0, '签到奖励');
            
            // 记录签到
            Db::name('common_user_sign_log')->insert([
                'uid' => $userId,
                'sign_date' => $today,
                'create_time' => date('Y-m-d H:i:s')
            ]);
            
            Db::commit();
            return $this->success(['reward' => 1]);
            
        } catch (\Exception $e) {
            Db::rollback();
            return $this->error('SIGN_FAILED');
        }
    }

    /**
     * 签到记录
     */
    public function records()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $days = input('days', 7);
        $startDate = date('Y-m-d', strtotime("-{$days} days"));
        
        list($page, $pageSize) = $this->getPageParams();
        
        // 使用 paginate 方法
        $result = Db::name('common_user_sign_log')
            ->where('uid', $userId)
            ->where('sign_date', '>=', $startDate)
            ->order('sign_date', 'desc')
            ->paginate([
                'list_rows' => $pageSize,
                'page' => $page,
            ]);
        
        $total = $result->total();
        $list = $result->items()->toArray();
        
        // 匹配前端 SignInRecord 接口
        $records = [];
        foreach ($list as $item) {
            $records[] = [
                'date' => $item['sign_date'],
                'signed' => true,
                'signType' => 'NORMAL',
                'amount' => '1',
                'signedAt' => date('c', strtotime($item['create_time']))
            ];
        }
        
        // 如果需要填充未签到的日期
        $allRecords = $this->fillMissingDates($startDate, $records, $days);
        
        return $this->success([
            'records' => $allRecords,
            'pagination' => [
                'total' => (int)$total,
                'page' => (int)$page,
                'pageSize' => (int)$pageSize,
                'totalPages' => ceil($total / $pageSize)
            ]
        ]);
    }

    /**
     * 填充缺失的日期（未签到的日期）
     */
    private function fillMissingDates($startDate, $signedRecords, $days)
    {
        $result = [];
        for ($i = 0; $i < $days; $i++) {
            $date = date('Y-m-d', strtotime($startDate) + ($i * 86400));
            $found = false;
            foreach ($signedRecords as $record) {
                if ($record['date'] === $date) {
                    $result[] = $record;
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                $result[] = [
                    'date' => $date,
                    'signed' => false,
                    'signType' => null,
                    'amount' => null,
                    'signedAt' => null
                ];
            }
        }
        return $result;
    }
    
    private function getContinuousDays($userId)
    {
        $days = 0;
        $date = date('Y-m-d');
        
        while (true) {
            $log = Db::name('common_user_sign_log')
                ->where('uid', $userId)
                ->where('sign_date', $date)
                ->find();
            
            if (!$log) break;
            
            $days++;
            $date = date('Y-m-d', strtotime($date . ' -1 day'));
        }
        
        return $days;
    }
}
