<?php
namespace app\controller;

use app\BaseController;
use app\model\User;
use app\model\MoneyLog;
use think\facade\Db;

class HoneywellGift extends BaseController
{
    public function redeem()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $code = input('code', '');
        
        if (empty($code)) {
            return json(['success' => false, 'error' => ['code' => 'EMPTY_CODE', 'message' => 'Código vacío']]);
        }
        
        Db::startTrans();
        try {
            $gift = Db::name('common_gift_code')->where('code', $code)->lock(true)->find();
            
            if (!$gift) throw new \Exception('Código inválido');
            if ($gift['status'] == 1) throw new \Exception('Código ya usado');
            if ($gift['expire_time'] && strtotime($gift['expire_time']) < time()) throw new \Exception('Código expirado');
            
            $used = Db::name('common_gift_code_log')->where('uid', $userId)->where('code', $code)->find();
            if ($used) throw new \Exception('Ya has usado este código');
            
            User::changeMoney($userId, 'inc', 1, $gift['reward_amount'], MoneyLog::STATUS_GIFT_CODE, $gift['id'], '礼品码奖励');
            
            Db::name('common_gift_code')->where('id', $gift['id'])->update(['status' => 1, 'used_time' => date('Y-m-d H:i:s')]);
            
            Db::name('common_gift_code_log')->insert([
                'uid' => $userId,
                'code' => $code,
                'reward_amount' => $gift['reward_amount'],
                'create_time' => date('Y-m-d H:i:s')
            ]);
            
            Db::commit();
            return json(['success' => true, 'data' => ['amount' => number_format($gift['reward_amount'], 2, '.', '')]]);
            
        } catch (\Exception $e) {
            Db::rollback();
            return json(['success' => false, 'error' => ['code' => 'REDEEM_FAILED', 'message' => $e->getMessage()]]);
        }
    }

    public function history()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $page = input('page', 1);
        $pageSize = input('pageSize', 20);
        
        $list = Db::name('common_gift_code_log')
            ->where('uid', $userId)
            ->order('id', 'desc')
            ->page($page, $pageSize)
            ->select()
            ->toArray();
        
        $total = Db::name('common_gift_code_log')->where('uid', $userId)->count();
        
        $records = [];
        foreach ($list as $item) {
            $records[] = [
                'id' => (int)$item['id'],
                'code' => $item['code'],
                'amount' => number_format($item['reward_amount'], 2, '.', ''),
                'redeemedAt' => date('c', strtotime($item['create_time']))
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
        
        $tokenInfo = Db::name('common_home_token')->where('token', $token)->find();
        return $tokenInfo ? $tokenInfo['uid'] : null;
    }
    
    private function unauthorized()
    {
        return json(['success' => false, 'error' => ['code' => 'UNAUTHORIZED', 'message' => 'No autorizado']], 401);
    }
}
