<?php
namespace app\controller;

use app\BaseController;
use think\facade\Filesystem;

class Upload extends BaseController
{
    // 上传提款凭证
    public function withdrawProof()
    {
        $userId = request()->userId;
        $file = request()->file('file');
        
        if (!$file) {
            return show(0, [], '请上传文件');
        }
        
        $savename = Filesystem::disk('public')->putFile('withdraw', $file);
        
        $data = [
            'user_id' => $userId,
            'file_path' => $savename,
            'type' => 'withdraw_proof',
            'created_at' => time()
        ];
        
        db('upload_file')->insert($data);
        
        return show(1, ['path' => $savename], '上传成功');
    }
}
