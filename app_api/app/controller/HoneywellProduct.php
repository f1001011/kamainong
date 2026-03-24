<?php
namespace app\controller;

use app\model\Product;
use think\facade\Db;

/**
 * Honeywell 产品模块
 */
class HoneywellProduct extends HoneywellBase
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
