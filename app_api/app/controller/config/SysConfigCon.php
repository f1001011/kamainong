<?php
declare(strict_types=1);

namespace app\controller\config;

use app\controller\BaseCon;
use app\model\CommonSysConfigModel;

/**
 * 系统配置控制器
 * 负责处理系统配置项相关的业务逻辑
 * 提供系统配置查询接口，用于获取APP运行时所需的配置信息
 */
class SysConfigCon extends BaseCon
{
    /**
     * 系统配置列表接口
     * 获取系统配置项列表，支持按配置名称精确查询
     * 用于前端获取APP运行所需的系统配置参数
     * 
     * @return mixed 返回系统配置列表数据，包含配置名称和配置值
     */
    public function GetConfigList()
    {
        // 定义需要接收的参数字段：name-配置名称(可选)
        $postField = 'name';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取配置名称参数
        $name = $post['name'] ?? '';
        
        // 构建查询条件
        $map = [];
        // 若传入配置名称，则精确查询该配置项
        if ($name) {
            $map['name'] = $name;
        }
        
        // 调用模型的不分页查询方法
        $list = CommonSysConfigModel::PageData($map);
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
}
