<?php

namespace app\model;

class CommonNotificationModel extends BaseModel
{
    protected $name = 'common_notification';

    const TYPE_SYSTEM = 'system'; // 系统通知
    const TYPE_TRANSACTION = 'transaction'; // 交易通知

    const IS_READ_NO = 0; // 未读
    const IS_READ_YES = 1; // 已读
}
