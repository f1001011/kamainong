<?php
namespace app\controller;

use app\BaseController;
use app\api\model\Income as IncomeModel;
use app\api\model\User;
use think\facade\Db;

class Income extends BaseController
{
    // 收益记录列表
    public function list()
    {
        $userId = request()->userId;
        
        $list = IncomeModel::where('user_id', $userId)
            ->order('create_time', 'desc')
            ->select();
        
        return show(1, $list);
    }
    
    // 可领取收益
    public function available()
    {
        $userId = request()->userId;
        
        $list = IncomeModel::where('user_id', $userId)
            ->where('status', 0)
            ->where('expire_time', '>', date('Y-m-d H:i:s'))
            ->select();
        
        return show(1, $list);
    }

    // 领取收益
    public function claim()
    {
        $userId = request()->userId;
        $claimId = input('claim_id');
        
        $claim = IncomeModel::where('id', $claimId)
            ->where('user_id', $userId)
            ->find();
        
        if (!$claim) {
            return show(0, [], 50001);
        }
        
        if ($claim['status'] == 1) {
            return show(0, [], 50001);
        }
        
        if ($claim['status'] == 2) {
            return show(0, [], 50002);
        }
        
        // 检查是否过期
        if (strtotime($claim['expire_time']) < time()) {
            IncomeModel::where('id', $claimId)->update(['status' => 2]);
            return show(0, [], 50002);
        }
        
        Db::startTrans();
        try {
            // 更新状态
            IncomeModel::where('id', $claimId)->update([
                'status' => 1,
                'claim_time' => date('Y-m-d H:i:s')
            ]);
            
            // 增加余额
            User::where('id', $userId)->inc('money_balance', $claim['claim_amount'])->update();
            
            Db::commit();
            return show(1, [], 50003);
        } catch (\Exception $e) {
            Db::rollback();
            return show(0, [], 1001);
        }
    }
}
