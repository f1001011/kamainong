<?php

namespace app\controller\api;

use app\model\ArticleModel;

class XinWen
{
    //新闻采集，运行一下 就有了，需要自己注册 拿到 key
    public function index()
    {

        //随机取出10条数据
        //$a = Db::query('SELECT * FROM `ntp_common_article` ORDER BY RAND() LIMIT 10');
        //dump($a);die;
//        $arr = Db::name('common_article')->select();

//        foreach ($arr as $key=>$value){
//         $a =    str_replace('[详细]', '', $value['content']);
//            Db::name('common_article')->where('id',$value['id'])->update(['content'=>$a]);
//        }
//
//
//
//        die;
        //新闻更新
        for ($i= 101;$i<200;$i++){
            sleep(1);
            $this->fora($i);
        }


    }

    public function getXw($page= 1)
    {
        //https://www.topthink.com/
        $key = '';
        $ch = curl_init();

        // set url

        curl_setopt($ch, CURLOPT_URL, "http://apis.tianapi.com/nongye/index?key$key=&num=50&page=$page");

        //return the transfer as a string

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

        // $output contains the output string

        $output = curl_exec($ch);

        //echo output
        //b18e77bc8ecf75ecf566cdc8c6528e23 close curl resource to free up system resources

        curl_close($ch);
        $arr = json_decode($output,true);
        return $arr;
    }

    public function fora($page = 1){
        $array = $this->getXw($page);

        if (!isset($array['result'])){
            return;
        }
        foreach ($array['result']['newslist'] as $key=>$value){
            if (empty($value['picUrl']) || empty($value['description']) || empty($value['title'])){
                continue;
            }

            if (stripos($value['picUrl'], 'http') ===false || stripos($value['picUrl'], '.jpg') ===false){
                continue;
            }
            ArticleModel::insert([
                'type'=>2,
                'content'=>$value['description'],
                'create_time'=>$value['ctime'],
                'update_time'=>date('Y-m-d H:i:s'),
                'thumb_url'=>$value['picUrl'],
                'title'=>$value['title'],
                'author'=>$value['source'],
                'description'=>'',
            ]);
        }
    }
}