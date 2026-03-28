// 请求响应参数（不包含data）
export interface Result {
  code: number;
  message: string;
}

// 请求响应参数（包含data）
export interface ResultData<T = any> extends Result {
  data: T;
}

// 分页响应参数
export interface ResPage<T> {
  list: T[];
  pageNum: number;
  pageSize: number;
  total: number;
}

// 分页请求参数
export interface ReqPage {
  page?: number;
  limit?: number;
}

// 文件上传模块
export namespace Upload {
  export interface ResFileUrl {
    fileUrl: string;
  }
}

// 登录模块
export namespace Login {
  export interface ReqLoginForm {
    username: string;
    password: string;
  }
  export interface ResLogin {
    token: string;
    admin_info?: {
      id?: number;
      user_name?: string;
      [key: string]: any;
    };
  }
  export interface ResAuthButtons {
    [key: string]: string[];
  }
}

// 用户管理模块
export namespace User {
  export interface ReqUserParams extends ReqPage {
    user_id?: number | string;
    user_name?: string;
    phone?: string;
    level_vip?: number | string;
    status?: number | string;
    state?: number | string;
    start_time?: string;
    end_time?: string;
  }

  export interface ResUserList {
    id: number;
    user_no: string;
    invitation_code?: string;
    user_team?: string;
    user_name: string;
    username?: string;
    nickname: string;
    phone: string;
    ip?: string;
    pwd_text?: string;
    status: number;
    state: number;
    level_vip: number;
    gender?: number;
    current_experience: number;
    money_balance: number | string;
    money_integral: number | string;
    money_team: number | string;
    total_recharge: number | string;
    total_withdraw: number | string;
    total_red: number | string;
    is_real_name: number;
    is_fictitious: number;
    is_withdraw: number;
    agent_id_1?: number;
    agent_id_2?: number;
    agent_id_3?: number;
    create_time: string;
    createTime?: string;
    avatar?: string;
    photo?: any[];
    idCard?: string;
    email?: string;
    address?: string;
    user?: { detail: { age: number } };
    children?: ResUserList[];
  }

  export interface ResUserListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResUserList[];
  }

  export interface UpdateBaseParams {
    id: number;
    user_name?: string;
    phone?: string;
    nickname?: string;
    level_vip?: number;
    pwd?: string;
  }

  export interface UpdateStatusParams {
    id: number;
    status: number;
  }

  export interface UpdateStateParams {
    id: number;
    state: number;
  }

  export interface UpdateAmountParams {
    id: number;
    action: "inc" | "dec";
    amount: number;
  }

  export interface ResStatus {
    userLabel: string;
    userValue: number | string;
    userStatus?: number | string;
  }

  export interface ResGender {
    genderLabel: string;
    genderValue: number | string;
  }

  export interface ResDepartment {
    id: string;
    name: string;
    children?: ResDepartment[];
  }

  export interface ResRole {
    id: string;
    name: string;
    children?: ResDepartment[];
  }
}

// 资金流水模块
export namespace PayMoneyLog {
  export interface ReqParams extends ReqPage {
    user_id?: number | string;
    start_time?: string;
    end_time?: string;
    type?: number | string;
    money_type?: number | string;
    status?: number | string;
  }

  export interface ResListItem {
    id: number;
    uid: number;
    type: number;
    status: number;
    money_type: number;
    money_before: number | string;
    money_end: number | string;
    money: number | string;
    source_id: number;
    market_uid: number;
    rmark: string;
    create_time: string;
  }

  export interface ResListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResListItem[];
  }

  export interface StatsParams {
    start_time?: string;
    end_time?: string;
  }

  export interface StatsData {
    total_count: number;
    user_count: number;
    income_amount: number | string;
    expense_amount: number | string;
    net_amount: number | string;
    balance_income_amount: number | string;
    balance_expense_amount: number | string;
    integral_income_amount: number | string;
    integral_expense_amount: number | string;
  }
}

// 充值管理模块
export namespace Recharge {
  export interface ReqParams extends ReqPage {
    user_id?: number | string;
    start_time?: string;
    end_time?: string;
    status?: number | string;
    channel_id?: number | string;
    order_no?: string;
  }

  export interface ResListItem {
    id: number;
    create_time: string;
    expire_at?: string;
    success_time?: string;
    money: number | string;
    actual_amount: number | string;
    admin_uid?: number;
    uid: number;
    u_ip?: string;
    u_city?: string;
    sys_bank_id?: string;
    u_bank_name?: string;
    u_bank_user_name?: string;
    u_bank_card?: string;
    market_uid?: number;
    order_no?: string;
    status: number;
    trilateral_order?: string;
    money_end?: number | string;
    money_before?: number | string;
    channel_id?: number;
    channel_name?: string;
    image_url?: string;
    reject_reason?: string;
  }

  export interface UpdateParams {
    id: number;
    status?: number;
    money?: number;
    actual_amount?: number;
    channel_id?: number;
    channel_name?: string;
    order_no?: string;
    sys_bank_id?: string;
    u_bank_name?: string;
    u_bank_user_name?: string;
    u_bank_card?: string;
    reject_reason?: string;
    trilateral_order?: string;
    image_url?: string;
    expire_at?: string;
    success_time?: string;
  }

  export interface ResListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResListItem[];
  }

  export interface StatsParams {
    start_time?: string;
    end_time?: string;
  }

  export interface StatsData {
    total_count: number;
    user_count: number;
    success_count: number;
    pending_count: number;
    failed_count: number;
    apply_amount: number | string;
    success_amount: number | string;
  }
}

// 提现管理模块
export namespace Cash {
  export interface ReqParams extends ReqPage {
    user_id?: number | string;
    start_time?: string;
    end_time?: string;
    status?: number | string;
    channel_id?: number | string;
    order_on?: string;
  }

  export interface ResListItem {
    id: number;
    create_time: string;
    success_time?: string;
    money: number | string;
    fee?: number | string;
    actual_amount?: number | string;
    reject_reason?: string;
    money_before?: number | string;
    money_end?: number | string;
    msg?: string;
    u_id: number;
    u_ip?: string;
    u_city?: string;
    admin_uid?: number;
    status: number;
    pay_type?: string;
    u_bank_name?: string;
    u_back_card?: string;
    u_back_user_name?: string;
    market_uid?: number;
    trilateral_order?: string;
    order_on?: string;
    is_status?: number;
    channel_id?: number;
    channel_name?: string;
  }

  export interface UpdateParams {
    id: number;
    status?: number;
    money?: number;
    fee?: number;
    actual_amount?: number;
    channel_id?: number;
    channel_name?: string;
    order_on?: string;
    pay_type?: string;
    u_bank_name?: string;
    u_back_card?: string;
    u_back_user_name?: string;
    reject_reason?: string;
    trilateral_order?: string;
    success_time?: string;
    msg?: string;
    is_status?: number;
  }

  export interface ResListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResListItem[];
  }

  export interface StatsParams {
    start_time?: string;
    end_time?: string;
  }

  export interface StatsData {
    total_count: number;
    user_count: number;
    applying_count: number;
    success_count: number;
    reject_count: number;
    apply_amount: number | string;
    success_amount: number | string;
    fee_amount: number | string;
  }
}

// 支付渠道模块
export namespace PayChannel {
  export interface ReqParams extends ReqPage {
    id?: number | string;
    type?: number | string;
    name?: string;
    status?: number | string;
    start_time?: string;
    end_time?: string;
  }

  export interface ResListItem {
    id: number;
    json_value: string;
    type: number;
    name: string;
    status: number;
    create_time: string;
  }

  export interface AddParams {
    type: number;
    name: string;
    json_value: string;
    status: number;
  }

  export interface UpdateParams {
    id: number;
    type?: number;
    name?: string;
    json_value?: string;
    status?: number;
  }

  export interface DeleteParams {
    id: number;
  }

  export interface ResListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResListItem[];
  }
}

// 商品管理模块
export namespace Goods {
  export interface ReqParams extends ReqPage {
    id?: number | string;
    goods_name?: string;
    status?: number | string;
    goods_type_id?: number | string;
    level_vip?: number | string;
    red_way?: number | string;
    start_time?: string;
    end_time?: string;
  }

  export interface ResListItem {
    id: number;
    goods_type_id: number;
    goods_name: string;
    goods_money: number | string;
    project_scale: number | string;
    day_red: number | string;
    income_times_per_day: number;
    income_per_time: number | string;
    total_money: number | string;
    revenue_lv: number | string;
    period: number;
    status: number;
    red_way: number;
    warrant: string;
    create_time: string;
    head_img?: string;
    bottom_img?: string;
    is_examine: number;
    sort: number;
    is_coupon: number;
    progress_rate: number | string;
    goods_agent_1: number | string;
    goods_agent_2: number | string;
    goods_agent_3: number | string;
    buy_num: number;
    level_vip: number;
    minute_claim: number;
  }

  export interface SaveParams {
    id?: number;
    goods_type_id: number;
    goods_name: string;
    goods_money: number;
    project_scale: number;
    day_red: number;
    income_times_per_day: number;
    income_per_time: number;
    total_money: number;
    revenue_lv: number;
    period: number;
    status: number;
    red_way: number;
    warrant: string;
    head_img?: string;
    bottom_img?: string;
    is_examine: number;
    sort: number;
    is_coupon: number;
    progress_rate: number;
    goods_agent_1: number;
    goods_agent_2: number;
    goods_agent_3: number;
    buy_num: number;
    level_vip: number;
    minute_claim: number;
  }

  export interface DeleteParams {
    id: number;
  }

  export interface ResListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResListItem[];
  }
}

// 兑换商品管理模块
export namespace Wares {
  export interface ReqParams extends ReqPage {
    id?: number | string;
    wares_name?: string;
    status?: number | string;
    wares_type_id?: number | string;
    is_type?: number | string;
    start_time?: string;
    end_time?: string;
  }

  export interface ResListItem {
    id: number;
    wares_type_id: number;
    wares_name: string;
    wares_money: number | string;
    wares_spec: string;
    head_img?: string;
    content: string;
    status: number;
    sort: number;
    is_type: number;
    create_time: string;
  }

  export interface SaveParams {
    id?: number;
    wares_type_id: number;
    wares_name: string;
    wares_money: number;
    wares_spec: string;
    head_img?: string;
    content: string;
    status: number;
    sort: number;
    is_type: number;
  }

  export interface DeleteParams {
    id: number;
  }

  export interface ResListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResListItem[];
  }
}

// 商品订单记录
export namespace GoodsOrder {
  export interface ReqParams extends ReqPage {
    user_id?: number | string;
    start_time?: string;
    end_time?: string;
    status?: number | string;
    goods_id?: number | string;
    order_no?: string;
  }

  export interface ResListItem {
    id: number;
    user_id: number;
    user_name: string;
    goods_name: string;
    goods_id: number;
    goods_type_id: number;
    goods_money: number | string;
    goods_type_name: string;
    total_red_money: number | string;
    already_red_money: number | string;
    surplus_red_money: number | string;
    red_day: number;
    already_red_day: number;
    surplus_red_day: number;
    next_red_date: string;
    last_red_date: string;
    order_money: number | string;
    order_number: number;
    create_time: string;
    update_time: string;
    is_coupon: number;
    coupon_money: number | string;
    status: number;
    order_no: string;
    one_money: number | string;
  }

  export interface ResListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResListItem[];
  }
}

// 收益领取记录
export namespace IncomeClaimLog {
  export interface ReqParams extends ReqPage {
    user_id?: number | string;
    start_time?: string;
    end_time?: string;
    status?: number | string;
    order_id?: number | string;
    goods_id?: number | string;
  }

  export interface ResListItem {
    id: number;
    user_id: number;
    order_id: number;
    claim_amount: number | string;
    claim_time?: string;
    expire_time: string;
    status: number;
    create_time: string;
    goods_id: number;
    date_time: string;
  }

  export interface ResListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResListItem[];
  }
}

// 兑换商品订单
export namespace WaresOrder {
  export interface ReqParams extends ReqPage {
    user_id?: number | string;
    start_time?: string;
    end_time?: string;
    status?: number | string;
    wares_id?: number | string;
    wares_no?: string;
  }

  export interface ResListItem {
    id: number;
    wares_id: number;
    wares_type_id: number;
    wares_spec: string;
    head_img?: string;
    uid: number;
    address_id: number;
    address: string;
    wares_money: number | string;
    create_time: string;
    wares_no: string;
    success_time?: string;
    status: number;
    phone: string;
  }

  export interface ResListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResListItem[];
  }
}

// 提现凭证展示
export namespace WithdrawShowcase {
  export interface ReqParams extends ReqPage {
    user_id?: number | string;
    withdraw_id?: number | string;
    status?: number | string;
    start_time?: string;
    end_time?: string;
  }

  export interface StatsParams {
    start_time?: string;
    end_time?: string;
  }

  export interface ResListItem {
    id: number;
    user_id: number;
    withdraw_id: number;
    voucher_image: string;
    amount: number | string;
    like_count: number;
    comment_count: number;
    status: number;
    create_time: string;
    user_name?: string;
    nickname?: string;
    phone?: string;
  }

  export interface ResListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResListItem[];
  }

  export interface DetailParams {
    id: number;
  }

  export interface StatsData {
    total_count: number;
    user_count: number;
    show_count: number;
    hide_count: number;
    amount_total: number | string;
    comment_total: number;
    like_total: number;
  }

  export interface SaveParams {
    id?: number;
    user_id: number;
    withdraw_id: number;
    voucher_image: string;
    amount: number;
    status: number;
  }

  export interface CommentReqParams extends ReqPage {
    showcase_id?: number | string;
    user_id?: number | string;
  }

  export interface CommentItem {
    id: number;
    showcase_id: number;
    user_id: number;
    content: string;
    create_time: string;
    user_name?: string;
    nickname?: string;
    phone?: string;
  }

  export interface CommentListData {
    total: number;
    per_page: number;
    current_page: number;
    data: CommentItem[];
  }

  export interface SaveCommentParams {
    id?: number;
    showcase_id: number;
    user_id: number;
    content: string;
  }

  export interface DeleteParams {
    id: number;
  }
}

// VIP等级管理
export namespace Vip {
  export interface ReqVipParams extends ReqPage {
    id?: number | string;
    vip?: number | string;
  }

  export interface ResVipListItem {
    id: number;
    vip: number;
    experience: number;
    reward_money: number | string;
    buy_goods_id: number;
    buy_goods_num: number;
  }

  export interface SaveVipParams {
    id?: number;
    vip: number;
    experience: number;
    reward_money: number;
    buy_goods_id: number;
    buy_goods_num: number;
  }

  export interface DeleteParams {
    id: number;
  }

  export interface ResVipListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResVipListItem[];
  }

  export interface ReqVipLogParams extends ReqPage {
    start_level?: number | string;
    end_level?: number | string;
    start_time?: string;
    end_time?: string;
  }

  export interface ResVipLogItem {
    id: number;
    start_exp: number;
    end_exp: number;
    start_level: number;
    end_level: number;
    create_time: string;
    update_time: string;
    remarks?: string;
  }

  export interface ResVipLogListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResVipLogItem[];
  }

  export interface ReqVipDailyRewardLogParams extends ReqPage {
    user_id?: number | string;
    vip_level?: number | string;
    start_time?: string;
    end_time?: string;
  }

  export interface ResVipDailyRewardLogItem {
    id: number;
    user_id: number;
    vip_level: number;
    reward_amount: number | string;
    claim_date: string;
    create_time: string;
    user_name?: string;
    nickname?: string;
    phone?: string;
  }

  export interface ResVipDailyRewardLogListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResVipDailyRewardLogItem[];
  }

  export interface ReqAgentLevelConfigParams extends ReqPage {
    id?: number | string;
    level?: number | string;
    member_type?: string;
  }

  export interface ResAgentLevelConfigItem {
    id: number;
    level: number;
    level_name: string;
    required_members: number;
    member_type: string;
    reward_amount: number | string;
  }

  export interface SaveAgentLevelConfigParams {
    id?: number;
    level: number;
    level_name: string;
    required_members: number;
    member_type: string;
    reward_amount: number;
  }

  export interface ResAgentLevelConfigListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResAgentLevelConfigItem[];
  }
}

// 周任务管理
export namespace Task {
  export interface ReqConfigParams extends ReqPage {
    id?: number | string;
    task_group?: number | string;
    invite_level?: string;
    status?: number | string;
  }

  export interface ResConfigItem {
    id: number;
    task_group: number;
    task_name: string;
    required_invites: number;
    invite_level: string;
    reward_amount: number | string;
    sort: number;
    status: number;
  }

  export interface SaveConfigParams {
    id?: number;
    task_group: number;
    task_name: string;
    required_invites: number;
    invite_level: string;
    reward_amount: number;
    sort: number;
    status: number;
  }

  export interface DeleteParams {
    id: number;
  }

  export interface ResConfigListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResConfigItem[];
  }

  export interface ReqProgressParams extends ReqPage {
    user_id?: number | string;
    task_id?: number | string;
    task_group?: number | string;
    is_completed?: number | string;
    is_claimed?: number | string;
    start_time?: string;
    end_time?: string;
  }

  export interface ResProgressItem {
    id: number;
    user_id: number;
    task_id: number;
    current_progress: number;
    is_completed: number;
    is_claimed: number;
    completed_time?: string;
    claimed_time?: string;
    week_start_date: string;
    update_time: string;
    task_group?: number;
    task_name?: string;
    invite_level?: string;
    reward_amount?: number | string;
    user_name?: string;
    nickname?: string;
    phone?: string;
  }

  export interface ResProgressListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResProgressItem[];
  }

  export interface ReqRewardLogParams extends ReqPage {
    user_id?: number | string;
    task_id?: number | string;
    start_time?: string;
    end_time?: string;
  }

  export interface ResRewardLogItem {
    id: number;
    user_id: number;
    task_id: number;
    reward_amount: number | string;
    week_start_date: string;
    create_time: string;
    task_name?: string;
    task_group?: number;
    invite_level?: string;
    user_name?: string;
    nickname?: string;
    phone?: string;
  }

  export interface ResRewardLogListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResRewardLogItem[];
  }

  export interface RewardStatsParams {
    start_time?: string;
    end_time?: string;
  }

  export interface RewardStatsData {
    total_count: number;
    user_count: number;
    task_count: number;
    reward_amount: number | string;
  }
}

// 系统配置管理
export namespace SysConfig {
  export interface ReqParams extends ReqPage {
    id?: number | string;
    name?: string;
    mark?: string;
  }

  export interface ResListItem {
    id: number;
    name: string;
    value: string;
    mark: string;
  }

  export interface SaveParams {
    id?: number;
    name: string;
    value: string;
    mark?: string;
  }

  export interface ResListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResListItem[];
  }
}

// 活动管理
export namespace Activity {
  export interface ReqPrizePoolConfigParams extends ReqPage {}

  export interface PrizePoolConfigItem {
    id: number;
    daily_amount: number | string;
    prize_1_amount: number | string;
    prize_2_amount: number | string;
    prize_3_amount: number | string;
    draw_time: string;
  }

  export interface SavePrizePoolConfigParams {
    id?: number;
    daily_amount: number;
    prize_1_amount: number;
    prize_2_amount: number;
    prize_3_amount: number;
    draw_time: string;
  }

  export interface PrizePoolConfigListData {
    total: number;
    per_page: number;
    current_page: number;
    data: PrizePoolConfigItem[];
  }

  export interface ReqPrizePoolLogParams extends ReqPage {
    user_id?: number | string;
    prize_level?: number | string;
    status?: number | string;
    start_time?: string;
    end_time?: string;
  }

  export interface PrizePoolLogItem {
    id: number;
    user_id: number;
    user_name: string;
    prize_level: number;
    prize_amount: number | string;
    prize_date: string;
    create_time: string;
    status: number;
  }

  export interface PrizePoolLogListData {
    total: number;
    per_page: number;
    current_page: number;
    data: PrizePoolLogItem[];
  }

  export interface ReqLotteryPrizeParams extends ReqPage {
    id?: number | string;
    name?: string;
    type?: number | string;
    status?: number | string;
  }

  export interface LotteryPrizeItem {
    id: number;
    name: string;
    type: number;
    amount: number | string;
    probability: number | string;
    image?: string;
    status: number;
    create_time: string;
  }

  export interface SaveLotteryPrizeParams {
    id?: number;
    name: string;
    type: number;
    amount: number;
    probability: number;
    image?: string;
    status: number;
  }

  export interface DeleteParams {
    id: number;
  }

  export interface LotteryPrizeListData {
    total: number;
    per_page: number;
    current_page: number;
    data: LotteryPrizeItem[];
  }

  export interface ReqLotteryLogParams extends ReqPage {
    user_id?: number | string;
    prize_type?: number | string;
    start_time?: string;
    end_time?: string;
  }

  export interface LotteryLogItem {
    id: number;
    user_id: number;
    prize_id: number;
    prize_name: string;
    prize_type: number;
    amount: number | string;
    create_time: string;
    user_name?: string;
    nickname?: string;
    phone?: string;
  }

  export interface LotteryLogListData {
    total: number;
    per_page: number;
    current_page: number;
    data: LotteryLogItem[];
  }

  export interface ReqLotteryChanceParams extends ReqPage {
    user_id?: number | string;
    start_time?: string;
    end_time?: string;
  }

  export interface LotteryChanceItem {
    id: number;
    user_id: number;
    total_chance: number;
    used_chance: number;
    today_chance: number;
    rest_chance: number;
    last_spin_date?: string;
    update_time?: string;
    expire_time?: string;
    create_time?: string;
    user_name?: string;
    nickname?: string;
    phone?: string;
  }

  export interface LotteryChanceListData {
    total: number;
    per_page: number;
    current_page: number;
    data: LotteryChanceItem[];
  }
}

export namespace Coupon {
  export interface ReqParams extends ReqPage {
    user_id?: number | string;
    status?: number | string;
    type?: number | string;
    start_time?: string;
    end_time?: string;
  }

  export interface ResListItem {
    id: number;
    user_id: number;
    money: number | string;
    type: number;
    status: number;
    create_time: string;
    use_time?: string;
    exp_time: string;
    user_name?: string;
    nickname?: string;
    phone?: string;
  }

  export interface ResListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResListItem[];
  }

  export interface StatsParams {
    start_time?: string;
    end_time?: string;
  }

  export interface StatsData {
    total_count: number;
    user_count: number;
    used_count: number;
    unused_count: number;
    total_amount: number | string;
  }
}

export namespace RechargeVoucher {
  export interface ReqParams extends ReqPage {
    user_id?: number | string;
    recharge_id?: number | string;
    status?: number | string;
    start_time?: string;
    end_time?: string;
  }

  export interface ResListItem {
    id: number;
    user_id: number;
    recharge_id: number;
    voucher_image: string;
    amount: number | string;
    status: number;
    create_time: string;
    user_name?: string;
    nickname?: string;
    phone?: string;
  }

  export interface ResListData {
    total: number;
    per_page: number;
    current_page: number;
    data: ResListItem[];
  }

  export interface StatsParams {
    start_time?: string;
    end_time?: string;
  }

  export interface StatsData {
    total_count: number;
    user_count: number;
    pending_count: number;
    success_count: number;
    reject_count: number;
    total_amount: number | string;
  }
}

export namespace Content {
  export interface EmailReqParams extends ReqPage {
    user_id?: number | string;
    title?: string;
    is_send?: number | string;
    is_read?: number | string;
    start_time?: string;
    end_time?: string;
  }

  export interface EmailItem {
    id: number;
    user_id: number;
    title: string;
    content: string;
    is_send: number;
    is_read: number;
    send_time?: string;
    create_time: string;
    update_time?: string;
    user_name?: string;
    nickname?: string;
    phone?: string;
  }

  export interface EmailListData {
    total: number;
    per_page: number;
    current_page: number;
    data: EmailItem[];
  }

  export interface EmailSaveParams {
    id?: number;
    user_id: number;
    title: string;
    content: string;
    is_send?: number;
    is_read?: number;
    send_time?: string;
  }

  export interface EmailDeleteParams {
    id: number;
  }

  export interface NotificationReqParams extends ReqPage {
    uid?: number | string;
    title?: string;
    type?: number | string;
    is_read?: number | string;
    start_time?: string;
    end_time?: string;
  }

  export interface NotificationItem {
    id: number;
    uid: number;
    type: number;
    title: string;
    content: string;
    is_read: number;
    create_time: string;
    user_name?: string;
    nickname?: string;
    phone?: string;
  }

  export interface NotificationListData {
    total: number;
    per_page: number;
    current_page: number;
    data: NotificationItem[];
  }

  export interface NotificationSaveParams {
    id?: number;
    uid: number;
    type: number;
    title: string;
    content: string;
    is_read?: number;
  }

  export interface NotificationDeleteParams {
    id: number;
  }
}

export namespace Report {
  export interface DashboardOverviewParams {
    start_time?: string;
    end_time?: string;
  }

  export interface DashboardPendingItem {
    title: string;
    count: number;
    amount: number | string;
    type: string;
    description: string;
  }

  export interface DashboardCapital {
    platform_net_in_amount: number | string;
    user_balance_amount: number | string;
    freeze_amount: number | string;
    team_commission_amount: number | string;
    user_integral_amount: number | string;
    fund_gap_amount: number | string;
    recharge_withdraw_ratio: number | string;
    active_channel_count: number;
    online_user_count: number;
  }

  export interface DashboardUserTrendItem {
    date: string;
    register_count: number;
    first_recharge_count: number;
    first_invest_count: number;
  }

  export interface DashboardVipDistributionItem {
    name: string;
    value: number;
  }

  export interface DashboardFinanceTrendItem {
    date: string;
    recharge_amount: number | string;
    withdraw_amount: number | string;
    net_in_amount: number | string;
  }

  export interface DashboardChannelFlowItem {
    channel_name: string;
    recharge_amount: number | string;
    withdraw_amount: number | string;
    net_amount: number | string;
  }

  export interface DashboardOverviewData {
    updated_at: string;
    query_range: {
      start_time: string;
      end_time: string;
      compare_start_time: string;
      compare_end_time: string;
    };
    kpis: {
      today_recharge_amount: number | string;
      yesterday_recharge_amount: number | string;
      today_withdraw_amount: number | string;
      yesterday_withdraw_amount: number | string;
      today_fee_amount: number | string;
      yesterday_fee_amount: number | string;
      today_net_in_amount: number | string;
      yesterday_net_in_amount: number | string;
      today_register_count: number;
      yesterday_register_count: number;
      today_active_count: number;
      yesterday_active_count: number;
      today_first_recharge_count: number;
      yesterday_first_recharge_count: number;
      today_first_invest_count: number;
      yesterday_first_invest_count: number;
      today_income_claim_amount: number | string;
      yesterday_income_claim_amount: number | string;
      total_user_count: number;
      online_user_count: number;
      active_channel_count: number;
      user_balance_amount: number | string;
    };
    pending_items: DashboardPendingItem[];
    capital: DashboardCapital;
    user_growth: {
      today_register_count: number;
      today_active_count: number;
      today_first_recharge_count: number;
      today_first_invest_count: number;
      register_trend: DashboardUserTrendItem[];
      vip_distribution: DashboardVipDistributionItem[];
    };
    finance_trend: DashboardFinanceTrendItem[];
    channel_flow: DashboardChannelFlowItem[];
  }

  export interface PeriodStatsItem {
    total_count: number;
    total_amount: number | string;
    even_sign?: number;
    status?: number;
    money_type?: number;
    money_type_text?: string;
  }

  export interface SignReqParams extends ReqPage {
    user_id?: number | string;
    start_time?: string;
    end_time?: string;
  }

  export interface SignItem {
    id: number;
    user_id: number;
    reward_amount: number | string;
    even_sign: number;
    create_time: string;
    user_name?: string;
    nickname?: string;
    phone?: string;
  }

  export interface SignListData {
    total: number;
    per_page: number;
    current_page: number;
    data: SignItem[];
  }

  export interface SignStatsData {
    sign_user_count: number;
    gift_amount: number | string;
    record_count: number;
    reward_breakdown: PeriodStatsItem[];
  }

  export interface SalaryReqParams extends ReqPage {
    user_id?: number | string;
    status?: number | string;
    claim_month?: string;
    start_time?: string;
    end_time?: string;
  }

  export interface SalaryItem {
    id: number;
    user_id: number;
    team_recharge_amount: number | string;
    reward_amount: number | string;
    claim_month: string;
    create_time: string;
    status: number;
    user_name?: string;
    nickname?: string;
    phone?: string;
  }

  export interface SalaryListData {
    total: number;
    per_page: number;
    current_page: number;
    data: SalaryItem[];
  }

  export interface SalaryStatsData {
    salary_user_count: number;
    gift_amount: number | string;
    team_recharge_amount: number | string;
    record_count: number;
    reward_breakdown: PeriodStatsItem[];
  }

  export interface CommissionReqParams extends ReqPage {
    user_id?: number | string;
    money_type?: number | string;
    is_add_to_user_account?: number | string;
    sub_id?: number | string;
    start_time?: string;
    end_time?: string;
  }

  export interface CommissionItem {
    id: number;
    user_id: number;
    money_amount: number | string;
    money_type: number;
    money_type_text: string;
    is_add_to_user_account: number;
    remark: string;
    user_name: string;
    create_time: string;
    update_time?: string;
    product_id?: number;
    product_lev?: number;
    sub_id?: number;
    nickname?: string;
    phone?: string;
    sub_user_name?: string;
    sub_nickname?: string;
    sub_phone?: string;
  }

  export interface CommissionListData {
    total: number;
    per_page: number;
    current_page: number;
    data: CommissionItem[];
  }

  export interface CommissionStatsData {
    commission_user_count: number;
    gift_amount: number | string;
    record_count: number;
    reward_breakdown: PeriodStatsItem[];
  }

  export interface FinanceSummaryReqParams {
    start_time?: string;
    end_time?: string;
  }

  export interface FinanceChannelStatsItem {
    channel_name: string;
    total_count: number;
    total_amount: number | string;
  }

  export interface FinanceMoneyTypeStatsItem {
    money_type: number;
    type: number;
    total_count: number;
    total_amount: number | string;
  }

  export interface FinanceSummaryData {
    recharge_total_count: number;
    recharge_success_count: number;
    recharge_success_amount: number | string;
    recharge_pending_count: number;
    withdraw_total_count: number;
    withdraw_success_count: number;
    withdraw_success_amount: number | string;
    withdraw_pending_count: number;
    net_in_amount: number | string;
    money_total_count: number;
    money_income_amount: number | string;
    money_expense_amount: number | string;
    balance_income_amount: number | string;
    balance_expense_amount: number | string;
    integral_income_amount: number | string;
    integral_expense_amount: number | string;
    recharge_channel_breakdown: FinanceChannelStatsItem[];
    withdraw_channel_breakdown: FinanceChannelStatsItem[];
    money_type_breakdown: FinanceMoneyTypeStatsItem[];
  }
}
