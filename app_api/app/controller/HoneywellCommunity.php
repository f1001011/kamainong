<?php
namespace app\controller;

use app\BaseController;
use think\facade\Db;

class HoneywellCommunity extends BaseController
{
    public function posts()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $page = input('page', 1);
        $pageSize = input('pageSize', 20);
        
        $list = Db::name('common_withdraw_showcase')
            ->alias('s')
            ->leftJoin('common_user u', 's.uid = u.id')
            ->field('s.*, u.phone')
            ->order('s.id', 'desc')
            ->page($page, $pageSize)
            ->select()
            ->toArray();
        
        $total = Db::name('common_withdraw_showcase')->count();
        
        $posts = [];
        foreach ($list as $item) {
            $likes = Db::name('common_withdraw_like')->where('showcase_id', $item['id'])->count();
            $comments = Db::name('common_withdraw_comment')->where('showcase_id', $item['id'])->count();
            $userLiked = Db::name('common_withdraw_like')->where('showcase_id', $item['id'])->where('uid', $userId)->find();
            
            $posts[] = [
                'id' => (int)$item['id'],
                'userId' => (int)$item['uid'],
                'username' => substr($item['phone'], 0, 3) . '****' . substr($item['phone'], -2),
                'amount' => number_format($item['amount'], 2, '.', ''),
                'image' => $item['image'] ?? '',
                'likes' => $likes,
                'comments' => $comments,
                'liked' => (bool)$userLiked,
                'createdAt' => date('c', strtotime($item['create_time']))
            ];
        }
        
        return json(['success' => true, 'data' => ['list' => $posts, 'pagination' => ['total' => (int)$total, 'page' => (int)$page, 'pageSize' => (int)$pageSize]]]);
    }

    public function myPosts()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $list = Db::name('common_withdraw_showcase')->where('uid', $userId)->order('id', 'desc')->select()->toArray();
        
        $posts = [];
        foreach ($list as $item) {
            $posts[] = [
                'id' => (int)$item['id'],
                'amount' => number_format($item['amount'], 2, '.', ''),
                'image' => $item['image'] ?? '',
                'createdAt' => date('c', strtotime($item['create_time']))
            ];
        }
        
        return json(['success' => true, 'data' => ['list' => $posts]]);
    }

    public function detail()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $id = input('id', 0);
        $post = Db::name('common_withdraw_showcase')->where('id', $id)->find();
        
        if (!$post) return json(['success' => false, 'error' => ['code' => 'NOT_FOUND', 'message' => 'No encontrado']]);
        
        $comments = Db::name('common_withdraw_comment')
            ->alias('c')
            ->leftJoin('common_user u', 'c.uid = u.id')
            ->where('c.showcase_id', $id)
            ->field('c.*, u.phone')
            ->order('c.id', 'desc')
            ->select()
            ->toArray();
        
        $commentList = [];
        foreach ($comments as $c) {
            $commentList[] = [
                'id' => (int)$c['id'],
                'username' => substr($c['phone'], 0, 3) . '****',
                'content' => $c['content'],
                'createdAt' => date('c', strtotime($c['create_time']))
            ];
        }
        
        return json(['success' => true, 'data' => ['post' => $post, 'comments' => $commentList]]);
    }

    public function like()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $id = input('id', 0);
        
        $exists = Db::name('common_withdraw_like')->where('showcase_id', $id)->where('uid', $userId)->find();
        if ($exists) {
            Db::name('common_withdraw_like')->where('id', $exists['id'])->delete();
            return json(['success' => true, 'data' => ['liked' => false]]);
        }
        
        Db::name('common_withdraw_like')->insert(['showcase_id' => $id, 'uid' => $userId, 'create_time' => date('Y-m-d H:i:s')]);
        return json(['success' => true, 'data' => ['liked' => true]]);
    }

    public function comment()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $id = input('id', 0);
        $content = input('content', '');
        
        if (empty($content)) return json(['success' => false, 'error' => ['code' => 'EMPTY_CONTENT', 'message' => 'Contenido vacío']]);
        
        Db::name('common_withdraw_comment')->insert(['showcase_id' => $id, 'uid' => $userId, 'content' => $content, 'create_time' => date('Y-m-d H:i:s')]);
        return json(['success' => true, 'data' => null]);
    }

    public function create()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $amount = input('amount', 0);
        $image = input('image', '');
        
        Db::name('common_withdraw_showcase')->insert(['uid' => $userId, 'amount' => $amount, 'image' => $image, 'create_time' => date('Y-m-d H:i:s')]);
        return json(['success' => true, 'data' => null]);
    }

    public function completedWithdraws()
    {
        return $this->posts();
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
