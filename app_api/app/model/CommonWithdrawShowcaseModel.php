<?php

namespace app\model;

class CommonWithdrawShowcaseModel extends BaseModel
{
    protected $name = 'common_withdraw_showcase';

    const STATUS_HIDE = 0; // 隐藏
    const STATUS_SHOW = 1; // 显示

    public function getVoucherImageAttr($value)
    {
        if (!$value) {
            return '';
        }

        if (preg_match('/^https?:\/\//i', $value)) {
            return $value;
        }

        $formatValue = str_replace('\\', '/', $value);
        $projectRoot = rtrim(str_replace('\\', '/', dirname(app()->getRootPath())), '/');
        $webPath = $formatValue;

        if (strpos($formatValue, $projectRoot . '/') === 0) {
            $webPath = substr($formatValue, strlen($projectRoot));
        }

        $webPath = '/' . ltrim($webPath, '/');

        $domain = (string)config('app.upload_domain');
        if ($domain === '') {
            return $webPath;
        }

        return rtrim($domain, '/') . $webPath;
    }
}
