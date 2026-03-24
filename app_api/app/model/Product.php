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
     * 匹配前端 ProductData 接口
     */
    public static function format($product, $userId = null)
    {
        // 检查用户是否已购买
        $purchased = false;
        $purchaseCount = 0;
        if ($userId) {
            $purchaseCount = \think\facade\Db::name('common_goods_order')
                ->where('uid', $userId)
                ->where('goods_id', $product['id'])
                ->where('status', 1)
                ->count();
            $purchased = $purchaseCount > 0;
        }
        
        // 判断购买限制
        $canPurchase = true;
        $lockReason = null;
        $userLimit = $product['user_limit'] ?? null;
        if ($userLimit && $purchaseCount >= $userLimit) {
            $canPurchase = false;
            $lockReason = 'ALREADY_PURCHASED';
        }
        
        // 判断库存
        $globalStock = $product['global_stock'] ?? null;
        $globalStockRemaining = $product['global_stock_remaining'] ?? null;
        if ($globalStock !== null && $globalStockRemaining !== null && $globalStockRemaining <= 0) {
            $canPurchase = false;
            $lockReason = 'STOCK_EXHAUSTED';
        }
        
        // 计算总收益
        $price = $product['goods_money'] ?? 0;
        $dailyIncome = $product['day_red'] ?? 0;
        $period = $product['period'] ?? 30;
        $totalIncome = $price + ($dailyIncome * $period);
        
        return [
            'id' => (int)$product['id'],
            'code' => $product['goods_code'] ?? 'P' . $product['id'],
            'name' => $product['goods_name'] ?? '',
            'type' => $product['is_trial'] ? 'TRIAL' : ($product['goods_type_id'] == self::SERIES_REVENU_FIXE ? 'PAID' : 'FINANCIAL'),
            'series' => $product['series_code'] ?? ($product['goods_type_id'] == self::SERIES_REVENU_FIXE ? 'VIC' : 'NWS'),
            'price' => number_format($price, 2, '.', ''),
            'dailyIncome' => number_format($dailyIncome, 2, '.', ''),
            'cycleDays' => (int)$period,
            'totalIncome' => number_format($totalIncome, 2, '.', ''),
            'grantVipLevel' => (int)($product['grant_vip'] ?? 0),
            'grantSvipLevel' => (int)($product['grant_svip'] ?? 0),
            'requireVipLevel' => (int)($product['require_vip'] ?? 0),
            'purchaseLimit' => (int)($product['buy_num'] ?? 0),
            'userPurchaseLimit' => $product['user_limit'] ?? null,
            'globalStock' => $globalStock,
            'globalStockRemaining' => $globalStockRemaining,
            'mainImage' => $product['goods_img'] ?? null,
            'showRecommendBadge' => (bool)($product['is_tuijian'] ?? false),
            'customBadgeText' => $product['badge_text'] ?? null,
            'status' => self::getStatusText($product['status']),
            'purchased' => $purchased,
            'purchaseCount' => $purchaseCount,
            'canPurchase' => $canPurchase,
            'lockReason' => $lockReason
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
