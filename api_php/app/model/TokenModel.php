<?php

namespace app\model;


class TokenModel extends BaseModel
{
    public $name = 'common_home_token';

    public static function page_one($map = []){
        return self::where($map)->find();
    }
}