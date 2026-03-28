<?php

namespace app\model;

class CommonAdminTokenModel extends BaseModel
{
    protected $name = 'common_admin_token';

    const TYPE_SINGLE_LOGIN = 1; // 单点登录类型
}
