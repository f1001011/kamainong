header('Content-Type: image/png');
$filename = 'test.png';
$compression = 9; // 压缩级别从 0（无压缩）到 9（最小/最劣）
$image = imagecreatefrompng($filename);
imagepng($image, NULL, $compression);
imagedestroy($image);