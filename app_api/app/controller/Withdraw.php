<?php
namespace app\controller;

use app\BaseController;
use app\model\Withdraw as WithdrawModel;
use app\model\BankCard;

class Withdraw extends BaseController
{
    // 创建提现申请
    public function create()
    {
        $userId = request()->userId;
        $amount = input('amount');
        $bankCard = input('bankCard');
        
        $data = [
            'user_id' => $userId,
            'amount' => $amount,
            'bank_card_id' => $bankCard,
            'status' => 'pending',
            'created_at' => time()
        ];
        
        WithdrawModel::insert($data);
        
        return show(1, [], '提现申请已提交');
    }
    
    // 提现历史
    public function history()
    {
        $userId = request()->userId;
        
        $list = WithdrawModel::where('user_id', $userId)
            ->order('id desc')
            ->select();
        
        return show(1, $list);
    }
    
    // 银行卡列表
    public function cards()
    {
        $userId = request()->userId;
        
        $cards = BankCard::where('user_id', $userId)
            ->select();
        
        return show(1, $cards);
    }
}
