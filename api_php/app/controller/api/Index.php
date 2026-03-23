<?php
namespace app\controller\api;

use app\controller\Base;
use app\model\ArticleModel;
use app\model\BannerModel;
use app\model\GoodsModel;
use app\model\GoodsTypeModel;
use app\model\KeFuModel;
use app\model\NoticeModel;
use think\facade\Cache;
use think\facade\Db;

class Index extends Base
{
    //获取banner
    public function banner(){
        $type = $this->request->param('type/d',1);
        if ($type <= 0){
            return show(0);
        }
        $list = BannerModel::page_list([['type','=',$type]],'img,content,is_type');
        return show(1,$list);
    }

    //获取新闻
    public function article(){
        $map = [
            ['type','=',2],
        ];
        $list=Cache::get('article_list');
        if(empty($list)){
            $list = ArticleModel::page_list($map,'id,content,create_time,thumb_url,title,author,description');
            Cache::set('article_list',$list,84600 * 2);
        }
        foreach ($list as $key=>&$value){
            // $value['thumb_url'] = TC('image_url').$value['thumb_url'];
            $value['content'] = returnEditor(htmlspecialchars_decode($value['content']));
        }
        return show(1,$list);
    }
    //新闻详情
    public function ArticleDetails(){
        $id = $this->request->param('id/d',0);
        $map = [
            ['id','=',$id]
        ];
        $list = ArticleModel::page_one($map,'content,create_time,thumb_url,title,author,description');
        if (!empty($list)){
            $list->thumb_url = TC('image_url').$list->thumb_url;
            $list->content = returnEditor(htmlspecialchars_decode($list->content));
        }
        return show(1,$list);
    }
    //平台攻略
    public function Introduction(){
        $tid = $this->request->param('tid/d',24);
        $map = [
            ['type','=',$tid]
        ];
        $list = ArticleModel::page_one($map,'content,create_time,thumb_url,title,author,description');

        if (!empty($list)){
            $list->thumb_url = TC('image_url').$list->thumb_url;
            $list->content = htmlspecialchars_decode($list->content);
        }

        return show(1,$list);
    }

    //获取公告
    public function notice(){
        $type = $this->request->param('type/d',0);
        $map = [];
        if ($type > 0){
            $map = [['position','=',$type]];
        }
        $list = NoticeModel::page_list($map,'content,create_time,position,position')->toArray();
        foreach ($list as $key=>&$value){
            $value['new'] = 0;
            //如果是三天内的，就是最新通知
            $target_time = strtotime($value['create_time']);
            // 获取当前时间
            $current_time = time();
            // 计算两个时间的差值，单位为秒
            $time_diff = $current_time - $target_time;
            // 计算总共经过的小时数
            $hour_diff = floor($time_diff / 3600);
            if ($hour_diff <= 72) {
                $value['new'] = 1;
            }
            if ($value['position'] == 1){
                $value['content']= strip_tags($value['content']);
            }
        }
        return show(1,$list);
    }

    //获取公告最新通知
    public function CountNotice(){
        $type = $this->request->param('type/d',0);
        $map = [];
        if ($type > 0){
            $map = [['position','=',$type]];
            $count= NoticeModel::whereTime('create_time','-3 day')->where($map)->count();
        }else{
            $count= NoticeModel::whereTime('create_time','-3 day')->group('position')
                ->field('count(id) as counts,position')
                ->where($map)
                ->select()
                ->toArray();
            foreach ($count as $key=>&$value){
                $str = '';
                switch ($value['position']){
                    case 1:$str = '首页通知';break;
                    case 3:$str = '弹出层公告';break;
                    case 4:$str = '系统通知';break;
                    case 5:$str = '最新活动';break;
                    case 6:$str = '平台公告';break;
                    case 7:$str = '站内信';break;
                }
                $value['text'] = $str;
            }
        }

        return show(1,['count'=>$count]);
    }

    //客服
    public function CustomerService(){
        $sid = $this->request->param('sid/d',0);
        $map = [];
        $find = '';
        if ($sid > 1000){
            $map = [
                'sid'=>$sid
            ];
            $find =  KeFuModel::where($map)->order('id desc')->find();
        }
        if (empty($find)){
            $find =  KeFuModel::where('sid',0)->order('id desc')->find();
        }
        if (!empty($find)){
            $find['show'] = 2;//1 验证码 2手机验证码
        }
        return show(1,$find);
    }

    //导航菜单状态
    public function MenuStatus(){
        $mGoodsType = new GoodsTypeModel();

        $goodsTypeList = $mGoodsType->page_list();

        $mGoods = new GoodsModel();

        $goodsList = [];
        foreach($mGoods->getCntGroupByGoodsTypeId() as $item){
            $goodsList[$item->id] = $item->cnt;
        }
        $ret = [];
        foreach($goodsTypeList as $item){
            $ret[] = [
                'id' => $item->id,
                'name' => $item->type_name,
                'cnt' => isset($goodsList[$item->id]) ? $goodsList[$item->id] : 0
            ];
        }
        return show(1, $ret);
    }

    public function phoneVerify(){
        $mobile = $this->request->post('phone','');
        if (empty($mobile)){
            return show(0,'手机号不能为空');
        }
        $data = $this->assemble($mobile);
        $result = curl_request($data['url'],$data['date']);
        if($result['code']==200&&$result['data']['fee']&&$result['data']['resultCode']==2000){
            Db::name('verify')->insert(['verify'=>$data['code'],'ctime'=>date('y-m-d H:i:s')]);
            return show(1);
        }
        return show(0,'获取验证码失败');
    }

    private function assemble($mobile){
        $realIdToken=cache::get('real_idCard_token');
        if(empty($realIdToken)){
            $realIdToken = obtainToken();
        }
        $url = codeUrl($realIdToken);
        $code = randomCode(6);
        $arr = array();
        $arr['appId'] = config("realId.appid");
        $arr['smsType'] = 1;//短信类型：1：验证码 2：行业通知 3：营销推广
        $arr['customId'] = "";//自定义业务ID
        $arr['delaySendTime'] = "";//发送时间。若为空，立即发送
        $arr['extend'] = "";//自定义参数，在获取状态报告时返回，最大长度100。
        $data = $fly = array();
        $fly['code'] = $code;
        $data['mobile'] = $mobile;
        $data['templateParams'] = $fly;
        $arr['recordList'][] = $data;//模板变量信息
        $arr['signatureName'] = config("realId.signatureName");//已报备的签名
        $arr['templateId'] = config("realId.templateId");//模板Id
        $arr = json_encode($arr,JSON_UNESCAPED_UNICODE);
        $result = array();
        $result['url'] = $url;
        $result['code'] = $code;
        $result['date'] = $arr;
        return $result;
    }
}
