<?php
namespace app\model;

use think\Model;

class Wares extends Model
{
    protected $name = 'common_wares';

    public static function getList()
    {
        return self::where('status', 1)
            ->order('sort', 'asc')
            ->select();
    }
}
