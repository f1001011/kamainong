<?php

namespace app\model;

class CommonVipModel extends BaseModel
{
    protected $name = 'common_vip';

    /**
     * 处理用户购买商品后的VIP升级逻辑
     * 根据配置的 VIP_UPGRADE_MODE 决定当前项目启用哪一套升级方案：
     * 0-关闭升级逻辑
     * 1-按购买金额累计经验升级
     * 2-按指定商品和数量升级
     *
     * @param mixed $user 当前用户信息（模型对象或数组）
     * @param mixed $goods 当前购买的商品信息（模型对象或数组）
     * @param float $orderMoney 本次订单总金额
     * @param int $buyNum 本次购买数量
     * @return array 返回本次VIP处理结果，便于后续调试或扩展返回数据
     * @throws \Exception 当更新经验或升级VIP失败时抛出异常，交由外层事务统一回滚
     */
    public static function handleUpgradeAfterBuy($user, $goods, $orderMoney, $buyNum = 1)
    {
        switch (VIP_UPGRADE_MODE) {
            case VIP_UPGRADE_MODE_EXPERIENCE:
                $result = self::handleExperienceUpgrade($user, $goods, $orderMoney, $buyNum);
                break;

            case VIP_UPGRADE_MODE_GOODS:
                $result = self::handleGoodsUpgrade($user, $goods, $buyNum);
                break;

            case VIP_UPGRADE_MODE_OFF:
            default:
                $result = [
                    'upgrade_mode' => VIP_UPGRADE_MODE,
                    'start_level' => (int)($user['level_vip'] ?? 0),
                    'end_level' => (int)($user['level_vip'] ?? 0),
                    'start_experience' => (int)($user['current_experience'] ?? 0),
                    'end_experience' => (int)($user['current_experience'] ?? 0),
                    'is_upgrade' => 0,
                ];
                break;
        }

        // 只要经验值或VIP等级发生变化，就写入一条VIP日志记录
        if (
            (int)$result['start_experience'] !== (int)$result['end_experience']
            || (int)$result['start_level'] !== (int)$result['end_level']
        ) {
            $remarks = self::buildUpgradeRemarks($user, $goods, $buyNum, $result);
            CommonVipLogModel::createUpgradeLog(
                (int)$result['start_experience'],
                (int)$result['end_experience'],
                (int)$result['start_level'],
                (int)$result['end_level'],
                $remarks
            );
        }

        return $result;
    }

    /**
     * 模式1：按购买金额累计经验升级
     * 每次购买商品后，把订单金额累加到用户 current_experience，
     * 然后根据 ntp_common_vip.experience 找到当前经验值可达到的最高VIP等级。
     *
     * @param mixed $user 当前用户信息（模型对象或数组）
     * @param mixed $goods 当前购买的商品信息（模型对象或数组）
     * @param float $orderMoney 本次订单总金额
     * @param int $buyNum 本次购买数量
     * @return array 本次经验累计与升级结果
     * @throws \Exception 当经验或VIP等级更新失败时抛出异常
     */
    protected static function handleExperienceUpgrade($user, $goods, $orderMoney, $buyNum = 1)
    {
        $userId = (int)$user['id'];
        $startLevel = (int)($user['level_vip'] ?? 0);
        $startExperience = (int)($user['current_experience'] ?? 0);

        // 经验模式下，订单金额直接作为本次增加的经验值
        $addExperience = max(0, (int)$orderMoney);
        $endExperience = $startExperience;
        if ($addExperience > 0) {
            $result = CommonUserModel::incCurrentExperience($userId, $addExperience);
            if (!$result) {
                throw new \Exception('', 10120);
            }
            $endExperience = $startExperience + $addExperience;
        }

        // 查询当前经验值可达到的最高VIP等级
        $targetVip = self::getVipConfigByExperience($endExperience);
        $endLevel = $startLevel;
        if ($targetVip && (int)$targetVip['vip'] > $startLevel) {
            $endLevel = (int)$targetVip['vip'];
            $result = CommonUserModel::updateVipLevel($userId, $endLevel);
            if (!$result) {
                throw new \Exception('', 10121);
            }
        }

        return [
            'upgrade_mode' => VIP_UPGRADE_MODE_EXPERIENCE,
            'user_id' => $userId,
            'goods_id' => (int)($goods['id'] ?? 0),
            'buy_num' => (int)$buyNum,
            'start_level' => $startLevel,
            'end_level' => $endLevel,
            'start_experience' => $startExperience,
            'end_experience' => $endExperience,
            'is_upgrade' => $endLevel > $startLevel ? 1 : 0,
        ];
    }

    /**
     * 模式2：按指定商品和数量升级
     * 判断当前购买的商品ID和购买数量，是否满足 ntp_common_vip.buy_goods_id、buy_goods_num 的升级条件。
     * 如果满足则直接升级到匹配到的最高VIP等级；
     * 如果不满足则只给用户 current_experience +1，作为购买次数经验累计。
     *
     * @param mixed $user 当前用户信息（模型对象或数组）
     * @param mixed $goods 当前购买的商品信息（模型对象或数组）
     * @param int $buyNum 本次购买数量
     * @return array 本次商品条件升级结果
     * @throws \Exception 当经验或VIP等级更新失败时抛出异常
     */
    protected static function handleGoodsUpgrade($user, $goods, $buyNum = 1)
    {
        $userId = (int)$user['id'];
        $startLevel = (int)($user['level_vip'] ?? 0);
        $startExperience = (int)($user['current_experience'] ?? 0);
        $endLevel = $startLevel;
        $endExperience = $startExperience;

        // 商品模式下，优先根据商品ID + 购买数量匹配VIP升级条件
        $targetVip = self::getVipConfigByGoods((int)$goods['id'], (int)$buyNum);
        if ($targetVip && (int)$targetVip['vip'] > $startLevel) {
            $endLevel = (int)$targetVip['vip'];
            $result = CommonUserModel::updateVipLevel($userId, $endLevel);
            if (!$result) {
                throw new \Exception('', 10121);
            }
        } else {
            // 当前购买不满足升级条件时，只给 current_experience +1，作为购买次数经验累计
            $result = CommonUserModel::incCurrentExperience($userId, 1);
            if (!$result) {
                throw new \Exception('', 10120);
            }
            $endExperience = $startExperience + 1;
        }

        return [
            'upgrade_mode' => VIP_UPGRADE_MODE_GOODS,
            'user_id' => $userId,
            'goods_id' => (int)($goods['id'] ?? 0),
            'buy_num' => (int)$buyNum,
            'start_level' => $startLevel,
            'end_level' => $endLevel,
            'start_experience' => $startExperience,
            'end_experience' => $endExperience,
            'is_upgrade' => $endLevel > $startLevel ? 1 : 0,
        ];
    }

    /**
     * 根据当前经验值，获取可达到的最高VIP配置
     *
     * @param int $experience 当前经验值
     * @return mixed
     */
    protected static function getVipConfigByExperience($experience)
    {
        return self::where('experience', '<=', (int)$experience)
            ->order('vip desc, id desc')
            ->find();
    }

    /**
     * 根据商品ID和购买数量，获取匹配到的最高VIP配置
     *
     * @param int $goodsId 商品ID
     * @param int $buyNum 购买数量
     * @return mixed
     */
    protected static function getVipConfigByGoods($goodsId, $buyNum)
    {
        return self::where('buy_goods_id', (int)$goodsId)
            ->where('buy_goods_num', '<=', (int)$buyNum)
            ->order('vip desc, id desc')
            ->find();
    }

    /**
     * 组装VIP日志备注
     * 当前表结构没有 user_id 字段，因此把用户ID、商品ID、购买数量、升级模式等上下文写进 remarks。
     *
     * @param mixed $user 当前用户信息
     * @param mixed $goods 当前购买商品信息
     * @param int $buyNum 本次购买数量
     * @param array $result 本次升级处理结果
     * @return string
     */
    protected static function buildUpgradeRemarks($user, $goods, $buyNum, array $result)
    {
        $modeText = 'off';
        if ((int)$result['upgrade_mode'] === VIP_UPGRADE_MODE_EXPERIENCE) {
            $modeText = 'experience';
        } elseif ((int)$result['upgrade_mode'] === VIP_UPGRADE_MODE_GOODS) {
            $modeText = 'goods';
        }

        return 'user_id=' . (int)($user['id'] ?? 0)
            . '; goods_id=' . (int)($goods['id'] ?? 0)
            . '; buy_num=' . (int)$buyNum
            . '; mode=' . $modeText
            . '; is_upgrade=' . (int)($result['is_upgrade'] ?? 0);
    }
}
