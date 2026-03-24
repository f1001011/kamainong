<?php

namespace app\traits;

/**
 * 单例模式 Trait
 */
trait Singleton
{
    protected static $instance = null;
    
    /**
     * 获取单例实例
     */
    public static function getInstance()
    {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * 防止克隆
     */
    protected function __clone() {}
    
    /**
     * 防止反序列化
     */
    protected function __wakeup() {}
}
