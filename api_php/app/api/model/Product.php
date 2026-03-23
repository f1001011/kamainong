<?php
namespace app\api\model;

use think\Model;

class Product extends Model
{
    protected $name = 'common_goods';
    
    // 获取产品列表
    public static function getList()
    {
        return self::where('del', 0)
            ->where('status', 'in', [1, 2])
            ->order('sort', 'asc')
            ->select();
    }
}
