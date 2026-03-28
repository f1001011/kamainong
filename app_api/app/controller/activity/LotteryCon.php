<?php
declare(strict_types=1);

namespace app\controller\activity;

use app\controller\BaseCon;
use app\model\CommonLotteryChanceModel;
use app\model\CommonLotteryLogModel;
use app\model\CommonLotteryPrizeModel;
use app\model\CommonUserModel;
use app\model\CommonPayMoneyLogModel;
use think\facade\Db;
use think\facade\Cache;

/**
 * 抽奖/转盘控制器
 * 负责处理用户抽奖活动相关的业务逻辑
 * 提供抽奖次数查询、抽奖历史查询、奖品列表查询、执行抽奖等功能
 */
class LotteryCon extends BaseCon
{
    /**
     * 获取抽奖次数接口
     * 获取当前用户剩余的有效抽奖次数，按过期时间升序排列
     * 用于用户查看当前可用的抽奖机会
     * 
     * @return mixed 返回抽奖次数信息，包含剩余次数、已用次数、过期时间等
     */
    public function GetLotteryChance()
    {
        // 获取当前登录用户的ID
        $userId = $this->request->UserID;
        
        // 构建查询条件：当前用户ID + 剩余次数大于0 + 未过期
        $map = [
            'user_id' => $userId, // 当前用户ID
            'rest_chance' => ['>', 0], // 剩余次数大于0
            'expire_time' => ['>=', date('Y-m-d H:i:s')], // 过期时间大于当前时间
        ];
        
        // 调用模型的不分页查询方法，按过期时间升序排列
        $list = CommonLotteryChanceModel::PageData($map, 'expire_time asc');
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
    
    /**
     * 抽奖历史记录接口
     * 获取当前用户的抽奖中奖记录列表，按ID倒序排列
     * 用于用户中心查看抽奖历史
     * 
     * @return mixed 返回抽奖记录列表数据，包含奖品名称、奖品类型、中奖金额、中奖时间等
     */
    public function GetLotteryLog()
    {
        // 定义需要接收的参数字段：page-当前页码, limit-每页数量
        $postField = 'page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取分页参数，默认为page=1, limit=20
        $page = $post['page'] ?? 1;
        $limit = $post['limit'] ?? 20;
        // 获取当前登录用户的ID
        $userId = $this->request->UserID;
        
        // 构建查询条件：当前用户ID
        $map = ['user_id' => $userId];
        
        // 调用模型的分页查询方法，按ID倒序排列
        $list = CommonLotteryLogModel::PageList($map, '*', (int)$page, (int)$limit, 'id desc');
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
    
    /**
     * 奖品列表接口
     * 获取所有已启用的抽奖奖品列表
     * 用于转盘页面展示可抽取的奖品信息
     * 
     * @return mixed 返回奖品列表数据，包含奖品名称、类型、金额、概率、图片等
     */
    public function GetPrizeList()
    {
        // 构建查询条件：状态为启用
        $map = ['status' => 1];
        
        // 调用模型的不分页查询方法
        $list = CommonLotteryPrizeModel::PageData($map);
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
    
    /**
     * 执行抽奖接口
     * 用户点击抽奖时触发，检查抽奖资格 -> 根据概率计算中奖 -> 扣除次数 -> 增加余额 -> 记录流水 -> 记录抽奖结果
     * 处理流程：加锁 -> 检查资格 -> 获取奖品 -> 事务处理 -> 返回结果
     * 
     * @return mixed 返回抽奖结果，包含奖品信息
     */
    public function DoLottery()
    {
        // 获取当前登录用户的ID
        $userId = $this->request->UserID;
        
        // 0. 加锁防止并发重复抽奖，生成缓存锁key
        $lockKey = 'lottery_lock_' . $userId;
        // 检查缓存中是否存在锁，若存在则返回操作频繁提示
        if (Cache::get($lockKey)) {
            return Show(ERROR, [], 10016);
        }
        // 设置缓存锁，有效期5秒
        Cache::set($lockKey, 1, 5); // 5秒内不能重复请求
        
        // 1. 检查用户是否有抽奖资格（存在有效的抽奖次数记录且剩余次数大于0且未过期）
        $chanceInfo = CommonLotteryChanceModel::PageDataOne([
            'user_id' => $userId,
            'rest_chance' => ['>', 0],
            'expire_time' => ['>=', date('Y-m-d H:i:s')],
        ]);
        
        // 若不存在有效的抽奖次数，则删除锁并返回提示信息
        if (!$chanceInfo) {
            Cache::delete($lockKey);
            return Show(ERROR, [], 10070);
        }
        
        // 2. 获取抽奖奖品列表（只获取已启用的现金奖励类型，且金额<=10000，排除实物奖品）
        $prizeList = CommonLotteryPrizeModel::PageData([
            'status' => CommonLotteryPrizeModel::STATUS_ENABLE, // 启用状态
            'type' => CommonLotteryPrizeModel::TYPE_CASH, // 现金类型
            'amount' => ['<=', 10000], // 金额小于等于10000
        ]);
        
        // 若奖品列表为空，则删除锁并返回提示信息
        if (!$prizeList) {
            Cache::delete($lockKey);
            return Show(ERROR, [], 10072);
        }
        
        // 3. 根据概率计算中奖奖品
        $prize = $this->calcPrize($prizeList);
        
        // 4. 使用事务保存抽奖结果，确保数据一致性
        Db::startTrans();
        try {
            // 4.1 减少用户抽奖次数
            CommonLotteryChanceModel::decChance($userId);
            
            // 4.2 获取用户当前余额（增加余额前的金额）
            $user = CommonUserModel::PageDataOne(['id' => $userId]);
            $moneyBefore = $user['money_balance'] ?? 0;
            
            // 4.3 增加用户余额（中奖金额）
            CommonUserModel::incMoney($userId, $prize['amount']);
            // 计算增加后的余额
            $moneyEnd = $moneyBefore + $prize['amount'];
            
            // 4.4 写入资金流水记录
            // 参数：用户ID、类型(收入)、状态(抽奖奖励)、资金类型(余额)、变动金额、变动前余额、变动后余额、备注
            CommonPayMoneyLogModel::recordMoneyLog(
                $userId,
                CommonPayMoneyLogModel::TYPE_INCOME, // 收入
                CommonPayMoneyLogModel::STATUS_LOTTERY_REWARD, // 抽奖奖励
                CommonPayMoneyLogModel::MONEY_TYPE_BALANCE, // 余额
                $prize['amount'], // 中奖金额
                $moneyBefore, // 变动前余额
                $moneyEnd, // 变动后余额
                '抽奖奖励' // 备注
            );
            
            // 4.5 写入抽奖记录
            $lotteryLog = CommonLotteryLogModel::recordPrize(
                $userId,
                $prize['id'], // 奖品ID
                $prize['name'], // 奖品名称
                $prize['type'], // 奖品类型
                $prize['amount'] // 中奖金额
            );
            
            // 提交事务，确认所有数据变更
            Db::commit();
            // 删除缓存锁，允许用户下次操作
            Cache::delete($lockKey);
            
            // 返回成功数据
            return Show(SUCCESS, $lotteryLog, 10071);
            
        } catch (\Throwable $e) {
            // 捕获异常，回滚所有数据变更
            Db::rollback();
            // 删除缓存锁
            Cache::delete($lockKey);
            // 返回错误提示
            return Show(ERROR, [], 10072);
        }
    }
    
    /**
     * 根据概率计算中奖奖品
     * 根据各奖品的概率使用随机算法计算中奖结果
     * 
     * @param array $prizeList 奖品列表
     * @return array 返回中奖的奖品信息
     */
    private function calcPrize($prizeList)
    {
        // 计算总概率
        $totalProbability = 0;
        foreach ($prizeList as $item) {
            $totalProbability += (float)$item['probability'];
        }
        
        // 生成0到总概率之间的随机数
        $random = mt_rand(1, (int)($totalProbability * 100)) / 100;
        
        // 遍历奖品列表，根据概率区间确定中奖奖品
        $current = 0;
        foreach ($prizeList as $item) {
            $current += (float)$item['probability'];
            if ($random <= $current) {
                return $item;
            }
        }
        
        // 若计算有误，默认返回第一个奖品
        return $prizeList[0];
    }
}
