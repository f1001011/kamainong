<?php

namespace app\controller\api;

use app\controller\Base;
use app\traits\PublicCon;

class ImageContract extends Base
{
    use PublicCon;

    public function index()
    {
        // 创建图片资源
        $filename = app()->getRootPath() . '/public/static/thigh/thigh.png';
        $image = imagecreatefrompng($filename);

        // 设置字体颜色和字体文件
        $color = imagecolorallocate($image, 255, 255, 255); // 白色字体
        $font_file = app()->getRootPath() . '/extend/' . 'FZFenSTXJW.TTF';
        // $font_file = 'arial.ttf'; // 字体文件路径

        // 给图片添加文本
        $text = "Hello, world!";
        imagettftext($image, 123, 0, 123, 123, $color, $font_file, $text);

        // 将图像保存为PNG文件
        imagepng($image, 'static/thigh/new_image.png');

        // 清除图像资源
        imagedestroy($image);
        //return show(1, ['thigh' => TC('qrcode_url') . '/static/thigh/' . $UserInfo['id'] . '.png', 'name' => $UserInfo['id'] . '.png']);

    }

    public function indexx()
    {
        $UserInfo = $this->request->UserInfo;
        $username = $UserInfo['user_name'];
        $id_card = $UserInfo['sfz'];
        $time = date('Y-m-d H:i:s');
        $thigh = '股权：' . $UserInfo['money_thigh'];

        $filename = app()->getRootPath() . '/public/static/thigh/thigh.png';
        $image = imagecreatefrompng($filename);

        // 设置字体颜色和字体文件
        $color = imagecolorallocate($image, 255, 255, 255); // 白色字体
        $font_file = app()->getRootPath() . '/extend/' . 'FZFenSTXJW.TTF';

        imagettftext($image, 123, 0, 123, 123, $color, $font_file, $username);
        imagettftext($image, 123, 0, 123, 123, $color, $font_file, $id_card);
        imagettftext($image, 123, 0, 123, 123, $color, $font_file, $time);
        imagettftext($image, 123, 0, 123, 123, $color, $font_file, $thigh);

//        $bg_info = getimagesize($filename);
//        $width = $bg_info[0];
//        $height = $bg_info[1];
//        $bg_type = image_type_to_extension($bg_info[2], false);
//        $func = 'imagecreatefrom' . $bg_type;
//        $bg_image = $func($filename);
//
//        $dest = imagecreatetruecolor($width, $height);
//
//        imagecopy($dest, $bg_image, 0, 0, 0, 0, $width, $height);
//
//        $color = imagecolorallocate($dest, 0, 0, 0);
//        $font = app()->getRootPath() . '/extend/' . 'FZFenSTXJW.TTF';
//        imagettftext($dest, 50, 0, 200, 800, $color, $font, $username);
//        imagettftext($dest, 50, 0, 200, 900, $color, $font, $id_card);
//        imagettftext($dest, 50, 0, 200, 1000, $color, $font, $time);
//        imagettftext($dest, 50, 0, 200, 1100, $color, $font, $thigh);
        $newname = app()->getRootPath() . '/public/static/thigh/' . $UserInfo['id'] . '.png';
        // $image = imagecreatefrompng($newname);
//        imagepng($image, NULL, 9);
        // 将图像保存为PNG文件
        imagepng($image, 'static/thigh/new_image.png',9);
        // 清除图像资源
        imagedestroy($image);
//        imagedestroy($image);
        return show(1, ['thigh' => TC('qrcode_url') . '/static/thigh/' . $UserInfo['id'] . '.png', 'name' => $UserInfo['id'] . '.png']);
        //return download($newname);
    }

    public function ThighDownload()
    {
        $name = $this->request->get('name', '');
        if (empty($name)) {
            return show([], config('ToConfig.http_code.error'), '文件名称不存在');
        }
        $path = 'public/static/thigh/';
        return $this->download($name, $path);
    }
}