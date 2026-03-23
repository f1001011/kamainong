<?php

namespace app\model;


class SysConfigModel extends BaseModel
{
    public $name = 'common_sys_config';

    public static function page_value($map = []){
        return self::where($map)->value('value');
    }
}