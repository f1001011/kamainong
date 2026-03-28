<template>
  <div class="dashboard-page" v-loading="loading">
    <section class="dashboard-hero">
      <div>
        <p class="hero-tag">CONSOLE</p>
        <h2>{{ greeting }}，控制台总览</h2>
        <p class="hero-desc">集中查看充值、提现、用户增长、通道流向和资金健康度，方便你先看盘再处理后台事务。</p>
      </div>
      <div class="hero-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          unlink-panels
          class="hero-date-picker"
        />
        <div class="hero-action-row">
          <el-button @click="resetDateRange">重置为今天</el-button>
          <el-button type="primary" @click="fetchOverview">查询</el-button>
        </div>
        <div class="update-time">最后更新：{{ overview.updated_at || "--" }}</div>
        <div class="compare-tip">
          对比区间：{{ formatRangeText(overview.query_range.compare_start_time, overview.query_range.compare_end_time) }}
        </div>
      </div>
    </section>

    <section class="kpi-grid">
      <article v-for="card in kpiCards" :key="card.key" class="kpi-card">
        <div class="kpi-head">
          <div class="kpi-icon" :style="{ background: card.iconBg, color: card.iconColor }">
            <el-icon><component :is="card.icon" /></el-icon>
          </div>
          <span class="kpi-title">{{ card.title }}</span>
        </div>
        <strong class="kpi-value">{{ card.value }}</strong>
        <div class="kpi-foot">
          <span class="kpi-compare">{{ card.compare }}</span>
          <span :class="['kpi-change', card.changeClass]">{{ card.change }}</span>
        </div>
      </article>
    </section>

    <section class="pending-card">
      <div class="section-title">
        <div>
          <h3>待处理事项</h3>
          <p>把真正需要你盯的单子和风险先挑出来。</p>
        </div>
      </div>
      <div class="pending-grid">
        <article v-for="item in overview.pending_items" :key="item.title" :class="['pending-item', item.type]">
          <div class="pending-title">{{ item.title }}</div>
          <div class="pending-main">
            <strong>{{ item.count }}</strong>
            <span>{{ formatCurrency(item.amount) }}</span>
          </div>
          <p>{{ item.description }}</p>
        </article>
      </div>
    </section>

    <section class="panel-grid">
      <article class="panel-card">
        <div class="section-title">
          <div>
            <h3>资金健康度</h3>
            <p>平台净入金、用户余额和资金缺口一屏看清。</p>
          </div>
        </div>
        <div class="capital-grid">
          <div v-for="item in capitalCards" :key="item.label" class="capital-item">
            <span>{{ item.label }}</span>
            <strong :class="{ danger: item.danger }">{{ item.value }}</strong>
          </div>
        </div>
        <div class="chart-block">
          <h4>近 14 天资金趋势</h4>
          <ECharts :option="financeTrendOption" :height="300" />
        </div>
      </article>

      <article class="panel-card">
        <div class="section-title">
          <div>
            <h3>用户增长</h3>
            <p>注册、首充、首投和 VIP 分布同时展示。</p>
          </div>
        </div>
        <div class="growth-grid">
          <div v-for="item in growthCards" :key="item.label" class="growth-item">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
        <div class="double-chart">
          <div class="chart-pane">
            <h4>近 30 天新增趋势</h4>
            <ECharts :option="userTrendOption" :height="300" />
          </div>
          <div class="chart-pane">
            <h4>VIP 分布</h4>
            <ECharts :option="vipPieOption" :height="300" />
          </div>
        </div>
      </article>
    </section>

    <section class="panel-card">
      <div class="section-title">
        <div>
          <h3>通道流向</h3>
          <p>按今日充值/提现净额排序，优先定位流出过大的通道。</p>
        </div>
      </div>
      <div class="channel-layout">
        <div class="channel-chart">
          <ECharts :option="channelFlowOption" :height="340" />
        </div>
        <div class="channel-table">
          <div class="table-head">
            <span>通道</span>
            <span>充值</span>
            <span>提现</span>
            <span>净额</span>
          </div>
          <div v-for="item in overview.channel_flow" :key="item.channel_name" class="table-row">
            <span>{{ item.channel_name }}</span>
            <span>{{ formatCurrency(item.recharge_amount) }}</span>
            <span>{{ formatCurrency(item.withdraw_amount) }}</span>
            <span :class="{ danger: Number(item.net_amount) < 0, success: Number(item.net_amount) >= 0 }">
              {{ formatCurrency(item.net_amount) }}
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts" name="home">
import dayjs from "dayjs";
import { computed, onMounted, ref } from "vue";
import {
  Coin,
  CreditCard,
  DataAnalysis,
  Histogram,
  Monitor,
  Money,
  Opportunity,
  PieChart,
  Refresh,
  User,
  Wallet
} from "@element-plus/icons-vue";
import { Report } from "@/api/interface";
import { getDashboardOverview } from "@/api/modules/report";
import ECharts from "@/components/ECharts/index.vue";
import type { ECOption } from "@/components/ECharts/config";
import { formatCurrency, getTimeState } from "@/utils";

const loading = ref(false);

const createDefaultOverview = (): Report.DashboardOverviewData => ({
  updated_at: "",
  query_range: {
    start_time: "",
    end_time: "",
    compare_start_time: "",
    compare_end_time: ""
  },
  kpis: {
    today_recharge_amount: 0,
    yesterday_recharge_amount: 0,
    today_withdraw_amount: 0,
    yesterday_withdraw_amount: 0,
    today_fee_amount: 0,
    yesterday_fee_amount: 0,
    today_net_in_amount: 0,
    yesterday_net_in_amount: 0,
    today_register_count: 0,
    yesterday_register_count: 0,
    today_active_count: 0,
    yesterday_active_count: 0,
    today_first_recharge_count: 0,
    yesterday_first_recharge_count: 0,
    today_first_invest_count: 0,
    yesterday_first_invest_count: 0,
    today_income_claim_amount: 0,
    yesterday_income_claim_amount: 0,
    total_user_count: 0,
    online_user_count: 0,
    active_channel_count: 0,
    user_balance_amount: 0
  },
  pending_items: [],
  capital: {
    platform_net_in_amount: 0,
    user_balance_amount: 0,
    freeze_amount: 0,
    team_commission_amount: 0,
    user_integral_amount: 0,
    fund_gap_amount: 0,
    recharge_withdraw_ratio: 0,
    active_channel_count: 0,
    online_user_count: 0
  },
  user_growth: {
    today_register_count: 0,
    today_active_count: 0,
    today_first_recharge_count: 0,
    today_first_invest_count: 0,
    register_trend: [],
    vip_distribution: []
  },
  finance_trend: [],
  channel_flow: []
});

const overview = ref<Report.DashboardOverviewData>(createDefaultOverview());
const dateRange = ref<string[]>([dayjs().format("YYYY-MM-DD"), dayjs().format("YYYY-MM-DD")]);
const greeting = computed(() => getTimeState() || "你好");

const formatCount = (value: number | string) => `${Number(value || 0).toLocaleString()} 人`;
const formatPlain = (value: number | string) => Number(value || 0).toLocaleString();

const getChangePercent = (current: number | string, previous: number | string) => {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);
  if (previousValue === 0) {
    return currentValue === 0 ? "0.0%" : "+100.0%";
  }
  const diff = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  return `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
};

const getChangeClass = (current: number | string, previous: number | string) => {
  return Number(current || 0) >= Number(previous || 0) ? "up" : "down";
};

const kpiCards = computed(() => {
  const { kpis } = overview.value;
  return [
    {
      key: "recharge",
      title: "今日充值额",
      value: formatCurrency(kpis.today_recharge_amount),
      compare: `昨日 ${formatCurrency(kpis.yesterday_recharge_amount)}`,
      change: getChangePercent(kpis.today_recharge_amount, kpis.yesterday_recharge_amount),
      changeClass: getChangeClass(kpis.today_recharge_amount, kpis.yesterday_recharge_amount),
      icon: Wallet,
      iconBg: "rgba(37, 99, 235, 0.12)",
      iconColor: "#2563eb"
    },
    {
      key: "withdraw",
      title: "今日提现额",
      value: formatCurrency(kpis.today_withdraw_amount),
      compare: `昨日 ${formatCurrency(kpis.yesterday_withdraw_amount)}`,
      change: getChangePercent(kpis.today_withdraw_amount, kpis.yesterday_withdraw_amount),
      changeClass: getChangeClass(kpis.today_withdraw_amount, kpis.yesterday_withdraw_amount),
      icon: CreditCard,
      iconBg: "rgba(124, 58, 237, 0.12)",
      iconColor: "#7c3aed"
    },
    {
      key: "fee",
      title: "今日手续费",
      value: formatCurrency(kpis.today_fee_amount),
      compare: `昨日 ${formatCurrency(kpis.yesterday_fee_amount)}`,
      change: getChangePercent(kpis.today_fee_amount, kpis.yesterday_fee_amount),
      changeClass: getChangeClass(kpis.today_fee_amount, kpis.yesterday_fee_amount),
      icon: Money,
      iconBg: "rgba(249, 115, 22, 0.12)",
      iconColor: "#f97316"
    },
    {
      key: "net",
      title: "今日净流入",
      value: formatCurrency(kpis.today_net_in_amount),
      compare: `昨日 ${formatCurrency(kpis.yesterday_net_in_amount)}`,
      change: getChangePercent(kpis.today_net_in_amount, kpis.yesterday_net_in_amount),
      changeClass: getChangeClass(kpis.today_net_in_amount, kpis.yesterday_net_in_amount),
      icon: DataAnalysis,
      iconBg: "rgba(16, 185, 129, 0.12)",
      iconColor: "#10b981"
    },
    {
      key: "register",
      title: "今日注册",
      value: formatCount(kpis.today_register_count),
      compare: `昨日 ${formatCount(kpis.yesterday_register_count)}`,
      change: getChangePercent(kpis.today_register_count, kpis.yesterday_register_count),
      changeClass: getChangeClass(kpis.today_register_count, kpis.yesterday_register_count),
      icon: User,
      iconBg: "rgba(6, 182, 212, 0.12)",
      iconColor: "#06b6d4"
    },
    {
      key: "active",
      title: "今日活跃",
      value: formatCount(kpis.today_active_count),
      compare: `昨日 ${formatCount(kpis.yesterday_active_count)}`,
      change: getChangePercent(kpis.today_active_count, kpis.yesterday_active_count),
      changeClass: getChangeClass(kpis.today_active_count, kpis.yesterday_active_count),
      icon: Monitor,
      iconBg: "rgba(99, 102, 241, 0.12)",
      iconColor: "#6366f1"
    },
    {
      key: "firstRecharge",
      title: "今日首充",
      value: formatCount(kpis.today_first_recharge_count),
      compare: `昨日 ${formatCount(kpis.yesterday_first_recharge_count)}`,
      change: getChangePercent(kpis.today_first_recharge_count, kpis.yesterday_first_recharge_count),
      changeClass: getChangeClass(kpis.today_first_recharge_count, kpis.yesterday_first_recharge_count),
      icon: Coin,
      iconBg: "rgba(168, 85, 247, 0.12)",
      iconColor: "#a855f7"
    },
    {
      key: "firstInvest",
      title: "今日首投",
      value: formatCount(kpis.today_first_invest_count),
      compare: `昨日 ${formatCount(kpis.yesterday_first_invest_count)}`,
      change: getChangePercent(kpis.today_first_invest_count, kpis.yesterday_first_invest_count),
      changeClass: getChangeClass(kpis.today_first_invest_count, kpis.yesterday_first_invest_count),
      icon: Opportunity,
      iconBg: "rgba(245, 158, 11, 0.12)",
      iconColor: "#f59e0b"
    },
    {
      key: "income",
      title: "今日收益发放",
      value: formatCurrency(kpis.today_income_claim_amount),
      compare: `昨日 ${formatCurrency(kpis.yesterday_income_claim_amount)}`,
      change: getChangePercent(kpis.today_income_claim_amount, kpis.yesterday_income_claim_amount),
      changeClass: getChangeClass(kpis.today_income_claim_amount, kpis.yesterday_income_claim_amount),
      icon: Histogram,
      iconBg: "rgba(239, 68, 68, 0.12)",
      iconColor: "#ef4444"
    },
    {
      key: "online",
      title: "在线用户",
      value: formatCount(kpis.online_user_count),
      compare: `总用户 ${formatCount(kpis.total_user_count)}`,
      change: `${((Number(kpis.online_user_count || 0) / Math.max(Number(kpis.total_user_count || 1), 1)) * 100).toFixed(1)}%`,
      changeClass: "up",
      icon: Monitor,
      iconBg: "rgba(59, 130, 246, 0.12)",
      iconColor: "#3b82f6"
    },
    {
      key: "channel",
      title: "启用通道",
      value: `${formatPlain(kpis.active_channel_count)} 个`,
      compare: "今日通道活跃情况",
      change: "实时统计",
      changeClass: "up",
      icon: PieChart,
      iconBg: "rgba(14, 165, 233, 0.12)",
      iconColor: "#0ea5e9"
    },
    {
      key: "balance",
      title: "用户总余额",
      value: formatCurrency(kpis.user_balance_amount),
      compare: "当前全站账户余额",
      change: "资金池口径",
      changeClass: "up",
      icon: Refresh,
      iconBg: "rgba(20, 184, 166, 0.12)",
      iconColor: "#14b8a6"
    }
  ];
});

const capitalCards = computed(() => [
  { label: "平台净入金", value: formatCurrency(overview.value.capital.platform_net_in_amount) },
  { label: "用户总余额", value: formatCurrency(overview.value.capital.user_balance_amount) },
  { label: "冻结金额", value: formatCurrency(overview.value.capital.freeze_amount) },
  { label: "团队佣金", value: formatCurrency(overview.value.capital.team_commission_amount) },
  { label: "用户积分", value: formatCurrency(overview.value.capital.user_integral_amount) },
  {
    label: "资金缺口",
    value: formatCurrency(overview.value.capital.fund_gap_amount),
    danger: Number(overview.value.capital.fund_gap_amount) < 0
  },
  { label: "充提比", value: Number(overview.value.capital.recharge_withdraw_ratio || 0).toFixed(2) },
  { label: "在线 / 通道", value: `${overview.value.capital.online_user_count} / ${overview.value.capital.active_channel_count}` }
]);

const growthCards = computed(() => [
  { label: "今日注册", value: formatCount(overview.value.user_growth.today_register_count) },
  { label: "今日活跃", value: formatCount(overview.value.user_growth.today_active_count) },
  { label: "今日首充", value: formatCount(overview.value.user_growth.today_first_recharge_count) },
  { label: "今日首投", value: formatCount(overview.value.user_growth.today_first_invest_count) }
]);

const financeTrendOption = computed<ECOption>(() => ({
  tooltip: { trigger: "axis" },
  legend: { top: 0 },
  grid: { left: 16, right: 16, top: 42, bottom: 20, containLabel: true },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: overview.value.finance_trend.map(item => item.date.slice(5))
  },
  yAxis: { type: "value" },
  series: [
    {
      name: "充值",
      type: "line",
      smooth: true,
      data: overview.value.finance_trend.map(item => Number(item.recharge_amount || 0)),
      areaStyle: { opacity: 0.08 },
      lineStyle: { width: 3 },
      itemStyle: { color: "#2563eb" }
    },
    {
      name: "提现",
      type: "line",
      smooth: true,
      data: overview.value.finance_trend.map(item => Number(item.withdraw_amount || 0)),
      areaStyle: { opacity: 0.08 },
      lineStyle: { width: 3 },
      itemStyle: { color: "#f97316" }
    },
    {
      name: "净流入",
      type: "line",
      smooth: true,
      data: overview.value.finance_trend.map(item => Number(item.net_in_amount || 0)),
      lineStyle: { width: 3 },
      itemStyle: { color: "#10b981" }
    }
  ]
}));

const userTrendOption = computed<ECOption>(() => ({
  tooltip: { trigger: "axis" },
  legend: { top: 0 },
  grid: { left: 16, right: 16, top: 42, bottom: 20, containLabel: true },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: overview.value.user_growth.register_trend.map(item => item.date.slice(5))
  },
  yAxis: { type: "value" },
  series: [
    {
      name: "注册",
      type: "line",
      smooth: true,
      data: overview.value.user_growth.register_trend.map(item => item.register_count),
      lineStyle: { width: 3 },
      itemStyle: { color: "#3b82f6" }
    },
    {
      name: "首充",
      type: "line",
      smooth: true,
      data: overview.value.user_growth.register_trend.map(item => item.first_recharge_count),
      lineStyle: { width: 3 },
      itemStyle: { color: "#10b981" }
    },
    {
      name: "首投",
      type: "line",
      smooth: true,
      data: overview.value.user_growth.register_trend.map(item => item.first_invest_count),
      lineStyle: { width: 3 },
      itemStyle: { color: "#f59e0b" }
    }
  ]
}));

const vipPieOption = computed<ECOption>(() => {
  const data = overview.value.user_growth.vip_distribution.length
    ? overview.value.user_growth.vip_distribution
    : [{ name: "暂无数据", value: 1 }];

  return {
    tooltip: { trigger: "item" },
    legend: { bottom: 0 },
    series: [
      {
        type: "pie",
        radius: ["42%", "70%"],
        center: ["50%", "44%"],
        itemStyle: { borderRadius: 10, borderColor: "#fff", borderWidth: 3 },
        label: { formatter: "{b}\n{d}%" },
        data
      }
    ]
  };
});

const channelFlowOption = computed<ECOption>(() => ({
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
  legend: { top: 0 },
  grid: { left: 16, right: 16, top: 42, bottom: 20, containLabel: true },
  xAxis: { type: "value" },
  yAxis: {
    type: "category",
    data: overview.value.channel_flow.map(item => item.channel_name)
  },
  series: [
    {
      name: "充值",
      type: "bar",
      data: overview.value.channel_flow.map(item => Number(item.recharge_amount || 0)),
      itemStyle: { color: "#2563eb" },
      barMaxWidth: 16
    },
    {
      name: "提现",
      type: "bar",
      data: overview.value.channel_flow.map(item => Number(item.withdraw_amount || 0)),
      itemStyle: { color: "#f97316" },
      barMaxWidth: 16
    }
  ]
}));

const formatRangeText = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return "--";
  return `${dayjs(startTime).format("YYYY-MM-DD")} 至 ${dayjs(endTime).format("YYYY-MM-DD")}`;
};

const fetchOverview = async () => {
  loading.value = true;
  try {
    const res = await getDashboardOverview({
      start_time: dateRange.value?.[0],
      end_time: dateRange.value?.[1]
    });
    overview.value = res.data || createDefaultOverview();
  } finally {
    loading.value = false;
  }
};

const resetDateRange = () => {
  const today = dayjs().format("YYYY-MM-DD");
  dateRange.value = [today, today];
  fetchOverview();
};

onMounted(() => {
  fetchOverview();
});
</script>

<style scoped lang="scss">
@import "./index.scss";
</style>
