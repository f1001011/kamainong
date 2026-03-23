<?php
namespace app\api\controller;

use app\BaseController;
use app\api\model\Order as OrderModel;
use app\api\model\Product;
use app\api\model\User;
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
            return json(['code' => 404, 'msg' => '产品不存在']);
        }
        
        // 检查用户余额
        $user = User::where('id', $userId)->find();
        if ($user['money_balance'] < $goods['goods_money']) {
            return json(['code' => 400, 'msg' => '余额不足']);
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
            
            // 扣除余额
            User::where('id', $userId)->dec('money_balance', $goods['goods_money'])->update();
            
            Db::commit();
            return json(['code' => 200, 'msg' => '购买成功', 'data' => ['order_id' => $orderId]]);
        } catch (\Exception $e) {
            Db::rollback();
            return json(['code' => 500, 'msg' => '购买失败']);
        }
    }

    // 我的订单列表
    public function myOrders()
    {
        $userId = request()->userId;
        
        $list = OrderModel::where('user_id', $userId)
            ->order('create_time', 'desc')
            ->select();
        
        return json(['code' => 200, 'data' => $list]);
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
            return json(['code' => 404, 'msg' => '订单不存在']);
        }
        
        return json(['code' => 200, 'data' => $order]);
    }
}
