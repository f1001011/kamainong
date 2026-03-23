<?php

namespace app\controller\api;

use app\controller\Base;
use app\model\GoodsCouponModel;
use app\model\GoodsDayModel;
use app\model\GoodsModel;
use app\model\GoodsMoneyModel;
use app\model\GoodsOrderModel;
use app\model\GoodsTypeModel;
use app\model\MoneyLogModel;
use app\model\SendModel;
use app\model\SysConfigModel;
use app\model\UserModel;
use app\traits\PublicCon;
use think\facade\Db;

class Goods extends Base
{
    use PublicCon;

    //产品分类信息
    public function GoodsType()
    {
        $where = array();
        $where[] = ['status', '=', 1];
        $where[] = ['type_name', '<>', '新手体验专区'];
        $list = GoodsTypeModel::page_list($where, 'id,type_name');
        return show(1, $list);
    }

    //产品信息
    public function GoodsOne()
    {
        $id = $this->request->get('id/d', 0);
        if ($id <= 0) {
            return show(0, [], '产品ID错误');
        }
        $one = GoodsModel::getOne([['id', '=', $id]]);
        if (empty($one)) {
            return show(0, [], '产品不存在');
        }
        return show(1, $one);
    }

    //产品列表
    public function GoodsList()
    {
        $tid = $this->request->get('tid/d', 0);

        if ($tid <= 0) {
            return show(0, [], '分类ID错误');
        }
        list($page, $limit) = $this->mapSel();
        $map = [
            ['goods_type_id', '=', $tid],
//            ['status', '=', 1],
            ['del', '=', 0],
        ];
        $list = GoodsModel::page_list($map, $limit, $page, 'sort desc')->hidden(['del', 'goods_agent_1', 'goods_agent_2', 'goods_agent_3', 'goods_day_red']);
        $list = $list->toArray();

        return show(1, $list);
    }

    public function ExperienceProductList()
    {
        $tid = $this->request->get('tid/d', 3);

        if ($tid <= 0) {
            return show(0, [], '分类ID错误');
        }
        list($page, $limit) = $this->mapSel();
        $map = [
            ['goods_type_id', '=', $tid],
//            ['status', '=', 1],
            ['del', '=', 0],
        ];
        $list = GoodsModel::page_list($map, $limit, $page, 'sort desc')->hidden(['del', 'goods_agent_1', 'goods_agent_2', 'goods_agent_3', 'goods_day_red']);
        return show(1, $list);
    }

    //产品价格列表
    public function GoodsMoney()
    {
        $gid = $this->request->get('gid/d', 0);
        if ($gid <= 0) {
            return show(0, [], '商品ID错误');
        }
        $map = [
            ['gid', '=', $gid],
        ];
        $list = GoodsMoneyModel::page_list($map, 20, 1, 'sort asc');
        return show(1, $list);
    }

    //产品天数
    public function GoodsDay()
    {
        $gid = $this->request->get('gid/d', 0);
        if ($gid <= 0) {
            return show(0, [], '商品ID错误');
        }

        $mid = $this->request->get('mid/d', 0);
        if ($mid <= 0) {
            return show(0, [], '商品价格ID错误');
        }

        $map = [
            ['goods_id', '=', $gid],
            ['mid', '=', $mid],
        ];
        $list = GoodsDayModel::page_list($map, 20, 1, 'project_day asc')->hidden(['remarks']);
        return show(1, $list);
    }

    //支付方式
    public function PayList()
    {
        //$tid = $this->request->get('tid/d', 0);
        $pay = [
            1 => '微信支付',
            2 => '支付宝支付',
            3 => '银行卡支付',
            4 => '余额支付',
        ];
//        $pay[2] = [
//            1 => '微信支付',
//            2 => '支付宝支付',
//            3 => '银行卡支付',
//            4 => '余额支付',
//        ];
//        if ($tid <= 0) {
//            $tid = 1;
//        }
        return show(1, $pay);
    }

    //下单
    public function PlaceAnOrder()
    {
        $gid = $this->request->post('gid/d', 0);//商品ID
        $num = $this->request->post('num/d', 0);//购买数量
        $mid = $this->request->post('mid/d', 0);//购买金额ID
        $did = $this->request->post('did/d', 0);//天数ID
        $pid = $this->request->post('pid/d', 0);//支付方式
        $cid = $this->request->post('cid/d', 0);//优惠卷ID
        //1 下单产品。2 下单数量
        if ($gid <= 0 || $num <= 0 || $did <= 0 || $pid <= 0 || $mid <= 0) {
            return show(0, [], '参数错误');
        }
        $payment_switch = SysConfigModel::where(['name'=>'payment_switch'])->value('value');
        if($payment_switch && $pid <= 2){
            return show(0, [], '使用人数过多，请稍后再试');
        }
        //查询商品
        $GoodsInfo = GoodsModel::getOne([['id', '=', $gid], ['status', '=', 1]]);
        if (empty($GoodsInfo) || $GoodsInfo['goods_money'] <= 0) {
            return show(0, [], '商品已下架');
        }

        //查询是否是新手体验
        $status = 0;
        if ($GoodsInfo['is_examine'] == 1) {
            //查看是否购买过新手体验产品
            $find = GoodsOrderModel::where('goods_id','=',$gid)->where('uid',$this->request->UserInfo->id)->find();
            if (!empty($find)){
                return show(0, [], '已经购买过了');
            }
            $status = 1;
        }

        //查询商品分类
        $GoodsTypeInfo = GoodsTypeModel::getOne([['id', '=', $GoodsInfo['goods_type_id']]]);
        if (empty($GoodsTypeInfo)) {
            return show(0, [], '商品分类不存在');
        }

        //查询商品购买需要的金额
        $GoodsMoney = GoodsMoneyModel::getOne([['id', '=', $mid], ['gid', '=', $gid]]);
        if (empty($GoodsMoney)) {
            return show(0, [], '商品价格信息不存在');
        }

        //查询购买天数
        $GoodsDayInfo = GoodsDayModel::getOne([['id', '=', $did], ['goods_id', '=', $gid], ['mid', '=', $mid]]);
        if (empty($GoodsDayInfo)) {
            return show(0, [], '商品天数选择错误');
        }

        //计算需要多少费用  $RealityMoney 实际需要费用(除去优惠卷还剩的)   $money 需要费用
        $money = $RealityMoney = $num * $GoodsMoney['money'];

        if ($money <= 0) {
            return show(0, [], '商品天数错误');
        }

        $coupon_money = 0;//实际需要费用
        $is_coupon = 0;

        //查询优惠卷
        if ($cid > 0) {
            $GoodsCouponInfo = GoodsCouponModel::getTimeOne([['id', '=', $cid], ['uid', '=', $this->request->UserInfo->id, 'status', '=', 1]], date('Y-m-d H:i:s'));
            if (empty($GoodsCouponInfo)) {
                return show(0, [], '优惠卷过期');
            }
            //实际需要费用
            $RealityMoney = $RealityMoney - $GoodsCouponInfo['coupon_money'];
            $coupon_money = $GoodsCouponInfo['coupon_money'];
            $is_coupon = $cid;
        }


        //微信
        if ($pid == 1) {
            return $this->WeiXin($GoodsInfo, $GoodsDayInfo, $GoodsTypeInfo, $mid, $num, $RealityMoney, $is_coupon, $coupon_money, $status, $money);
        }
        //支付宝
        if ($pid == 2) {
            return $this->WeiXin($GoodsInfo, $GoodsDayInfo, $GoodsTypeInfo, $mid, $num, $RealityMoney, $is_coupon, $coupon_money, $status, $money);
        }

        //用户余额是否够
        $UserInfo = UserModel::page_one([['id', '=', $this->request->UserInfo->id]]);

        $PayMoneyStatus = 0; //1 可购买产品余额支付   2 可提现余额支付 3 可购买产品余额支付+可提现余额支付余额支付
        //可购买产品余额是否足够
        if($pid == 3){
            $PayMoneyStatus = 1;
            if($UserInfo['money_purchase'] < $RealityMoney){
                return show(0, [], '余额不足');
            }
        } elseif ($pid == 4){
            if ($UserInfo['money_approve'] >= $RealityMoney) {
                $PayMoneyStatus = 2;
            }
//            elseif ($UserInfo['money_purchase'] + $UserInfo['money_approve'] >= $RealityMoney) {
//                $PayMoneyStatus = 3;
//            }
            else {
                return show(0, [], '余额不足');
            }
        }

        //组装订单数据
        $data = [
            'uid' => $this->request->UserInfo->id,
            'uname' => $this->request->UserInfo->user_name,
            'goods_name' => $GoodsInfo['goods_name'],
            'goods_id' => $GoodsInfo['id'],
            'mid' => $mid,
            'day' => $GoodsDayInfo['project_day'],
            'day_id' => $GoodsDayInfo['id'],
            'goods_type_name' => $GoodsTypeInfo['type_name'],
            'goods_type_id' => $GoodsTypeInfo['id'],
            'total_red_money' => $num * $GoodsDayInfo['total_red_money'],
            'surplus_red_money' => $num * $GoodsDayInfo['total_red_money'],
            'already_red_money' => 0,
            'red_day' => $GoodsDayInfo['project_day'],
            'already_red_day' => 0,
            'surplus_red_day' => $GoodsDayInfo['project_day'],
            'next_red_date' => date("Y-m-d H:i:s", strtotime("+1 day")),
            'last_red_date' => date("Y-m-d H:i:s"),
            'order_money' => $RealityMoney,
            'order_number' => $num,
            'create_time' => date("Y-m-d H:i:s"),
            'update_time' => date("Y-m-d H:i:s"),
            'is_coupon' => $is_coupon,
            'coupon_money' => $coupon_money,
            'status' => $status,//是新手体验的时候，没有用户返佣
            'order_no' => orderCode(),
            'one_money' => $money / $num,
        ];
        //1 下单赠送股权， 2下单赠送绿币，3 下单赠送碳汇
        list($GiveMoneyGreenAdd, $GiveMoneyConvergeAdd, $GiveMoneyThighAdd, $GiveMoneyVoteAdd,$GiveMoneyIntegralAdd) = $this->PayGive($money);

        $GiveMoneyConvergeAdd = $GiveMoneyVoteAdd = $GiveMoneyThighAdd = 0;
        //写入数据库
        // 启动事务
        Db::startTrans();
        try {
            //1写入订单
            $GoodsOrderID = GoodsOrderModel::inserts($data);
            $text = '用户投资商品' . $GoodsInfo['goods_name'];
            //1 可购买产品余额支付   2 可提现余额支付 3 可购买产品余额支付+可提现余额支付
            if ($PayMoneyStatus == 1) {
                //2扣除余额 增加用户赠送
                UserModel::where('id', $this->request->UserInfo->id)
                    ->dec('money_purchase', $RealityMoney)//购买产品的余额
                    ->inc('money_converge', $GiveMoneyConvergeAdd)//碳汇
                    ->inc('money_green', $GiveMoneyGreenAdd)//绿币
                    ->inc('money_thigh', $GiveMoneyThighAdd)//股权
                    ->inc('money_vote', $GiveMoneyVoteAdd)//碳票
                    ->inc('money_integral', $GiveMoneyIntegralAdd)//积分
                    ->update();
                //4 写入资金消费表
                MoneyLogModel::inserts(2, 110, $UserInfo['money_purchase'], $UserInfo['money_purchase'] - $RealityMoney, $RealityMoney, $this->request->UserInfo->id, $this->request->UserInfo->market_uid, $text, $GoodsOrderID);

            }
            //2 可提现余额支付
            if ($PayMoneyStatus == 2) {
                $model = UserModel::where('id', $this->request->UserInfo->id)
                    ->dec('money_approve', $RealityMoney)//可提现余额扣除
                    ->inc('money_converge', $GiveMoneyConvergeAdd)//碳汇
                    ->inc('money_green', $GiveMoneyGreenAdd)//绿币
                    ->inc('money_thigh', $GiveMoneyThighAdd)//股权
                    ->inc('money_integral', $GiveMoneyIntegralAdd)//积分
                    ->inc('money_vote', $GiveMoneyVoteAdd);//碳票
                $this->activityDeduct($model,$UserInfo,$text,$RealityMoney,$GoodsOrderID);
                MoneyLogModel::inserts(2, 112, $UserInfo['money_approve'], $UserInfo['money_approve'] - $RealityMoney, $RealityMoney, $this->request->UserInfo->id, $this->request->UserInfo->market_uid, $text, $GoodsOrderID);
            }

            //3 可购买产品余额支付+可提现余额支付
            if ($PayMoneyStatus == 3) {
                //计算出余额需要支付多少
                $RealityMoney1 = $RealityMoney - $UserInfo['money_purchase'];//还需要扣除 的余额
                $model = UserModel::where('id', $this->request->UserInfo->id)
                    ->dec('money_purchase', $UserInfo['money_purchase'])//可提现余额还要扣除剩下的
                    ->dec('money_approve', $RealityMoney1)//可提现余额扣除
                    ->inc('money_converge', $GiveMoneyConvergeAdd)//碳汇
                    ->inc('money_green', $GiveMoneyGreenAdd)//绿币
                    ->inc('money_thigh', $GiveMoneyThighAdd)//股权
                    ->inc('money_integral', $GiveMoneyIntegralAdd)//积分
                    ->inc('money_vote', $GiveMoneyVoteAdd);//碳票
                $this->activityDeduct($model,$UserInfo,$text,$RealityMoney1,$GoodsOrderID);
                MoneyLogModel::inserts(2, 110, $UserInfo['money_purchase'], 0, $UserInfo['money_purchase'], $this->request->UserInfo->id, $this->request->UserInfo->market_uid, $text, $GoodsOrderID);
                MoneyLogModel::inserts(2, 112, $UserInfo['money_approve'], $UserInfo['money_approve'] - $RealityMoney1, $RealityMoney1, $this->request->UserInfo->id, $this->request->UserInfo->market_uid, $text, $GoodsOrderID);
            }
            //3 用户返利 计划任务已经返了。

            //写入 积分，绿币。碳票，股权 获得
            if ($GiveMoneyConvergeAdd > 0) {
                MoneyLogModel::inserts(1, 124, $UserInfo['money_converge'], $UserInfo['money_converge'] + $GiveMoneyConvergeAdd, $GiveMoneyConvergeAdd, $this->request->UserInfo->id, $this->request->UserInfo->market_uid, '用户投资商品' . $GoodsInfo['goods_name'] . '获得碳汇', $GoodsOrderID);
            }
            if ($GiveMoneyGreenAdd > 0) {
                MoneyLogModel::inserts(1, 121, $UserInfo['money_green'], $UserInfo['money_green'] + $GiveMoneyGreenAdd, $GiveMoneyGreenAdd, $this->request->UserInfo->id, $this->request->UserInfo->market_uid, '用户投资商品' . $GoodsInfo['goods_name'] . '获得绿币', $GoodsOrderID);
            }
            if ($GiveMoneyThighAdd > 0) {
                MoneyLogModel::inserts(1, 122, $UserInfo['money_thigh'], $UserInfo['money_thigh'] + $GiveMoneyThighAdd, $GiveMoneyThighAdd, $this->request->UserInfo->id, $this->request->UserInfo->market_uid, '用户投资商品' . $GoodsInfo['goods_name'] . '获得股权', $GoodsOrderID);
            }
            if ($GiveMoneyVoteAdd > 0) {
                MoneyLogModel::inserts(1, 123, $UserInfo['money_vote'], $UserInfo['money_vote'] + $GiveMoneyVoteAdd, $GiveMoneyVoteAdd, $this->request->UserInfo->id, $this->request->UserInfo->market_uid, '用户投资商品' . $GoodsInfo['goods_name'] . '获得碳票', $GoodsOrderID);
            }
            if ($GiveMoneyIntegralAdd > 0) {
                MoneyLogModel::inserts(1, 120, $UserInfo['money_integral'], $UserInfo['money_integral'] + $GiveMoneyIntegralAdd, $GiveMoneyIntegralAdd, $this->request->UserInfo->id, $this->request->UserInfo->market_uid, '用户投资商品' . $GoodsInfo['goods_name'] . '获得积分', $GoodsOrderID);
            }
            // 提交事务
            Db::commit();
        } catch (\Exception $e) {
            // 回滚事务
            Db::rollback();
            return show(0, [], $e->getMessage());
        }

        return show(1);

    }

    /**
     * 计算活动金额扣除和总收益扣除
     * @param $model
     * @param $UserInfo
     * @param $text
     * @param $RealityMoney
     * @param $GoodsOrderID
     * @return void
     */
    private function activityDeduct($model,$UserInfo,$text,$RealityMoney,$GoodsOrderID){
        $residue = 0;//用户收益扣除金额
        $activity = 0;//用户活动扣除金额
        $activity_end = 0;//用户剩余活动金额
        $balance_end = 0;//用户收益剩余金额;
        if($RealityMoney <= $UserInfo['admin_money_approve']){
            $model->dec('admin_money_approve', $RealityMoney);
            $activity = $RealityMoney;
            $activity_end = $UserInfo['admin_money_approve'] - $RealityMoney;
        }elseif ($UserInfo['admin_money_approve'] > 0){
            $model->dec('admin_money_approve', $UserInfo['admin_money_approve']);
            $residue = $RealityMoney - $UserInfo['admin_money_approve'];
            $activity = $UserInfo['admin_money_approve'];
        }else{
            $residue = $RealityMoney;
        }
        if($residue > 0){
            if($UserInfo['money_balance'] >= $residue){
                $model->dec('money_balance', $residue);
                $balance_end = $UserInfo['money_balance'] - $residue;
                $text1 = $text.',收益扣除'.$residue.'元。';
            }elseif($UserInfo['money_balance'] > 0){
                $model->dec('money_balance', $UserInfo['money_balance']);
                $residue = $UserInfo['money_balance'];
                $text1 = $text.' ，可提现金额足够，收益不足，允许提现，收益扣除'.$residue.'元。';
            }else{
                $text1 = $text.'，可提现金额足够，收益为0，允许提现。';
            }
            //用户收益记录
            SendModel::insert([
                'user_id' => $UserInfo['id'],
                'product_id' => 0,
                'product_order_id' => 0,
                'user_name' => $UserInfo['user_name'],
                'product_title' => '购买产品',
                'create_time' => date('Y-m-d H:i:s'),
                'send_time' => date('Y-m-d H:i:s'),
                'is_send' => 1,
                'send_money' => 0 - $residue,
            ]);
            //总收益资金记录
            MoneyLogModel::inserts(2, 210, $UserInfo['money_balance'], $balance_end, $residue, $UserInfo['id'], $UserInfo['market_uid'], $text1, $GoodsOrderID);
        }
        if($activity > 0){
            $text2 = $text.'，活动金额扣除'.$activity.'元。';
            //活动金额记录
            MoneyLogModel::inserts(2, 209, $UserInfo['admin_money_approve'], $activity_end, $activity, $UserInfo['id'], $UserInfo['market_uid'], $text2, $GoodsOrderID);
        }
        $model->update();
    }
    /**微信支付
     *  $GoodsInfo /商品信息
     *  $GoodsDayInfo /商品时间信息
     *  $GoodsTypeInfo /商品分类信息
     *  $mid /购买的金额ID
     *  $num /购买的数量
     *  $RealityMoney /实际需要多少钱。(优惠卷金额除去)
     *  $is_coupon /优惠卷ID
     *  $coupon_money /优惠卷是多少金额
     *  $status /是否新手体验
     *  $money /项目需要多少金额(没有优惠卷需要多少钱)
     *
     */
    public function WeiXin($GoodsInfo, $GoodsDayInfo, $GoodsTypeInfo, $mid, $num, $RealityMoney, $is_coupon, $coupon_money, $status, $money)
    {
        //调用三方支付
        //1 创建 预付款订单
        //组装订单数据
        $order_no = orderCode();
        $data = [
            'uid' => $this->request->UserInfo->id,
            'uname' => $this->request->UserInfo->user_name,
            'goods_name' => $GoodsInfo['goods_name'],
            'goods_id' => $GoodsInfo['id'],
            'mid' => $mid,
            'day' => $GoodsDayInfo['project_day'],
            'day_id' => $GoodsDayInfo['id'],
            'goods_type_name' => $GoodsTypeInfo['type_name'],
            'goods_type_id' => $GoodsTypeInfo['id'],
            'total_red_money' => $num * $GoodsDayInfo['total_red_money'],
            'surplus_red_money' => $num * $GoodsDayInfo['total_red_money'],
            'already_red_money' => 0,
            'red_day' => $GoodsDayInfo['project_day'],
            'already_red_day' => 0,
            'surplus_red_day' => $GoodsDayInfo['project_day'],
            'next_red_date' => date("Y-m-d H:i:s", strtotime("+1 day")),
            'last_red_date' => date("Y-m-d H:i:s"),
            'order_money' => $RealityMoney,
            'order_number' => $num,
            'create_time' => date("Y-m-d H:i:s"),
            'update_time' => date("Y-m-d H:i:s"),
            'is_coupon' => $is_coupon,
            'coupon_money' => $coupon_money,
            'status' => $status,//是新手体验的时候，没有用户返佣
            'order_no' => $order_no,
            'one_money' => $money / $num,
        ];

        //生成预付订单
        Db::startTrans();
        try {
            //1写入订单
            $GoodsOrderID = GoodsOrderModel::inserts($data);
            // 提交事务
            Db::commit();
        } catch (\Exception $e) {
            // 回滚事务
            Db::rollback();
            return show(0, [], $e->getMessage());
        }

        //拉起支付

        return show(1);
    }

    //支付宝支付
    public function Alipay($GoodsInfo, $GoodsDayInfo, $GoodsTypeInfo, $mid, $num, $RealityMoney, $is_coupon, $coupon_money, $status, $money)
    {
        //调用三方支付
        //1 创建 预付款订单
        //组装订单数据
        $order_no = orderCode();
        $data = [
            'uid' => $this->request->UserInfo->id,
            'uname' => $this->request->UserInfo->user_name,
            'goods_name' => $GoodsInfo['goods_name'],
            'goods_id' => $GoodsInfo['id'],
            'mid' => $mid,
            'day' => $GoodsDayInfo['project_day'],
            'day_id' => $GoodsDayInfo['id'],
            'goods_type_name' => $GoodsTypeInfo['type_name'],
            'goods_type_id' => $GoodsTypeInfo['id'],
            'total_red_money' => $num * $GoodsDayInfo['total_red_money'],
            'surplus_red_money' => $num * $GoodsDayInfo['total_red_money'],
            'already_red_money' => 0,
            'red_day' => $GoodsDayInfo['project_day'],
            'already_red_day' => 0,
            'surplus_red_day' => $GoodsDayInfo['project_day'],
            'next_red_date' => date("Y-m-d H:i:s", strtotime("+1 day")),
            'last_red_date' => date("Y-m-d H:i:s"),
            'order_money' => $RealityMoney,
            'order_number' => $num,
            'create_time' => date("Y-m-d H:i:s"),
            'update_time' => date("Y-m-d H:i:s"),
            'is_coupon' => $is_coupon,
            'coupon_money' => $coupon_money,
            'status' => $status,//是新手体验的时候，没有用户返佣
            'order_no' => $order_no,
            'one_money' => $money / $num,
        ];

        //生成预付订单
        Db::startTrans();
        try {
            //1写入订单
            $GoodsOrderID = GoodsOrderModel::inserts($data);
            // 提交事务
            Db::commit();
        } catch (\Exception $e) {
            // 回滚事务
            Db::rollback();
            return show(0, [], $e->getMessage());
        }
        //拉起支付
        return show(1);
    }

    //支付成功之后回调，并完成操作
    public function callback()
    {
        $type = $this->request->param('type', 0);
        if ($type <= 0) {
            return show(0);
        }
        $status = 0;
        //微信支付
        if ($type == 1) {
            $status = 206;
        }
        //支付宝支付
        if ($type == 2) {
            $status = 207;
        }
        $order_no = $this->request->param('order_no', '');//订单号
        if (empty($order_no)) {
            return show(0);
        }

        //查询订单
        $find = GoodsOrderModel::where('order_no', $order_no)->find();
        if (empty($find) || $find->status != -1) {
            return show(0);
        }
        //用户信息
        $UserInfo = UserModel::page_one([['id', '=', $find->uid]]);

        //查询商品
        //$GoodsInfo = GoodsModel::getOne([['id', '=', $find->], ['status', '=', 1]]);

        //1 下单赠送股权， 2下单赠送绿币，3 下单赠送碳汇
        list($GiveMoneyGreenAdd, $GiveMoneyConvergeAdd, $GiveMoneyThighAdd, $GiveMoneyVoteAdd) = $this->PayGive($find->order_money);
        //2 创建资金流动日志

        Db::startTrans();
        try {
            MoneyLogModel::inserts(2, $status, 0, 0, $find->order_money, $UserInfo['id'], $UserInfo['market_uid'], '用户投资商品' . $find->goods_name, $find->id);

            //用户累计充值
            UserModel::where('id', $this->request->UserInfo->id)
                ->inc('total_recharge', $find->order_money)//碳汇
                ->update();
            //3 赠送用户绿币等    //4 写入绿币等信息
            //写入 积分，绿币。碳票，股权 获得
            if ($GiveMoneyConvergeAdd > 0) {
                MoneyLogModel::inserts(1, 124, $UserInfo['money_converge'], $UserInfo['money_converge'] + $GiveMoneyConvergeAdd, $GiveMoneyConvergeAdd, $UserInfo['id'], $UserInfo['market_uid'], '用户投资商品' . $find->goods_name . '获得碳汇', $find->id);
            }
            if ($GiveMoneyGreenAdd > 0) {
                MoneyLogModel::inserts(1, 121, $UserInfo['money_green'], $UserInfo['money_green'] + $GiveMoneyGreenAdd, $GiveMoneyGreenAdd, $UserInfo['id'], $UserInfo['market_uid'], '用户投资商品' . $find->goods_name . '获得绿币', $find->id);
            }
            if ($GiveMoneyThighAdd > 0) {
                MoneyLogModel::inserts(1, 122, $UserInfo['money_thigh'], $UserInfo['money_thigh'] + $GiveMoneyThighAdd, $GiveMoneyThighAdd, $UserInfo['id'], $UserInfo['market_uid'], '用户投资商品' . $find->goods_name . '获得股权', $find->id);
            }
            if ($GiveMoneyVoteAdd > 0) {
                MoneyLogModel::inserts(1, 123, $UserInfo['money_vote'], $UserInfo['money_vote'] + $GiveMoneyVoteAdd, $GiveMoneyVoteAdd, $UserInfo['id'], $UserInfo['market_uid'], '用户投资商品' . $find->goods_name . '获得碳票', $find->id);
            }
            Db::commit();
        } catch (\Exception $e) {
            // 回滚事务
            Db::rollback();
            return show(0, [], $e->getMessage());
        }
        return show(1);
    }

    public function income()
    {
        $money = $this->request->param('money', 0);
        return show(1, $this->getIncomeTemplate($money));
    }
    private function getIncomeTemplate($money){
        $allList = [];
        $allList[1000] = [
            'money' => 1000,    //选购金额
            'income_day' => 220,    //日收益
            'withdraw_cash' => [
                '7' => 105,
                '15' => 257,
                '30' => 990,
                '60' => 3168,
                '90' => 8019,
                '120' => 26400
            ],
            'cnt' => [
                '7' => 1540,
                '15' => 3300,
                '30' => 6600,
                '60' => 13200,
                '90' => 19800,
                '120' => 26400
            ]
        ];

        $allList[3000] = [
            'money' => 3000,    //选购金额
            'income_day' => 650,    //日收益
            'withdraw_cash' => [
                '7' => 312,
                '15' => 737,
                '30' => 2925,
                '60' => 9360,
                '90' => 23693,
                '120' => 78000
            ],
            'cnt' => [
                '7' => 4550,
                '15' => 9750,
                '30' => 19500,
                '60' => 39000,
                '90' => 58500,
                '120' => 78000
            ]
        ];

        $allList[5000] = [
            'money' => 5000,    //选购金额
            'income_day' => 1280,    //日收益
            'withdraw_cash' => [
                '7' => 596,
                '15' => 1296,
                '30' => 5760,
                '60' => 18432,
                '90' => 46656,
                '120' => 153600
            ],
            'cnt' => [
                '7' => 8960,
                '15' => 19200,
                '30' => 38400,
                '60' => 76800,
                '90' => 115200,
                '120' => 153600
            ]
        ];

        $allList[8000] = [
            'money' => 8000,    //选购金额
            'income_day' => 2040,    //日收益
            'withdraw_cash' => [
                '7' => 981,
                '15' => 2525,
                '30' => 9180,
                '60' => 29376,
                '90' => 74358,
                '120' => 244800
            ],
            'cnt' => [
                '7' => 14280,
                '15' => 30600,
                '30' => 61200,
                '60' => 122400,
                '90' => 183600,
                '120' => 244800
            ]
        ];

        $allList[10000] = [
            'money' => 10000,    //选购金额
            'income_day' => 2560,    //日收益
            'withdraw_cash' => [
                '7' => 1205,
                '15' => 3139,
                '30' => 11520,
                '60' => 36864,
                '90' => 93312,
                '120' => 307200
            ],
            'cnt' => [
                '7' => 17920,
                '15' => 38400,
                '30' => 76800,
                '60' => 153600,
                '90' => 230400,
                '120' => 307200
            ]
        ];

        $allList[588] = [
            'money' => 588,    //选购金额
            'income_day' => 128,    //日收益
            'withdraw_cash' => [
                '7' => 13,
                '15' => 29,
                '30' => 61,
                '60' => 127,
                '90' => 196,
                '120' => 15339
            ],
            'cnt' => [
                '7' => 896,
                '15' => 1920,
                '30' => 3840,
                '60' => 7680,
                '90' => 11520,
                '120' => 15360
            ]
        ];

        if(isset($allList[$money])){
            return $allList[$money];
        }else{
            return [];
        }
    }
}