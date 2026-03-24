<?php
namespace app\controller;

use app\model\Lottery;
use think\facade\Db;

/**
 * Honeywell 转盘模块
 */
class HoneywellLottery extends HoneywellBase
{
    public function status()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $chances = Db::name('common_lottery_chance')->where('uid', $userId)->value('chances') ?? 0;
        
        return json(['success' => true, 'data' => ['remainingChances' => (int)$chances]]);
    }

    public function prizes()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $list = Db::name('common_lottery_prize')->where('status', 1)->order('sort', 'asc')->select()->toArray();
        
        $prizes = [];
        foreach ($list as $item) {
            $prizes[] = [
                'id' => (int)$item['id'],
                'name' => $item['prize_name'],
                'amount' => number_format($item['prize_amount'], 2, '.', ''),
                'probability' => (float)$item['probability']
            ];
        }
        
        return json(['success' => true, 'data' => ['prizes' => $prizes]]);
    }

    public function spin()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        Db::startTrans();
        try {
            $chance = Db::name('common_lottery_chance')->where('uid', $userId)->lock(true)->find();
            if (!$chance || $chance['chances'] <= 0) throw new \Exception('Sin oportunidades');
            
            Db::name('common_lottery_chance')->where('uid', $userId)->dec('chances')->update();
            
            $prize = $this->drawPrize();
            
            if ($prize['prize_amount'] > 0) {
                User::changeMoney($userId, 'inc', 1, $prize['prize_amount'], MoneyLog::STATUS_LOTTERY, $prize['id'], '转盘奖励');
            }
            
            Db::name('common_lottery_log')->insert([
                'uid' => $userId,
                'prize_id' => $prize['id'],
                'prize_name' => $prize['prize_name'],
                'prize_amount' => $prize['prize_amount'],
                'create_time' => date('Y-m-d H:i:s')
            ]);
            
            Db::commit();
            return json(['success' => true, 'data' => ['prizeId' => (int)$prize['id'], 'amount' => number_format($prize['prize_amount'], 2, '.', '')]]);
            
        } catch (\Exception $e) {
            Db::rollback();
            return json(['success' => false, 'error' => ['code' => 'SPIN_FAILED', 'message' => $e->getMessage()]]);
        }
    }
    
    private function drawPrize()
    {
        $prizes = Db::name('common_lottery_prize')->where('status', 1)->select()->toArray();
        $rand = mt_rand(1, 10000) / 100;
        $sum = 0;
        
        foreach ($prizes as $prize) {
            $sum += $prize['probability'];
            if ($rand <= $sum) return $prize;
        }
        
        return $prizes[0];
    }
    
    private function getUserId()
    {
        $token = request()->header('authorization');
        $token = str_replace('Bearer ', '', $token);
        if (empty($token)) return null;
        
        $tokenInfo = Db::name('common_home_token')->where('token', $token)->find();
        return $tokenInfo ? $tokenInfo['uid'] : null;
    }
    
    private function unauthorized()
    {
        return json(['success' => false, 'error' => ['code' => 'UNAUTHORIZED', 'message' => 'No autorizado']], 401);
    }
}
