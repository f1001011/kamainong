<?php
namespace app\controller;

use think\facade\Db;

/**
 * Honeywell 配置模块
 */
class HoneywellConfig extends HoneywellBase
{
    /**
     * 全局配置
     * GET /api/honeywell_config/global
     */
    public function global()
    {
        $configs = Db::name('common_sys_config')->column('value', 'name');
        
        return json([
            'success' => true,
            'data' => [
                'siteName' => 'AVIVA',
                'siteLogo' => '/logo.png',
                'currencySymbol' => 'XAF',
                'currencyCode' => 'XAF',
                'currencyDecimals' => 0,
                'phoneAreaCode' => '+237',
                'phoneDigitCount' => 9,
                'systemTimezone' => 'Africa/Douala',
                'serviceWhatsapp' => $configs['service_whatsapp'] ?? '',
                'registerBonus' => 0,
                'withdrawFeePercent' => (float)($configs['withdraw_tax_rate'] ?? 0.1),
                'minRechargeAmount' => (int)($configs['min_recharge'] ?? 8000),
                'maxRechargeAmount' => 10000000,
                'minWithdrawAmount' => (int)($configs['min_withdraw'] ?? 500),
                'maxWithdrawTimesPerDay' => (int)($configs['withdraw_daily_limit'] ?? 1),
                'withdrawTimeRange' => ($configs['withdraw_start_time'] ?? '10:00') . ' - ' . ($configs['withdraw_end_time'] ?? '18:00'),
                'commissionLevel1Rate' => 10,
                'commissionLevel2Rate' => 3,
                'commissionLevel3Rate' => 1,
                'signinDailyReward' => (int)($configs['daily_sign_points'] ?? 1),
                'svipRewardEnabled' => true,
                'weeklySalaryEnabled' => true,
                'prizePoolEnabled' => true,
                'spinWheelEnabled' => true,
                'communityEnabled' => true,
                'version' => 1
            ]
        ]);
    }
    
    /**
     * 文案配置
     * GET /api/texts
     */
    public function texts()
    {
        return json([
            'success' => true,
            'data' => [
                'es' => [
                    'common' => [
                        'confirm' => 'Confirmar',
                        'cancel' => 'Cancelar',
                        'submit' => 'Enviar',
                        'loading' => 'Cargando...',
                    ]
                ]
            ]
        ]);
    }
    
    /**
     * 产品配置
     * GET /api/config/products
     */
    public function products()
    {
        return json([
            'success' => true,
            'data' => [
                'series' => ['Po', 'Pr', 'Ps'],
                'defaultSeries' => 'Po'
            ]
        ]);
    }
    
    /**
     * 动画配置
     * GET /api/config/animation
     */
    public function animation()
    {
        return json([
            'success' => true,
            'data' => [
                'enabled' => true,
                'duration' => 300
            ]
        ]);
    }
    
    /**
     * 版本配置
     * GET /api/config/versions
     */
    public function versions()
    {
        return json([
            'success' => true,
            'data' => [
                'config' => 1,
                'texts' => 1
            ]
        ]);
    }

    /**
     * 首页配置
     * GET /api/config/home
     */
    public function home()
    {
        $configs = Db::name('common_sys_config')->column('value', 'name');
        
        // 获取推荐产品
        $products = Db::name('common_goods')
            ->where('status', 1)
            ->where('is_tuijian', 1)
            ->limit(5)
            ->select()
            ->toArray();
        
        $recommendProducts = [];
        foreach ($products as $p) {
            $recommendProducts[] = [
                'id' => (int)$p['id'],
                'name' => $p['goods_name'],
                'price' => number_format($p['goods_money'], 2, '.', ''),
                'dailyIncome' => number_format($p['day_red'], 2, '.', ''),
                'image' => $p['goods_img']
            ];
        }
        
        return json([
            'success' => true,
            'data' => [
                'quickEntries' => [
                    ['id' => 'recharge', 'icon' => 'wallet', 'label' => 'Recharge'],
                    ['id' => 'withdraw', 'icon' => '提现', 'label' => 'Withdraw'],
                    ['id' => 'team', 'icon' => 'team', 'label' => 'Team'],
                    ['id' => 'activities', 'icon' => 'gift', 'label' => 'Activities']
                ],
                'recommendProducts' => $recommendProducts,
                'bannerVisible' => true,
                'todayIncomeVisible' => true,
                'signInEntryVisible' => true,
                'marqueeVisible' => true,
                'recommendEnabled' => true,
                'recommendTitle' => 'Produits recommandés'
            ]
        ]);
    }

    /**
     * 个人资料配置
     * GET /api/config/profile
     */
    public function profile()
    {
        return json([
            'success' => true,
            'data' => [
                'nicknameMaxLength' => 20,
                'nicknameMinLength' => 2,
                'avatarMaxSize' => 2048,  // KB
                'passwordMinLength' => 6,
                'passwordMaxLength' => 20,
                'passwordRequireLetter' => false,
                'passwordRequireNumber' => true
            ]
        ]);
    }
}
