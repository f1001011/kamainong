<?php

namespace app\model;


class SendModel extends BaseModel
{
    public $name = 'money_send_log';

    public static function toDayMoney($map = [],$time='today'){
        $self =  self::where($map);
        if (!empty($time)){
            $self->whereTime('send_time',$time);
        }
       return $self->sum('send_money');
    }

    /**
     * @param $map 用户ID status >=0
     * @param $time 查询的时间
     */
    public static function orderLog($map = [],$time = '',$page = 1,$limit=10,$field = '*',$order = 'id desc'){
        $self =  self::where($map);
        if (!empty($time)){
            $self = $self->whereMonth('send_time',$time);
        }
        return $self->field($field)->order($order)->paginate([
            'list_rows'=>$limit,
            'page'=>$page
        ]);
    }

    public static function countMoney($map,$time){
        $self =  self::where($map);
        if (!empty($time)){
            $self = $self->whereMonth('create_time',$time);
        }
        return  $self->where($map)->sum('send_money');
    }

}