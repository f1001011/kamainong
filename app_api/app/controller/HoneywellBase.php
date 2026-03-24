<?php
namespace app\controller;

use app\BaseController as Base;
use app\helper\Response;
use app\helper\Money;
use think\facade\Db;
use think\facade\Lang;

/**
 * Honeywell 基础控制器
 */
class HoneywellBase extends Base
{
    use \app\traits\Singleton;
    
    /**
     * 成功响应
     */
    protected function success($data = null, $message = '')
    {
        return Response::success($data, $message);
    }
    
    /**
     * 错误响应
     */
    protected function error($code, $params = [], $httpStatus = 400)
    {
        return Response::error($code, $params, $httpStatus);
    }
    
    /**
     * 分页响应
     */
    protected function paginated($list, $total, $page = 1, $pageSize = 20)
    {
        return Response::paginated($list, $total, $page, $pageSize);
    }
    
    /**
     * 列表响应
     */
    protected function list($list, $total = null)
    {
        return Response::list($list, $total);
    }
    
    /**
     * 空响应
     */
    protected function empty($message = '')
    {
        return Response::empty($message);
    }
    
    /**
     * 格式化金额
     */
    protected function money($amount, $withSymbol = false)
    {
        return Money::formatNumber($amount);
    }
    
    /**
     * 获取当前用户ID
     */
    protected function getUserId()
    {
        $token = request()->header('authorization');
        if (empty($token)) return null;
        
        $token = str_replace('Bearer ', '', $token);
        if (empty($token)) return null;
        
        $tokenInfo = Db::name('common_home_token')
            ->where('token', $token)
            ->where('expire_time', '>', time())
            ->find();
        
        return $tokenInfo ? $tokenInfo['uid'] : null;
    }
    
    /**
     * 获取当前用户
     */
    protected function getUser()
    {
        $userId = $this->getUserId();
        if (!$userId) return null;
        
        return Db::name('common_user')->where('id', $userId)->find();
    }
    
    /**
     * 未授权响应
     */
    protected function unauthorized()
    {
        return $this->error('UNAUTHORIZED', [], 401);
    }
    
    /**
     * 获取分页参数
     */
    protected function getPageParams()
    {
        $page = max(1, (int)input('page', 1));
        $pageSize = min(100, max(1, (int)input('pageSize', 20)));
        
        return [$page, $pageSize];
    }
    
    /**
     * 验证必填参数
     */
    protected function validateRequired($params, $fields)
    {
        foreach ($fields as $field) {
            if (!isset($params[$field]) || $params[$field] === '') {
                return $field;
            }
        }
        return null;
    }
}
