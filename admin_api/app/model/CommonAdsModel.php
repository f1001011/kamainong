<?php

namespace app\model;

class CommonAdsModel extends BaseModel
{
    protected $name = 'common_ads';

    const STATUS_HIDE = 0; // 是否显示: 否
    const STATUS_SHOW = 1; // 是否显示: 是

    const TYPE_BANNER = 1; // 轮播图类型

    const IS_TYPE_IMAGE = 0; // 内容类型: 图片
    const IS_TYPE_ARTICLE = 1; // 内容类型: 文章
}
