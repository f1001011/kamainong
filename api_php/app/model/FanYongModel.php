<?php

namespace app\model;


class FanYongModel extends BaseModel
{
    public $name = 'money_fanyong_log';

    public static function insets($data = [])
    {
        return self::insertGetId($data);
    }

    public static function ToInsert($user_id,$money_amount,$money_type,$money_type_text,$is_add_to_user_account,$remark,$user_name,$update_time,$product_id,$product_lev,$sub_id)
    {
       $data = [
           'user_id'=>$user_id,
           'money_amount'=>$money_amount,
           'money_type'=>$money_type,
           'money_type_text'=>$money_type_text,
           'is_add_to_user_account'=>$is_add_to_user_account,
           'remark'=>$remark,
           'user_name'=>$user_name,
           'create_time'=>date('Y-m-d H:i:s'),
           'update_time'=>$update_time,
           'product_id'=>$product_id,
           'product_lev'=>$product_lev,
           'sub_id'=>$sub_id,
       ];
       return self::insets($data);
    }


    public static function month_list($map=[],$time = '',$limit=10,$page=1){
        if (empty($time)){
            return self::where($map)->whereMonth('create_time')->paginate(['list_rows'=>$limit,'page'=>$page], false);;
        }

        return self::where($map)->whereMonth('create_time',$time)->paginate(['list_rows'=>$limit,'page'=>$page], false);
    }

    public static function month_list_two($map=[],$time = '',$limit=10,$page=1,$order= 'id desc'){
        if (empty($time)){
            return self::where($map)->order($order)->paginate(['list_rows'=>$limit,'page'=>$page], false);;
        }

        return self::where($map)->whereMonth('create_time',$time)->order($order)->paginate(['list_rows'=>$limit,'page'=>$page], false);
    }

    public static function countMoney($map,$time){
        $self =  self::where($map);
        if (!empty($time)){
            $self = $self->whereMonth('create_time',$time);
        }
        return  $self->where($map)->sum('money_amount');
    }
}