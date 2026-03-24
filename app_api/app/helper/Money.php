<?php

namespace app\helper;

/**
 * 货币和金额格式化助手
 */
class Money
{
    // 货币符号
    const SYMBOL = 'XAF';
    const CURRENCY = 'XAF'; // 中非法郎
    
    /**
     * 格式化金额（带货币符号）
     * @param float $amount 金额
     * @param bool $withSymbol 是否带货币符号
     * @return string
     */
    public static function format($amount, $withSymbol = true)
    {
        $formatted = number_format((float)$amount, 0, '.', ' ');
        
        if ($withSymbol) {
            return $formatted . ' ' . self::SYMBOL;
        }
        
        return $formatted;
    }
    
    /**
     * 格式化金额（纯数字）
     * @param float $amount 金额
     * @param int $decimals 小数位数
     * @return string
     */
    public static function formatNumber($amount, $decimals = 2)
    {
        return number_format((float)$amount, $decimals, '.', '');
    }
    
    /**
     * 解析金额字符串
     * @param string $str 金额字符串
     * @return float
     */
    public static function parse($str)
    {
        // 移除货币符号和空格
        $str = str_replace(self::SYMBOL, '', $str);
        $str = str_replace(' ', '', $str);
        $str = trim($str);
        
        return (float)$str;
    }
    
    /**
     * 计算税率后的金额
     * @param float $amount 金额
     * @param float $rate 税率（0.1 = 10%）
     * @return float
     */
    public static function afterTax($amount, $rate = 0)
    {
        if ($rate <= 0) {
            return $amount;
        }
        
        return $amount * (1 - $rate);
    }
    
    /**
     * 计算税额
     * @param float $amount 金额
     * @param float $rate 税率（0.1 = 10%）
     * @return float
     */
    public static function tax($amount, $rate = 0.1)
    {
        return $amount * $rate;
    }
}
