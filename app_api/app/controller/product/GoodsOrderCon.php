<?php
declare(strict_types=1);

namespace app\controller\product;

use app\controller\BaseCon;
use app\model\CommonGoodsOrderModel;
use app\model\CommonGoodsModel;
use app\model\CommonIncomeClaimLogModel;
use app\model\CommonUserModel;
use app\model\CommonPayMoneyLogModel;
use think\facade\Db;
use think\facade\Cache;

/**
 * 商品订单控制器
 * 负责处理商品订单相关的业务逻辑，包括订单列表查询、购买记录、收益领取等功能
 */
class GoodsOrderCon extends BaseCon
{
    /**
     * 订单列表接口（含待领取数量）
     * 获取用户所有订单列表，排除已删除的订单，并关联商品信息
     * 
     * @return mixed 返回订单列表数据
     */
    public function GetOrderList()
    {
        // 定义需要接收的参数字段：page-当前页码, limit-每页数量
        $postField = 'page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取分页参数，默认为page=1, limit=20
        $page = $post['page'] ?? 1;
        $limit = $post['limit'] ?? 20;
        // 获取当前登录用户的ID
        $userId = $this->request->UserID;
        
        // 构建查询条件：用户ID + 排除已删除的订单
        $map = [
            'user_id' => $userId,
            'status' => ['<>', CommonGoodsOrderModel::STATUS_DELETE],
        ];
        
        // 调用模型的分页查询方法，按状态正序、ID倒序排列
        $list = CommonGoodsOrderModel::PageList($map, '*', (int)$page, (int)$limit, 'status asc, id desc');
        
        // 如果查询结果不为空，则处理每条订单数据
        if ($list) {
            foreach ($list as &$item) {
                // 根据商品ID查询商品详细信息
                $goodsInfo = CommonGoodsModel::PageDataOne(
                    ['id' => $item['goods_id']], 
                    'id,goods_name,head_img,goods_money,period,revenue_lv,day_red'
                );
                // 将商品信息赋值给订单数据，若不存在则为空对象
                $item['goods_info'] = $goodsInfo ?: (object)[];
            }
        }
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
    
    /**
     * 购买记录接口（含待领取数量）
     * 获取用户已购买的商品订单列表，仅查询正常分红中的订单，并附带待领取收益数量
     * 
     * @return mixed 返回购买记录列表数据
     */
    public function GetBuyRecordList()
    {
        // 定义需要接收的参数字段：page-当前页码, limit-每页数量
        $postField = 'page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取分页参数，默认为page=1, limit=20
        $page = $post['page'] ?? 1;
        $limit = $post['limit'] ?? 20;
        // 获取当前登录用户的ID
        $userId = $this->request->UserID;
        
        // 构建查询条件：用户ID + 状态为正常分红中(0)
        $map = [
            'user_id' => $userId,
            'status' => CommonGoodsOrderModel::STATUS_NORMAL,
        ];
        
        // 调用模型的分页查询方法，按状态正序、ID倒序排列
        $list = CommonGoodsOrderModel::PageList($map, '*', (int)$page, (int)$limit, 'status asc, id desc');
        
        // 如果查询结果不为空，则处理每条订单数据
        if ($list) {
            foreach ($list as &$item) {
                // 根据商品ID查询商品详细信息
                $goodsInfo = CommonGoodsModel::PageDataOne(
                    ['id' => $item['goods_id']], 
                    'id,goods_name,head_img,goods_money,period,revenue_lv,day_red'
                );
                // 将商品信息赋值给订单数据，若不存在则为空对象
                $item['goods_info'] = $goodsInfo ?: (object)[];
                
                // 查询该订单的待领取收益数量（未过期且待领取状态）
                $pendingCount = CommonIncomeClaimLogModel::getPendingCount($item['id']);
                // 将待领取数量赋值给订单数据
                $item['pending_claim_count'] = $pendingCount;
            }
        }
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }

    /**
     * 领取收益接口
     * 用户点击领取按钮时触发，自动查找最近即将过期的待领取记录，进行领取处理
     * 处理流程：加锁 -> 查询最近过期记录 -> 增加用户余额 -> 写入流水 -> 更新记录状态 -> 更新订单数据
     * 
     * @return mixed 返回领取结果，包含本次领取金额和剩余待领取数量
     */
    public function ClaimIncome()
    {
        // 获取当前登录用户的ID
        $userId = $this->request->UserID;

        // 生成缓存锁key，防止用户重复点击（同一用户5秒内只能领取一次）
        $lockKey = 'claim_income_lock_' . $userId;
        // 检查缓存中是否存在锁，若存在则返回操作频繁提示
        if (Cache::get($lockKey)) {
            return Show(ERROR, [], 10016);
        }
        // 设置缓存锁，有效期5秒
        Cache::set($lockKey, 1, 5);

        // 查询用户最近即将过期的待领取收益记录（按过期时间升序排列，取第一条）
        $claimLog = CommonIncomeClaimLogModel::getNearestPendingClaim($userId);

        // 若不存在待领取记录，则删除锁并返回提示信息
        if (!$claimLog) {
            Cache::delete($lockKey);
            return Show(ERROR, [], 10091);
        }

        // 开启事务处理，确保数据一致性
        Db::startTrans();
        try {
            // 获取当前时间
            $now = date('Y-m-d H:i:s');
            // 获取本次需要领取的金额
            $claimAmount = $claimLog['claim_amount'];

            // 根据用户ID查询用户信息
            $user = CommonUserModel::PageDataOne(['id' => $userId]);
            // 若用户不存在，则抛出异常进行回滚
            if (!$user) {
                throw new \Exception('用户不存在');
            }

            // 获取用户当前余额（领取前的余额）
            $moneyBefore = $user['money_balance'] ?? 0;

            // 调用模型方法增加用户余额
            $result = CommonUserModel::incMoney($userId, $claimAmount);
            // 若余额增加失败，则抛出异常进行回滚
            if (!$result) {
                throw new \Exception('余额增加失败');
            }

            // 计算领取后的余额
            $moneyEnd = $moneyBefore + $claimAmount;

            // 记录资金流水日志
            // 参数：用户ID、类型(收入)、状态(用户每日收益)、资金类型(余额)、变动金额、变动前余额、变动后余额、备注
            CommonPayMoneyLogModel::recordMoneyLog(
                $userId,
                CommonPayMoneyLogModel::TYPE_INCOME,
                CommonIncomeClaimLogModel::STATUS_USER_DAILY_INCOME,
                CommonPayMoneyLogModel::MONEY_TYPE_BALANCE,
                $claimAmount,
                $moneyBefore,
                $moneyEnd,
                '领取收益'
            );

            // 更新领取记录的状态为已领取，并记录领取时间
            $claimLog->save([
                'status' => CommonIncomeClaimLogModel::STATUS_CLAIMED, // 已领取状态
                'claim_time' => $now, // 领取时间
            ]);

            // 根据订单ID查询关联的订单信息
            $order = CommonGoodsOrderModel::PageDataOne(['id' => $claimLog['order_id']]);
            // 若订单不存在，则抛出异常进行回滚
            if (!$order) {
                throw new \Exception('订单不存在');
            }

            // 计算更新后的订单数据
            $alreadyRedMoney = $order['already_red_money'] + $claimAmount; // 已分红金额 + 本次领取金额
            $alreadyRedDay = $order['already_red_day'] + 1; // 已分红天数 + 1
            $surplusRedMoney = $order['surplus_red_money'] - $claimAmount; // 剩余分红金额 - 本次领取金额
            $surplusRedDay = $order['surplus_red_day'] - 1; // 剩余分红天数 - 1

            // 更新订单的分红相关数据
            CommonGoodsOrderModel::where('id', $order['id'])->update([
                'already_red_money' => $alreadyRedMoney, // 更新已分红金额
                'already_red_day' => $alreadyRedDay, // 更新已分红天数
                'surplus_red_money' => $surplusRedMoney, // 更新剩余分红金额
                'surplus_red_day' => $surplusRedDay, // 更新剩余分红天数
                'last_red_date' => $now, // 更新上次分红时间
                'update_time' => $now, // 更新时间
            ]);

            // 提交事务，确认所有数据变更
            Db::commit();
            // 删除缓存锁，允许用户下次操作
            Cache::delete($lockKey);

            // 查询用户剩余的待领取收益数量
            $pendingCount = CommonIncomeClaimLogModel::getUserTotalPendingCount($userId);

            // 返回成功数据
            return Show(SUCCESS, [
                'claimed_amount' => $claimAmount, // 本次领取金额
                'pending_count' => $pendingCount, // 剩余待领取数量
            ], 10092);

        } catch (\Throwable $e) {
            // 捕获异常，回滚所有数据变更
            Db::rollback();
            // 删除缓存锁
            Cache::delete($lockKey);
            // 返回错误提示
            return Show(ERROR, [], 10093);
        }
    }

    /**
     * 获取待领取数量接口
     * 查询当前用户所有待领取收益的数量（未过期且状态为待领取）
     * 
     * @return mixed 返回待领取数量
     */
    public function GetPendingClaimCount()
    {
        // 获取当前登录用户的ID
        $userId = $this->request->UserID;

        // 调用模型方法查询用户所有待领取收益数量
        $count = CommonIncomeClaimLogModel::getUserTotalPendingCount($userId);

        // 返回成功数据
        return Show(SUCCESS, ['pending_count' => $count]);
    }
}
