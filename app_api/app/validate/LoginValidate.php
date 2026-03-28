<?php
declare (strict_types = 1);

namespace app\validate;

use think\Validate;

class LoginValidate extends Validate
{
    /**
     * 定义验证规则
     * 格式：'字段名' =>  ['规则1','规则2'...]
     *
     * @var array
     */
    protected $rule = [
        'phone'  => 'require|regex:' . PHONE_REGEX,
        'pwd'   => 'require|alphaNum|min:8|max:25',
        'invitation_code' => 'max:50',
        'upwd' => 'require|alphaNum|min:8|max:25',
        'user_name'=>'require|min:2|max:25',
        'sfz'=>'require|alphaNum|min:15|max:25',
        'agent_id'=>'require|integer',
        'captcha'=>'require|alphaNum|min:3|max:10',
    ];

    /**
     * 定义错误信息
     * 格式：'字段名.规则名' =>  '错误信息'
     *
     * @var array
     */
    protected $message = [
        'phone'     => '10010',
        'pwd'       => '10001',
        'invitation_code' => '10060',
        'upwd'      => '10011',
        'user_name' => '10012',
        'sfz'       => '10013',
        'agent_id'  => '10006',
        'captcha'   => '10014',
    ];

    protected $scene = [
        'login'=>  ['phone','pwd'],
        'register' => ['phone', 'pwd'],
    ];
}
