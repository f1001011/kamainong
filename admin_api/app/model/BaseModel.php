<?php

namespace app\model;

use think\Model;

class BaseModel extends Model
{
    public static function PageList($map=[],$field='*',$page=1,$limit=10,$order='id desc')
    {
        return self::where($map)
            ->field($field)
            ->order($order)
            ->paginate([
            'list_rows' => $limit,
            'page' => $page,
            'query' => request()->param()
        ]);
    }

    public static function PageData($map=[],$field='*')
    {
        return  self::where($map)->field($field)->select();
    }

    public static function PageDataOne($map=[],$field='*')
    {
        return self::where($map)->field($field)->find();
    }
}