<?php
namespace app\model;

use think\Model;
use app\consts\IncomeStatus;

class Income extends Model
{
    protected $name = 'common_income_claim_log';
    
    // 收益领取状态常量
    const STATUS_WAITING = 0;  // 待领取
    const STATUS_CLAIMED = 1;  // 已领取
    const STATUS_EXPIRED = 2;  // 已过期
    
    /**
     * 获取状态文本
     */
    public static function getStatusText($status)
    {
        $statusMap = [
            self::STATUS_WAITING => 'WAITING',
            self::STATUS_CLAIMED => 'CLAIMED',
            self::STATUS_EXPIRED => 'EXPIRED',
        ];
        
        return $statusMap[$status] ?? 'UNKNOWN';
    }
    
    /**
     * 查询可领取的收益
     */
    public function getClaimableIncomes($userId)
    {
        return $this->where('user_id', $userId)
            ->where('status', self::STATUS_WAITING)
            ->where('available_time', '<=', time())
            ->where('expire_time', '>', time())
            ->select();
    }
    
    /**
     * 领取收益
     */
    public function claim($incomeId, $userId)
    {
        $income = $this->where('id', $incomeId)
            ->where('user_id', $userId)
            ->where('status', self::STATUS_WAITING)
            ->where('available_time', '<=', time())
            ->where('expire_time', '>', time())
            ->find();
        
        if (!$income) {
            return false;
        }
        
        $income->status = self::STATUS_CLAIMED;
        $income->claim_time = time();
        return $income->save();
    }
}
