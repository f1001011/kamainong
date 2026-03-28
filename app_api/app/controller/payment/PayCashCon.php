<?php
declare(strict_types=1);

namespace app\controller\payment;

use app\controller\BaseCon;
use app\model\CommonPayCashModel;
use app\model\CommonWithdrawShowcaseModel;
use think\exception\ValidateException;

/**
 * 提现控制器
 * 负责处理用户提现记录相关的业务逻辑
 * 提供提现记录查询，用于用户查看提现历史和状态
 */
class PayCashCon extends BaseCon
{
    /**
     * 提现记录列表接口
     * 获取当前用户的提现记录列表，按ID倒序排列
     * 用于用户中心展示提现历史记录
     * 
     * @return mixed 返回提现记录列表数据，包含提现金额、手续费、实际到账金额、状态、申请时间等
     */
    public function GetCashList()
    {
        // 定义需要接收的参数字段：page-当前页码, limit-每页数量
        $postField = 'page,limit';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        
        // 获取分页参数，默认为page=1, limit=20
        $page = $post['page'] ?? 1;
        $limit = $post['limit'] ?? 20;
        // 获取当前登录用户的ID
        $uId = $this->request->UserID;
        
        // 构建查询条件：当前用户ID
        $map = ['u_id' => $uId];
        
        // 调用模型的分页查询方法，按ID倒序排列
        $list = CommonPayCashModel::PageList($map, '*', (int)$page, (int)$limit, 'id desc');
        
        // 返回成功数据
        return Show(SUCCESS, $list);
    }

    /**
     * 上传提现凭证接口
     * 用户上传提现成功截图，保存到展示表用于后续展示
     *
     * @return mixed
     */
    public function UploadVoucher()
    {
        $postField = 'withdraw_id';
        $post = $this->request->only(explode(',', $postField), 'post', null);

        try {
            validate(\app\validate\WithdrawVoucherValidate::class)
                ->scene('upload')
                ->check($post);
        } catch (ValidateException $e) {
            return Show(ERROR, [], $e->getError());
        }

        $file = $this->request->file('voucher_image');
        if (!$file) {
            return Show(ERROR, [], 10052);
        }

        $withdrawId = (int)$post['withdraw_id'];
        $userId = (int)$this->request->UserID;

        $withdrawInfo = CommonPayCashModel::PageDataOne(['id' => $withdrawId]);
        if (!$withdrawInfo) {
            return Show(ERROR, [], 10130);
        }

        if ((int)$withdrawInfo['u_id'] !== $userId) {
            return Show(ERROR, [], 10131);
        }

        if ((int)$withdrawInfo['status'] !== CommonPayCashModel::STATUS_SUCCESS) {
            return Show(ERROR, [], 10132);
        }

        $existsVoucher = CommonWithdrawShowcaseModel::PageDataOne(['withdraw_id' => $withdrawId], 'id');
        if ($existsVoucher) {
            return Show(ERROR, [], 10133);
        }

        $extension = strtolower((string)$file->extension());
        $allowExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!in_array($extension, $allowExtensions, true)) {
            return Show(ERROR, [], 10134);
        }

        $saveDir = dirname(app()->getRootPath()) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'withdraw' . DIRECTORY_SEPARATOR . date('Ym');
        if (!is_dir($saveDir) && !mkdir($saveDir, 0755, true) && !is_dir($saveDir)) {
            return Show(ERROR, [], 10135);
        }

        $saveName = md5((string)$userId . '_' . (string)$withdrawId . '_' . microtime(true) . '_' . mt_rand(1000, 9999)) . '.' . $extension;
        $savePath = $saveDir . DIRECTORY_SEPARATOR . $saveName;

        try {
            $file->move($saveDir, $saveName);
        } catch (\Throwable $e) {
            return Show(ERROR, [], 10135);
        }

        if (!is_file($savePath)) {
            return Show(ERROR, [], 10135);
        }

        $amount = (float)($withdrawInfo['money_actual'] ?: $withdrawInfo['actual_amount'] ?: $withdrawInfo['money'] ?: 0);
        $voucherPath = str_replace('\\', '/', $savePath);

        try {
            $voucherModel = new CommonWithdrawShowcaseModel();
            $voucherModel->save([
                'user_id' => $userId,
                'withdraw_id' => $withdrawId,
                'voucher_image' => $voucherPath,
                'amount' => $amount,
                'status' => CommonWithdrawShowcaseModel::STATUS_SHOW,
                'create_time' => date('Y-m-d H:i:s'),
            ]);
        } catch (\Throwable $e) {
            if (is_file($savePath)) {
                @unlink($savePath);
            }

            return Show(ERROR, [], 10135);
        }

        return Show(SUCCESS, [
            'id' => (int)$voucherModel->id,
            'withdraw_id' => $withdrawId,
            'voucher_image' => $voucherModel->voucher_image,
            'amount' => $amount,
        ], 10136);
    }
}
