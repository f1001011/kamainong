<?php
declare(strict_types=1);

namespace app\controller\common;

use app\controller\BaseCon;

class FileCon extends BaseCon
{
    public function UploadImg()
    {
        return $this->handleUpload(
            ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            'img'
        );
    }

    public function UploadVideo()
    {
        return $this->handleUpload(
            ['mp4', 'mov', 'avi', 'wmv', 'm4v', 'webm'],
            'video'
        );
    }

    protected function handleUpload(array $allowExtensions, string $defaultType)
    {
        $file = $this->request->file('file');
        if (!$file) {
            return Show(ERROR, [], '请先选择文件');
        }

        $extension = strtolower((string)$file->extension());
        if (!in_array($extension, $allowExtensions, true)) {
            return Show(ERROR, [], '文件格式不支持');
        }

        $type = trim((string)$this->request->post('type', $defaultType));
        if ($type === '' || !preg_match('/^[a-zA-Z0-9_-]+$/', $type)) {
            $type = $defaultType;
        }

        $relativeDir = 'uploads' . DIRECTORY_SEPARATOR . $type . DIRECTORY_SEPARATOR . date('Ym');
        $saveDir = dirname(app()->getRootPath()) . DIRECTORY_SEPARATOR . $relativeDir;
        if (!is_dir($saveDir) && !mkdir($saveDir, 0755, true) && !is_dir($saveDir)) {
            return Show(ERROR, [], '创建上传目录失败');
        }

        $saveName = md5($type . '_' . microtime(true) . '_' . mt_rand(1000, 9999)) . '.' . $extension;

        try {
            $file->move($saveDir, $saveName);
        } catch (\Throwable $exception) {
            return Show(ERROR, [], '文件上传失败');
        }

        $relativePath = '/' . str_replace(DIRECTORY_SEPARATOR, '/', $relativeDir . DIRECTORY_SEPARATOR . $saveName);

        return Show(SUCCESS, [
            'fileUrl' => $relativePath,
            'filePath' => $relativePath,
            'type' => $type
        ], '上传成功');
    }
}
