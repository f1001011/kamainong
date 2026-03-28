<?php
declare(strict_types=1);

namespace app\controller\config;

use app\controller\BaseCon;
use app\model\CommonPayMoneyLogModel;
use app\model\CommonUserModel;
use app\model\CommonVipModel;
use app\model\CommonVipDailyRewardLogModel;
use think\facade\Cache;
use think\facade\Db;

/**
 * VIP控制器
 * 负责处理VIP等级配置相关的业务逻辑
 * 提供VIP等级列表查询，用于用户查看各VIP等级权益和升级要求
 */
class VipCon extends BaseCon
{
    /**
     * VIP等级列表接口
     * 获取所有VIP等级配置信息，按VIP等级正序排列
     * 用于用户中心展示VIP等级体系，了解各等级权益和升级所需条件
     * 
     * @return mixed 返回VIP等级列表数据，包含等级、所需经验、每日奖励等信息
     */
    public function GetVipList()
    {
        // 调用模型的不分页查询方法，按VIP等级正序、ID正序排列
        $list = CommonVipModel::PageData([], 'vip asc, id asc');
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }

    /**
     * 领取VIP每日奖励接口
     * 根据当前用户VIP等级查询可领取奖励金额，并按配置区分发放到余额或积分。
     * 处理流程：加锁 -> 查询用户VIP等级 -> 检查今日是否已领取 -> 发放奖励 -> 写资金流水 -> 写领取日志
     *
     * @return mixed 返回领取结果，包含VIP等级、奖励金额和奖励发放类型
     */
    public function ClaimDailyReward()
    {
        // 获取当前登录用户ID，并为领取动作加锁，避免重复点击造成重复领取
        $userId = $this->request->UserID;
        $lockKey = 'vip_daily_reward_claim_' . $userId;
        if (Cache::get($lockKey)) {
            return Show(ERROR, [], 10016);
        }
        Cache::set($lockKey, 1, 5);

        // 查询当前用户信息，用于获取VIP等级和账户金额
        $user = CommonUserModel::PageDataOne(['id' => $userId]);
        if (!$user || (int)($user['level_vip'] ?? 0) <= 0) {
            Cache::delete($lockKey);
            return Show(ERROR, [], 10110);
        }

        // 根据用户当前VIP等级查询对应的每日奖励配置
        $vipLevel = (int)$user['level_vip'];
        $vipConfig = CommonVipModel::PageDataOne(['vip' => $vipLevel]);
        if (!$vipConfig) {
            Cache::delete($lockKey);
            return Show(ERROR, [], 10110);
        }

        // 检查今天是否已领取过VIP每日奖励
        $claimDate = date('Y-m-d');
        $todayLog = CommonVipDailyRewardLogModel::getTodayClaim($userId, $claimDate);
        if ($todayLog) {
            Cache::delete($lockKey);
            return Show(ERROR, [], 10111);
        }

        // reward_money 为当前VIP等级每天可领取的基础奖励金额
        $rewardAmount = (float)($vipConfig['reward_money'] ?? 0);
        if ($rewardAmount <= 0) {
            Cache::delete($lockKey);
            return Show(ERROR, [], 10110);
        }

        // 开启事务，确保“发放奖励 + 写资金流水 + 写领取日志”一致成功
        Db::startTrans();
        try {
            if (VIP_DAILY_REWARD_TYPE == VIP_DAILY_REWARD_TYPE_BALANCE) {
                // 当前配置为发放余额：记录变动前余额 -> 增加余额 -> 计算变动后余额
                $moneyBefore = (float)($user['money_balance'] ?? 0);
                $result = CommonUserModel::incMoney($userId, $rewardAmount);
                if (!$result) {
                    throw new \Exception('VIP每日奖励发放余额失败');
                }
                $moneyEnd = $moneyBefore + $rewardAmount;

                // 写入余额资金流水，便于后续查询用户账户变动明细
                CommonPayMoneyLogModel::recordMoneyLog(
                    $userId,
                    CommonPayMoneyLogModel::TYPE_INCOME,
                    CommonPayMoneyLogModel::STATUS_VIP_DAILY_REWARD,
                    CommonPayMoneyLogModel::MONEY_TYPE_BALANCE,
                    $rewardAmount,
                    $moneyBefore,
                    $moneyEnd,
                    'VIP每日奖励 - VIP' . $vipLevel
                );
            } else {
                // 当前配置为发放积分：记录变动前积分 -> 增加积分 -> 计算变动后积分
                $integralBefore = (float)($user['money_integral'] ?? 0);
                $result = CommonUserModel::incIntegral($userId, $rewardAmount);
                if (!$result) {
                    throw new \Exception('VIP每日奖励发放积分失败');
                }
                $integralEnd = $integralBefore + $rewardAmount;

                // 写入积分资金流水，便于后续查询用户积分变动明细
                CommonPayMoneyLogModel::recordMoneyLog(
                    $userId,
                    CommonPayMoneyLogModel::TYPE_INCOME,
                    CommonPayMoneyLogModel::STATUS_VIP_DAILY_REWARD,
                    CommonPayMoneyLogModel::MONEY_TYPE_INTEGRAL,
                    $rewardAmount,
                    $integralBefore,
                    $integralEnd,
                    'VIP每日奖励 - VIP' . $vipLevel
                );
            }

            // 写入VIP每日奖励领取记录，claim_date 作为“当天是否已领取”的判断依据
            CommonVipDailyRewardLogModel::createClaimLog($userId, $vipLevel, $rewardAmount, $claimDate);

            Db::commit();
            Cache::delete($lockKey);

            // 返回领取结果，前端可根据 reward_type 判断本次奖励发放到余额还是积分
            return Show(SUCCESS, [
                'vip_level' => $vipLevel,
                'reward_amount' => $rewardAmount,
                'reward_type' => VIP_DAILY_REWARD_TYPE,
                'claim_date' => $claimDate,
            ], 10112);
        } catch (\Throwable $e) {
            Db::rollback();
            Cache::delete($lockKey);
            return Show(ERROR, [], 10113);
        }
    }
}
