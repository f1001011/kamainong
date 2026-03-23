<?php

namespace app\traits;

use app\controller\Verify;
use app\model\SysConfigModel;
use my\QRcode;

trait PublicCon
{
    public function mapDateSel()
    {
        $page = $this->request->param('page/d', 1);
        $limit = $this->request->param('limit/d', 10);
        $time = $this->request->param('time', '');

        if ($page <= 0 || $limit <= 0) {
            return show(0, [], '分页条件错误');
        }

        if (empty($time) || strlen($time) != 7) {
            //return show(0, [], '查询日期不明确');
            return [$page, $limit, $time];
        }
        return [$page, $limit, $time];
    }

    public function mapSel()
    {
        $page = $this->request->param('page/d', 1);
        $limit = $this->request->param('limit/d', 40);

        if ($page <= 0 || $limit <= 0) {
            return  show(0, [], '分页条件错误');
        }
        return [$page, $limit];
    }

    //购买商品赠送奖品
    protected function PayGive($money = 0)
    {
        if ($money <= 0) {
            return [0, 0, 0];
        }
        //1 下单赠送股权， 2下单赠送绿币，3 下单赠送积分
        //获取股权配置
        $GiveMoneyGreen = SysConfigModel::page_value([['name', '=', 'give_money_green']]);//绿币
        $GiveMoneyConverge = SysConfigModel::page_value([['name', '=', 'give_money_converge']]);//碳汇
        $GiveMoneyThigh = SysConfigModel::page_value([['name', '=', 'give_money_thigh']]);//股权
        $GiveMoneyVote = SysConfigModel::page_value([['name', '=', 'give_money_vote']]);//股权
        $GiveMoneyIntegral = 0;//100; //积分
        $GiveMoneyIntegralAdd = $GiveMoneyGreenAdd = $GiveMoneyConvergeAdd = $GiveMoneyThighAdd =$GiveMoneyVoteAdd= 0;

        if (intval($GiveMoneyIntegral) > 0) {
            //赠送积分
            $GiveMoneyIntegralAdd =  $money * $GiveMoneyIntegral /100;
        }

        if (intval($GiveMoneyGreen) > 0) {
            //赠送绿币
           $GiveMoneyGreenAdd =  $money * $GiveMoneyGreen /100;
        }

        if (intval($GiveMoneyConverge) > 0) {
            //赠送碳汇
            $GiveMoneyConvergeAdd =  $money * $GiveMoneyConverge /100;
        }

        if (intval($GiveMoneyThigh) > 0) {
            //赠送股权
            $GiveMoneyThighAdd =  $money * $GiveMoneyThigh /100;
        }

        if (intval($GiveMoneyVote) > 0) {
            //赠送碳票
            $GiveMoneyVoteAdd =  $money * $GiveMoneyVote /100;
        }

        return [$GiveMoneyGreenAdd, $GiveMoneyConvergeAdd, $GiveMoneyThighAdd,$GiveMoneyVoteAdd,$GiveMoneyIntegralAdd];
    }

    public function generate($uid,$url = 'http', $logo = '')
    {
        if (empty($url))
            return false;
        $value = $url; //二维码内容地址 地址一定要加http啥的
        $errorCorrectionLevel = 'H';  //容错级别
        $matrixPointSize = 8;      //生成图片大小
        //生成二维码图片
        $name = $uid.'.png';
        $filename = 'static/qrcode/' .$name ; //生成的二维码图片

        QRcode::png($value, $filename, $errorCorrectionLevel, $matrixPointSize, 2);
        //$logo = 'static/info_msg.png'; //准备好的logo图片 注意地址
        $QR = $filename;      //已经生成的原始二维码图

        if ($logo == ''){
            return $name;
        }

        if (file_exists($logo)) {
            $QR = imagecreatefromstring(file_get_contents($QR));      //目标图象连接资源。
            $logo = imagecreatefromstring(file_get_contents($logo));  //源图象连接资源。
            $QR_width = imagesx($QR);        //二维码图片宽度
            $QR_height = imagesy($QR);       //二维码图片高度
            $logo_width = imagesx($logo);    //logo图片宽度
            $logo_height = imagesy($logo);   //logo图片高度
            $logo_qr_width = $QR_width / 4;   //组合之后logo的宽度(占二维码的1/5)
            $scale = $logo_width / $logo_qr_width;  //logo的宽度缩放比(本身宽度/组合后的宽度)
            $logo_qr_height = $logo_height / $scale; //组合之后logo的高度
            $from_width = ($QR_width - $logo_qr_width) / 2;  //组合之后logo左上角所在坐标点
            //重新组合图片并调整大小
            /*
             * imagecopyresampled() 将一幅图像(源图象)中的一块正方形区域拷贝到另一个图像中
             */
            imagecopyresampled($QR, $logo, $from_width, $from_width, 0, 0, $logo_qr_width, $logo_qr_height, $logo_width, $logo_height);
        }
        //输出图片
        //最新图片。拼接头像 和二维码的最新图片
//        $i = time();
        $img_path = $filename;
        imagepng($QR, $img_path); //不改
        imagedestroy($QR);
        imagedestroy($logo);
        //图片

        return $img_path;
    }

    private function download($name ,$path = 'public/static/')
    {
        $file_name = $name;
        if (empty($file_name)){
            return show([],config('ToConfig.http_code.error'),'文件名称不存在');
        }
        //用以解决中文不能显示出来的问题
        //$file_name=iconv("utf-8","gb2312",$file_name);
        $file_path = app()->getRootPath().$path. $file_name;

        $file_path = str_replace("'", "", $file_path);
        //首先要判断给定的文件存在与否
        if (!file_exists($file_path)) {
            return show([],config('ToConfig.http_code.error'),'文件不存在');
        }
        $fp = fopen($file_path, "r");
        $file_size = filesize($file_path);
        //下载文件需要用到的头
        Header("Content-type: application/octet-stream");
        Header("Accept-Ranges: bytes");
        Header("Accept-Length:" . $file_size);
        Header("Content-Disposition: attachment; filename=" . $file_name);
        $buffer = 1024;
        $file_count = 0;

        //一下两行防止（格式未知 数据已被损坏）
        ob_clean();
        flush();
        //向浏览器返回数据
        while (!feof($fp) && $file_count < $file_size) {
            $file_con = fread($fp, $buffer);
            $file_count += $buffer;
            echo $file_con;
        }
        fclose($fp);
    }

    public function verify(){
        $bg = new Verify();
        $bg->index();
    }

    public function captcha($code){
        $bg = new Verify();
        return $bg->check($code);
    }

    private function validateMobile($mobile) {
        if (strlen($mobile) != 11) {
            return false;
        }
        $prefix = substr($mobile, 0, 3);

        if (!in_array($prefix, ['134', '135', '136', '137', '138', '139', '150', '151', '152', '157', '158', '159', '182', '183', '184', '187', '188', '198', '130', '131', '132', '155', '156', '185', '186', '166', '133', '149', '153', '173', '177', '180', '181', '189', '199'])) {
            return false;

        }
        if (!preg_match('/^1[3-9]\d{9}$/', $mobile) && !preg_match('/^0\d{2,3}\d{7,8}$/', $mobile) && !preg_match('/^(\d{3}-|\d{4}-)?\d{7,8}$/', $mobile)) {

            return false;

        }
        return true;

    }
}