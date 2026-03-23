<?php
namespace app\controller;

use app\BaseController;
use app\model\SysConfig;

class System extends BaseController
{
    // 获取系统配置
    public function config()
    {
        $key = input('key');

        $map = [];
        if(!$key){
            $map['key'] = $key;
        }
        $config = SysConfig::where($map)->value('value');
        
        return show(1, $config);
    }
}
