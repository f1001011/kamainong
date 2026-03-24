<?php
namespace app\controller;

use think\facade\Db;

/**
 * Honeywell 其他模块
 */
class HoneywellOther extends HoneywellBase
{
    public function banners()
    {
        $list = Db::name('common_ads')
            ->where('position', 'home_banner')
            ->where('status', 1)
            ->order('sort', 'asc')
            ->select()
            ->toArray();
        
        // 返回数组格式给前端
        $banners = [];
        foreach ($list as $item) {
            $banners[] = [
                'id' => (int)$item['id'],
                'imageUrl' => $item['image'] ?? '',
                'linkUrl' => $item['link'] ?? null,
                'sortOrder' => (int)($item['sort'] ?? 0)
            ];
        }
        
        return json(['success' => true, 'data' => ['list' => $banners]]);
    }

    public function announcements()
    {
        $page = input('page', 1);
        $pageSize = input('pageSize', 20);
        
        // 使用 paginate 方法
        $result = Db::name('common_ads')
            ->where('position', 'announcement')
            ->where('status', 1)
            ->order('id', 'desc')
            ->paginate([
                'list_rows' => $pageSize,
                'page' => $page,
            ]);
        
        $total = $result->total();
        $list = $result->items()->toArray();
        
        $announcements = [];
        foreach ($list as $item) {
            $announcements[] = [
                'id' => (int)$item['id'],
                'title' => $item['title'] ?? '',
                'content' => $item['content'] ?? '',
                'createdAt' => date('c', strtotime($item['create_time'] ?? 'now'))
            ];
        }
        
        return json([
            'success' => true,
            'data' => [
                'list' => $announcements,
                'pagination' => [
                    'total' => (int)$total,
                    'page' => (int)$page,
                    'pageSize' => (int)$pageSize,
                    'totalPages' => ceil($total / $pageSize)
                ]
            ]
        ]);
    }

    public function aboutUs()
    {
        $content = Db::name('common_sys_config')->where('key', 'about_us')->value('value');
        
        return json(['success' => true, 'data' => ['content' => $content ?? '']]);
    }

    public function serviceLinks()
    {
        $telegram = Db::name('common_sys_config')->where('key', 'telegram_link')->value('value');
        $whatsapp = Db::name('common_sys_config')->where('key', 'whatsapp_link')->value('value');
        
        return json([
            'success' => true,
            'data' => [
                'telegram' => $telegram ?? '',
                'whatsapp' => $whatsapp ?? ''
            ]
        ]);
    }
}
