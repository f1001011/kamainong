<?php
namespace app\model;

use think\Model;
use think\facade\Db;

class Withdraw extends Model
{
    protected $name = 'common_pay_cash';
    
    // 提现状态常量
    const STATUS_PENDING = 0;      // 待处理
    const STATUS_APPROVED = 1;    // 已通过
    const STATUS_REJECTED = 2;    // 已拒绝
    
    /**
     * 获取提现记录列表
     */
    public static function getRecords($userId, $page = 1, $pageSize = 20)
    {
        $query = self::where('uid', $userId);
        
        $total = $query->count();
        $list = $query->order('id', 'desc')
            ->page($page, $pageSize)
            ->select();
        
        return ['list' => $list, 'total' => $total];
    }
    
    /**
     * 获取提现详情
     */
    public static function getDetail($id, $userId)
    {
        return self::where('id', $id)
            ->where('uid', $userId)
            ->find();
    }
    
    /**
     * 格式化提现记录
     */
    public static function format($record)
    {
        return [
            'id' => (int)$record['id'],
            'orderNo' => $record['order_no'] ?? '',
            'amount' => number_format($record['money'], 2, '.', ''),
            'actualAmount' => number_format($record['actual_amount'] ?? $record['money'], 2, '.', ''),
            'fee' => number_format(($record['money'] - $record['actual_amount']) ?? 0, 2, '.', ''),
            'status' => self::getStatusText($record['status']),
            'createdAt' => date('c', strtotime($record['create_time'])),
            'processedAt' => $record['update_time'] ? date('c', strtotime($record['update_time'])) : null
        ];
    }
    
    /**
     * 检查是否可以提现
     */
    public static function canWithdraw($userId)
    {
        $now = date('H:i:s');
        $withdrawStart = Db::name('common_sys_config')->where('name', 'withdraw_start_time')->value('value', '10:00');
        $withdrawEnd = Db::name('common_sys_config')->where('name', 'withdraw_end_time')->value('value', '18:00');
        $dailyLimit = Db::name('common_sys_config')->where('name', 'withdraw_daily_limit')->value('value', 1);
        
        // 检查时间
        if ($now < $withdrawStart || $now > $withdrawEnd) {
            return ['can' => false, 'reason' => 'WITHDRAW_OUTSIDE_TIME'];
        }
        
        // 检查每日次数
        $today = date('Y-m-d');
        $todayCount = self::where('uid', $userId)
            ->where('status', '<>', self::STATUS_REJECTED)
            ->whereTime('create_time', 'today')
            ->count();
        
        if ($todayCount >= $dailyLimit) {
            return ['can' => false, 'reason' => 'WITHDRAW_DAILY_LIMIT'];
        }
        
        // 检查是否购买过产品
        $hasPurchase = Db::name('common_goods_order')
            ->where('uid', $userId)
            ->where('status', 1)
            ->count();
        
        if ($hasPurchase == 0) {
            return ['can' => false, 'reason' => 'WITHDRAW_REQUIREMENT'];
        }
        
        return ['can' => true];
    }
    
    /**
     * 创建提现订单
     */
    public static function create($userId, $money, $bankCardId)
    {
        // 获取用户余额
        $user = Db::name('common_user')->where('id', $userId)->find();
        if (!$user || $user['money_balance'] < $money) {
            return ['code' => 0, 'msg' => 'BALANCE_INSUFFICIENT'];
        }
        
        // 计算手续费（10%）
        $fee = $money * 0.1;
        $actualAmount = $money - $fee;
        
        $orderNo = 'WD' . date('YmdHis') . rand(1000, 9999);
        
        Db::startTrans();
        try {
            // 扣除余额
            Db::name('common_user')->where('id', $userId)->dec('money_balance', $money)->update();
            
            // 创建提现订单
            $id = self::insertGetId([
                'uid' => $userId,
                'order_no' => $orderNo,
                'money' => $money,
                'actual_amount' => $actualAmount,
                'fee' => $fee,
                'bank_card_id' => $bankCardId,
                'status' => self::STATUS_PENDING,
                'create_time' => date('Y-m-d H:i:s')
            ]);
            
            // 记录流水
            Db::name('common_pay_money_log')->insert([
                'uid' => $userId,
                'money' => $money,
                'type' => 2, // 支出
                'status' => 1,
                'before_money' => $user['money_balance'],
                'end_money' => $user['money_balance'] - $money,
                'source_id' => $id,
                'remark' => '提现申请',
                'create_time' => date('Y-m-d H:i:s')
            ]);
            
            Db::commit();
            return ['code' => 1, 'id' => $id, 'order_no' => $orderNo];
        } catch (\Exception $e) {
            Db::rollback();
            return ['code' => 0, 'msg' => 'SYSTEM_ERROR'];
        }
    }
    
    /**
     * 获取状态文本
     */
    public static function getStatusText($status)
    {
        $map = [
            self::STATUS_PENDING => 'PENDING',
            self::STATUS_APPROVED => 'APPROVED',
            self::STATUS_REJECTED => 'REJECTED'
        ];
        return $map[$status] ?? 'UNKNOWN';
    }
}
