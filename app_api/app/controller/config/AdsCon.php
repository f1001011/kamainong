<?php
declare(strict_types=1);

namespace app\controller\config;

use app\controller\BaseCon;
use app\model\CommonAdsModel;

/**
 * Banner/广告控制器
 * 负责处理APP首页轮播图(Banner)相关的业务逻辑
 * 提供Banner列表查询接口，用于前端展示首页轮播广告
 */
class AdsCon extends BaseCon
{
    /**
     * Banner列表接口
     * 获取所有已启用的Banner轮播图列表，按排序字段正序排列
     * 用于APP首页轮播图展示
     * 
     * @return mixed 返回Banner列表数据，包含图片地址、跳转链接等信息
     */
    public function GetBannerList()
    {
        // 构建查询条件：状态为显示中
        $map = [
            'status' => CommonAdsModel::STATUS_SHOW,
        ];
        
        // 查询Banner列表，按sort字段正序排列
        $list = CommonAdsModel::PageData($map, 'sort asc');
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
}
