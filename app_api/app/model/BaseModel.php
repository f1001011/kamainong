<?php

namespace app\model;

use think\Model;
use app\helper\Money;
use app\consts\IncomeStatus;
use app\consts\OrderStatus;

/**
 * 基础 Model 类
 */
class BaseModel extends Model
{
    /**
     * 格式化金额
     */
    protected function formatMoney($amount, $field = 'money')
    {
        if (is_array($this->$field)) {
            return Money::formatNumber($this->$field);
        }
        return Money::formatNumber($amount);
    }
    
    /**
     * 获取分页数据
     */
    public function paginate($page = 1, $pageSize = 20)
    {
        $total = $this->count();
        $list = $this->page($page, $pageSize)->select();
        
        return [
            'list' => $list,
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize
        ];
    }
    
    /**
     * 获取单条数据或抛出异常
     */
    public function findOrFail($id)
    {
        $data = $this->find($id);
        if (!$data) {
            throw new \Exception('数据不存在');
        }
        return $data;
    }
}
