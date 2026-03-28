export interface User {
  id: number
  user_name: string
  nickname: string
  phone: string
  money_balance: number
  level_vip: number
  agent_level: number
}

export interface Product {
  id: number
  goods_name: string
  goods_money: number
  revenue_lv: number
  period: number
  day_red: number
  total_money: number
}

export interface Order {
  id: number
  user_id: number
  goods_id: number
  goods_name: string
  goods_money: number
  total_red_money: number
  already_red_money: number
  create_time: string
}

export interface Income {
  id: number
  user_id: number
  claim_amount: number
  status: number
  expire_time: string
  create_time: string
}

export interface TeamMember {
  id: number
  user_name: string
  phone: string
  total_recharge: number
  level: number
}
