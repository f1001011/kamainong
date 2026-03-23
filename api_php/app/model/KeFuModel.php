<?php

namespace app\model;


class KeFuModel extends BaseModel
{
    public $name = 'common_kefu';

    /**
     * 获取随机客服
     * @param $where
     * @return mixed
     */
    public function randomId($where = []){
        return self::field('id')->where($where)->orderRaw("rand(),id desc")->find();
    }
}