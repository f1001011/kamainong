<?php


namespace app\controller\api;


use app\controller\Base;
use app\model\FanYongModel;
use app\model\GoodsOrderModel;
use app\model\InvitationLogModel;
use app\model\InvitationModel;
use app\model\MoneyLogModel;
use app\model\SendModel;
use app\model\UserModel;
use app\model\UserWelfareModel;
use app\model\WelfareModel;
use app\traits\PublicCon;
use think\facade\Db;

class Welfare extends Base
{
    use PublicCon;

    /**
     * 公益设置的捐赠金额
     * @return false|string
     */
    public function SetAmount()
    {
        $arr = array(100, 200, 500);
        return show(1, $arr);
    }

    /**
     * 公益文章
     * @return false|string
     */
    public function ArticleList()
    {
        $map = [];
        $map[] = ['type', '=', 1];
        list($page, $limit) = $this->mapSel();
        $field = 'id,title,content,img_path,create_time,labels';
        $list = WelfareModel::page_list($map, $limit, $page, 'id desc', $field);
        return show(1, $list);
    }

    /**
     * 用户捐赠
     * @return false|string
     */
    public function Donate()
    {
        $UserInfo = $this->request->UserInfo;
        $amount = $this->request->post('amount', 0);
        $wid = $this->request->post('wid/d', 0);//文章ID
        if (empty($wid)) {
            return show(0, [], '请输入公益ID');
        }
        $one = WelfareModel::getOne([['id', '=', $wid]]);
        if (empty($one)) {
            return show(0, [], '公益不存在');
        }
        if (empty($amount) || $amount <= 0) {
            return show(0, [], '请输入正确捐款金额');
        }
        //查询实时的余额
        $User = UserModel::page_one(['id' => $UserInfo->id]);
        if ($User['money_approve'] < $amount) {
            return show(0, [], '可提现余额不足');
        }
//        if ($User['money_balance'] < $amount) {
//            return show(0, [], '余额不足');
//        }
        $residue = 0;//用户收益扣除金额
        $activity = 0;//用户活动扣除金额
        $activity_end = 0;//用户剩余活动金额
        $balance_end = 0;//用户收益剩余金额;
        Db::startTrans();
        try {
            //用户捐赠记录
            $WelfareId = UserWelfareModel::inserts([
                'uid' => $UserInfo->id,
                'user_name' => $UserInfo->user_name,
                'wid' => $wid,
                'amount' => $amount,
                'create_time' => date('Y-m-d H:i:s'),
                'update_time' => date('Y-m-d H:i:s'),
            ]);
            //文章捐赠金额修改
            WelfareModel::accumulate(['id' => $wid], $amount);

            $text = '用户' . $UserInfo->user_name . '捐献公益<<' . $one['title'] . '>>' . $amount . '元';
            //用户余额扣除
            $model = UserModel::where('id', $UserInfo->id)->dec('money_approve', $amount);
            if($amount <= $User['admin_money_approve']){
                $model->dec('admin_money_approve', $amount);
                $activity = $amount;
                $activity_end = $User['admin_money_approve'] - $amount;
            }elseif ($User['admin_money_approve'] > 0){
                $model->dec('admin_money_approve', $User['admin_money_approve']);
                $residue = $amount - $User['admin_money_approve'];
                $activity = $User['admin_money_approve'];
            }else{
                $residue = $amount;
            }
            if($residue > 0){
                if($User['money_balance'] >= $residue){
                    $model->dec('money_balance', $residue);
                    $balance_end = $User['money_balance'] - $residue;
                    $text1 = $text.',收益扣除'.$residue.'元。';
                }else if($User['money_balance'] > 0){
                    $model->dec('money_balance', $User['money_balance']);
                    $residue = $User['money_balance'];
                    $text1 = $text. '，可提现金额足够，收益不足，允许捐赠，收益扣除'.$residue.'元。';
                }else{
                    $text1 = $text. '，可提现金额足够，收益为0，允许捐赠。';
                }
                //用户收益记录
                SendModel::insert([
                    'user_id' => $User['id'],
                    'product_id' => 0,
                    'product_order_id' => 0,
                    'user_name' => $User['user_name'],
                    'product_title' => '公益捐款',
                    'create_time' => date('Y-m-d H:i:s'),
                    'send_time' => date('Y-m-d H:i:s'),
                    'is_send' => 1,
                    'send_money' => 0 - $residue,
                ]);
                //用户收益扣除记录
                MoneyLogModel::inserts(2, 204, $User['money_balance'], $balance_end, $residue, $UserInfo->id, $UserInfo->market_uid, $text1, $WelfareId);
            }
            if($activity > 0){
                $text2 = $text. '，活动金额扣除'.$activity.'元。';
                //活动金额记录
                MoneyLogModel::inserts(2, 209, $User['admin_money_approve'], $activity_end, $activity, $UserInfo->id, $UserInfo->market_uid, $text2, $WelfareId);
            }
            $model->update();
            //可提现余额记录
            MoneyLogModel::inserts(2, 203, $User['money_approve'], $User['money_approve'] - $amount, $amount, $UserInfo->id, $UserInfo->market_uid, $text, $WelfareId);
            // 提交事务
            Db::commit();
            return show(1);
        } catch (\Exception $e) {
            // 回滚事务
            Db::rollback();
            return show(0, [], '捐款失败');
        }
    }

    /**
     * 文章详情
     * @return false|string
     */
    public function Details()
    {
        $id = $this->request->get('id/d', 0);
        if ($id <= 0) {
            return show(0, [], '公益ID错误');
        }
        $one = WelfareModel::getOne([['id', '=', $id]]);
        if (empty($one)) {
            return show(0, [], '公益不存在');
        }
        return show(1, $one);
    }

    /**
     * 团队津贴展示
     * @return false|string
     * @throws \think\db\exception\DbException
     */
    public function allowance()
    {
        $UserInfo = $this->request->UserInfo;
        $map = [];
        $map[] = ['status', '=', 1];
        $field = 'id,title,number,reward';
        $list = InvitationModel::page_list($map, 'id asc', $field);

        //获取直推用户
        $column = UserModel::where(['agent_id' => $UserInfo->id])->cache(5)->column('id');
        //查询用户完成的情况
        $num = 0;

        $date = received_date(); // 定时间指 这个看固定a记号可以领取
        $one_month_ago = date("Y-m-d H:i:s", strtotime("-1 month", strtotime($date)));
        if (!empty($column)) {
            $num = GoodsOrderModel::where('uid', 'in', $column)->where('goods_type_id','<>',3)->cache(5)->group("uid")->count();
        }

        //查询用户已购的直推人数

        //$num = 230;
        //完成任务总数
        $ranking = InvitationModel::task_ranking($num);
        //获得的津贴总数
        $total = InvitationLogModel::task_num([['uid', '=', $UserInfo->id]]);

        //查询是否已经领取了,本月的时间已经有一条数据了。表示已经领取了
        $received = InvitationLogModel::received([['uid', '=', $UserInfo->id]], $date);



        //计算是否可以领取
        foreach ($list as $key => &$value) {
            $value['status'] = 0;//0 未达成，1 能领取，2 不能领取(超过要求)
            if ($num < $value['number']) {
                $value['status'] = 0;
                continue;
            }

            if (!isset($list[$key + 1]) || $num < $list[$key + 1]['number']) {
                //已领取状态
                if ($received > 0) {
                    $value['status'] = 3;
                    continue;
                }

                $date = strtotime(received_date());//领取开始时间
                $end = strtotime(date('Y-m-'). "01 12:00:00");//领取结束时间
                $danqian = strtotime(date('Y-m-d H:i:s')); //当前时间

                //当前时间必须 是 大于领取时间，并且小于 领取结束时间
                if ($danqian < $date){
                    $value['status'] = 4;
                    continue;
                }

                if ($end < $danqian){
                    $value['status'] = 4;
                    continue;
                }
                $value['status'] = 1;
                continue;
            }

            //在等于和小于这个区间能领取
            //if ($num < $list[$key + 1]['number']) {
            //    $value['status'] = 1;
            //    continue;
            // }

            if ($num > $value['number']) {
                $value['status'] = 2;// 0 未达成，1 能领取，2 不能领取(超过要求) 3已领取（当月） 4 没在领取范围内
                continue;
            }
        }

        $data = array();
        $data['allowance'] = $total;//团队津贴领取总数
        $data['people'] = $num;//直推已购总数
        $data['purchased'] = count($column);//直推人数总数
        $data['task'] = $ranking;//完成任务总数
        //session('user_received_'.$UserInfo->id,$data);
        cache('user_received_'.$UserInfo->id,$data,20);
        $data['list'] = $list;
        return show(1, $data);
    }

    /**
     * 所有捐款记录
     * @return false|string|\think\response\Json
     */
    public function donate_log()
    {
        //$UserInfo = $this->request->UserInfo;
        $map = [];
        //$map[] = ['a.uid', '=', $UserInfo->id];
        list($page, $limit,$time) = $this->mapDateSel();
        $field = 'a.id,a.wid,a.user_name,a.amount,a.create_time,b.title,img_path';
        $list = UserWelfareModel::page_list($map, $limit, $page,$time, 'a.id desc', $field)->toArray();
        //捐献总额
        $list['count_money']   = UserWelfareModel::countMoney($map, $time);
        return show(1, $list);
    }

    /**
     * 个人捐款记录
     * @return false|string|\think\response\Json
     */
    public function user_donate_log()
    {
        $UserInfo = $this->request->UserInfo;
        $map = [];
        $map['uid'] = $UserInfo->id;
        list($page, $limit,$time) = $this->mapDateSel();
        $field = 'a.id,a.uid,a.wid,a.amount,a.create_time,b.title,img_path';
        $list = UserWelfareModel::page_list($map, $limit, $page,$time, 'a.id desc', $field)->toArray();
        //捐献总额
        $list['count_money']   = UserWelfareModel::countMoney($map, $time);
        return show(1, $list);
    }

    //用户领取团队奖金 津贴领取
    public function received()
    {
        $iid = $this->request->post('iid/d', 0);
        if ($iid <= 0) {
            return show(0, [], '领取ID错误');
        }

        $date = strtotime(received_date());//领取开始时间
        $end = strtotime(date('Y-m-'). "01 12:00:00");//领取结束时间
        $danqian = $time2 = strtotime(date('Y-m-d H:i:s')); //当前时间

        //当前时间必须 是 大于领取时间，并且小于 领取结束时间
        if ($danqian < $date){
            return show(0, [], '请在规定时间领取');
        }

        if ($end < $danqian){
            return show(0, [], '请在规定时间领取');
        }

        //查询领取的奖励信息
        $PageOne = InvitationModel::page_one([['id','=',$iid]]);
        if (empty($PageOne)){
            return show(0, [],'领取ID错误');
        }

        $UserInfo = $this->request->UserInfo;
        //$ArrayReceived= session('user_received_'.$UserInfo->id);//查询自己达到条件的人数
        $ArrayReceived =  cache('user_received_'.$UserInfo->id);
        if (empty($ArrayReceived)){
            return show(0, [],'领取信息错误');
        }
        if ($ArrayReceived['people'] < $PageOne['number']){
            return show(0, [],'条件不足');
        }
        //查询是否领取过了
        $received = InvitationLogModel::received([['uid', '=', $UserInfo->id]], $date);
        if ($received > 0 ){
            return show(0, [],'本月已经领取过了');
        }

        //领取团队奖金
        //1 查询用户团队奖金余额，2写入日志，3修改用户团队奖金(改为用户返佣了)
        $UserInfo = UserModel::page_one([['id', '=', $UserInfo->id]],'id,money_hire,user_name');
        $money = $PageOne->reward;
        Db::startTrans();
        try {
            //1 修改用户团队奖金
            UserModel::where('id', $UserInfo->id)->inc('money_hire', $money)->update();
            //2插入团队佣金记录
            $content = "用户<{$UserInfo->user_name}>领取{$PageOne['number']}人团队佣金";
            $id = InvitationLogModel::inserts([
                'title'=>$PageOne->title,
                'number'=>$PageOne->number,
                'reward'=>$money,
                'grade'=>$ArrayReceived['people'],
                'status'=>1,
                'iid'=>$iid,
                'create_time'=>$time2,
                'content'=>$content,
                'uid'=>$UserInfo->id
            ]);

            //插入返佣记录表
            FanYongModel::ToInsert($UserInfo->id,$money,10,'领取守护者津贴',1,$content,$UserInfo->user_name,date('Y-m-d H:i:s'),0,$id,0);
            //3 写入团队奖金记录
            MoneyLogModel::inserts(1, 125, $UserInfo['money_hire'], $UserInfo['money_hire'] + $money, $money, $UserInfo->id, $UserInfo->market_uid, $content, $id);
            Db::commit();
        } catch (\Exception $e) {
            // 回滚事务
            Db::rollback();
            return show(0, [], $e->getMessage());
        }
        return show(1);
    }


}