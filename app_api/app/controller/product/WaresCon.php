<?php
declare(strict_types=1);

namespace app\controller\product;

use app\controller\BaseCon;
use app\model\CommonWaresModel;
use app\model\CommonWaresOrderModel;
use app\model\CommonUserModel;
use app\model\CommonPayMoneyLogModel;
use think\facade\Db;
use think\facade\Cache;

/**
 * 积分商品控制器
 * 负责处理积分兑换商品相关的业务逻辑
 * 提供积分商品列表查询、商品详情查询、积分兑换等功能
 */
class WaresCon extends BaseCon
{
    /**
     * 积分商品列表接口
     * 获取已上架的积分商品列表，按排序和ID倒序排列
     * 用于积分商城页面展示可兑换的商品
     * 
     * @return mixed 返回积分商品列表数据，包含商品名称、所需积分、图片等信息
     */
    public function GetWaresList()
    {
        // 定义需要接收的参数字段：page-当前页码, limit-每页数量
        $postField = 'page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取分页参数，默认为page=1, limit=20
        $page = $post['page'] ?? 1;
        $limit = $post['limit'] ?? 20;
        
        // 构建查询条件：状态为上架
        $map = ['status' => CommonWaresModel::STATUS_ONLINE];
        
        // 调用模型的分页查询方法，按sort正序、ID倒序排列
        $list = CommonWaresModel::PageList($map, '*', (int)$page, (int)$limit, 'sort asc, id desc');
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
    
    /**
     * 积分商品详情接口
     * 根据商品ID获取积分商品详细信息，需要判定商品是否上架
     * 用于积分商品详情页展示商品的完整信息
     * 
     * @return mixed 返回积分商品详情数据，包含商品名称、所需积分、规格、图片、详情介绍等
     */
    public function GetWaresDetail()
    {
        // 定义需要接收的参数字段：id-商品ID
        $postField = 'id';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取商品ID
        $id = $post['id'] ?? 0;
        
        // 校验商品ID是否传入
        if (!$id) {
            return Show(ERROR, [], 'id_required');
        }
        
        // 构建查询条件：商品ID + 上架状态
        $map = [
            'id' => $id,
            'status' => CommonWaresModel::STATUS_ONLINE, // 上架状态
        ];
        
        // 调用模型查询商品详情
        $detail = CommonWaresModel::PageDataOne($map);
        
        // 若商品不存在，则返回错误提示
        if (!$detail) {
            return Show(ERROR, [], 'wares_not_found');
        }
        
        // 返回成功数据
        return Show(SUCCESS, $detail);
    }
    
    /**
     * 积分兑换商品接口
     * 用户选择积分商品并兑换时触发，检查商品状态 -> 验证用户积分 -> 扣除积分 -> 写入流水 -> 创建订单
     * 处理流程：加锁 -> 获取商品 -> 检查状态 -> 验证用户积分 -> 事务处理 -> 返回结果
     * 
     * @return mixed 返回兑换结果，包含订单信息
     */
    public function BuyWares()
    {
        // 定义需要接收的参数字段：wares_id-商品ID, address-收货地址, phone-联系电话
        $postField = 'wares_id,address,phone';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取参数
        $waresId = $post['wares_id'] ?? 0; // 商品ID
        $address = trim($post['address'] ?? ''); // 收货地址
        $phone = trim($post['phone'] ?? ''); // 联系电话
        // 获取当前登录用户的ID
        $userId = $this->request->UserID;
        
        // 校验商品ID是否传入
        if (!$waresId) {
            return Show(ERROR, [], 10080);
        }
        
        // 校验收货地址是否填写
        if (empty($address)) {
            return Show(ERROR, [], 10082);
        }
        
        // 校验联系电话是否填写
        if (empty($phone)) {
            return Show(ERROR, [], 10083);
        }
        
        // 0. 加锁防止并发重复兑换，生成缓存锁key
        $lockKey = 'buy_wares_lock_' . $userId . '_' . $waresId;
        // 检查缓存中是否存在锁，若存在则返回操作频繁提示
        if (Cache::get($lockKey)) {
            return Show(ERROR, [], 10016);
        }
        // 设置缓存锁，有效期5秒
        Cache::set($lockKey, 1, 5);
        
        // 1. 获取积分商品信息
        $wares = CommonWaresModel::PageDataOne([
            'id' => $waresId,
            'status' => CommonWaresModel::STATUS_ONLINE, // 上架状态
        ]);
        
        // 若商品不存在，则删除锁并返回错误提示
        if (!$wares) {
            Cache::delete($lockKey);
            return Show(ERROR, [], 10080);
        }
        
        // 2. 检查商品是否上架
        if ($wares['status'] != CommonWaresModel::STATUS_ONLINE) {
            Cache::delete($lockKey);
            return Show(ERROR, [], 10081);
        }
        
        // 3. 获取用户信息
        $user = CommonUserModel::PageDataOne(['id' => $userId]);
        
        // 若用户不存在，则删除锁并返回错误提示
        if (!$user) {
            Cache::delete($lockKey);
            return Show(ERROR, [], 10017);
        }
        
        // 4. 检查用户积分是否足够兑换商品
        $integralBefore = $user['money_integral'] ?? 0; // 获取用户当前积分
        $waresMoney = $wares['wares_money']; // 商品所需积分
        
        // 若用户积分不足，则删除锁并返回错误提示
        if ($integralBefore < $waresMoney) {
            Cache::delete($lockKey);
            return Show(ERROR, [], 10084);
        }
        
        // 5. 使用事务保存兑换结果，确保数据一致性
        Db::startTrans();
        try {
            // 5.1 扣除用户积分
            $result = CommonUserModel::decIntegral($userId, $waresMoney);
            // 若积分扣除失败，则抛出异常进行回滚
            if (!$result) {
                throw new \Exception('积分扣除失败');
            }
            
            // 5.2 获取扣除后积分
            $integralEnd = $integralBefore - $waresMoney;
            
            // 5.3 写入资金流水记录（积分消耗）
            // 参数：用户ID、类型(支出)、状态(购买积分商品)、资金类型(积分)、变动积分、变动前积分、变动后积分、备注
            CommonPayMoneyLogModel::recordMoneyLog(
                $userId,
                CommonPayMoneyLogModel::TYPE_EXPEND, // 支出
                CommonPayMoneyLogModel::STATUS_BUY_WARES, // 购买积分商品
                CommonPayMoneyLogModel::MONEY_TYPE_INTEGRAL, // 积分
                $waresMoney, // 商品所需积分
                $integralBefore, // 变动前积分
                $integralEnd, // 变动后积分
                '兑换积分商品: ' . $wares['wares_name'] // 备注
            );
            
            // 5.4 创建积分商品订单
            $order = CommonWaresOrderModel::createOrder(
                $userId, // 用户ID
                $wares, // 商品信息
                $address, // 收货地址
                $phone // 联系电话
            );
            
            // 提交事务，确认所有数据变更
            Db::commit();
            // 删除缓存锁，允许用户下次操作
            Cache::delete($lockKey);
            
            // 返回成功数据
            return Show(SUCCESS, $order, 10085);
            
        } catch (\Throwable $e) {
            // 捕获异常，回滚所有数据变更
            Db::rollback();
            // 删除缓存锁
            Cache::delete($lockKey);
            // 返回错误提示
            return Show(ERROR, [], 10086);
        }
    }
}
