<?php
namespace app\controller;

use think\facade\Db;

/**
 * Honeywell 银行卡模块
 */
class HoneywellBankCard extends HoneywellBase
{
    /**
     * 银行卡列表
     * GET /api/bank-cards
     */
    public function list()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $list = Db::name('common_user_bank')
            ->where('uid', $userId)
            ->order('is_default', 'desc')
            ->select()
            ->toArray();
        
        $cards = [];
        foreach ($list as $item) {
            $cards[] = $this->formatCard($item);
        }
        
        // 获取最大绑卡数量
        $maxCount = (int)Db::name('common_sys_config')->where('name', 'max_bindcard')->value('value', 5);
        
        return $this->success([
            'list' => $cards,
            'maxCount' => $maxCount,
            'canAdd' => count($list) < $maxCount
        ]);
    }

    /**
     * 添加银行卡
     * POST /api/bank-cards
     */
    public function add()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $bankName = input('bankName', '');
        $bankCode = input('bankCode', '');
        $cardNumber = input('cardNumber', '');
        $holderName = input('holderName', '');
        
        // 参数验证
        if (empty($bankName) || empty($cardNumber) || empty($holderName)) {
            return $this->error('INVALID_PARAMS');
        }
        
        // 检查是否已存在该卡
        $exists = Db::name('common_user_bank')
            ->where('uid', $userId)
            ->where('bank_number', $cardNumber)
            ->find();
        
        if ($exists) {
            return $this->error('CARD_EXISTS');
        }
        
        // 检查绑卡数量限制
        $count = Db::name('common_user_bank')->where('uid', $userId)->count();
        $maxCount = (int)Db::name('common_sys_config')->where('name', 'max_bindcard')->value('value', 5);
        
        if ($count >= $maxCount) {
            return $this->error('CARD_LIMIT_REACHED');
        }
        
        // 如果是第一张卡，设为默认
        $isDefault = $count == 0 ? 1 : 0;
        
        $id = Db::name('common_user_bank')->insertGetId([
            'uid' => $userId,
            'bank_name' => $bankName,
            'bank_code' => $bankCode,
            'bank_number' => $cardNumber,
            'real_name' => $holderName,
            'is_default' => $isDefault,
            'create_time' => date('Y-m-d H:i:s')
        ]);
        
        return $this->success(['id' => $id]);
    }

    /**
     * 删除银行卡
     * DELETE /api/bank-cards/:id
     */
    public function delete()
    {
        $userId = $this->getUserId();
        if (!$userId) return $this->unauthorized();
        
        $id = input('id', 0);
        
        $card = Db::name('common_user_bank')
            ->where('id', $id)
            ->where('uid', $userId)
            ->find();
        
        if (!$card) {
            return $this->error('CARD_NOT_FOUND');
        }
        
        Db::name('common_user_bank')->where('id', $id)->delete();
        
        // 如果删除的是默认卡，将第一张卡设为默认
        if ($card['is_default'] == 1) {
            $firstCard = Db::name('common_user_bank')
                ->where('uid', $userId)
                ->order('id', 'asc')
                ->find();
            
            if ($firstCard) {
                Db::name('common_user_bank')->where('id', $firstCard['id'])->update(['is_default' => 1]);
            }
        }
        
        return $this->success();
    }

    /**
     * 格式化银行卡信息
     */
    private function formatCard($card)
    {
        return [
            'id' => (int)$card['id'],
            'bankName' => $card['bank_name'],
            'bankCode' => $card['bank_code'],
            'cardNumber' => $card['bank_number'],
            'holderName' => $card['real_name'],
            'isDefault' => (bool)$card['is_default']
        ];
    }

    /**
     * 获取当前用户ID
     */
    private function getUserId()
    {
        $token = request()->header('authorization');
        $token = str_replace('Bearer ', '', $token);
        if (empty($token)) return null;
        
        $tokenInfo = Db::name('common_home_token')->where('token', $token)->find();
        return $tokenInfo ? $tokenInfo['uid'] : null;
    }

    /**
     * 未授权响应
     */
    private function unauthorized()
    {
        return json(['success' => false, 'error' => ['code' => 'UNAUTHORIZED', 'message' => 'No autorizado']], 401);
    }
}
