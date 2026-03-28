<?php

namespace app\controller;

use app\BaseController;

class BaseCon extends BaseController
{
    /**
     * 统一处理分页参数，后台所有记录列表默认 page=1、limit=20。
     *
     * @param array $post 请求参数
     * @return array
     */
    protected function getPageLimit(array $post): array
    {
        $page = (int)($post['page'] ?? 1);
        $limit = (int)($post['limit'] ?? 20);

        if ($page <= 0) {
            $page = 1;
        }

        if ($limit <= 0) {
            $limit = 20;
        }

        return [$page, $limit];
    }

    /**
     * 标准化后台时间搜索参数。
     * 支持两种传法：
     * 1. Y-m-d
     * 2. Y-m-d H:i:s
     *
     * @param mixed $value 原始时间值
     * @param bool $isEnd 是否为结束时间
     * @return string|false|null
     */
    protected function normalizeSearchTime($value, bool $isEnd = false)
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string)$value);
        if ($value === '') {
            return null;
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return $value . ($isEnd ? ' 23:59:59' : ' 00:00:00');
        }

        $timestamp = strtotime($value);
        if ($timestamp === false) {
            return false;
        }

        return date('Y-m-d H:i:s', $timestamp);
    }

    /**
     * 给查询条件追加时间范围筛选。
     *
     * @param array $map 查询条件
     * @param string $field 目标时间字段
     * @param string|null $startTime 开始时间
     * @param string|null $endTime 结束时间
     * @return void
     */
    protected function appendTimeRange(array &$map, string $field, ?string $startTime, ?string $endTime): void
    {
        if (!empty($startTime)) {
            $map[] = [$field, '>=', $startTime];
        }

        if (!empty($endTime)) {
            $map[] = [$field, '<=', $endTime];
        }
    }
}
