<?php
namespace app\controller;

use app\BaseController;
use think\facade\Db;

class Banner extends BaseController
{
    // 获取首页banner
    public function list()
    {
        $banners = Db::name('common_ads')
            ->where('status', 1)
            ->order('sort asc')
            ->limit(5)
            ->select();
        
        return show(1, ['list' => $banners]);
    }
}
