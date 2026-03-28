http://0.0.0.0:8080/api/register
参数
{
    "phone": "189999996",
    "pwd": "123123123",
    "invitation_code": "RV"
}

返回
{
    "code": 200,
    "message": "注册成功",
    "data": {
    "token": "4f828a0db9389b36d750881cd1bc7140",
        "user_info": {
        "id": 8,
            "user_no": 1008,
            "user_name": "user_1774368808192",
            "nickname": null,
            "create_time": "2026-03-25 00:13:28",
            "status": 1,
            "state": 0,
            "head_img": null,
            "is_real_name": 0,
            "market_uid": 0,
            "is_fictitious": 0,
            "phone": "189999996",
            "money_balance": "0.00",
            "money_freeze": "0.00",
            "first_purchase_done": 0,
            "money_integral": "0.00",
            "money_team": "0.00",
            "user_team": 1003,
            "ip": "127.0.0.1",
            "total_withdraw": "0.00",
            "total_recharge": "0.00",
            "total_red": "0.00",
            "sfz": null,
            "is_withdraw": 1,
            "agent_id_1": 3,
            "agent_id_2": 0,
            "agent_id_3": 0,
            "agent_id": 3,
            "level_vip": 0,
            "agent_level": 0,
            "agent_level_name": null,
            "current_experience": 0,
            "agent_lv": 0,
            "invitation_code": "1008"
    }
},
    "sub_token": "6e3f4d83a489a24a428865e6f188f497"
}


http://0.0.0.0:8080/api/login

{
    "phone": "189999995",
    "pwd": "123123123"
}


{
    "code": 200,
    "message": "登录成功",
    "data": {
    "token": "107ae10692179140390c0f78bebe8abe",
        "user_info": {
        "id": 7,
            "user_no": 1007,
            "user_name": "user_1774368735159",
            "nickname": null,
            "create_time": "2026-03-25 00:12:15",
            "status": 1,
            "state": 0,
            "head_img": null,
            "is_real_name": 0,
            "market_uid": 0,
            "is_fictitious": 0,
            "phone": "189999995",
            "money_balance": "0.00",
            "money_freeze": "0.00",
            "first_purchase_done": 0,
            "money_integral": "0.00",
            "money_team": "0.00",
            "user_team": 1003,
            "ip": "127.0.0.1",
            "total_withdraw": "0.00",
            "total_recharge": "0.00",
            "total_red": "0.00",
            "sfz": null,
            "is_withdraw": 1,
            "agent_id_1": 3,
            "agent_id_2": 0,
            "agent_id_3": 0,
            "agent_id": 3,
            "level_vip": 0,
            "agent_level": 0,
            "agent_level_name": null,
            "current_experience": 0,
            "agent_lv": 0,
            "invitation_code": "1007"
    }
},
    "sub_token": "1a61598754f46934330cd0046fad2f26"
}