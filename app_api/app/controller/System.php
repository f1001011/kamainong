<?php
namespace app\api\controller;

use app\BaseController;

class System extends BaseController
{
    // 获取系统配置
    public function config()
    {
        $key = input('key');
        
        $config = db('common_sys_config')
            ->where('key', $key)
            ->value('value');
        
        return show(1, $config);
    }
}
