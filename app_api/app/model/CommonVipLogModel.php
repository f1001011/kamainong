<?php

namespace app\model;

class CommonVipLogModel extends BaseModel
{
    protected $name = 'common_vip_log';

    /**
     * 创建VIP变更日志
     * 由于当前表结构没有 user_id 字段，所以用户信息和场景说明统一写入 remarks 方便追溯。
     *
     * @param int $startExp 变更前经验值
     * @param int $endExp 变更后经验值
     * @param int $startLevel 变更前VIP等级
     * @param int $endLevel 变更后VIP等级
     * @param string $remarks 备注说明
     * @return self
     */
    public static function createUpgradeLog($startExp, $endExp, $startLevel, $endLevel, $remarks = '')
    {
        $now = date('Y-m-d H:i:s');

        $model = new self();
        $model->save([
            'start_exp' => (int)$startExp,
            'end_exp' => (int)$endExp,
            'start_level' => (int)$startLevel,
            'end_level' => (int)$endLevel,
            'create_time' => $now,
            'update_time' => $now,
            'remarks' => $remarks,
        ]);

        return $model;
    }
}
