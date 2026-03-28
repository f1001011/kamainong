<?php
declare(strict_types=1);

namespace app\controller\activity;

use app\controller\BaseCon;
use app\model\CommonWithdrawShowcaseModel;
use app\model\CommonWithdrawLikeModel;
use app\model\CommonWithdrawCommentModel;

/**
 * 提现凭证展示控制器
 * 负责处理提现凭证展示、点赞、评论相关的业务逻辑
 * 提供提现凭证列表查询、详情查看、点赞数统计、评论列表等功能
 */
class WithdrawShowcaseCon extends BaseCon
{
    /**
     * 提现凭证展示列表接口
     * 获取所有显示状态的提现凭证列表，按ID倒序排列，并统计点赞数
     * 用于展示区展示用户上传的提现成功凭证
     * 
     * @return mixed 返回提现凭证列表数据，包含用户信息、凭证图片、提现金额、点赞数等
     */
    public function GetShowcaseList()
    {
        // 定义需要接收的参数字段：page-当前页码, limit-每页数量
        $postField = 'page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取分页参数，默认为page=1, limit=10
        $page = $post['page'] ?? 1;
        $limit = $post['limit'] ?? 10;
        
        // 构建查询条件：状态为显示
        $map = ['status' => CommonWithdrawShowcaseModel::STATUS_SHOW];
        
        // 调用模型的分页查询方法，按ID倒序排列
        $list = CommonWithdrawShowcaseModel::PageList($map, '*', (int)$page, (int)$limit, 'id desc');
        
        // 若查询结果不为空，则处理每条数据，统计点赞数
        if ($list) {
            foreach ($list as &$item) {
                // 统计该凭证的点赞数量
                $likeCount = CommonWithdrawLikeModel::where('showcase_id', $item['id'])->count();
                // 将点赞数赋值给数据
                $item['like_count'] = $likeCount;
            }
        }
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
    
    /**
     * 提现凭证详情接口
     * 获取指定ID的提现凭证详情，支持同时查询评论列表
     * 用于展示区查看凭证详情及用户评论
     * 
     * @return mixed 返回提现凭证详情数据，包含凭证信息、点赞数、可选评论列表等
     */
    public function GetShowcaseDetail()
    {
        // 定义需要接收的参数字段：id-凭证ID(必传), plpage-评论分页当前页, pllimit-评论分页每页数量
        $postField = 'id,plpage,pllimit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取查询参数
        $id = $post['id'] ?? 0; // 凭证ID
        $plpage = $post['plpage'] ?? 0; // 评论分页当前页
        $pllimit = $post['pllimit'] ?? 20; // 评论分页每页数量
        
        // 校验凭证ID是否传入
        if (!$id) {
            return Show(ERROR, [], 'id_required');
        }
        
        // 查询凭证详情
        $detail = CommonWithdrawShowcaseModel::PageDataOne([
            'id' => $id, 
            'status' => CommonWithdrawShowcaseModel::STATUS_SHOW // 显示状态
        ]);
        
        // 若凭证不存在，则返回错误提示
        if (!$detail) {
            return Show(ERROR, [], 'showcase_not_found');
        }
        
        // 统计该凭证的点赞数量
        $likeCount = CommonWithdrawLikeModel::where('showcase_id', $id)->count();
        // 将点赞数赋值给详情数据
        $detail['like_count'] = $likeCount;
        
        // 如果传入了评论分页参数，则查询评论列表
        if ($plpage > 0) {
            // 构建评论查询条件：凭证ID
            $commentMap = ['showcase_id' => $id];
            // 调用模型的分页查询方法，按ID倒序排列
            $commentList = CommonWithdrawCommentModel::PageList(
                $commentMap, 
                '*', 
                (int)$plpage, 
                (int)$pllimit, 
                'id desc'
            );
            // 将评论列表赋值给详情数据
            $detail['comment_list'] = $commentList;
        }
        
        // 返回成功数据
        return Show(SUCCESS, $detail);
    }
    
    /**
     * 评论列表接口
     * 获取指定提现凭证的评论列表，按ID倒序排列
     * 用于查看凭证详情页的评论信息
     * 
     * @return mixed 返回评论列表数据，包含评论内容、评论用户、评论时间等
     */
    public function GetCommentList()
    {
        // 定义需要接收的参数字段：showcase_id-凭证ID, page-当前页码, limit-每页数量
        $postField = 'showcase_id,page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取查询参数
        $showcaseId = $post['showcase_id'] ?? 0; // 凭证ID
        $page = $post['page'] ?? 1; // 当前页码
        $limit = $post['limit'] ?? 20; // 每页数量
        
        // 校验凭证ID是否传入
        if (!$showcaseId) {
            return Show(ERROR, [], 'showcase_id_required');
        }
        
        // 构建查询条件：凭证ID
        $map = ['showcase_id' => $showcaseId];
        
        // 调用模型的分页查询方法，按ID倒序排列
        $list = CommonWithdrawCommentModel::PageList($map, '*', (int)$page, (int)$limit, 'id desc');
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }
}
