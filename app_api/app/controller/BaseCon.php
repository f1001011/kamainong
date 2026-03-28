<?php

namespace app\controller;

use app\BaseController;
use app\model\BaseModel;

/**
 * 控制器基类
 * 所有业务控制器都需要继承该基类
 * 继承自ThinkPHP的BaseController，提供基础的请求处理能力
 */
class BaseCon extends BaseController
{
    // 该类主要继承自ThinkPHP的BaseController
    // 提供了以下基础功能：
    // - $this->request: 请求对象，用于获取请求参数
    // - $this->request->UserID: 当前登录用户的ID（由AuthMiddleware中间件设置）
    // - $this->request->only(): 获取指定字段的请求参数
    // - Show(): 全局函数，用于统一返回接口数据
}
