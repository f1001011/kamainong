<?php

namespace app\helper;

use think\facade\Lang;

/**
 * 统一响应助手
 */
class Response
{
    /**
     * 成功响应
     */
    public static function success($data = null, $message = '')
    {
        return json([
            'success' => true,
            'data' => $data,
            'message' => $message
        ]);
    }
    
    /**
     * 错误响应
     * @param string $code 错误码名称
     * @param array $params 参数替换（如金额等）
     * @param int $httpStatus HTTP状态码
     */
    public static function error($code, $params = [], $httpStatus = 400)
    {
        $error = self::getErrorInfo($code, $params);
        
        return json([
            'success' => false,
            'error' => [
                'code' => $error['code'],
                'message' => $error['message']
            ]
        ], $httpStatus);
    }
    
    /**
     * 获取错误信息
     */
    private static function getErrorInfo($code, $params = [])
    {
        // 先从语言包获取
        $lang = Lang::get('response.' . $code);
        
        if ($lang && is_array($lang)) {
            $message = $lang['message'];
            $codeValue = $lang['code'];
        } else {
            // 如果语言包没有，使用默认
            $message = $code;
            $codeValue = 0;
        }
        
        // 替换参数
        if (!empty($params)) {
            foreach ($params as $key => $value) {
                $message = str_replace('{' . $key . '}', $value, $message);
            }
        }
        
        return [
            'code' => $codeValue,
            'message' => $message
        ];
    }
    
    /**
     * 分页响应
     */
    public static function paginated($list, $total, $page = 1, $pageSize = 20)
    {
        return self::success([
            'list' => $list,
            'pagination' => [
                'total' => (int)$total,
                'page' => (int)$page,
                'pageSize' => (int)$pageSize,
                'totalPages' => ceil($total / $pageSize)
            ]
        ]);
    }
    
    /**
     * 列表响应（带总数）
     */
    public static function list($list, $total = null)
    {
        $data = ['list' => $list];
        
        if ($total !== null) {
            $data['total'] = (int)$total;
        }
        
        return self::success($data);
    }
    
    /**
     * 空响应
     */
    public static function empty($message = '')
    {
        return self::success([
            'list' => [],
            'total' => 0
        ], $message);
    }
}
