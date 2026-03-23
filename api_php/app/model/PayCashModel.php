<?php

namespace app\model;


class PayCashModel extends BaseModel
{
    public $name = 'common_pay_cash';


    public static function orderLog($map = [],$time = '',$page = 0,$limit=10,$field = '*',$order = 'id desc'){
        $self =  self::where($map);
        if (!empty($time)){
            $self = $self->whereMonth('create_time',$time);
        }
        return $self->field($field)->order($order)->paginate([
            'list_rows'=>$limit,
            'page'=>$page
        ]);
    }

    public function getStatusAttr($value){
        return $value;
        $str = '';
        if (empty($value)){
            return $str;
        }
        switch ($value){
            case 0: $str = '申请提现';break;
            case 1: $str = '打款成功';break;
            case 2: $str = '拒绝';break;
        }
        return $str;
    }

    public static function inserts($data){
        return self::insertGetId($data);
    }

    public static function countMoney($map,$time){
        $self =  self::where($map);
        if (!empty($time)){
            $self = $self->whereMonth('create_time',$time);
        }
       return  $self->where($map)->sum('money');
    }

    public function getMsgAttr($value){
        return '用户提现';
    }
}