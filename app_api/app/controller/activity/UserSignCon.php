<?php
declare(strict_types=1);

namespace app\controller\activity;

use app\controller\BaseCon;
use app\model\CommonUserSignLogModel;
use app\model\CommonUserModel;
use app\model\CommonPayMoneyLogModel;
use think\facade\Db;
use think\facade\Cache;

/**
 * 签到控制器
 * 负责处理用户签到相关的业务逻辑
 * 提供签到功能，根据连续签到天数发放奖励
 */
class UserSignCon extends BaseCon
{
    /**
     * 签到接口
     * 用户点击签到时触发，检查今日是否已签到 -> 计算连续签到天数 -> 发放奖励 -> 写入签到记录
     * 处理流程：加锁 -> 检查今天是否已签到 -> 计算连续签到天数 -> 计算奖励金额 -> 事务处理 -> 返回结果
     * 
     * @return mixed 返回签到结果，包含本次签到奖励、连续签到天数、明日奖励预览等信息
     */
    public function DoSign()
    {
        // 获取当前登录用户的ID
        $userId = $this->request->UserID;

        // 0. 加锁防止并发重复签到
        // 同一个用户在短时间内重复点击签到时，直接拦截，避免出现重复加金额、重复写签到记录的问题
        $lockKey = 'sign_lock_' . $userId;
        // 检查缓存中是否存在锁，若存在说明当前已有签到请求在处理中
        if (Cache::get($lockKey)) {
            return Show(ERROR, [], 10016);
        }
        // 设置缓存锁，有效期5秒，正常情况下本次签到流程会在5秒内执行完成
        Cache::set($lockKey, 1, 5);

        // 1. 检查今天是否已签到
        $todaySign = CommonUserSignLogModel::getTodaySign($userId);
        // 若今天已签到，则直接返回“已签到”，并及时释放缓存锁
        if ($todaySign) {
            Cache::delete($lockKey);
            return Show(ERROR, [], 10101);
        }

        // 2. 获取用户上次签到记录中的连续签到天数
        // 这个值只是“上一次签到结束时”的连续天数，今天是否继续累计还要结合最后签到日期判断
        $lastEvenSign = CommonUserSignLogModel::getLastEvenSign($userId);

        // 3. 计算今天的连续签到天数
        // 判断规则：
        // - 如果最后一次签到日期是昨天，说明今天属于连续签到，天数 +1
        // - 否则视为新的签到周期，连续签到天数重置为1
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        $lastSign = CommonUserSignLogModel::where('uid', $userId)
            ->order('id', 'desc')
            ->find();

        $evenSign = 1; // 默认重新计算连续签到天数
        if ($lastSign) {
            $lastSignDate = date('Y-m-d', strtotime($lastSign['create_time']));
            // 如果上次签到是昨天，连续天数+1，否则重置为1
            if ($lastSignDate == $yesterday) {
                $evenSign = $lastEvenSign + 1;
            } else {
                $evenSign = 1;
            }
        }

        // 4. 分别计算本次签到的基础奖励、额外奖励和总奖励金额
        // 基础奖励：只从 SIGN_DAILY_REWARD 中读取
        // 额外奖励：只从 SIGN_EXTRA_DAYS 中读取
        // 总奖励：基础奖励 + 额外奖励
        // 例如：第3天可能基础奖励是10，额外奖励是20，则本次总奖励是30
        $baseReward = $this->calculateReward($evenSign);
        $extraReward = $this->getExtraReward($evenSign);
        $rewardAmount = $baseReward + $extraReward;

        // 5. 使用事务保存签到结果，确保“加金额 + 写流水 + 写签到记录”三个动作要么全部成功，要么全部回滚
        Db::startTrans();
        try {
            // 获取用户信息，用于拿到当前余额/积分并计算变动前后金额
            $user = CommonUserModel::PageDataOne(['id' => $userId]);
            if (!$user) {
                throw new \Exception('用户不存在');
            }

            // 根据奖励类型发放奖励
            // SIGN_REWARD_TYPE = 1 表示奖励到余额账户
            // SIGN_REWARD_TYPE = 2 表示奖励到积分账户
            if (SIGN_REWARD_TYPE == 1) {
                // 发放余额奖励：先记录变动前余额，再增加余额，最后计算变动后余额
                $moneyBefore = $user['money_balance'] ?? 0;
                $result = CommonUserModel::incMoney($userId, $rewardAmount);
                if (!$result) {
                    throw new \Exception('余额增加失败');
                }
                $moneyEnd = $moneyBefore + $rewardAmount;

                // 写入资金流水记录
                // 资金流水中记录的是本次签到最终发放的总奖励金额
                CommonPayMoneyLogModel::recordMoneyLog(
                    $userId,
                    CommonPayMoneyLogModel::TYPE_INCOME,
                    CommonPayMoneyLogModel::STATUS_SIGN_REWARD,
                    CommonPayMoneyLogModel::MONEY_TYPE_BALANCE,
                    $rewardAmount,
                    $moneyBefore,
                    $moneyEnd,
                    '签到奖励 - 第' . $evenSign . '天'
                );
            } else {
                // 发放积分奖励：先记录变动前积分，再增加积分，最后计算变动后积分
                $integralBefore = $user['money_integral'] ?? 0;
                $result = CommonUserModel::incIntegral($userId, $rewardAmount);
                if (!$result) {
                    throw new \Exception('积分增加失败');
                }
                $integralEnd = $integralBefore + $rewardAmount;

                // 写入资金流水记录
                // 资金流水中记录的是本次签到最终发放的总奖励金额
                CommonPayMoneyLogModel::recordMoneyLog(
                    $userId,
                    CommonPayMoneyLogModel::TYPE_INCOME,
                    CommonPayMoneyLogModel::STATUS_SIGN_REWARD,
                    CommonPayMoneyLogModel::MONEY_TYPE_INTEGRAL,
                    $rewardAmount,
                    $integralBefore,
                    $integralEnd,
                    '签到奖励 - 第' . $evenSign . '天'
                );
            }

            // 写入签到记录
            // 这里写入的是本次实际发放的总奖励金额，方便后续查询签到历史时直接看到每天总共拿到了多少
            CommonUserSignLogModel::createSign($userId, $rewardAmount, $evenSign);

            // 提交事务，确认所有数据变更
            Db::commit();
            // 删除缓存锁，允许用户后续再次发起其他请求
            Cache::delete($lockKey);

            // 计算明天的奖励金额预览
            // 这里同样拆成基础奖励和额外奖励，方便前端直观展示签到规则
            $tomorrowDay = $this->normalizeRewardDay($evenSign + 1);
            $tomorrowBaseReward = $this->calculateReward($evenSign + 1);
            $tomorrowExtraReward = $this->getExtraReward($evenSign + 1);
            $tomorrowReward = $tomorrowBaseReward + $tomorrowExtraReward;
            $isExtraDay = $tomorrowExtraReward > 0;

            // 返回成功数据
            return Show(SUCCESS, [
                'reward_amount' => $rewardAmount, // 本次签到总奖励金额 = 基础奖励 + 额外奖励
                'base_reward' => $baseReward, // 本次签到基础奖励金额
                'extra_reward' => $extraReward, // 本次签到额外奖励金额
                'reward_type' => SIGN_REWARD_TYPE, // 奖励发放类型：1-余额，2-积分
                'even_sign' => $evenSign, // 当前连续签到天数
                'tomorrow_reward' => $tomorrowReward, // 明天签到可获得的总奖励金额
                'tomorrow_base_reward' => $tomorrowBaseReward, // 明天签到基础奖励
                'tomorrow_extra_reward' => $tomorrowExtraReward, // 明天签到额外奖励
                'is_extra_day' => $isExtraDay, // 明天是否属于额外奖励日
            ], 10100);

        } catch (\Throwable $e) {
            // 捕获异常后回滚事务，确保不会出现“钱加了但签到记录没写”或“签到记录写了但钱没加”的异常状态
            Db::rollback();
            // 无论成功还是失败，都需要删除缓存锁，避免用户后续无法继续签到
            Cache::delete($lockKey);
            // 返回统一的签到失败提示
            return Show(ERROR, [], 10102);
        }
    }

    /**
     * 计算签到基础奖励金额
     * 根据连续签到天数从 SIGN_DAILY_REWARD 配置中获取基础奖励金额。
     *
     * 规则说明：
     * 1. 这里只读取基础奖励，不包含额外奖励
     * 2. 额外奖励需要单独读取 SIGN_EXTRA_DAYS 配置
     * 3. 当天数超过配置的最大天数时，奖励天数重置为第 1 天(重新从第一天开始)
     * 4. 如果当天配置缺失，则优先回退到第 1 天的基础奖励
     * 
     * @param int $day 连续签到天数
     * @return float 基础奖励金额
     */
    private function calculateReward($day)
    {
        // 如果没有配置基础奖励，则直接返回0，避免出现未定义下标或固定写死金额
        if (!is_array(SIGN_DAILY_REWARD) || empty(SIGN_DAILY_REWARD)) {
            return 0.00;
        }

        // 先把连续签到天数转换成实际用于取奖励配置的天数
        // 例如：配置只写到第7天，当签到天数为第8天时，这里会重置为第1天
        $day = $this->normalizeRewardDay($day);

        // 读取基础奖励配置
        // firstReward：第1天的基础奖励，作为兜底值使用
        // reward：优先取当前天数对应的基础奖励；若当前天数未配置，则回退到第1天基础奖励
        $rewards = SIGN_DAILY_REWARD;
        $firstReward = $rewards[1] ?? reset($rewards);
        $reward = $rewards[$day] ?? $firstReward;

        // 统一转成浮点数返回，避免配置值为字符串时影响后续金额计算
        return (float)$reward;
    }

    /**
     * 获取签到额外奖励金额
     * 根据连续签到天数从 SIGN_EXTRA_DAYS 配置中读取当天额外奖励。
     *
     * 规则说明：
     * 1. 这里只读取额外奖励，不包含基础奖励
     * 2. 如果当天没有配置额外奖励，则返回0
     * 3. 额外奖励天数同样遵循“超过最大配置天数后，从第1天重新开始”的规则
     *
     * @param int $day 连续签到天数
     * @return float 额外奖励金额
     */
    private function getExtraReward($day)
    {
        // 如果没有配置额外奖励，则当天额外奖励默认为0
        if (!is_array(SIGN_EXTRA_DAYS) || empty(SIGN_EXTRA_DAYS)) {
            return 0.00;
        }

        // 使用统一的签到天数规则，确保基础奖励和额外奖励取值周期一致
        $day = $this->normalizeRewardDay($day);

        // 当前天数如果配置了额外奖励则返回对应金额，否则返回0
        return (float)(SIGN_EXTRA_DAYS[$day] ?? 0);
    }

    /**
     * 规范化签到奖励天数。
     * 当签到天数超过已配置的最大天数时，重新从第1天开始计算。
     *
     * @param int $day 连续签到天数
     * @return int 实际用于取奖励配置的天数
     */
    private function normalizeRewardDay($day)
    {
        // 非法天数统一按第1天处理，避免出现0天或负数天数
        $day = (int)$day;
        if ($day <= 0) {
            return 1;
        }

        // 基础奖励配置的最大key，即当前签到周期支持的最大天数
        $keys = array_keys(SIGN_DAILY_REWARD);
        $maxDay = $keys ? (int)max($keys) : 1;

        // 如果当前连续签到天数超过最大配置天数，则从第1天重新开始
        return $day > $maxDay ? 1 : $day;
    }

    /**
     * 获取签到信息接口
     * 获取用户今日签到状态、连续签到天数、明日奖励预览等信息
     * 该接口不执行签到动作，只负责给前端展示当前签到面板所需的数据
     * 
     * @return mixed 返回签到相关信息
     */
    public function GetSignInfo()
    {
        // 获取当前登录用户的ID
        $userId = $this->request->UserID;

        // 检查今天是否已签到
        $todaySign = CommonUserSignLogModel::getTodaySign($userId);
        
        // 获取当前连续签到天数
        $evenSign = CommonUserSignLogModel::getLastEvenSign($userId);

        // 明日奖励预览
        // 为了让前端直接展示“基础奖励 + 额外奖励 = 总奖励”，这里拆分返回
        $tomorrowDay = $this->normalizeRewardDay($evenSign + 1);
        $tomorrowBaseReward = $this->calculateReward($evenSign + 1);
        $tomorrowExtraReward = $this->getExtraReward($evenSign + 1);
        $tomorrowReward = $tomorrowBaseReward + $tomorrowExtraReward;
        $isExtraDay = $tomorrowExtraReward > 0;

        // 返回成功数据
        return Show(SUCCESS, [
            'is_signed_today' => $todaySign ? 1 : 0, // 今日是否已签到：0-未签到，1-已签到
            'even_sign' => $evenSign, // 当前连续签到天数
            'tomorrow_reward' => $tomorrowReward, // 明天签到可获得的总奖励金额
            'tomorrow_base_reward' => $tomorrowBaseReward, // 明天签到基础奖励
            'tomorrow_extra_reward' => $tomorrowExtraReward, // 明天签到额外奖励
            'is_extra_day' => $isExtraDay, // 明天是否属于额外奖励日
            'reward_type' => SIGN_REWARD_TYPE, // 奖励发放类型：1-余额，2-积分
            'sign_config' => SIGN_DAILY_REWARD, // 基础签到奖励配置
            'extra_days' => SIGN_EXTRA_DAYS, // 额外奖励配置
        ]);
    }
}
