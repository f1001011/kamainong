<?php
declare(strict_types=1);

namespace app\controller\payment;

use app\controller\BaseCon;
use app\model\CommonRechargeVoucherModel;
use app\model\CommonUserModel;

/**
 * 充值凭证控制器
 * 负责处理用户充值凭证展示相关的业务逻辑
 * 提供充值凭证查询，用于展示用户上传的充值凭证信息
 */
class RechargeVoucherCon extends BaseCon
{
    /**
     * 充值凭证列表接口
     * 获取当前用户已通过的充值凭证列表，按ID倒序排列
     * 用于展示区展示用户上传的充值成功凭证
     * 
     * @return mixed 返回充值凭证列表数据，包含充值用户信息、凭证图片、充值金额、状态等
     */
    public function GetVoucherList()
    {
        // 获取当前登录用户的ID
        $userId = $this->request->UserID;
        
        // 构建查询条件：当前用户ID + 审核通过状态
        $map = [
            'user_id' => $userId,
            'status' => CommonRechargeVoucherModel::STATUS_PASS,
        ];
        
        // 调用模型的不分页查询方法，按ID倒序排列
        $list = CommonRechargeVoucherModel::PageData($map, 'id desc');
        
        // 若查询结果不为空，则处理每条数据，添加用户昵称信息
        if ($list) {
            foreach ($list as &$item) {
                // 根据用户ID查询用户信息，获取昵称或用户名
                $userInfo = CommonUserModel::PageDataOne(
                    ['id' => $item['user_id']], 
                    'nickname,user_name'
                );
                // 优先使用昵称，若昵称为空则使用用户名
                $item['nickname'] = $userInfo['nickname'] ?? $userInfo['user_name'] ?? '';
            }
        }
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
}
