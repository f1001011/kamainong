<?php


namespace app\command;

use app\model\AgentPath;
use app\model\UserModel;
use think\console\Command;
use think\console\Input;
use think\console\Output;
use think\facade\Db;

/**
    半小时执行一次
 **/
class UserAgentPath extends Command
{
    protected function configure()
    {
        $this->setName('UserAgentPath')->setDescription('Here is the UserAgentPath');
    }

    protected function execute(Input $input, Output $output)
    {
        Db::name('verify')->delete(true);
        //查询用户的所有代理
        $MaxUserId = AgentPath::max_user();
        //查询用户大于这个id的用户，都是没有写入代理关系
        $AgentUser = UserModel::agent_user($MaxUserId);
        if (empty($AgentUser)){
            $output->writeln('执行成功');
            return;
        }
        //遍历用户
        foreach ($AgentUser as $key=>$value){

            //判断用户是否有上一级代理 没有代理时候
            $find = AgentPath::where('uid',$value['agent_id'])->find();
            if (!$value['agent_id']){
                //查询是否存在了
                if (!empty($find)){
                    continue;
                }
                //直接写入
                AgentPath::insert([
                    'uid'=>$value['id'],
                    'path'=>$value['id'].'|',
                    'agent_id'=>0,
                    'times'=>date('Y-m-d H:i:s'),
                ]);
                continue;
            }
            //有代理时候
            //查询上级用户的 path
            AgentPath::insert([
                'uid'=>$value['id'],
                'path'=>$find->path.$value['id'].'|',
                'agent_id'=>$value['agent_id'],
                'times'=>date('Y-m-d H:i:s'),
            ]);
            continue;
        }
        $output->writeln('执行成功1');
        return;
    }
}