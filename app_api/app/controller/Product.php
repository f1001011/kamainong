<?php
namespace app\controller;

use app\BaseController;
use app\api\model\Product as ProductModel;

class Product extends BaseController
{
    // 获取产品列表
    public function list()
    {
        $list = ProductModel::getList();
        return show(1, $list);
    }
    
    // 获取产品详情
    public function detail()
    {
        $id = input('id');
        $detail = ProductModel::where('id', $id)->where('del', 0)->find();
        
        if (!$detail) {
            return show(0, [], 20001);
        }
        
        return show(1, $detail);
    }
}
