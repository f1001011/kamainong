<?php

namespace app\controller\api;

use app\controller\Base;
use app\controller\IDCardFilter;
use app\model\SysConfigModel;
use app\model\TokenModel;
use app\model\UserModel;
use app\traits\PublicCon;
use think\exception\ValidateException;
use think\facade\Cache;
use think\facade\Db;

class Login extends Base
{
    use PublicCon;

    //登录
    public function login()
    {
        //过滤数据
        $postField = 'phone,pwd,captcha,app_version';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        try {
            validate(\app\validate\Login::class)
                ->scene('login')
                ->check($post);
        } catch (ValidateException $e) {
            // 验证失败 输出错误信息
            return show(0, [], $e->getError());
        }
        $where = array();
        if(isset($post['osName']) &&  $post['osName'] == 'ios'){
            $where['name'] = 'app_version_ios';
        }else {
            $where['name'] = 'app_version';
        }
        $app_version = SysConfigModel::page_value($where);

//        if(empty($post['app_version'])){
//                return show(0, [], '系统提示：版本过低，请下载最新版本。');
//        }
//
//        if ($post['app_version'] != $app_version && $post['app_version'] != 1){
//            return show(0, [], '系统提示：版本过低，请下载最新版本。');
//        }

        // 验证失败
        //if (!$this->captcha($post['captcha'])) {
            // return show(0, [], '验证码过期');
        //}

        //1 判断 密码是否一样
        $UserInfo = UserModel::where('phone', $post['phone'])->find();
        if (empty($UserInfo)) {
            return show(0, [], lang(10000));
        }

        if (md5($post['pwd']) !== $UserInfo->getData('pwd')) {
            return show(0, [], lang(10001));
        }

        if ($UserInfo->status != 1) {
            return show(0, [], lang(10002));
        }
        if ($UserInfo->is_real_name == 3) {
            return show(0, [], lang(10003));
        }

        //成功了之后返回用户信息
        $token = api_token($UserInfo['id']);
        $tfind = TokenModel::where('user_id',$UserInfo['id'])->find();
        if ($tfind){
            TokenModel::where('user_id',$UserInfo['id'])->update([
                'token' => $token,
                'create_time' => date('Y-m-d H:i:s'),
            ]);
        }else{
            TokenModel::insert([
                'token' => $token,
                'create_time' => date('Y-m-d H:i:s'),
                'user_id' => $UserInfo['id'],

            ]);
        }
        Db::name('common_login_log')->insert([
            'unique'=>$UserInfo['id'],
            'login_type'=>2,
            'login_time'=>date('Y-m-d H:i:s'),
            'login_ip'=>$this->request->ip(),
            'login_equipment'=>  '',
        ]);
        return show(1, ['token' => $token, 'user' => $UserInfo]);
    }

    //注册
    public function register()
    {
        //过滤数据
        $postField = 'phone,pwd,upwd,sfz,user_name,agent_id,captcha';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        try {
            validate(\app\validate\Login::class)
                ->scene('insert')
                ->check($post);
        } catch (ValidateException $e) {
            // 验证失败 输出错误信息
            return show(0, [], $e->getError());
        }

        if ($post['pwd'] !== $post['upwd']) {
            return show(0, [], lang(10004));
        }


        // 万能验证码验证失败
        if(is_code_off()){
            if (mb_strlen($post['captcha']) != 6 || !$this->captcha($post['captcha'])) {
                return show(0, [cache('captcha.key')], lang(10005));
            }
        }

        //验证成功后查询 代理商是否正确
        $AgentInfo = UserModel::where('id', $post['agent_id'])->find();
        if (empty($AgentInfo)) {
            return show(0, [], lang(10006));
        }

        //查询用户身份证，手机，名称，是否正确
        if (!empty(UserModel::where('phone', $post['phone'])->find())) {
            return show(0, [], lang(10007));
        }

//        if(!$this->isIdCard($post['sfz'])){
//            return show(0, [], lang(10008));
//        }
//        if (!empty(Db::name('is_sfz')->where('sfzcode',$post['sfz'])->find())) {
//            return show(0, [], lang(10009));
//        }
//        if (!empty(UserModel::where('sfz', $post['sfz'])->find())) {
//            return show(0, [], lang(10009));
//        }

        //写入数据库数据
        $data = [
            'phone' => $post['phone'],
            'pwd' => md5($post['pwd']),
            'user_name' => $post['user_name'],
            'sfz' => $post['sfz'],
            'agent_id' => $post['agent_id'],
            'head_img'=>'/static/touxiang/'.rand(1,16).'.jpg',
            'agent_id_1' => $post['agent_id'],
            'agent_id_2' => $AgentInfo['agent_id_1'],
            'agent_id_3' => $AgentInfo['agent_id_2'],
            'market_uid' => $AgentInfo['market_uid'],
            'user_team' => $AgentInfo['user_team'],
            'create_time' => date('Y-m-d H:i:s'),
            'withdraw_pwd' => base64_encode(123456),
            'status' => 1,
            'state' => 1,
            'is_real_name' => 1,
            'ip' => $this->request->ip(),
            'is_fictitious' => 0,
            'is_withdraw' => 1,
        ];

        //注册获取奖励

        $GetId = UserModel::inserts($data);
        Db::name('is_sfz')->insert([
            'sfzcode'=>$post['sfz']
        ]);
        if ($GetId) {
            return show(1, [], 'ok');
        }
        return show(0, [], 'no');
    }

    public function forget()
    {
        //过滤数据
        $postField = 'phone,pwd,captcha,sfz';
        $post = $this->request->only(explode(',', $postField), 'post', null);
        try {
            validate(\app\validate\Login::class)
                ->scene('forget')
                ->check($post);
        } catch (ValidateException $e) {
            // 验证失败 输出错误信息
            return show(0, [], $e->getError());
        }

        // 验证失败
        if (!$this->captcha($post['captcha'])) {
            return show(0, [cache('captcha.key')], lang(10005));
        }


        $UserInfo = UserModel::where('phone', $post['phone'])->where('sfz', $post['sfz'])->find();
        if (empty($UserInfo)) {
            show(0, [], lang(10000));
        }
        UserModel::where('id', $UserInfo['id'])->update(['pwd' => md5($post['pwd'])]);
        return show(1);
    }


    public function version(){
        return show(1,[
//            'v'=>'3.0.0',
            'v' => SysConfigModel::page_value([['name', '=', 'app_version']]),
            'ios_v' => SysConfigModel::page_value([['name', '=', 'app_version_ios']]),
            'apk'=>SysConfigModel::page_value([['name', '=', 'app_down_android']]),
            'ios'=>SysConfigModel::page_value([['name', '=', 'app_down_ios']]),
            'gw'=>SysConfigModel::page_value([['name', '=', 'app_gw']]),
            'down'=>SysConfigModel::page_value([['name', '=', 'app_down']]),
            'renew'=>SysConfigModel::page_value([['name', '=', 'app_renew']]),
        ]);
    }


    /**
     * 检查是否是身份证号
     * @param $id
     * @return bool
     */
    private function isIdCard($id){
        $id        = strtoupper($id);

        $cIDCardFilter = new IDCardFilter();
        return $cIDCardFilter->vaild($id);

        $regx      = "/(^\d{15}$)|(^\d{17}([0-9]|X)$)/";
        $arr_split = array();
        if (!preg_match($regx, $id)) {
            return false;
        }
        if (15 == strlen($id)) //检查15位
        {
            $regx = "/^(\d{6})+(\d{2})+(\d{2})+(\d{2})+(\d{3})$/";

            @preg_match($regx, $id, $arr_split);
            //检查生日日期是否正确
            $dtm_birth = "19" . $arr_split[2] . '/' . $arr_split[3] . '/' . $arr_split[4];
            if (!strtotime($dtm_birth)) {
                return false;
            } else {
                return true;
            }
        } else //检查18位
        {
            $regx = "/^(\d{6})+(\d{4})+(\d{2})+(\d{2})+(\d{3})([0-9]|X)$/";
            @preg_match($regx, $id, $arr_split);
            $dtm_birth = $arr_split[2] . '/' . $arr_split[3] . '/' . $arr_split[4];
            if (!strtotime($dtm_birth)) //检查生日日期是否正确
            {
                return false;
            } else {
                if((strtotime(date('Y-m-d')) - strtotime($dtm_birth)) > 100 * 365 * 24 * 3600 || (strtotime(date('Y-m-d')) - strtotime($dtm_birth)) < 10 * 365 * 24 * 3600){
                    return false;
                }
                return true;
                //检验18位身份证的校验码是否正确。
                //校验位按照ISO 7064:1983.MOD 11-2的规定生成，X可以认为是数字10。
                $arr_int = array(7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2);
                $arr_ch  = array('1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2');
                $sign    = 0;
                for ($i = 0; $i < 17; $i++) {
                    $b = (int) $id[$i];
                    $w = $arr_int[$i];
                    $sign += $b * $w;
                }
                $n       = $sign % 11;
                $val_num = $arr_ch[$n];
                if ($val_num != substr($id, 17, 1)) {
                    return false;
                }
                else {
                    return true;
                }
            }
        }
    }

    /**
     * 验证身份证是否正确
     * @param $id
     * @param $name
     * @return bool
     */
    private function realIdCard($id,$name){
        $arr = array();
        $arr['appId'] = config("realId.appid");
        $arr['cardCode'] = $id;
        $arr['cardName'] = $name;
        $sign = $this->obtainSign($arr);
        $arr['sign'] = $sign;
        $realIdToken=cache::get('real_idCard_token');
        if(empty($realIdToken)){
            $realIdToken = $this->obtainToken();
        }
        $url = realIdCheck($realIdToken);
        $result = curl_request($url,json_encode($arr,JSON_UNESCAPED_UNICODE));
        if($result['code']==200&&$result['data']['fee']){
            return true;
        }
        return false;
    }

    /**
     * 获取身份验证token
     * @return mixed
     */
    private function obtainToken(){
        $url = realIdToken();
        $result = curl_request($url);
        if(isset($result['code']) && $result['code']==0){
            show(0, [], $result['msg']);
        }
        if(isset($result['error'])){
            show(0, [], $result['error_description']);
        }
        Cache::set('real_idCard_token',$result['access_token'],'84600');
        return $result['access_token'];
    }

    /**
     * 签名
     * @param $data
     * @return string
     */
    private function obtainSign($data){
        $str = implode('',$data);
        $str = $str.config("realId.secretKey");
        return md5($str);
    }

}