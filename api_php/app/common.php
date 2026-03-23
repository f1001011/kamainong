<?php
// 应用公共文件
use think\facade\Cache;
use think\facade\Db;

function show($code, $data = [], $msg = ""){
    if ($code == 0){
        $code = TC('error_code');
    }elseif ($code ==1){
        $code = TC('success_code');
    }

    if (empty($msg)){
        $msg = 'ok';
        if ($code == 0){
            $msg = 'no';
        }
    }
    $token = md5(uniqid());
    $result = array(
        'code' => $code,
        'msg'  => $msg,
        'data' => $data,
    );

    if (\think\facade\Request::isPost()){
        $result['sub_token'] = $token;
        session('sub_token',$token);
    }
    //输出json
    return json_encode($result,JSON_UNESCAPED_UNICODE);
    exit;
}

function addShow($code, $data = '', $msg = ""){
    if ($code == 0){
        $code = TC('error_code');
    }elseif ($code ==1){
        $code = TC('success_code');
    }

    if (empty($msg)){
        $msg = 'ok';
        if ($code == 0){
            $msg = 'no';
        }
    }
    $token = md5(uniqid());
    $result = array(
        'code' => $code,
        'msg'  => $msg,
        'data' => $data,
    );

    if (\think\facade\Request::isPost()){
        $result['sub_token'] = $token;
        session('sub_token',$token);
    }
    //输出json
    return json_encode($result,JSON_UNESCAPED_UNICODE);
    exit;
}

function api_token($id)
{
    return md5($id . 'api' . date('Y-m-d H:i:s', time()) . 'token');
}

//购买商品生成订单号
function orderCode($string = '')
{
//    if (empty($string))
//        return false;
    //生成订单 字符串 + 随机数 + 时间 +
    return $string . mt_rand(1000, 9999) . date('YmdHis');
}


//加密 rsa
function rsa_encrypt($data)
{
    openssl_public_encrypt($data, $encrypted, TC('public_key'));
    return base64_encode($encrypted);
}

//解密 rsa
function rsa_decrypt($encrypted)
{
    $encrypted = base64_decode($encrypted);
    openssl_private_decrypt($encrypted, $decrypted,TC('private_key') );
    return $decrypted;
}

//获取 toConfig配置
function TC($value){
    return config("toConfig.".$value);
}

function config_image($str = ''){
    if (empty($str)){
        return '';
    }
    return config('ToConfig.app_update.image_url') . '/' .$str;
}

function code_check($value){
    $v = new app\controller\Verify();
    return $v->check($value);
}

//可以领取团队奖励的时间，每月的几号
function received_date(){
    return date('Y-m-') . "01 00:00:00";
}

/*
 * 富文本返回，需要把域名加上
 */
function returnEditor($content){

    return  str_replace('/topic/',config('ToConfig.image_url').'/topic/',$content);

}

/**
 * 获取身份验证token地址
 * @return string
 */
function realIdToken(){
    $domainName = config("realId.domainName");
    $apiKey = config("realId.apiKey");
    $secretKey = config("realId.secretKey");
    $url = $domainName.'/aip/oauth/2.0/token?grant_type=client_credentials&client_id='.$apiKey.'&client_secret='.$secretKey;
    return $url;
}

/**
 * 缓存token
 * @return mixed
 */
function obtainToken(){
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
 * 短信验证码url
 * @return string
 */
function codeUrl($token){
    $domainName = config("realId.domainName");
    $url = $domainName.'/aip/sms/v1/batchSendSmsTp?access_token='.$token;
    return $url;
}
/**
 * 身份证核对url
 * @param $token
 * @return string
 */
function realIdCheck($token){
    $domainName = config("realId.domainName");
    $url = $domainName.'/aip/check/v1/id/elem2?access_token='.$token;
    return $url;
}
function randomCode($num = 4){
    //$text = 'abcdefghijklmnopqrstuvwxyz123456789';
    $text = '123456789';
    $code = '';
    for($i=0;$i<$num;$i++) {
        $code .= $text[mt_rand(0,strlen($text)-1)];
    };
    return $code;
}

function is_code_off()
{
    $find = Db::name('common_sys_config')->where(['name'=>'code_off'])->find();
    if(!empty($find)&&$find['value']==1){
        return true;
    }
    return false;
}
/**
 * @Description: curl请求
 * @Author:
 * @param $url
 * @param null $data
 * @param string $method
 * @param array $header
 * @param bool $https
 * @param int $timeout
 * @return mixed
 */
function curl_request($url, $datas = null, $method = 'post', $header = array("content-type: application/json"), $https = true, $timeout = 50)
{
    try {
        $ch = curl_init(); //初始化
        curl_setopt($ch, CURLOPT_URL, $url); //访问的URL
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); //只获取页面内容，但不输出
        if(substr($url,0,5)=="https"){
            $https = true;
        }else{
            $https = false;
        }
        if ($https) {
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); //https请求 不验证证书
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false); //https请求 不验证HOST
        }

        if ($method != "GET") {
            if ($method == 'POST') {
                curl_setopt($ch, CURLOPT_POST, true); //请求方式为post请求
            }
            if ($method == 'PUT' || strtoupper($method) == 'DELETE') {
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method); //设置请求方式
            }
            curl_setopt($ch, CURLOPT_POSTFIELDS, $datas); //请求数据
        }
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        curl_setopt($ch, CURLOPT_HEADER, false); //设置不需要头信息
        curl_setopt($ch, CURLOPT_HTTPHEADER, $header); //模拟的header头

        $result = curl_exec($ch); //执行请求

        if (false == $result){
            throw new Exception(curl_error($ch), curl_errno($ch));
        }
        $data = json_decode($result, true);
        curl_close($ch); //关闭curl，释放资源
    } catch(Exception $e) {
        $data = ['code' => 0, 'msg' => $e->getMessage(), 'data' => ''];
    }
    return $data;
}





