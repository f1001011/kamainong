<?php

namespace app\model;


class AddressModel extends BaseModel
{
    public $name = 'common_address';

    public static function page_one($map = []){
        return self::where($map)->find();
    }

    public static function insets($data = []){
        return self::insertGetId($data);
    }
}