<?php

namespace app\model;

class CommonUserSignLogModel extends BaseModel
{
    protected $name = 'common_user_sign_log';

    /**
     * 获取用户今天的签到记录
     */
    public static function getTodaySign($uid)
    {
        $today = date('Y-m-d');
        return self::where('uid', $uid)
            ->where('create_time', '>=', $today . ' 00:00:00')
            ->where('create_time', '<=', $today . ' 23:59:59')
            ->find();
    }

    /**
     * 获取用户最后一次签到的连续天数
     */
    public static function getLastEvenSign($uid)
    {
        $lastSign = self::where('uid', $uid)
            ->order('id', 'desc')
            ->find();
        
        if (!$lastSign) {
            return 0;
        }
        
        return $lastSign['even_sign'] ?? 0;
    }

    /**
     * 创建签到记录
     */
    public static function createSign($uid, $money, $evenSign)
    {
        $model = new self();
        $model->save([
            'uid' => $uid,
            'money' => $money,
            'create_time' => date('Y-m-d H:i:s'),
            'even_sign' => $evenSign,
        ]);
        return $model;
    }
}
