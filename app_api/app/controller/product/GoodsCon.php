<?php
declare(strict_types=1);

namespace app\controller\product;

use app\controller\BaseCon;
use app\model\CommonGoodsModel;
use app\model\CommonGoodsOrderModel;
use app\model\CommonPayMoneyLogModel;
use app\model\CommonUserModel;
use app\model\CommonVipModel;
use think\facade\Db;
use think\facade\Cache;

/**
 * 商品控制器
 * 负责处理投资商品相关的业务逻辑
 * 提供商品列表查询、商品详情查询、购买商品等功能
 */
class GoodsCon extends BaseCon
{
    /**
     * 商品列表接口
     * 获取投资商品列表，支持按状态筛选，按排序和ID倒序排列
     * 用于APP首页和商品列表页展示可投资的商品
     * 
     * @return mixed 返回商品列表数据，包含商品名称、价格、收益率、周期等信息
     */
    public function GetGoodsList()
    {
        // 定义需要接收的参数字段：status-商品状态, page-当前页码, limit-每页数量
        $postField = 'status,page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取查询参数
        $status = $post['status'] ?? 0; // 商品状态：1-上架 2-即将推出
        $page = $post['page'] ?? 1; // 当前页码，默认1
        $limit = $post['limit'] ?? 20; // 每页数量，默认20
        
        // 构建查询条件
        $map = [];
        // 若传入的状态为上架或即将推出，则添加状态筛选条件
        if ($status == CommonGoodsModel::STATUS_ONLINE || $status == CommonGoodsModel::STATUS_COMING_SOON) {
            $map['status'] = $status;
        }
        
        // 添加删除状态筛选：未删除
        $map['del'] = CommonGoodsModel::DEL_NO;
        
        // 调用模型的分页查询方法，按sort正序、ID倒序排列
        $list = CommonGoodsModel::PageList($map, '*', (int)$page, (int)$limit, 'sort asc, id desc');
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
    
    /**
     * 商品详情接口
     * 根据商品ID获取商品详细信息，需要判定商品是否上架
     * 用于商品详情页展示商品的完整信息
     * 
     * @return mixed 返回商品详情数据，包含商品名称、价格、收益率、周期、担保公司等信息
     */
    public function GetGoodsDetail()
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
        
        // 构建查询条件：商品ID + 上架状态 + 未删除
        $map = [
            'id' => $id,
            'status' => CommonGoodsModel::STATUS_ONLINE, // 上架状态
            'del' => CommonGoodsModel::DEL_NO, // 未删除
        ];
        
        // 调用模型查询商品详情
        $detail = CommonGoodsModel::PageDataOne($map);
        
        // 若商品不存在，则返回错误提示
        if (!$detail) {
            return Show(ERROR, [], 'goods_not_found');
        }
        
        // 返回成功数据
        return Show(SUCCESS, $detail);
    }
    
    /**
     * 购买商品接口
     * 用户选择商品并购买时触发，检查商品状态 -> 验证用户余额 -> 扣除余额 -> 写入流水 -> 创建订单
     * 处理流程：加锁 -> 获取商品 -> 检查状态 -> 计算金额 -> 验证用户 -> 事务处理 -> 返回结果
     * 
     * @return mixed 返回购买结果，包含订单信息
     */
    public function BuyGoods()
    {
        // 定义需要接收的参数字段：goods_id-商品ID, num-购买数量
        $postField = 'goods_id,num';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取参数
        $goodsId = $post['goods_id'] ?? 0; // 商品ID
        $num = $post['num'] ?? 1; // 购买数量，默认1
        // 获取当前登录用户的ID
        $userId = $this->request->UserID;
        
        // 校验商品ID是否传入
        if (!$goodsId) {
            return Show(ERROR, [], 10073);
        }
        
        // 校验购买数量是否合法
        if ($num <= 0) {
            return Show(ERROR, [], 10075);
        }
        
        // 0. 加锁防止并发重复购买，生成缓存锁key
        $lockKey = 'buy_goods_lock_' . $userId . '_' . $goodsId;
        // 检查缓存中是否存在锁，若存在则返回操作频繁提示
        if (Cache::get($lockKey)) {
            return Show(ERROR, [], 10016);
        }
        // 设置缓存锁，有效期5秒
        Cache::set($lockKey, 1, 5);
        
        // 1. 获取商品信息
        $goods = CommonGoodsModel::PageDataOne([
            'id' => $goodsId,
            'status' => CommonGoodsModel::STATUS_ONLINE, // 上架状态
            'del' => CommonGoodsModel::DEL_NO, // 未删除
        ]);
        
        // 若商品不存在，则删除锁并返回错误提示
        if (!$goods) {
            Cache::delete($lockKey);
            return Show(ERROR, [], 10073);
        }
        
        // 2. 检查商品是否上架
        if ($goods['status'] != CommonGoodsModel::STATUS_ONLINE) {
            Cache::delete($lockKey);
            return Show(ERROR, [], 10074);
        }
        
        // 3. 计算订单金额（商品单价 * 购买数量）
        $orderMoney = $goods['goods_money'] * $num;
        
        // 4. 获取用户信息
        $user = CommonUserModel::PageDataOne(['id' => $userId]);
        
        // 若用户不存在，则删除锁并返回错误提示
        if (!$user) {
            Cache::delete($lockKey);
            return Show(ERROR, [], 10017);
        }
        
        // 5. 检查用户等级是否满足购买条件（若商品设置了VIP等级限制）
        if ($goods['level_vip'] > 0 && $user['level_vip'] < $goods['level_vip']) {
            Cache::delete($lockKey);
            return Show(ERROR, [], 10079);
        }
        
        // 6. 检查用户余额是否足够支付订单
        $moneyBefore = $user['money_balance'] ?? 0; // 获取用户当前余额
        if ($moneyBefore < $orderMoney) {
            Cache::delete($lockKey);
            return Show(ERROR, [], 10076);
        }
        
        // 7. 使用事务保存购买结果，确保数据一致性
        Db::startTrans();
        try {
            // 7.1 减少用户余额
            $result = CommonUserModel::decMoney($userId, $orderMoney);
            // 若余额扣除失败，则抛出异常进行回滚
            if (!$result) {
                throw new \Exception('余额扣除失败');
            }
            
            // 7.2 获取扣款后余额
            $moneyEnd = $moneyBefore - $orderMoney;
            
            // 7.3 写入资金流水记录
            // 参数：用户ID、类型(支出)、状态(购买商品)、资金类型(余额)、变动金额、变动前余额、变动后余额、备注
            CommonPayMoneyLogModel::recordMoneyLog(
                $userId,
                CommonPayMoneyLogModel::TYPE_EXPEND, // 支出
                CommonPayMoneyLogModel::STATUS_BUY_GOODS, // 购买商品
                CommonPayMoneyLogModel::MONEY_TYPE_BALANCE, // 余额
                $orderMoney, // 订单金额
                $moneyBefore, // 变动前余额
                $moneyEnd, // 变动后余额
                '购买商品: ' . $goods['goods_name'] // 备注
            );
            
            // 7.4 创建商品订单
            $order = CommonGoodsOrderModel::createOrder(
                $userId, // 用户ID
                $user['user_name'], // 用户名
                $goods, // 商品信息
                $num // 购买数量
            );
            
            // 7.5 处理VIP升级逻辑
            // 当前项目具体走哪一套升级规则，统一由 VIP_UPGRADE_MODE 配置控制：
            // 0-关闭
            // 1-按购买金额累计经验升级
            // 2-按指定商品和数量升级
            // 这里收口调用模型方法，后续即使增加第三套规则，也不需要改购买主流程
            CommonVipModel::handleUpgradeAfterBuy(
                $user,
                $goods,
                (float)$orderMoney,
                (int)$num
            );

            // 提交事务，确认所有数据变更
            Db::commit();
            // 删除缓存锁，允许用户下次操作
            Cache::delete($lockKey);
            
            // 返回成功数据
            return Show(SUCCESS, $order, 10077);
            
        } catch (\Throwable $e) {
            // 捕获异常，回滚所有数据变更
            Db::rollback();
            // 删除缓存锁
            Cache::delete($lockKey);
            // 如果是VIP升级过程中抛出的状态码异常，则优先返回对应多语言状态码
            $errorCode = (int)$e->getCode();
            if ($errorCode > 0) {
                return Show(ERROR, [], $errorCode);
            }

            // 其他未单独定义状态码的异常，统一返回购买失败
            return Show(ERROR, [], 10078);
        }
    }
}
