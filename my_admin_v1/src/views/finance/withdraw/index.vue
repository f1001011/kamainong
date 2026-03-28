<template>
  <div class="table-box finance-list-page">
    <div class="period-grid">
      <div v-for="item in periodCards" :key="item.key" class="period-card">
        <div class="period-title">{{ item.title }}</div>
        <strong>{{ currencyPrefix }}{{ formatMoney(item.data.success_amount) }}</strong>
        <div class="period-meta">
          <span>完成 {{ item.data.success_count }} 单</span>
          <span>手续费 {{ currencyPrefix }}{{ formatMoney(item.data.fee_amount) }}</span>
        </div>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card danger">
        <span class="summary-label">申请中</span>
        <strong>{{ summary.applying }}</strong>
      </div>
      <div class="summary-card success">
        <span class="summary-label">已完成</span>
        <strong>{{ summary.success }}</strong>
      </div>
      <div class="summary-card warning">
        <span class="summary-label">已拒绝</span>
        <strong>{{ summary.reject }}</strong>
      </div>
      <div class="summary-card">
        <span class="summary-label">当前页总额</span>
        <strong>{{ currencyPrefix }}{{ formatMoney(summary.totalMoney) }}</strong>
      </div>
    </div>

    <ProTable
      ref="proTable"
      :columns="columns"
      :request-api="requestCashList"
      :data-callback="dataCallback"
      :tool-button="['refresh', 'setting', 'search']"
    >
      <template #tableHeader>
        <div class="page-title">
          <span>提现管理</span>
          <el-tag type="info" effect="plain">真实接口：/pay/cash/list</el-tag>
        </div>
      </template>

      <template #status="scope">
        <el-tag :type="getStatusTag(scope.row.status)" effect="light">
          {{ getStatusText(scope.row.status) }}
        </el-tag>
      </template>

      <template #money="scope">
        <span class="amount">{{ currencyPrefix }}{{ formatMoney(scope.row.money) }}</span>
      </template>

      <template #actual_amount="scope">
        <span class="success-text">{{ currencyPrefix }}{{ formatMoney(scope.row.actual_amount) }}</span>
      </template>

      <template #fee="scope">
        <span>{{ currencyPrefix }}{{ formatMoney(scope.row.fee) }}</span>
      </template>

      <template #is_status="scope">
        <el-tag :type="Number(scope.row.is_status) === 1 ? 'success' : 'info'" effect="plain">
          {{ Number(scope.row.is_status) === 1 ? "已提交" : "未提交" }}
        </el-tag>
      </template>

      <template #operation="scope">
        <el-button type="primary" link @click="openDialog(scope.row)">编辑</el-button>
      </template>
    </ProTable>

    <WithdrawDialog ref="dialogRef" />
  </div>
</template>

<script setup lang="ts" name="financeWithdraw">
import dayjs from "dayjs";
import { computed, onMounted, reactive, ref } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps, ProTableInstance } from "@/components/ProTable/interface";
import { Cash } from "@/api/interface";
import { getCashList, getCashStats } from "@/api/modules/payment";
import { currencyPrefix } from "@/utils";
import WithdrawDialog from "@/views/finance/components/WithdrawDialog.vue";

const proTable = ref<ProTableInstance>();
const dialogRef = ref<InstanceType<typeof WithdrawDialog> | null>(null);

const summary = reactive({
  applying: 0,
  success: 0,
  reject: 0,
  totalMoney: 0
});

const createEmptyStats = (): Cash.StatsData => ({
  total_count: 0,
  user_count: 0,
  applying_count: 0,
  success_count: 0,
  reject_count: 0,
  apply_amount: 0,
  success_amount: 0,
  fee_amount: 0
});

const periodStats = reactive<Record<string, Cash.StatsData>>({
  today: createEmptyStats(),
  yesterday: createEmptyStats(),
  week: createEmptyStats(),
  month: createEmptyStats()
});

const getPeriodRange = (type: "today" | "yesterday" | "week" | "month") => {
  const now = dayjs();
  if (type === "yesterday") {
    return {
      start_time: now.subtract(1, "day").startOf("day").format("YYYY-MM-DD HH:mm:ss"),
      end_time: now.subtract(1, "day").endOf("day").format("YYYY-MM-DD HH:mm:ss")
    };
  }
  if (type === "week") {
    return {
      start_time: now.startOf("week").format("YYYY-MM-DD HH:mm:ss"),
      end_time: now.endOf("week").format("YYYY-MM-DD HH:mm:ss")
    };
  }
  if (type === "month") {
    return {
      start_time: now.startOf("month").format("YYYY-MM-DD HH:mm:ss"),
      end_time: now.endOf("month").format("YYYY-MM-DD HH:mm:ss")
    };
  }
  return {
    start_time: now.startOf("day").format("YYYY-MM-DD HH:mm:ss"),
    end_time: now.endOf("day").format("YYYY-MM-DD HH:mm:ss")
  };
};

const fetchPeriodStats = async () => {
  const [todayRes, yesterdayRes, weekRes, monthRes] = await Promise.all([
    getCashStats(getPeriodRange("today")),
    getCashStats(getPeriodRange("yesterday")),
    getCashStats(getPeriodRange("week")),
    getCashStats(getPeriodRange("month"))
  ]);

  periodStats.today = todayRes.data;
  periodStats.yesterday = yesterdayRes.data;
  periodStats.week = weekRes.data;
  periodStats.month = monthRes.data;
};

const periodCards = computed(() => [
  { key: "today", title: "今天", data: periodStats.today },
  { key: "yesterday", title: "昨天", data: periodStats.yesterday },
  { key: "week", title: "本周", data: periodStats.week },
  { key: "month", title: "本月", data: periodStats.month }
]);

const statusOptions = [
  { label: "全部", value: "" },
  { label: "申请中", value: 0 },
  { label: "已完成", value: 1 },
  { label: "已拒绝", value: 2 }
];

const columns = reactive<ColumnProps<Cash.ResListItem>[]>([
  { type: "index", label: "#", width: 70 },
  { prop: "id", label: "订单ID", width: 90 },
  { prop: "u_id", label: "用户ID", width: 100, search: { el: "input" } },
  { prop: "order_on", label: "订单号", minWidth: 180, search: { el: "input" } },
  { prop: "channel_id", label: "渠道ID", width: 100, isShow: false, isSetting: false, search: { el: "input" } },
  {
    prop: "status",
    label: "状态",
    width: 120,
    enum: statusOptions,
    search: { el: "select", props: { clearable: true } },
    fieldNames: { label: "label", value: "value" }
  },
  { prop: "money", label: "提现金额", width: 120 },
  { prop: "fee", label: "手续费", width: 110 },
  { prop: "actual_amount", label: "实际到账", width: 120 },
  { prop: "channel_name", label: "渠道名称", minWidth: 120 },
  { prop: "u_bank_name", label: "银行名称", minWidth: 140 },
  { prop: "u_back_card", label: "收款账号", minWidth: 220 },
  { prop: "is_status", label: "平台提交", width: 110 },
  {
    prop: "create_time",
    label: "申请时间",
    minWidth: 180,
    search: {
      el: "date-picker",
      key: "date_range",
      span: 2,
      props: { type: "datetimerange", valueFormat: "YYYY-MM-DD HH:mm:ss" }
    }
  },
  { prop: "success_time", label: "审核时间", minWidth: 180 },
  { prop: "operation", label: "操作", fixed: "right", width: 100 }
]);

const requestCashList = (params: Record<string, any>) => {
  const newParams: Cash.ReqParams = {
    page: params.pageNum,
    limit: params.pageSize,
    user_id: params.u_id,
    status: params.status,
    order_on: params.order_on,
    channel_id: params.channel_id
  };

  if (Array.isArray(params.date_range)) {
    newParams.start_time = params.date_range[0];
    newParams.end_time = params.date_range[1];
  }

  return getCashList(newParams);
};

const dataCallback = (res: Cash.ResListData) => {
  const list = res.data || [];
  summary.applying = list.filter(item => Number(item.status) === 0).length;
  summary.success = list.filter(item => Number(item.status) === 1).length;
  summary.reject = list.filter(item => Number(item.status) === 2).length;
  summary.totalMoney = list.reduce((sum, item) => sum + Number(item.money || 0), 0);
  return {
    list,
    total: res.total || 0
  };
};

const openDialog = (row: Cash.ResListItem) => {
  dialogRef.value?.acceptParams({
    row,
    getTableList: () => proTable.value?.getTableList()
  });
};

const formatMoney = (value: number | string) => Number(value || 0).toFixed(2);

const getStatusText = (value: number | string) => {
  const map: Record<number, string> = {
    0: "申请中",
    1: "已完成",
    2: "已拒绝"
  };
  return map[Number(value)] || `状态${value}`;
};

const getStatusTag = (value: number | string) => {
  const map: Record<number, "danger" | "success" | "warning"> = {
    0: "warning",
    1: "success",
    2: "danger"
  };
  return map[Number(value)] || "warning";
};

onMounted(fetchPeriodStats);
</script>

<style scoped lang="scss">
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

.period-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #64748b;
  font-size: 12px;
}

.page-title {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.summary-card strong {
  font-size: 24px;
  color: #111827;
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

.summary-label {
  font-size: 13px;
  color: #6b7280;
}

.amount {
  font-weight: 600;
  color: #111827;
}

.success-text {
  font-weight: 600;
  color: #16a34a;
}

@media (max-width: 1200px) {
  .period-grid,
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .period-grid,
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
