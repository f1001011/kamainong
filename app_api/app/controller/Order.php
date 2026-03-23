<?php
namespace app\controller;

use app\BaseController;
use app\model\Order as OrderModel;
use app\model\Product;
use app\model\User;
use app\model\MoneyLog;
use think\facade\Db;

class Order extends BaseController
{
    // 购买产品
    public function buy()
    {
        $userId = request()->userId;
        $goodsId = input('goods_id');
        
        // 获取产品信息
        $goods = Product::where('id', $goodsId)->find();
        if (!$goods) {
            return show(0, [], 20001);
        }
        
        // 检查用户余额
        $user = User::where('id', $userId)->find();
        if ($user['money_balance'] < $goods['goods_money']) {
            return show(0, [], 10049);
        }
        
        // 创建订单
        Db::startTrans();
        try {
            $orderId = OrderModel::insertGetId([
                'user_id' => $userId,
                'user_name' => $user['user_name'],
                'goods_id' => $goodsId,
                'goods_name' => $goods['goods_name'],
                'goods_money' => $goods['goods_money'],
                'total_red_money' => $goods['total_money'],
                'already_red_money' => 0,
                'create_time' => date('Y-m-d H:i:s')
            ]);
            
            // 扣除余额并记录流水
            $result = User::changeMoney($userId, 'dec', 1, $goods['goods_money'], MoneyLog::STATUS_BUY_GOODS, $orderId, '购买商品：' . $goods['goods_name']);
            if ($result['code'] == 0) {
                Db::rollback();
                return show(0, [], $result['msg']);
            }
            
            Db::commit();
            return show(1, ['order_id' => $orderId], 20002);
        } catch (\Exception $e) {
            Db::rollback();
            return show(0, [], 20003);
        }
    }

    // 我的订单列表
    public function myOrders()
    {
        $userId = request()->userId;
        
        $list = OrderModel::where('user_id', $userId)
            ->order('create_time', 'desc')
            ->select();
        
        return show(1, $list);
    }
    
    // 订单详情
    public function detail()
    {
        $userId = request()->userId;
        $orderId = input('order_id');
        
        $order = OrderModel::where('id', $orderId)
            ->where('user_id', $userId)
            ->find();
        
        if (!$order) {
            return show(0, [], 30001);
        }
        
        return show(1, $order);
    }
}
