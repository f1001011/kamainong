<?php

namespace my;

use think\facade\Session;

class Verify
{
    public function index()
    {
        //$code = '12345678';
        $code = rand(1000,9999);
        $_SESSION['captcha'] = $code;

        $width = 150;
        $height = 50;

        $image = imagecreatetruecolor($width, $height);

        $bg_color = imagecolorallocate($image, 255, 255, 255);
        imagefill($image, 0, 0, $bg_color);

        $text_color = imagecolorallocate($image, 0, 0, 0);
        // 验证码使用随机字体

        $font_path = app()->getRootPath().'/extend/'.'FZFenSTXJW.TTF';

        $font_size = 20;

        imagettftext($image, $font_size, 0, 50, 30, $text_color, $font_path, $code);

        $line_color = imagecolorallocate($image, mt_rand(1, 150), mt_rand(1, 150), mt_rand(1, 150));
        $pixel_color = imagecolorallocate($image, mt_rand(1, 150), mt_rand(1, 150), mt_rand(1, 150));

        for ($i = 0;
             $i < 10;
             $i++) {
            imageline($image, 0, mt_rand(0, $height), $width, mt_rand(0, $height), $line_color);
        }

        for ($i = 0; $i < 100; $i++) {
            imagesetpixel($image, mt_rand(0, $width), mt_rand(0, $height), $pixel_color);
        }

        header('Content-Type: image/png');
        Session::set('captcha.key',md5($code));
        imagepng($image);
        imagedestroy($image);
    }

    //判断验证码是否正确
    public function check($value){
        $key = Session::get('captcha.key');
        Session::delete('captcha.key');
        if (md5($value) != $key){
            return false;
        }
        return true;
    }
}