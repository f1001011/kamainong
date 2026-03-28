<?php
declare(strict_types=1);

namespace app\controller\payment;

use app\controller\BaseCon;
use app\model\CommonPayMoneyLogModel;

/**
 * 资金流水控制器
 * 负责处理用户资金流水记录相关的业务逻辑
 * 提供资金流水查询，支持按资金类型筛选，用于用户查看账户资金变动明细
 */
class PayMoneyLogCon extends BaseCon
{
    /**
     * 资金流水列表接口
     * 获取当前用户的资金流水记录，支持按资金类型(余额/积分)筛选，按ID倒序排列
     * 用于用户中心展示账户资金变动明细
     * 
     * @return mixed 返回资金流水列表数据，包含变动类型、变动金额、变动前后余额、备注、时间等
     */
    public function GetMoneyLogList()
    {
        // 定义需要接收的参数字段：money_type-资金类型(可选1余额2积分), page-当前页码, limit-每页数量
        $postField = 'money_type,page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取查询参数
        $moneyType = $post['money_type'] ?? 0; // 资金类型：1-余额 2-积分
        $page = $post['page'] ?? 1; // 当前页码，默认1
        $limit = $post['limit'] ?? 20; // 每页数量，默认20
        // 获取当前登录用户的ID
        $uid = $this->request->UserID;
        
        // 构建查询条件：当前用户ID
        $map = ['uid' => $uid];
        
        // 若传入了资金类型，则添加筛选条件
        if ($moneyType) {
            $map['money_type'] = $moneyType;
        }
        
        // 调用模型的分页查询方法，按ID倒序排列
        $list = CommonPayMoneyLogModel::PageList($map, '*', (int)$page, (int)$limit, 'id desc');
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
}
