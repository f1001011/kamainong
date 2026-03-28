<?php

namespace app\middleware;

use app\model\CommonAdminLogModel;

/**
 * 后台管理员操作日志中间件
 * 负责在后台接口请求完成后，自动写入管理员操作日志。
 */
class AdminLogMiddleware
{
    public function handle($request, \Closure $next)
    {
        $response = $next($request);

        try {
            $adminId = (int)($request->AdminID ?? 0);
            if ($adminId <= 0) {
                return $response;
            }

            if (!$this->shouldLogRequest($request)) {
                return $response;
            }

            $adminName = trim((string)($request->AdminName ?? ''));
            if ($adminName === '') {
                $adminName = 'admin_' . $adminId;
            }

            $controller = method_exists($request, 'controller') ? (string)$request->controller() : '';
            $action = method_exists($request, 'action') ? (string)$request->action() : '';
            $func = trim($controller . '@' . $action, '@');
            if ($func === '') {
                $func = $request->pathinfo();
            }

            $remark = $this->buildRemark($request, $response);

            CommonAdminLogModel::recordLog(
                $adminName,
                $adminId,
                (string)$request->ip(),
                $func,
                $remark
            );
        } catch (\Throwable $e) {
            // 后台日志写入失败不能影响主业务接口返回。
        }

        return $response;
    }

    /**
     * 判断当前请求是否属于需要记录的后台写操作
     * 目前只记录新增、修改、删除这类操作，不记录 list/detail 等查询接口。
     *
     * @param mixed $request
     * @return bool
     */
    protected function shouldLogRequest($request): bool
    {
        $action = method_exists($request, 'action') ? (string)$request->action() : '';
        if ($action !== '' && preg_match('/^(Add|Update|Delete)/i', $action)) {
            return true;
        }

        $path = strtolower((string)$request->pathinfo());
        if ($path === '') {
            return false;
        }

        return (bool)preg_match('#/(add|update|delete)$#', $path);
    }

    /**
     * 组装日志备注
     * 备注中保留请求方式、请求路径和接口返回码，方便后台后续排查。
     *
     * @param mixed $request
     * @param mixed $response
     * @return string
     */
    protected function buildRemark($request, $response): string
    {
        $parts = [];
        $parts[] = strtoupper((string)$request->method()) . ' ' . $request->pathinfo();

        $responseCode = $this->resolveResponseCode($response);
        if ($responseCode !== '') {
            $parts[] = 'code=' . $responseCode;
        }

        $remark = implode('; ', $parts);
        if (mb_strlen($remark) > 255) {
            $remark = mb_substr($remark, 0, 255);
        }

        return $remark;
    }

    /**
     * 提取接口响应中的业务返回码
     *
     * @param mixed $response
     * @return string
     */
    protected function resolveResponseCode($response): string
    {
        if (!is_object($response) || !method_exists($response, 'getContent')) {
            return '';
        }

        $content = (string)$response->getContent();
        if ($content === '') {
            return '';
        }

        $result = json_decode($content, true);
        if (!is_array($result) || !isset($result['code'])) {
            return '';
        }

        return (string)$result['code'];
    }
}
