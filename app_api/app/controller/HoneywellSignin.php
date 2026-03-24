<?php
namespace app\controller;

use app\BaseController;
use app\model\User;
use app\model\MoneyLog;

/**
 * Honeywell 签到模块
 */
class HoneywellSignin extends BaseController
{
    /**
     * 签到状态
     */
    public function status()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $today = date('Y-m-d');
        $todayLog = \think\facade\Db::name('common_user_sign_log')
            ->where('uid', $userId)
            ->where('sign_date', $today)
            ->find();
        
        $continuousDays = $this->getContinuousDays($userId);
        
        return json([
            'success' => true,
            'data' => [
                'hasSigned' => (bool)$todayLog,
                'continuousDays' => $continuousDays,
                'reward' => 1
            ]
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
        $exists = \think\facade\Db::name('common_user_sign_log')
            ->where('uid', $userId)
            ->where('sign_date', $today)
            ->find();
        
        if ($exists) {
            return json(['success' => false, 'error' => ['code' => 'ALREADY_SIGNED', 'message' => 'Ya has firmado hoy']]);
        }
        
        \think\facade\Db::startTrans();
        try {
            // 增加积分
            User::changeMoney($userId, 'inc', 2, 1, MoneyLog::STATUS_SIGNIN, 0, '签到奖励');
            
            // 记录签到
            \think\facade\Db::name('common_user_sign_log')->insert([
                'uid' => $userId,
                'sign_date' => $today,
                'create_time' => date('Y-m-d H:i:s')
            ]);
            
            \think\facade\Db::commit();
            return json(['success' => true, 'data' => ['reward' => 1]]);
            
        } catch (\Exception $e) {
            \think\facade\Db::rollback();
            return json(['success' => false, 'error' => ['code' => 'SIGN_FAILED', 'message' => $e->getMessage()]]);
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
        
        $records = \think\facade\Db::name('common_user_sign_log')
            ->where('uid', $userId)
            ->where('sign_date', '>=', $startDate)
            ->order('sign_date', 'desc')
            ->select()
            ->toArray();
        
        $list = [];
        foreach ($records as $item) {
            $list[] = [
                'date' => $item['sign_date'],
                'reward' => 1
            ];
        }
        
        return json(['success' => true, 'data' => ['list' => $list]]);
    }
    
    private function getContinuousDays($userId)
    {
        $days = 0;
        $date = date('Y-m-d');
        
        while (true) {
            $log = \think\facade\Db::name('common_user_sign_log')
                ->where('uid', $userId)
                ->where('sign_date', $date)
                ->find();
            
            if (!$log) break;
            
            $days++;
            $date = date('Y-m-d', strtotime($date . ' -1 day'));
        }
        
        return $days;
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
