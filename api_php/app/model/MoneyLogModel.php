<?php

namespace app\model;


class MoneyLogModel extends BaseModel
{
    public $name = 'common_pay_money_log';


    public static $integral = [111,102,120,221,222];//积分
    public static $green = [121,223,224];//绿币
    public static $vote = [123,229,230];//碳票
    public static $converge = [124,231,232];//碳汇

    public static function inserts($type,$status,$money_before,$money_end,$money,$uid,$market_uid,$mark,$source_id){
       return  self::insert([
           'type'=>$type,
           'status'=>$status,
           'money_before'=>$money_before,
           'money_end'=>$money_end,
           'money'=>$money,
           'uid'=>$uid,
           'market_uid'=>$market_uid,
           'mark'=>$mark,
           'source_id'=>$source_id,
           'create_time'=>date('Y-m-d H:i:s'),
       ]);
    }


    public static function month_list($map=[],$time = '',$limit=10,$page=1){
        $list =  self::where($map);
        if (empty($time)){
            $list = $list->whereMonth('create_time');
        }else{
            $list = $list->whereMonth('create_time',$time);
        }

        return $list->paginate(['list_rows'=>$limit,'page'=>$page], false)->each(function($item, $key){
            $item['money_before'] =  intval($item['money_before']);
            $item['money_end'] =  intval($item['money_end']);
            $item['money'] =  intval($item['money']);
            if ($item['type'] == 3){
                $item['mark'] = '官方活动';
            }
            return $item;
        });
    }

    public static function countMoney($map,$time){
        $self =  self::where($map);
        if (!empty($time)){
            $self = $self->whereMonth('create_time',$time);
        }
        $num = $self->where($map)->sum('money');
        return  intval($num);
    }
}