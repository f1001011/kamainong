export interface HoneywellMetric {
  label: string
  value: string
  tone?: 'default' | 'accent'
}

export interface HoneywellCard {
  title: string
  body: string
  badge?: string
  value?: string
  to?: string
}

export interface HoneywellField {
  label: string
  placeholder: string
  note?: string
}

export interface HoneywellRecord {
  title: string
  value: string
  meta?: string
}

export interface HoneywellPageConfig {
  kicker: string
  title: string
  description: string
  metrics?: HoneywellMetric[]
  cards?: HoneywellCard[]
  fields?: HoneywellField[]
  records?: HoneywellRecord[]
  primaryAction?: { label: string; to?: string }
  secondaryAction?: { label: string; to?: string }
}

const formPage = (
  kicker: string,
  title: string,
  description: string,
  fields: HoneywellField[],
  primaryAction: { label: string; to?: string },
  secondaryAction?: { label: string; to?: string }
): HoneywellPageConfig => ({ kicker, title, description, fields, primaryAction, secondaryAction })

const detailPage = (
  kicker: string,
  title: string,
  description: string,
  metrics: HoneywellMetric[],
  records: HoneywellRecord[],
  primaryAction?: { label: string; to?: string }
): HoneywellPageConfig => ({ kicker, title, description, metrics, records, primaryAction })

const listPage = (
  kicker: string,
  title: string,
  description: string,
  cards: HoneywellCard[],
  primaryAction?: { label: string; to?: string },
  metrics?: HoneywellMetric[]
): HoneywellPageConfig => ({ kicker, title, description, cards, primaryAction, metrics })

const recordPage = (
  kicker: string,
  title: string,
  description: string,
  records: HoneywellRecord[],
  primaryAction?: { label: string; to?: string }
): HoneywellPageConfig => ({ kicker, title, description, records, primaryAction })

export const honeywellPageConfigs: Record<string, HoneywellPageConfig> = {
  ProductDetail: detailPage(
    'Product Detail',
    '产品详情 #{id}',
    '以 Honeywell 的产品详情节奏重建：重点展示收益、周期和购买入口。',
    [
      { label: '周期', value: '30 天' },
      { label: '日收益', value: '8.20', tone: 'accent' },
      { label: '可购买', value: '5 次' },
    ],
    [
      { title: '总价', value: '998.00', meta: '按当前配置展示' },
      { title: '收益模型', value: '固定收益 + 到期返本', meta: '与 Honeywell 产品页一致的摘要结构' },
      { title: '说明', value: '可在后续阶段接入真实产品详情 API 并替换占位内容。' },
    ],
    { label: '立即购买', to: '/recharge' }
  ),
  Activities: listPage(
    'Activity Center',
    '活动中心',
    '集中展示 Honeywell 的活动卡片矩阵，保持轻量但有层次的卡片密度。',
    [
      { title: 'Weekly Salary', body: '周薪奖励进度与条件。', badge: '01', to: '/activities/weekly-salary' },
      { title: 'SVIP Program', body: 'SVIP 奖励与升级计划。', badge: '02', to: '/activities/svip' },
      { title: 'Spin Wheel', body: '幸运转盘与抽奖入口。', badge: '03', to: '/activities/spin-wheel' },
      { title: 'Prize Pool', body: '奖池活动和每日奖励。', badge: '04', to: '/activities/prize-pool' },
      { title: 'Invite', body: '邀请活动入口。', badge: '05', to: '/activities/invite' },
      { title: 'Invite Reward', body: '邀请达标奖励卡。', badge: '06', to: '/activities/invite-reward' },
      { title: 'Collection Bonus', body: '连单奖励的进度总览。', badge: '07', to: '/activities/collection' },
    ],
    { label: '返回首页', to: '/' },
    [
      { label: '活动数量', value: '7' },
      { label: '进行中', value: '5', tone: 'accent' },
      { label: '奖励类型', value: '多层级' },
    ]
  ),
  ActivityWeeklySalary: detailPage(
    'Weekly Salary',
    '周薪活动',
    '围绕 Honeywell 的奖励节奏，提供阶段目标、领取状态和说明。',
    [
      { label: '当前进度', value: '4 / 7' },
      { label: '本周奖励', value: '120.00', tone: 'accent' },
      { label: '状态', value: '进行中' },
    ],
    [
      { title: '阶段一', value: '完成 3 天签到', meta: '已完成' },
      { title: '阶段二', value: '完成 5 天签到', meta: '处理中' },
      { title: '阶段三', value: '完成 7 天签到', meta: '待解锁' },
    ],
    { label: '查看活动中心', to: '/activities' }
  ),
  ActivitySvip: detailPage(
    'SVIP',
    'SVIP 奖励计划',
    '保留 Honeywell 风格的高等级奖励说明与分层结构。',
    [
      { label: '当前等级', value: 'SVIP 2' },
      { label: '专属奖励', value: '680.00', tone: 'accent' },
      { label: '升级差额', value: '320.00' },
    ],
    [
      { title: '等级权益', value: '更高收益系数', meta: '含推荐奖励' },
      { title: '升级条件', value: '累计投资达到门槛', meta: '按后台配置为准' },
      { title: '说明', value: '本页后续可接入 SVIP 详情接口。' },
    ],
    { label: '返回活动', to: '/activities' }
  ),
  ActivitySpinWheel: detailPage(
    'Spin Wheel',
    '幸运转盘',
    '重建 Honeywell 的活动详情入口，为后续接入抽奖逻辑留出位置。',
    [
      { label: '剩余次数', value: '2' },
      { label: '最高奖励', value: '500.00', tone: 'accent' },
      { label: '状态', value: '可参与' },
    ],
    [
      { title: '参与条件', value: '完成指定任务解锁次数' },
      { title: '奖励范围', value: '现金 / 优惠 / 积分' },
      { title: '提示', value: '后续可替换成完整转盘交互。' },
    ],
    { label: '去活动中心', to: '/activities' }
  ),
  ActivityPrizePool: detailPage(
    'Prize Pool',
    '奖池活动',
    '展示每日奖池、参与人数和当前可领取额度。',
    [
      { label: '今日奖池', value: '3000.00', tone: 'accent' },
      { label: '参与人数', value: '128' },
      { label: '我的份额', value: '36.00' },
    ],
    [
      { title: '分发时间', value: '每天 05:00', meta: 'Asia/Shanghai' },
      { title: '规则', value: '按活动规则自动结算' },
      { title: '备注', value: '当前为 Vue 迁移版展示页。' },
    ],
    { label: '查看所有活动', to: '/activities' }
  ),
  ActivityInvite: detailPage(
    'Invite',
    '邀请活动',
    '以 Honeywell 的邀请活动结构展示目标、奖励和达成进度。',
    [
      { label: '有效邀请', value: '9' },
      { label: '下一目标', value: '12', tone: 'accent' },
      { label: '累计奖励', value: '210.00' },
    ],
    [
      { title: '邀请方式', value: '分享注册链接或邀请码' },
      { title: '达标条件', value: '受邀用户完成首充' },
      { title: '提示', value: '后续可接入邀请详情接口。' },
    ],
    { label: '查看邀请奖励', to: '/activities/invite-reward' }
  ),
  ActivityInviteReward: detailPage(
    'Invite Reward',
    '邀请奖励',
    '分层奖励页，突出里程碑式奖励与下一档目标。',
    [
      { label: '当前档位', value: 'Tier 2' },
      { label: '待领取', value: '88.00', tone: 'accent' },
      { label: '下一档', value: '15 人' },
    ],
    [
      { title: 'Tier 1', value: '邀请 5 人', meta: '已领取' },
      { title: 'Tier 2', value: '邀请 10 人', meta: '可领取' },
      { title: 'Tier 3', value: '邀请 15 人', meta: '未达成' },
    ],
    { label: '返回邀请活动', to: '/activities/invite' }
  ),
  ActivityCollection: detailPage(
    'Collection Bonus',
    '连单奖励',
    '使用 Honeywell 的奖励进度结构，强调已购产品数量和奖励层级。',
    [
      { label: '已购产品', value: '3' },
      { label: '下一层级', value: '5', tone: 'accent' },
      { label: '累计奖励', value: '66.00' },
    ],
    [
      { title: '第一层', value: '连续购买 3 个产品', meta: '已完成' },
      { title: '第二层', value: '连续购买 5 个产品', meta: '进行中' },
      { title: '第三层', value: '连续购买 8 个产品', meta: '未解锁' },
    ],
    { label: '回到活动中心', to: '/activities' }
  ),
  BankCards: recordPage(
    'Bank Cards',
    '银行卡',
    '列表页保留 Honeywell 的轻卡片和金融管理语气。',
    [
      { title: 'ICBC', value: '**** 3345', meta: '默认收款卡' },
      { title: 'ABC', value: '**** 1028', meta: '备用提现卡' },
    ],
    { label: '新增银行卡', to: '/bank-cards/add' }
  ),
  BankCardAdd: formPage(
    'Add Card',
    '新增银行卡',
    '表单结构遵循 Honeywell 的轻量输入编排。',
    [
      { label: '开户行', placeholder: '请输入银行名称' },
      { label: '持卡人', placeholder: '请输入真实姓名' },
      { label: '银行卡号', placeholder: '请输入完整卡号' },
    ],
    { label: '保存银行卡', to: '/bank-cards' },
    { label: '取消', to: '/bank-cards' }
  ),
  Community: listPage(
    'Community',
    '社区广场',
    '用 Honeywell 的内容流方式重新组织帖子、互动和发帖入口。',
    [
      { title: '收益分享', body: '查看用户晒单与评论。', badge: 'POST', to: '/community/101' },
      { title: '热门话题', body: '围绕投资体验和社区互动。', badge: 'HOT', to: '/community/102' },
      { title: '创建帖子', body: '发布新的社区内容。', badge: 'NEW', to: '/community/create' },
    ],
    { label: '我的帖子', to: '/community/my' }
  ),
  CommunityMy: recordPage(
    'My Community',
    '我的帖子',
    '保留 Honeywell 中个人内容管理的入口感。',
    [
      { title: '帖子 #101', value: '收益更新', meta: '3 条评论' },
      { title: '帖子 #102', value: '活动心得', meta: '8 个赞' },
    ],
    { label: '继续发帖', to: '/community/create' }
  ),
  CommunityCreate: formPage(
    'Create Post',
    '发布帖子',
    '创建页以 Honeywell 的轻表单样式为基础。',
    [
      { label: '标题', placeholder: '输入帖子标题' },
      { label: '正文', placeholder: '分享你的投资体验或活动心得' },
    ],
    { label: '提交帖子', to: '/community' },
    { label: '返回广场', to: '/community' }
  ),
  CommunityDetail: detailPage(
    'Community Detail',
    '社区帖子 #{id}',
    '帖子详情页承接 Honeywell 的讨论感与评论层次。',
    [
      { label: '点赞', value: '28' },
      { label: '评论', value: '7', tone: 'accent' },
      { label: '收藏', value: '4' },
    ],
    [
      { title: '作者', value: '社区用户 A', meta: '2 小时前' },
      { title: '摘要', value: '围绕当前收益和风险控制的个人分享。' },
      { title: '评论提示', value: '后续可接入真实评论流。' },
    ],
    { label: '返回社区', to: '/community' }
  ),
  GiftCode: formPage(
    'Gift Code',
    '礼包码',
    'Gift Code 页面保留 Honeywell 的功能直达感。',
    [
      { label: '礼包码', placeholder: '输入兑换码' },
    ],
    { label: '立即兑换' }
  ),
  Messages: recordPage(
    'Messages',
    '消息中心',
    '以列表卡片呈现系统消息和操作通知。',
    [
      { title: '系统公告', value: '关于活动规则更新', meta: '今天' },
      { title: '到账通知', value: '充值已成功到账', meta: '昨天' },
      { title: '审核状态', value: '提现申请处理中', meta: '2 天前' },
    ],
    { label: '查看第一条', to: '/messages/101' }
  ),
  MessageDetail: detailPage(
    'Message Detail',
    '消息详情 #{id}',
    '消息详情页保持 Honeywell 的清爽阅读层次。',
    [
      { label: '类型', value: '系统消息' },
      { label: '状态', value: '已读', tone: 'accent' },
      { label: '时间', value: '2026-03-24' },
    ],
    [
      { title: '主题', value: '平台规则更新提醒' },
      { title: '摘要', value: '关于收益展示、活动参与和账户安全的一次统一更新。' },
      { title: '后续', value: '如需操作，可前往对应页面继续处理。' },
    ],
    { label: '返回消息中心', to: '/messages' }
  ),
  Positions: recordPage(
    'Positions',
    '持仓列表',
    '重建 Honeywell 的持仓页，突出收益和状态。',
    [
      { title: '持仓 #201', value: 'Product A', meta: '进行中' },
      { title: '持仓 #202', value: 'Product B', meta: '已完成' },
    ],
    { label: '查看持仓详情', to: '/positions/201' }
  ),
  PositionDetail: detailPage(
    'Position Detail',
    '持仓详情 #{id}',
    '以 Honeywell 的数字信息卡形式展示投资详情。',
    [
      { label: '状态', value: '进行中' },
      { label: '今日收益', value: '12.00', tone: 'accent' },
      { label: '已返收益', value: '88.00' },
    ],
    [
      { title: '产品名称', value: 'Architectural Growth Plan' },
      { title: '买入时间', value: '2026-03-21 11:00' },
      { title: '说明', value: '后续可接入真实持仓明细接口。' },
    ],
    { label: '返回持仓列表', to: '/positions' }
  ),
  AppDownload: listPage(
    'App Download',
    'APP 下载',
    '保留 Honeywell 下载页的分发感与渠道说明。',
    [
      { title: 'Android APK', body: '适合直接安装的移动端版本。', badge: 'APK' },
      { title: 'iOS Guide', body: '适合 Safari 添加到主屏幕的访问指引。', badge: 'iOS' },
      { title: 'Web Fallback', body: '也可以继续通过 Web 访问所有核心流程。', badge: 'WEB' },
    ],
    { label: '返回个人中心', to: '/profile' }
  ),
  Recharge: formPage(
    'Recharge',
    '充值',
    '充值页采用 Honeywell 的简化金融表单结构。',
    [
      { label: '充值金额', placeholder: '输入金额', note: '遵循后台最小充值规则' },
      { label: '付款方式', placeholder: '选择充值渠道' },
      { label: '备注', placeholder: '可选：填写附加说明' },
    ],
    { label: '提交充值' },
    { label: '查看记录', to: '/recharge/records' }
  ),
  RechargeRecords: recordPage(
    'Recharge Records',
    '充值记录',
    '保留 Honeywell 的记录列表密度与状态感。',
    [
      { title: '订单 #R001', value: '500.00', meta: '已完成' },
      { title: '订单 #R002', value: '1200.00', meta: '审核中' },
    ],
    { label: '查看记录详情', to: '/recharge/records/1' }
  ),
  RechargeRecordDetail: detailPage(
    'Recharge Detail',
    '充值详情 #{id}',
    '详情页用于展示打款信息、状态与审核说明。',
    [
      { label: '金额', value: '500.00' },
      { label: '状态', value: '已完成', tone: 'accent' },
      { label: '渠道', value: 'Bank Transfer' },
    ],
    [
      { title: '提交时间', value: '2026-03-22 09:20' },
      { title: '审核说明', value: '平台已确认到账。' },
      { title: '凭证', value: '后续可接入上传截图与查看详情。' },
    ],
    { label: '返回充值记录', to: '/recharge/records' }
  ),
  Security: listPage(
    'Security',
    '安全中心',
    '安全页承接 Honeywell 的账户保护与认证入口。',
    [
      { title: '登录密码', body: '修改当前登录密码。', badge: 'PWD', to: '/security/password' },
      { title: '设备管理', body: '查看登录设备与风险提示。', badge: 'SAFE' },
      { title: '验证状态', body: '手机号、支付密码与身份校验。', badge: 'CHECK' },
    ],
    { label: '前往设置安全', to: '/settings/security' }
  ),
  SecurityPassword: formPage(
    'Security Password',
    '修改安全密码',
    '作为 Honeywell 安全流程的一部分，此页采用简洁三字段布局。',
    [
      { label: '当前密码', placeholder: '请输入当前密码' },
      { label: '新密码', placeholder: '请输入新密码' },
      { label: '确认密码', placeholder: '再次输入新密码' },
    ],
    { label: '保存密码', to: '/security' },
    { label: '取消', to: '/security' }
  ),
  Settings: listPage(
    'Settings',
    '设置中心',
    '用 Honeywell 的设置页分发结构组织二级入口。',
    [
      { title: '密码设置', body: '登录密码与支付密码管理。', badge: 'PWD', to: '/settings/password' },
      { title: '安全设置', body: '安全策略与验证方式。', badge: 'SAFE', to: '/settings/security' },
      { title: '语言与偏好', body: '更多通用应用设置。', badge: 'PREF' },
    ],
    { label: '前往个人中心', to: '/profile' }
  ),
  SettingsPassword: formPage(
    'Settings Password',
    '设置密码',
    '延续 Honeywell 的毛玻璃 + 清晰输入字段的设置体验。',
    [
      { label: '当前密码', placeholder: '请输入当前密码' },
      { label: '新密码', placeholder: '请输入新密码' },
      { label: '确认新密码', placeholder: '再次输入新密码' },
    ],
    { label: '确认修改', to: '/settings' },
    { label: '返回设置', to: '/settings' }
  ),
  SettingsSecurity: listPage(
    'Settings Security',
    '安全设置',
    '二级安全设置页用于放置更多系统开关与校验入口。',
    [
      { title: '手机号验证', body: '确认绑定手机号状态。', badge: 'SMS' },
      { title: '支付验证', body: '查看支付验证方式。', badge: 'PAY' },
      { title: '登录保护', body: '异常登录提醒与设备校验。', badge: 'AUTH' },
    ],
    { label: '返回设置', to: '/settings' }
  ),
  Team: listPage(
    'Team',
    '团队中心',
    '团队页延续 Honeywell 的指标优先设计，强调邀请和佣金。',
    [
      { title: '一级团队', body: '查看直属成员表现。', value: '12' },
      { title: '二级团队', body: '查看二级裂变数据。', value: '28' },
      { title: '三级团队', body: '查看三级团队规模。', value: '56' },
    ],
    { label: '查看活动', to: '/activities' },
    [
      { label: '总成员', value: '96' },
      { label: '今日佣金', value: '66.00', tone: 'accent' },
      { label: '本月佣金', value: '820.00' },
    ]
  ),
  Transactions: recordPage(
    'Transactions',
    '交易记录',
    '列表记录页用于承接收支流水、收益结算与奖励发放。',
    [
      { title: '收益发放', value: '+12.00', meta: '今天' },
      { title: '充值到账', value: '+500.00', meta: '昨天' },
      { title: '提现申请', value: '-200.00', meta: '处理中' },
    ]
  ),
  Withdraw: formPage(
    'Withdraw',
    '提现',
    '提现页在 Vue 中采用 Honeywell 的安静金融表单风格。',
    [
      { label: '提现金额', placeholder: '输入提现金额' },
      { label: '到账银行卡', placeholder: '选择银行卡' },
      { label: '资金密码', placeholder: '输入资金密码' },
    ],
    { label: '提交提现' },
    { label: '查看提现记录', to: '/withdraw/records' }
  ),
  WithdrawRecords: recordPage(
    'Withdraw Records',
    '提现记录',
    '记录页保留 Honeywell 的审批状态和金额层次。',
    [
      { title: '订单 #W001', value: '200.00', meta: '处理中' },
      { title: '订单 #W002', value: '120.00', meta: '已完成' },
    ],
    { label: '查看记录详情', to: '/withdraw/records/1' }
  ),
  WithdrawRecordDetail: detailPage(
    'Withdraw Detail',
    '提现详情 #{id}',
    '详情页用于展示 Honeywell 的提现状态、时间和审核说明。',
    [
      { label: '金额', value: '200.00' },
      { label: '状态', value: '处理中', tone: 'accent' },
      { label: '方式', value: 'Bank Card' },
    ],
    [
      { title: '提交时间', value: '2026-03-24 10:30' },
      { title: '审核说明', value: '预计 1-2 个工作日内处理。' },
      { title: '提示', value: '后续可接入真实提现详情接口。' },
    ],
    { label: '返回提现记录', to: '/withdraw/records' }
  ),
}
