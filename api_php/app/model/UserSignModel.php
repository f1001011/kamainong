<?php

namespace app\model;


use think\facade\Db;

class UserSignModel extends BaseModel
{
    public $name = 'common_user_sign_log';

    //用户签到
    public static function sign($UserInfo,$money){
       $find =  self::where('uid',$UserInfo['id'])->whereTime('create_time','today')->find();
       if (empty($find)){
           Db::startTrans();
           try {
           $id =self::insertGetId([
               'uid'=>$UserInfo['id'],
               'money'=>$money,
               'create_time'=>date('Y-m-d H:i:s'),
           ]);

           //写入资金记录
           MoneyLogModel::inserts(1,102,$UserInfo['money_integral'],$UserInfo['money_integral']+$money,$money,$UserInfo['id'],$UserInfo['market_uid'],$UserInfo['user_name'].'签到成功',$id);
           //增加用户余额
            UserModel::where('id',$UserInfo['id'])->inc('money_integral',$money)->update();
               Db::commit();
           } catch (\Exception $e) {
               // 回滚事务
               Db::rollback();
               return false;
           }
            return true;
       }else{
          return false;
       }
    }

    public static function month_list($map=[]){
        return self::where($map)->whereMonth('create_time')->column('create_time');
    }
}