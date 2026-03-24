<?php
namespace app\controller;

use app\BaseController;
use app\model\Product;

/**
 * Honeywell 产品接口
 */
class HoneywellProduct extends BaseController
{
    /**
     * 产品列表
     * GET /api/products?series=REVENU_FIXE
     */
    public function list()
    {
        $series = input('series', '');
        
        $products = Product::getList($series);
        
        $list = [];
        foreach ($products as $p) {
            $list[] = Product::format($p);
        }
        
        return $this->success($list);
    }
}
