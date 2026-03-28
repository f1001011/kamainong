<template>
  <div class="table-box finance-list-page">
    <div class="period-grid">
      <div v-for="item in periodCards" :key="item.key" class="period-card">
        <div class="period-title">{{ item.title }}</div>
        <strong>{{ currencyPrefix }}{{ formatMoney(item.data.success_amount) }}</strong>
        <div class="period-meta">
          <span>成功 {{ item.data.success_count }} 单</span>
          <span>用户 {{ item.data.user_count }} 人</span>
        </div>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <span class="summary-label">当前页订单数</span>
        <strong>{{ summary.total }}</strong>
      </div>
      <div class="summary-card success">
        <span class="summary-label">已到账</span>
        <strong>{{ summary.success }}</strong>
      </div>
      <div class="summary-card warning">
        <span class="summary-label">待支付</span>
        <strong>{{ summary.pending }}</strong>
      </div>
      <div class="summary-card danger">
        <span class="summary-label">支付失败</span>
        <strong>{{ summary.failed }}</strong>
      </div>
    </div>

    <ProTable
      ref="proTable"
      :columns="columns"
      :request-api="requestRechargeList"
      :data-callback="dataCallback"
      :tool-button="['refresh', 'setting', 'search']"
    >
      <template #tableHeader>
        <div class="page-title">
          <span>充值管理</span>
          <el-tag type="info" effect="plain">真实接口：/pay/recharge/list</el-tag>
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
        <span class="amount success-text">{{ currencyPrefix }}{{ formatMoney(scope.row.actual_amount) }}</span>
      </template>

      <template #channel_name="scope">
        <el-tag v-if="scope.row.channel_name" type="primary" effect="plain">{{ scope.row.channel_name }}</el-tag>
        <span v-else>-</span>
      </template>

      <template #image_url="scope">
        <el-link v-if="scope.row.image_url" :href="scope.row.image_url" target="_blank" type="primary">查看凭证</el-link>
        <span v-else>-</span>
      </template>

      <template #operation="scope">
        <el-button type="primary" link @click="openDialog(scope.row)">编辑</el-button>
      </template>
    </ProTable>

    <RechargeDialog ref="dialogRef" />
  </div>
</template>

<script setup lang="ts" name="financeRecharge">
import dayjs from "dayjs";
import { computed, onMounted, reactive, ref } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps, ProTableInstance } from "@/components/ProTable/interface";
import { Recharge } from "@/api/interface";
import { getRechargeList, getRechargeStats } from "@/api/modules/payment";
import { currencyPrefix } from "@/utils";
import RechargeDialog from "@/views/finance/components/RechargeDialog.vue";

const proTable = ref<ProTableInstance>();
const dialogRef = ref<InstanceType<typeof RechargeDialog> | null>(null);

const summary = reactive({
  total: 0,
  success: 0,
  pending: 0,
  failed: 0
});

const createEmptyStats = (): Recharge.StatsData => ({
  total_count: 0,
  user_count: 0,
  success_count: 0,
  pending_count: 0,
  failed_count: 0,
  apply_amount: 0,
  success_amount: 0
});

const periodStats = reactive<Record<string, Recharge.StatsData>>({
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
    getRechargeStats(getPeriodRange("today")),
    getRechargeStats(getPeriodRange("yesterday")),
    getRechargeStats(getPeriodRange("week")),
    getRechargeStats(getPeriodRange("month"))
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
  { label: "创建订单", value: 0 },
  { label: "待支付", value: 1 },
  { label: "已到账", value: 2 },
  { label: "支付失败", value: 3 }
];

const columns = reactive<ColumnProps<Recharge.ResListItem>[]>([
  { type: "index", label: "#", width: 70 },
  { prop: "id", label: "订单ID", width: 90 },
  { prop: "uid", label: "用户ID", width: 100, search: { el: "input" } },
  { prop: "order_no", label: "订单号", minWidth: 180, search: { el: "input" } },
  { prop: "channel_id", label: "渠道ID", width: 100, isShow: false, isSetting: false, search: { el: "input" } },
  {
    prop: "status",
    label: "状态",
    width: 120,
    enum: statusOptions,
    search: { el: "select", props: { clearable: true } },
    fieldNames: { label: "label", value: "value" }
  },
  { prop: "money", label: "充值金额", width: 120 },
  { prop: "actual_amount", label: "实际到账", width: 120 },
  { prop: "channel_name", label: "渠道名称", minWidth: 120 },
  { prop: "sys_bank_id", label: "收款账号", minWidth: 150 },
  { prop: "u_bank_name", label: "银行名称", minWidth: 130 },
  { prop: "trilateral_order", label: "三方订单号", minWidth: 180 },
  { prop: "image_url", label: "凭证", width: 100 },
  {
    prop: "create_time",
    label: "创建时间",
    minWidth: 180,
    search: {
      el: "date-picker",
      key: "date_range",
      span: 2,
      props: { type: "datetimerange", valueFormat: "YYYY-MM-DD HH:mm:ss" }
    }
  },
  { prop: "success_time", label: "到账时间", minWidth: 180 },
  { prop: "operation", label: "操作", fixed: "right", width: 100 }
]);

const requestRechargeList = (params: Record<string, any>) => {
  const newParams: Recharge.ReqParams = {
    page: params.pageNum,
    limit: params.pageSize,
    user_id: params.uid,
    status: params.status,
    order_no: params.order_no,
    channel_id: params.channel_id
  };

  if (Array.isArray(params.date_range)) {
    newParams.start_time = params.date_range[0];
    newParams.end_time = params.date_range[1];
  }

  return getRechargeList(newParams);
};

const dataCallback = (res: Recharge.ResListData) => {
  const list = res.data || [];
  summary.total = list.length;
  summary.success = list.filter(item => Number(item.status) === 2).length;
  summary.pending = list.filter(item => Number(item.status) === 1).length;
  summary.failed = list.filter(item => Number(item.status) === 3).length;
  return {
    list,
    total: res.total || 0
  };
};

const openDialog = (row: Recharge.ResListItem) => {
  dialogRef.value?.acceptParams({
    row,
    getTableList: () => proTable.value?.getTableList()
  });
};

const formatMoney = (value: number | string) => Number(value || 0).toFixed(2);

const getStatusText = (value: number | string) => {
  const map: Record<number, string> = {
    0: "创建订单",
    1: "待支付",
    2: "已到账",
    3: "支付失败"
  };
  return map[Number(value)] || `状态${value}`;
};

const getStatusTag = (value: number | string) => {
  const map: Record<number, "info" | "warning" | "success" | "danger"> = {
    0: "info",
    1: "warning",
    2: "success",
    3: "danger"
  };
  return map[Number(value)] || "info";
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
