<?php
namespace app\model;

use think\Model;
use think\facade\Db;

class Recharge extends Model
{
    protected $name = 'common_pay_recharge';
    
    // 充值状态常量
    const STATUS_PENDING = 0;      // 待支付
    const STATUS_PAID = 1;        // 已支付
    const STATUS_CANCELLED = 2;   // 已取消
    
    /**
     * 获取充值记录列表
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
     * 获取充值详情
     */
    public static function getDetail($id, $userId)
    {
        return self::where('id', $id)
            ->where('uid', $userId)
            ->find();
    }
    
    /**
     * 格式化充值记录
     */
    public static function format($record)
    {
        return [
            'id' => (int)$record['id'],
            'orderNo' => $record['order_no'] ?? '',
            'amount' => number_format($record['money'], 2, '.', ''),
            'actualAmount' => number_format($record['actual_amount'] ?? $record['money'], 2, '.', ''),
            'channelName' => $record['pay_type'] ?? '',
            'status' => self::getStatusText($record['status']),
            'createdAt' => date('c', strtotime($record['create_time'])),
            'paidAt' => $record['pay_time'] ? date('c', strtotime($record['pay_time'])) : null
        ];
    }
    
    /**
     * 创建充值订单
     */
    public static function create($userId, $money, $payType = 'manual')
    {
        $orderNo = 'RC' . date('YmdHis') . rand(1000, 9999);
        
        $id = self::insertGetId([
            'uid' => $userId,
            'order_no' => $orderNo,
            'money' => $money,
            'pay_type' => $payType,
            'status' => self::STATUS_PENDING,
            'create_time' => date('Y-m-d H:i:s')
        ]);
        
        return ['code' => 1, 'id' => $id, 'order_no' => $orderNo];
    }
    
    /**
     * 确认充值
     */
    public static function confirm($id)
    {
        $order = self::where('id', $id)
            ->where('status', self::STATUS_PENDING)
            ->find();
        
        if (!$order) {
            return ['code' => 0, 'msg' => 'ORDER_NOT_FOUND'];
        }
        
        self::where('id', $id)->update([
            'status' => self::STATUS_PAID,
            'pay_time' => date('Y-m-d H:i:s')
        ]);
        
        return ['code' => 1];
    }
    
    /**
     * 取消充值
     */
    public static function cancel($id, $userId)
    {
        $order = self::where('id', $id)
            ->where('uid', $userId)
            ->where('status', self::STATUS_PENDING)
            ->find();
        
        if (!$order) {
            return ['code' => 0, 'msg' => 'ORDER_CANNOT_CANCEL'];
        }
        
        self::where('id', $id)->update([
            'status' => self::STATUS_CANCELLED
        ]);
        
        return ['code' => 1];
    }
    
    /**
     * 获取状态文本
     */
    public static function getStatusText($status)
    {
        $map = [
            self::STATUS_PENDING => 'PENDING',
            self::STATUS_PAID => 'PAID',
            self::STATUS_CANCELLED => 'CANCELLED'
        ];
        return $map[$status] ?? 'UNKNOWN';
    }
}
