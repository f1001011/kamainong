<template>
  <div class="report-page">
    <div v-loading="loading" class="panel">
      <div class="panel-header">
        <div class="page-title">
          <span>财务报表</span>
          <el-tag type="success" effect="plain">真实接口：/report/finance/summary</el-tag>
        </div>
        <div class="header-actions">
          <el-radio-group v-model="rangeType" @change="handlePresetChange">
            <el-radio-button label="today">当日</el-radio-button>
            <el-radio-button label="yesterday">昨日</el-radio-button>
            <el-radio-button label="last7">7日</el-radio-button>
            <el-radio-button label="week">本周</el-radio-button>
            <el-radio-button label="month">本月</el-radio-button>
          </el-radio-group>
          <el-date-picker
            v-model="customRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 320px"
          />
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" @click="fetchSummary">查询</el-button>
        </div>
      </div>

      <div class="period-grid">
        <div v-for="item in periodCards" :key="item.key" class="period-card">
          <div class="period-title">{{ item.title }}</div>
          <strong>{{ currencyPrefix }}{{ formatMoney(item.data.net_in_amount) }}</strong>
          <div class="period-meta">
            <span>充 {{ currencyPrefix }}{{ formatMoney(item.data.recharge_success_amount) }}</span>
            <span>提 {{ currencyPrefix }}{{ formatMoney(item.data.withdraw_success_amount) }}</span>
          </div>
          <small>充值 {{ item.data.recharge_success_count || 0 }} 笔 / 提现 {{ item.data.withdraw_success_count || 0 }} 笔</small>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <span class="summary-label">充值成功金额</span>
          <strong>{{ currencyPrefix }}{{ formatMoney(summary.recharge_success_amount) }}</strong>
          <small>成功 {{ summary.recharge_success_count || 0 }} 笔 / 总 {{ summary.recharge_total_count || 0 }} 笔</small>
        </div>
        <div class="summary-card warning">
          <span class="summary-label">充值待处理</span>
          <strong>{{ summary.recharge_pending_count || 0 }}</strong>
          <small>待支付 / 待审核订单</small>
        </div>
        <div class="summary-card danger">
          <span class="summary-label">提现成功金额</span>
          <strong>{{ currencyPrefix }}{{ formatMoney(summary.withdraw_success_amount) }}</strong>
          <small>成功 {{ summary.withdraw_success_count || 0 }} 笔 / 总 {{ summary.withdraw_total_count || 0 }} 笔</small>
        </div>
        <div class="summary-card primary">
          <span class="summary-label">提现待处理</span>
          <strong>{{ summary.withdraw_pending_count || 0 }}</strong>
          <small>申请中订单</small>
        </div>
        <div class="summary-card success">
          <span class="summary-label">净流入金额</span>
          <strong>{{ currencyPrefix }}{{ formatMoney(summary.net_in_amount) }}</strong>
          <small>充值到账 - 提现到账</small>
        </div>
        <div class="summary-card info">
          <span class="summary-label">资金流水</span>
          <strong>{{ summary.money_total_count || 0 }} 条</strong>
          <small>
            收入 {{ currencyPrefix }}{{ formatMoney(summary.money_income_amount) }} / 支出 {{ currencyPrefix
            }}{{ formatMoney(summary.money_expense_amount) }}
          </small>
        </div>
      </div>

      <div class="section-grid">
        <div class="breakdown-card">
          <div class="breakdown-title">充值渠道统计</div>
          <div class="breakdown-list">
            <div
              v-for="item in summary.recharge_channel_breakdown || []"
              :key="`recharge-${item.channel_name}`"
              class="breakdown-item"
            >
              <span>{{ item.channel_name }}</span>
              <span>{{ item.total_count }} 笔</span>
              <strong>{{ currencyPrefix }}{{ formatMoney(item.total_amount) }}</strong>
            </div>
            <el-empty v-if="!(summary.recharge_channel_breakdown || []).length" description="暂无数据" />
          </div>
        </div>

        <div class="breakdown-card">
          <div class="breakdown-title">提现渠道统计</div>
          <div class="breakdown-list">
            <div
              v-for="item in summary.withdraw_channel_breakdown || []"
              :key="`withdraw-${item.channel_name}`"
              class="breakdown-item"
            >
              <span>{{ item.channel_name }}</span>
              <span>{{ item.total_count }} 笔</span>
              <strong>{{ currencyPrefix }}{{ formatMoney(item.total_amount) }}</strong>
            </div>
            <el-empty v-if="!(summary.withdraw_channel_breakdown || []).length" description="暂无数据" />
          </div>
        </div>
      </div>

      <div class="section-grid single">
        <div class="breakdown-card">
          <div class="breakdown-title">账户流水统计</div>
          <div class="account-grid">
            <div class="account-card">
              <span>余额收入</span>
              <strong>{{ currencyPrefix }}{{ formatMoney(summary.balance_income_amount) }}</strong>
            </div>
            <div class="account-card">
              <span>余额支出</span>
              <strong>{{ currencyPrefix }}{{ formatMoney(summary.balance_expense_amount) }}</strong>
            </div>
            <div class="account-card">
              <span>积分收入</span>
              <strong>{{ formatMoney(summary.integral_income_amount) }}</strong>
            </div>
            <div class="account-card">
              <span>积分支出</span>
              <strong>{{ formatMoney(summary.integral_expense_amount) }}</strong>
            </div>
          </div>

          <el-table :data="moneyTypeTableData" border style="margin-top: 16px">
            <el-table-column prop="account_type" label="账户类型" min-width="120" />
            <el-table-column prop="flow_type" label="流水方向" min-width="120" />
            <el-table-column prop="total_count" label="笔数" min-width="90" />
            <el-table-column prop="total_amount" label="金额" min-width="140">
              <template #default="{ row }">
                <span v-if="row.money_type === 1">{{ currencyPrefix }}{{ formatMoney(row.total_amount) }}</span>
                <span v-else>{{ formatMoney(row.total_amount) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="financeReportManage">
import dayjs from "dayjs";
import { computed, onMounted, reactive, ref } from "vue";
import { Report } from "@/api/interface";
import { getFinanceSummary } from "@/api/modules/report";
import { currencyPrefix } from "@/utils";

const loading = ref(false);
const rangeType = ref("today");
const customRange = ref<string[]>([]);
const createEmptySummary = (): Report.FinanceSummaryData => ({
  recharge_total_count: 0,
  recharge_success_count: 0,
  recharge_success_amount: 0,
  recharge_pending_count: 0,
  withdraw_total_count: 0,
  withdraw_success_count: 0,
  withdraw_success_amount: 0,
  withdraw_pending_count: 0,
  net_in_amount: 0,
  money_total_count: 0,
  money_income_amount: 0,
  money_expense_amount: 0,
  balance_income_amount: 0,
  balance_expense_amount: 0,
  integral_income_amount: 0,
  integral_expense_amount: 0,
  recharge_channel_breakdown: [],
  withdraw_channel_breakdown: [],
  money_type_breakdown: []
});

const normalizeSummaryData = (data?: Partial<Report.FinanceSummaryData>): Report.FinanceSummaryData => ({
  recharge_total_count: Number(data?.recharge_total_count || 0),
  recharge_success_count: Number(data?.recharge_success_count || 0),
  recharge_success_amount: Number(data?.recharge_success_amount || 0),
  recharge_pending_count: Number(data?.recharge_pending_count || 0),
  withdraw_total_count: Number(data?.withdraw_total_count || 0),
  withdraw_success_count: Number(data?.withdraw_success_count || 0),
  withdraw_success_amount: Number(data?.withdraw_success_amount || 0),
  withdraw_pending_count: Number(data?.withdraw_pending_count || 0),
  net_in_amount: Number(data?.net_in_amount || 0),
  money_total_count: Number(data?.money_total_count || 0),
  money_income_amount: Number(data?.money_income_amount || 0),
  money_expense_amount: Number(data?.money_expense_amount || 0),
  balance_income_amount: Number(data?.balance_income_amount || 0),
  balance_expense_amount: Number(data?.balance_expense_amount || 0),
  integral_income_amount: Number(data?.integral_income_amount || 0),
  integral_expense_amount: Number(data?.integral_expense_amount || 0),
  recharge_channel_breakdown: data?.recharge_channel_breakdown || [],
  withdraw_channel_breakdown: data?.withdraw_channel_breakdown || [],
  money_type_breakdown: data?.money_type_breakdown || []
});

const summary = reactive<Report.FinanceSummaryData>(createEmptySummary());
const periodSummary = reactive<Record<string, Report.FinanceSummaryData>>({
  today: createEmptySummary(),
  yesterday: createEmptySummary(),
  week: createEmptySummary(),
  month: createEmptySummary()
});

const getRangeByType = (type: string): string[] => {
  const now = dayjs();
  if (type === "yesterday") {
    return [
      now.subtract(1, "day").startOf("day").format("YYYY-MM-DD HH:mm:ss"),
      now.subtract(1, "day").endOf("day").format("YYYY-MM-DD HH:mm:ss")
    ];
  }
  if (type === "last7") {
    return [now.subtract(6, "day").startOf("day").format("YYYY-MM-DD HH:mm:ss"), now.endOf("day").format("YYYY-MM-DD HH:mm:ss")];
  }
  if (type === "week") {
    return [now.startOf("week").format("YYYY-MM-DD HH:mm:ss"), now.endOf("week").format("YYYY-MM-DD HH:mm:ss")];
  }
  if (type === "month") {
    return [now.startOf("month").format("YYYY-MM-DD HH:mm:ss"), now.endOf("month").format("YYYY-MM-DD HH:mm:ss")];
  }
  return [now.startOf("day").format("YYYY-MM-DD HH:mm:ss"), now.endOf("day").format("YYYY-MM-DD HH:mm:ss")];
};

const getCurrentRange = () => (customRange.value.length === 2 ? customRange.value : getRangeByType(rangeType.value));

const fetchSummary = async () => {
  loading.value = true;
  try {
    const [start_time, end_time] = getCurrentRange();
    const { data } = await getFinanceSummary({ start_time, end_time });
    Object.assign(summary, normalizeSummaryData(data));
  } finally {
    loading.value = false;
  }
};

const fetchPeriodSummary = async () => {
  const periodKeys = ["today", "yesterday", "week", "month"] as const;
  const responses = await Promise.all(
    periodKeys.map(key => {
      const [start_time, end_time] = getRangeByType(key);
      return getFinanceSummary({ start_time, end_time });
    })
  );

  periodKeys.forEach((key, index) => {
    periodSummary[key] = normalizeSummaryData(responses[index].data);
  });
};

const handlePresetChange = async () => {
  customRange.value = [];
  await fetchSummary();
};

const resetSearch = async () => {
  rangeType.value = "today";
  customRange.value = [];
  await fetchSummary();
};

const moneyTypeTableData = computed(() =>
  (summary.money_type_breakdown || []).map(item => ({
    ...item,
    account_type: Number(item.money_type) === 1 ? "余额账户" : "积分账户",
    flow_type: Number(item.type) === 1 ? "收入" : "支出"
  }))
);

const periodCards = computed(() => [
  { key: "today", title: "今天", data: periodSummary.today },
  { key: "yesterday", title: "昨天", data: periodSummary.yesterday },
  { key: "week", title: "本周", data: periodSummary.week },
  { key: "month", title: "本月", data: periodSummary.month }
]);

const formatMoney = (value: number | string) => Number(value || 0).toFixed(2);

onMounted(async () => {
  await Promise.allSettled([fetchSummary(), fetchPeriodSummary()]);
});
</script>

<style scoped lang="scss">
.report-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel {
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}

.page-title,
.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.period-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.period-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 20px;
  border-radius: 14px;
  border: 1px solid #dbeafe;
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
}

.period-title {
  color: #475569;
  font-size: 13px;
}

.period-card strong {
  color: #0f172a;
  font-size: 26px;
}

.period-card small {
  color: #64748b;
}

.period-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #64748b;
  font-size: 12px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}

.summary-card strong {
  font-size: 24px;
  color: #111827;
}

.summary-card small {
  color: #6b7280;
}

.summary-label {
  color: #6b7280;
  font-size: 13px;
}

.summary-card.success {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.summary-card.warning {
  border-color: #fde68a;
  background: #fffbeb;
}

.summary-card.danger {
  border-color: #fecaca;
  background: #fef2f2;
}

.summary-card.primary {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.summary-card.info {
  border-color: #ddd6fe;
  background: #f5f3ff;
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.section-grid.single {
  grid-template-columns: minmax(0, 1fr);
  margin-bottom: 0;
}

.breakdown-card {
  padding: 18px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}

.breakdown-title {
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.breakdown-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 10px;
  background: #f8fafc;
  color: #374151;
}

.account-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.account-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 12px;
  background: #f8fafc;
}

.account-card span {
  color: #6b7280;
  font-size: 13px;
}

.account-card strong {
  font-size: 20px;
  color: #111827;
}

@media (max-width: 1200px) {
  .period-grid,
  .summary-grid,
  .section-grid,
  .account-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .section-grid.single {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 768px) {
  .panel-header,
  .page-title,
  .header-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .period-grid,
  .summary-grid,
  .section-grid,
  .account-grid {
    grid-template-columns: 1fr;
  }

  .section-grid.single {
    grid-template-columns: minmax(0, 1fr);
  }

  .breakdown-item {
    grid-template-columns: 1fr;
  }
}
</style>
