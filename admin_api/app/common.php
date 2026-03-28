<?php
// 应用公共文件
require_once __DIR__ . '/helper/Code.php';
function Show($code, $data = [], $msg = 0){
    // 如果 msg 为空或者是数字，使用 lang() 获取多语言

    $message = lang("".$msg);

    $token = md5(uniqid());
    $result = array(
        'code' => $code,
        'message'  => $message,
        'data' => $data,
    );

    $result['sub_token'] = $token;
    session('sub_token',$token);
    //输出json
    return json($result);
    exit;
}


function ApiToken($id)
{
    return md5($id . 'api' . date('Y-m-d H:i:s', time()) . 'token');
}

//购买商品生成订单号
function OrderCode($string = '')
{
    //生成订单 字符串 + 随机数 + 时间 +
    return $string . mt_rand(1000, 9999) . date('YmdHis');
}


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

// 加密
function ShiftEncode($data, $shift = 3) {
    $result = '';
    for ($i = 0; $i < strlen($data); $i++) {
        $result .= chr(ord($data[$i]) + $shift);
    }
    return base64_encode($result);
}

// 解密
function ShiftDecode($data, $shift = 3) {
    $data = base64_decode($data);
    $result = '';
    for ($i = 0; $i < strlen($data); $i++) {
        $result .= chr(ord($data[$i]) - $shift);
    }
    return $result;
}
