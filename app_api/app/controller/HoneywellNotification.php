<?php
namespace app\controller;

use think\facade\Db;

/**
 * Honeywell 通知模块
 */
class HoneywellNotification extends HoneywellBase
{
    public function list()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        list($page, $pageSize) = $this->getPageParams();
        
        // 使用 paginate 方法
        $result = Db::name('common_notification')
            ->where('uid', $userId)
            ->order('id', 'desc')
            ->paginate([
                'list_rows' => $pageSize,
                'page' => $page,
            ]);
        
        $total = $result->total();
        $list = $result->items()->toArray();
        
        $notifications = [];
        foreach ($list as $item) {
            $notifications[] = [
                'id' => (int)$item['id'],
                'title' => $item['title'],
                'content' => $item['content'],
                'isRead' => (bool)$item['is_read'],
                'createdAt' => date('c', strtotime($item['create_time']))
            ];
        }
        
        return json([
            'success' => true,
            'data' => [
                'list' => $notifications,
                'pagination' => ['total' => (int)$total, 'page' => (int)$page, 'pageSize' => (int)$pageSize]
            ]
        ]);
    }

    public function detail()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $id = input('id', 0);
        $notification = Db::name('common_notification')->where('id', $id)->where('uid', $userId)->find();
        
        if (!$notification) {
            return json(['success' => false, 'error' => ['code' => 'NOT_FOUND', 'message' => 'No encontrado']]);
        }
        
        return json([
            'success' => true,
            'data' => [
                'id' => (int)$notification['id'],
                'title' => $notification['title'],
                'content' => $notification['content'],
                'isRead' => (bool)$notification['is_read'],
                'createdAt' => date('c', strtotime($notification['create_time']))
            ]
        ]);
    }

    public function unreadCount()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $count = Db::name('common_notification')->where('uid', $userId)->where('is_read', 0)->count();
        
        return json(['success' => true, 'data' => ['count' => (int)$count]]);
    }

    public function read()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $id = input('id', 0);
        
        Db::name('common_notification')->where('id', $id)->where('uid', $userId)->update(['is_read' => 1]);
        
        return json(['success' => true, 'data' => null]);
    }

    public function readAll()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        Db::name('common_notification')->where('uid', $userId)->where('is_read', 0)->update(['is_read' => 1]);
        
        return json(['success' => true, 'data' => null]);
    }
    
    private function getUserId()
    {
        $token = request()->header('authorization');
        $token = str_replace('Bearer ', '', $token);
        if (empty($token)) return null;
        
        $tokenInfo = Db::name('common_home_token')->where('token', $token)->find();
        return $tokenInfo ? $tokenInfo['uid'] : null;
    }
    
    private function unauthorized()
    {
        return json(['success' => false, 'error' => ['code' => 'UNAUTHORIZED', 'message' => 'No autorizado']], 401);
    }
}
