import { formatCurrency } from "@/utils";

export interface VipLevelItem {
  id: number;
  vip: number;
  experience: number;
  reward_money: number;
  buy_goods_id: number;
  buy_goods_num: number;
  team_total_recharge: number;
  one_time_reward: number;
  commission_rate: number;
  reward_days: number;
}

export interface WeeklyTaskItem {
  id: number;
  level: string;
  task_name: string;
  required_invites: number;
  reward_amount: number;
  active_users: number;
  completed_users: number;
  claimed_users: number;
  status: number;
}

export interface PrizePoolSetting {
  enabled: boolean;
  open_time: string;
  time_range: string;
  activity_days: string;
  display_rule: string;
  note: string;
}

export interface PrizePoolParticipant {
  id: number;
  user_id: number;
  phone: string;
  product_value: number;
  joined_at: string;
  winner: boolean;
}

export interface PrizePoolHistory {
  id: number;
  date: string;
  prize_amount: number;
  real_users: number;
  display_users: number;
  status: string;
}

export interface LotterySetting {
  enabled: boolean;
  start_date: string;
  reset_time: string;
}

export interface LotteryRechargeTier {
  id: number;
  min_amount: number;
  max_amount: number;
  chance_count: number;
}

export interface LotteryPrizeItem {
  id: number;
  name: string;
  amount: number;
  probability: number;
  type: 1 | 2;
  status: 0 | 1;
}

export interface LotteryUsageItem {
  id: number;
  date: string;
  prize_count: number;
  prize_amount: number;
  lottery_users: number;
  lottery_times: number;
  recharge_bonus_amount: number;
  recharge_bonus_times: number;
}

export interface CommissionLogItem {
  id: number;
  user_name: string;
  vip_level: number;
  reward_type: string;
  reward_amount: number;
  create_time: string;
}

export const cloneBusinessData = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export const defaultVipLevels: VipLevelItem[] = [
  {
    id: 1,
    vip: 1,
    experience: 0,
    reward_money: 50,
    buy_goods_id: 2,
    buy_goods_num: 2,
    team_total_recharge: 100,
    one_time_reward: 6,
    commission_rate: 1,
    reward_days: 60
  },
  {
    id: 2,
    vip: 2,
    experience: 0,
    reward_money: 80,
    buy_goods_id: 3,
    buy_goods_num: 2,
    team_total_recharge: 500,
    one_time_reward: 30,
    commission_rate: 2,
    reward_days: 90
  },
  {
    id: 3,
    vip: 3,
    experience: 0,
    reward_money: 120,
    buy_goods_id: 4,
    buy_goods_num: 2,
    team_total_recharge: 2500,
    one_time_reward: 150,
    commission_rate: 3,
    reward_days: 120
  },
  {
    id: 4,
    vip: 4,
    experience: 0,
    reward_money: 160,
    buy_goods_id: 5,
    buy_goods_num: 2,
    team_total_recharge: 7500,
    one_time_reward: 450,
    commission_rate: 4,
    reward_days: 150
  },
  {
    id: 5,
    vip: 5,
    experience: 0,
    reward_money: 200,
    buy_goods_id: 6,
    buy_goods_num: 2,
    team_total_recharge: 15000,
    one_time_reward: 900,
    commission_rate: 6,
    reward_days: 180
  },
  {
    id: 6,
    vip: 6,
    experience: 0,
    reward_money: 240,
    buy_goods_id: 7,
    buy_goods_num: 2,
    team_total_recharge: 30000,
    one_time_reward: 1800,
    commission_rate: 8,
    reward_days: 240
  },
  {
    id: 7,
    vip: 7,
    experience: 0,
    reward_money: 280,
    buy_goods_id: 8,
    buy_goods_num: 2,
    team_total_recharge: 50000,
    one_time_reward: 3000,
    commission_rate: 12,
    reward_days: 300
  }
];

export const defaultCommissionRates = {
  level1: 10,
  level2: 3,
  level3: 2
};

export const defaultCommissionLogs: CommissionLogItem[] = [
  {
    id: 1,
    user_name: "market_001",
    vip_level: 4,
    reward_type: "一级返现",
    reward_amount: 120,
    create_time: "2026-03-25 14:20:00"
  },
  {
    id: 2,
    user_name: "market_002",
    vip_level: 6,
    reward_type: "二级返现",
    reward_amount: 66,
    create_time: "2026-03-25 15:30:00"
  },
  { id: 3, user_name: "market_003", vip_level: 7, reward_type: "三级返现", reward_amount: 30, create_time: "2026-03-26 09:10:00" }
];

export const defaultVipDailyReward = {
  vip0Amount: 1,
  rewardDays: 30
};

export const defaultWeeklySettings = {
  enabled: true,
  weekRange: "2026-03-23 00:00:00 ~ 2026-03-30 00:00:00",
  timezone: "UTC-5"
};

export const defaultWeeklyTasks: WeeklyTaskItem[] = [
  {
    id: 1,
    level: "Lv1",
    task_name: "邀请 1 人",
    required_invites: 1,
    reward_amount: 3,
    active_users: 0,
    completed_users: 0,
    claimed_users: 0,
    status: 1
  },
  {
    id: 2,
    level: "Lv2",
    task_name: "邀请 3 人",
    required_invites: 3,
    reward_amount: 10,
    active_users: 2,
    completed_users: 1,
    claimed_users: 1,
    status: 1
  },
  {
    id: 3,
    level: "Lv3",
    task_name: "邀请 6 人",
    required_invites: 6,
    reward_amount: 20,
    active_users: 5,
    completed_users: 2,
    claimed_users: 1,
    status: 1
  },
  {
    id: 4,
    level: "Lv4",
    task_name: "邀请 9 人",
    required_invites: 9,
    reward_amount: 30,
    active_users: 9,
    completed_users: 4,
    claimed_users: 3,
    status: 1
  },
  {
    id: 5,
    level: "Lv5",
    task_name: "邀请 15 人",
    required_invites: 15,
    reward_amount: 50,
    active_users: 15,
    completed_users: 6,
    claimed_users: 4,
    status: 1
  }
];

export const defaultPrizePoolSetting: PrizePoolSetting = {
  enabled: false,
  open_time: "18:00",
  time_range: "00:00 - 16:00",
  activity_days: "周二、周五",
  display_rule: "展示人数 = 真实人数 + 虚假人数",
  note: "以上时间规则由后端任务固定执行"
};

export const defaultPrizePoolParticipants: PrizePoolParticipant[] = [
  { id: 1, user_id: 1024, phone: "+51 900100001", product_value: 120, joined_at: "2026-03-24 10:15:00", winner: false },
  { id: 2, user_id: 1033, phone: "+51 900100233", product_value: 320, joined_at: "2026-03-24 11:36:00", winner: true },
  { id: 3, user_id: 1088, phone: "+51 900100888", product_value: 520, joined_at: "2026-03-24 12:18:00", winner: false }
];

export const defaultPrizePoolHistory: PrizePoolHistory[] = [
  { id: 1, date: "2026-03-17", prize_amount: 688, real_users: 12, display_users: 28, status: "已开奖" },
  { id: 2, date: "2026-03-21", prize_amount: 888, real_users: 18, display_users: 36, status: "已开奖" },
  { id: 3, date: "2026-03-24", prize_amount: 0, real_users: 3, display_users: 3, status: "待开奖" }
];

export const defaultLotterySetting: LotterySetting = {
  enabled: false,
  start_date: "2026-01-01",
  reset_time: "次月 1 日 0:00"
};

export const defaultLotteryTiers: LotteryRechargeTier[] = [
  { id: 1, min_amount: 50, max_amount: 100, chance_count: 1 },
  { id: 2, min_amount: 120, max_amount: 300, chance_count: 3 },
  { id: 3, min_amount: 600, max_amount: 1200, chance_count: 6 },
  { id: 4, min_amount: 2500, max_amount: 5000, chance_count: 10 }
];

export const defaultLotteryPrizes: LotteryPrizeItem[] = [
  { id: 1, name: formatCurrency(10), amount: 10, probability: 10, type: 1, status: 1 },
  { id: 2, name: formatCurrency(20), amount: 20, probability: 30, type: 1, status: 1 },
  { id: 3, name: formatCurrency(40), amount: 40, probability: 25, type: 1, status: 1 },
  { id: 4, name: formatCurrency(60), amount: 60, probability: 15, type: 1, status: 1 },
  { id: 5, name: "智能手表", amount: 0, probability: 8, type: 2, status: 1 },
  { id: 6, name: "充电宝", amount: 0, probability: 7, type: 2, status: 1 },
  { id: 7, name: formatCurrency(100), amount: 100, probability: 5, type: 1, status: 1 }
];

export const defaultLotteryUsage: LotteryUsageItem[] = [
  {
    id: 1,
    date: "2026-03-20",
    prize_count: 2,
    prize_amount: 60,
    lottery_users: 18,
    lottery_times: 38,
    recharge_bonus_amount: 0,
    recharge_bonus_times: 8
  },
  {
    id: 2,
    date: "2026-03-21",
    prize_count: 3,
    prize_amount: 120,
    lottery_users: 22,
    lottery_times: 41,
    recharge_bonus_amount: 0,
    recharge_bonus_times: 10
  },
  {
    id: 3,
    date: "2026-03-22",
    prize_count: 1,
    prize_amount: 20,
    lottery_users: 9,
    lottery_times: 12,
    recharge_bonus_amount: 0,
    recharge_bonus_times: 3
  }
];
