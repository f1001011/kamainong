<?php

namespace app\controller\api;

use app\controller\Base;
use app\model\AddressModel;
use app\model\MoneyLogModel;
use app\model\UserModel;
use app\model\WaresModel;
use app\model\WaresOrderModel;
use app\traits\PublicCon;
use think\facade\Db;

class Wares extends Base
{
    use PublicCon;

    //积分兑换商品列表
    public function WaresList()
    {
        $tid = $this->request->get('tid/d', 1);
        $map = [];
        if ($tid > 0) {
            $map[] = ['wares_type_id', '=', $tid];
        }
        $map[] = ['status', '=', 1];
        list($page, $limit) = $this->mapSel();

        $list = WaresModel::page_list($map, $limit, $page, 'wares_money asc');
        return show(1, $list);
    }

    public function WaresOne(){
        $id = $this->request->get('id/d', 0);
        $map = [];
        $map[] = ['status', '=', 1];
        $map[] = ['id', '=', $id];
        $one = WaresModel::getOne($map);
        return show(1, $one);
    }
    //我的商品
    public function WaresMy(){
        $map = [];
        $map[] = ['uid', '=', $this->request->UserInfo->id];
        list($page, $limit) = $this->mapSel();
        $list = WaresOrderModel::page_list($map, $limit, $page, 'id desc');

        $waresIds = [];
        foreach($list as $item){
            $waresIds[] = $item['wares_id'];
        }

        if(count($waresIds)){
            $mWares = new WaresModel();
            $waresNameList = $mWares->getWaresNameListByIds($waresIds);

            $waresIdNameArr = [];
            foreach($waresNameList as $item){
                if(mb_strlen($item['wares_name']) > 10){
                    $item['wares_name'] = mb_substr($item['wares_name'], 0, 10) . '...';
                }
                $waresIdNameArr[$item['id']] = $item['wares_name'];
            }


            foreach($list as &$item){
                $item['wares_spec'] = isset($waresIdNameArr[$item['wares_id']]) ? $waresIdNameArr[$item['wares_id']]: '';
            }
        }
        return show(1, $list);
    }
    //积分兑换商品下单
    public function WaresOrder()
    {
        $wid = $this->request->post('wid/d', 0);//商品ID
        $aid = $this->request->post('aid/d', 0);//购买地址
        if ($wid <= 0) {
            return show(0, [], '商品ID错误');
        }

        $GetOneInfo = WaresModel::getOne([['id', '=', $wid]]);
        if (empty($GetOneInfo) || $GetOneInfo['wares_money'] <= 0) {
            return show(0, [], '商品已下架');
        }
        if ($GetOneInfo['is_type'] != 1) {
            return show(0, [], '不是积分兑换商品');
        }
        //用户地址
        $AddressInfo = AddressModel::page_one([['id', '=', $aid]]);
        if (empty($AddressInfo)) {
            return show(0, [], '收获地址不存在');
        }

        //用户积分是否够
        $UserInfo = UserModel::page_one([['id', '=', $this->request->UserInfo->id]]);
        if ($UserInfo['money_integral'] < $GetOneInfo['wares_money']) {
            return show(0, [], '积分不足');
        }

        $save = false;
        Db::startTrans();
        try {
            //1 兑换扣除用户积分
            UserModel::where('id', $this->request->UserInfo->id)
                ->dec('money_integral', $GetOneInfo['wares_money'])
                ->update();
            //2 写入订单信息
            WaresOrderModel::inserts([
                'uid' => $this->request->UserInfo->id,
                'wares_id' => $wid,
                'wares_type_id' => $GetOneInfo['wares_type_id'],
                'wares_spec' => $GetOneInfo['wares_spec'],
                'head_img' => $GetOneInfo['head_img'],
                'address_id' => $aid,
                'address' => $AddressInfo['province'] . $AddressInfo['city'] . $AddressInfo['county'] . $AddressInfo['address'],//地址
                'wares_money' => $GetOneInfo['wares_money'],
                'create_time' => date('Y-m-d H:i:s'),
                'wares_no' => orderCode(),
                'status' => 0,
                'phone' => $AddressInfo['phone'],
            ]);
            //3 写入用户资金表
            MoneyLogModel::inserts(2, 111, $UserInfo['money_integral'], $UserInfo['money_integral'] - $GetOneInfo['wares_money'], $GetOneInfo['wares_money'], $this->request->UserInfo->id, $this->request->UserInfo->market_uid, '积分兑换商品' . $GetOneInfo['wares_name'], '');
            $save = true;
            // 提交事务
            Db::commit();
        } catch (\Exception $e) {
            // 回滚事务
            Db::rollback();
            $save = false;
        }

        if ($save) {
            return show(1);
        }
        return show(0);
    }
}