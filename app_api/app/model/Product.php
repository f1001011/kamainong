<?php
namespace app\model;

use think\Model;

class Product extends Model
{
    protected $name = 'common_goods';
    
    // 产品系列
    const SERIES_REVENU_FIXE = 1;
    const SERIES_PERIODIC = 2;
    
    // 产品状态
    const STATUS_AVAILABLE = 1;
    const STATUS_COMING_SOON = 2;
    const STATUS_SOLD_OUT = 0;
    
    /**
     * 获取产品列表
     */
    public static function getList($series = null)
    {
        $query = self::where('del', 0);
        
        if ($series === 'REVENU_FIXE') {
            $query->where('goods_type_id', self::SERIES_REVENU_FIXE);
        } elseif ($series === 'PERIODIC') {
            $query->where('goods_type_id', self::SERIES_PERIODIC);
        }
        
        return $query->order('sort', 'asc')->select();
    }
    
    /**
     * 获取产品详情
     */
    public static function getDetail($id)
    {
        return self::where('id', $id)->where('del', 0)->find();
    }
    
    /**
     * 格式化产品数据
     */
    public static function format($product)
    {
        return [
            'id' => (int)$product['id'],
            'name' => $product['goods_name'],
            'series' => $product['goods_type_id'] == self::SERIES_REVENU_FIXE ? 'REVENU_FIXE' : 'PERIODIC',
            'price' => number_format($product['goods_money'], 2, '.', ''),
            'dailyIncome' => number_format($product['day_red'], 2, '.', ''),
            'totalIncome' => number_format($product['total_money'], 2, '.', ''),
            'period' => (int)$product['period'],
            'minuteClaim' => (int)$product['minute_claim'],
            'incomeTimesPerDay' => (int)$product['income_times_per_day'],
            'incomePerTime' => number_format($product['income_per_time'], 2, '.', ''),
            'status' => self::getStatusText($product['status']),
            'purchaseLimit' => (int)$product['buy_num'],
            'sort' => (int)$product['sort']
        ];
    }
    
    /**
     * 获取状态文本
     */
    public static function getStatusText($status)
    {
        $map = [
            self::STATUS_AVAILABLE => 'AVAILABLE',
            self::STATUS_COMING_SOON => 'COMING_SOON',
            self::STATUS_SOLD_OUT => 'SOLD_OUT'
        ];
        return $map[$status] ?? 'SOLD_OUT';
    }
}
