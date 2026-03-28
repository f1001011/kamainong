<?php

namespace app\model;

/**
 * 后台管理员操作日志模型
 * 对应数据表：ntp_common_admin_log
 */
class CommonAdminLogModel extends BaseModel
{
    protected $name = 'common_admin_log';

    /**
     * 记录后台操作日志
     * 后续后台控制器或中间件需要写管理员操作日志时，可直接调用这个公共方法。
     *
     * @param string $name 操作人名称
     * @param int $adminId 管理员ID
     * @param string $ip 操作IP
     * @param string $func 操作方法
     * @param string $remark 备注
     * @return self
     */
    public static function recordLog(string $name, int $adminId, string $ip, string $func, string $remark = '')
    {
        $model = new self();
        $model->save([
            'name' => $name,
            'admin_id' => $adminId,
            'ip' => $ip,
            'func' => $func,
            'create_time' => date('Y-m-d H:i:s'),
            'rmark' => $remark,
        ]);

        return $model;
    }
}
