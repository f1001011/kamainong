<?php

namespace app\model;

class CommonEmailModel extends BaseModel
{
    protected $name = 'common_email';

    const IS_SEND_NO = 0; // 发送状态: 未发送
    const IS_SEND_YES = 1; // 发送状态: 已发送

    const IS_READ_NO = 0; // 阅读状态: 未读
    const IS_READ_YES = 1; // 阅读状态: 已读
}
