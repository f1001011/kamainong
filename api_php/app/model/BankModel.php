<?php

namespace app\model;


class BankModel extends BaseModel
{
    public $name = 'common_pay_sys_bank';

    public static function page_one($map = []){
        return self::where($map)->find();
    }

    public static function page_list($map = []){

        return self::where($map)->select();
    }
    public static function insets($data = []){
        return self::insertGetId($data);
    }
}