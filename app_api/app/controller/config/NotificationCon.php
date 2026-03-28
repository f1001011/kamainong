<?php
declare(strict_types=1);

namespace app\controller\config;

use app\controller\BaseCon;
use app\model\CommonNotificationModel;

/**
 * 通知控制器
 * 负责处理用户通知消息相关的业务逻辑
 * 提供系统通知和交易通知的列表查询，用于用户查看各类通知信息
 */
class NotificationCon extends BaseCon
{
    /**
     * 通知列表接口
     * 获取当前用户的所有通知列表，按已读状态和创建时间倒序排列
     * 用于用户中心展示系统通知和交易通知
     * 
     * @return mixed 返回通知列表数据，包含通知类型、标题、内容、已读状态、创建时间等
     */
    public function GetNotificationList()
    {
        // 定义需要接收的参数字段：page-当前页码, limit-每页数量
        $postField = 'page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取分页参数，默认为page=1, limit=20
        $page = $post['page'] ?? 1;
        $limit = $post['limit'] ?? 20;
        // 获取当前登录用户的ID
        $uid = $this->request->UserID;
        
        // 构建查询条件：当前用户ID
        $map = ['uid' => $uid];
        
        // 调用模型的分页查询方法，按已读状态正序(未读在前)、创建时间倒序排列
        $list = CommonNotificationModel::PageList($map, '*', (int)$page, (int)$limit, 'is_read asc, create_time desc');
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }

    /**
     * 通知标记已读接口
     * 将指定通知标记为已读状态
     * 
     * @return mixed 返回操作结果
     */
    public function MarkRead()
    {
        // 定义需要接收的参数字段：id-通知ID
        $postField = 'id';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取通知ID
        $id = $post['id'] ?? 0;
        
        // 校验通知ID是否传入
        if (!$id) {
            return Show(ERROR, [], 'id_required');
        }
        
        // 获取当前登录用户的ID
        $userId = $this->request->UserID;
        
        // 查询通知是否存在
        $notification = CommonNotificationModel::PageDataOne(['id' => $id, 'uid' => $userId]);
        
        // 若通知不存在，则返回错误提示
        if (!$notification) {
            return Show(ERROR, [], 'notification_not_found');
        }
        
        // 若通知已是已读状态，则直接返回成功
        if ($notification['is_read'] == CommonNotificationModel::IS_READ_YES) {
            return Show(SUCCESS, [], 'notification_already_read');
        }
        
        // 更新通知为已读状态
        $result = CommonNotificationModel::where('id', $id)->update(['is_read' => CommonNotificationModel::IS_READ_YES]);
        
        // 返回成功数据
        return Show(SUCCESS, [], 'notification_marked_read');
    }
}
