<?php
declare(strict_types=1);

namespace app\controller\logger;

use app\controller\BaseCon;
use app\model\MoneyFanyongLogModel;

/**
 * 返佣记录控制器
 * 负责处理用户返佣记录相关的业务逻辑
 * 提供返佣记录查询，用于用户查看代理返佣收益明细
 */
class MoneyFanyongLogCon extends BaseCon
{
    /**
     * 返佣记录列表接口
     * 获取当前用户的返佣记录列表，按ID倒序排列
     * 用于用户中心展示代理返佣收益明细
     * 
     * @return mixed 返回返佣记录列表数据，包含返佣金额、返佣类型、下级用户信息、创建时间等
     */
    public function GetFanyongLogList()
    {
        // 定义需要接收的参数字段：page-当前页码, limit-每页数量
        $postField = 'page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取分页参数，默认为page=1, limit=20
        $page = $post['page'] ?? 1;
        $limit = $post['limit'] ?? 20;
        // 获取当前登录用户的ID
        $userId = $this->request->UserID;
        
        // 构建查询条件：当前用户ID
        $map = ['user_id' => $userId];
        
        // 调用模型的分页查询方法，按ID倒序排列
        $list = MoneyFanyongLogModel::PageList($map, '*', (int)$page, (int)$limit, 'id desc');
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
}
