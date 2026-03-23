<?php
namespace app\api\controller;

use app\BaseController;
use app\api\model\Product as ProductModel;

class Product extends BaseController
{
    // 获取产品列表
    public function list()
    {
        $list = ProductModel::getList();
        return json(['code' => 200, 'data' => $list]);
    }
    
    // 获取产品详情
    public function detail()
    {
        $id = input('id');
        $detail = ProductModel::where('id', $id)->where('del', 0)->find();
        
        if (!$detail) {
            return json(['code' => 404, 'msg' => '产品不存在']);
        }
        
        return json(['code' => 200, 'data' => $detail]);
    }
}
