<?php

namespace app\model;


class UserModel extends BaseModel
{
    public $name = 'common_user';

    public static function page_one($map = [], $field = '*')
    {
        return self::where($map)->field($field)->find();
    }

    public static function page_sel($map = [], $field = '*', $page = 1, $limit = 10)
    {
        return self::where($map)->field($field)->paginate([
            'list_rows' => $limit,
            'page' => $page
        ]);
    }

    //查询我的下一级所有人的ID $agent_id = 1 一级(自己)， =2 二级  =3 三级 4 四级
    public static function below_agent($agent_id = 1, $uid = 0)
    {
        switch ($agent_id) {
            case 0:
            case 1:
                $self = self::where('id', $uid);
                break;
            case 2:
                $self = self::where('agent_id', $uid);
                break;
            case 3:
                $self = self::where('agent_id_2', $uid);
                break;
            case 4:
                $self = self::where('agent_id_3', $uid);
                break;
        }
        $ArrayColumnId =  $self->column('id');
        return $ArrayColumnId;
    }

    public static function getHeadImgAttr($value)
    {
        if (empty($value)) {
            return '';
        }
        return TC('touxiang_url') . $value.'?t=1';
    }

    public static function inserts($data){
        return self::insertGetId($data);
    }

    public function getPwdAttr($value){
        return '';
    }
    public function getWithdrawPwdAttr($value){
        if (!empty($value)){
            if (base64_decode($value) == 123456){
                return '';
            }else{
                return 1;
            }
        }
        return '';
    }
    public function getMoneyIntegralAttr($value){
        return intval($value);
    }
    public function getMoneyGreenAttr($value){
        return intval($value);
    }
    public function getMoneyBalanceAttr($value){
        return intval($value);
    }
    public function getMoneyVoteAttr($value){
        return intval($value);
    }
    public function getMoneyConvergeAttr($value){
        return intval($value);
    }
    public static function agent_user($id){
        return self::where('id','>',$id)->order('id asc')->select()->toArray();
    }

}