<template>
  <div class="table-box finance-list-page">
    <div class="period-grid">
      <div v-for="item in periodCards" :key="item.key" class="period-card">
        <div class="period-title">{{ item.title }}</div>
        <strong>{{ currencyPrefix }}{{ formatMoney(item.data.net_amount) }}</strong>
        <div class="period-meta">
          <span class="amount-up">入 {{ currencyPrefix }}{{ formatMoney(item.data.income_amount) }}</span>
          <span class="amount-down">出 {{ currencyPrefix }}{{ formatMoney(item.data.expense_amount) }}</span>
        </div>
      </div>
    </div>

    <ProTable
      ref="proTable"
      :columns="columns"
      :request-api="requestMoneyLogList"
      :data-callback="dataCallback"
      :search-col="{ xs: 1, sm: 2, md: 3, lg: 4, xl: 6 }"
      :tool-button="['refresh', 'setting', 'search']"
    >
      <template #tableHeader>
        <div class="page-title">
          <span>资金流水</span>
          <el-tag type="info" effect="plain">已对接 admin_api</el-tag>
        </div>
      </template>

      <template #type="scope">
        <el-tag :type="Number(scope.row.type) === 1 ? 'success' : 'danger'" effect="light">
          {{ getTypeText(scope.row.type) }}
        </el-tag>
      </template>

      <template #money_type="scope">
        <el-tag :type="Number(scope.row.money_type) === 1 ? 'primary' : 'warning'" effect="light">
          {{ getMoneyTypeText(scope.row.money_type) }}
        </el-tag>
      </template>

      <template #status="scope">
        <span>{{ getStatusText(scope.row.status) }}</span>
      </template>

      <template #money_before="scope">
        <span>{{ currencyPrefix }}{{ formatMoney(scope.row.money_before) }}</span>
      </template>

      <template #money="scope">
        <span :class="Number(scope.row.type) === 1 ? 'amount-up' : 'amount-down'">
          {{ Number(scope.row.type) === 1 ? "+" : "-" }}{{ currencyPrefix }}{{ formatMoney(scope.row.money) }}
        </span>
      </template>

      <template #money_end="scope">
        <span>{{ currencyPrefix }}{{ formatMoney(scope.row.money_end) }}</span>
      </template>
    </ProTable>
  </div>
</template>

<script setup lang="ts" name="financeMoneyLog">
import dayjs from "dayjs";
import { computed, reactive, ref, onMounted } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps, ProTableInstance } from "@/components/ProTable/interface";
import { PayMoneyLog } from "@/api/interface";
import { getPayMoneyLogList, getPayMoneyLogStats } from "@/api/modules/payment";
import { currencyPrefix } from "@/utils";

const proTable = ref<ProTableInstance>();

const createEmptyStats = (): PayMoneyLog.StatsData => ({
  total_count: 0,
  user_count: 0,
  income_amount: 0,
  expense_amount: 0,
  net_amount: 0,
  balance_income_amount: 0,
  balance_expense_amount: 0,
  integral_income_amount: 0,
  integral_expense_amount: 0
});

const periodStats = reactive<Record<string, PayMoneyLog.StatsData>>({
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
    getPayMoneyLogStats(getPeriodRange("today")),
    getPayMoneyLogStats(getPeriodRange("yesterday")),
    getPayMoneyLogStats(getPeriodRange("week")),
    getPayMoneyLogStats(getPeriodRange("month"))
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

const typeOptions = [
  { label: "全部", value: "" },
  { label: "收入", value: 1 },
  { label: "支出", value: 2 }
];

const moneyTypeOptions = [
  { label: "全部", value: "" },
  { label: "余额", value: 1 },
  { label: "积分", value: 2 }
];

const statusOptions = [
  { label: "全部", value: "" },
  { label: "充值到账", value: 101 },
  { label: "管理员加余额", value: 120 },
  { label: "管理员减余额", value: 121 },
  { label: "管理员加积分", value: 122 },
  { label: "管理员减积分", value: 123 },
  { label: "提现扣款", value: 201 },
  { label: "提现驳回退回", value: 202 }
];

const columns = reactive<ColumnProps<PayMoneyLog.ResListItem>[]>([
  { type: "index", label: "#", width: 70 },
  { prop: "id", label: "流水ID", width: 90 },
  { prop: "uid", label: "用户ID", width: 100, search: { el: "input", order: 1 } },
  {
    prop: "type",
    label: "收支类型",
    width: 120,
    enum: typeOptions,
    search: { el: "select", order: 3, props: { clearable: true } },
    fieldNames: { label: "label", value: "value" }
  },
  {
    prop: "money_type",
    label: "账户类型",
    width: 120,
    enum: moneyTypeOptions,
    search: { el: "select", order: 2, props: { clearable: true } },
    fieldNames: { label: "label", value: "value" }
  },
  {
    prop: "status",
    label: "业务状态",
    minWidth: 150,
    enum: statusOptions,
    search: { el: "select", order: 4, props: { clearable: true } },
    fieldNames: { label: "label", value: "value" }
  },
  { prop: "money_before", label: "变更前", width: 120 },
  { prop: "money", label: "变更金额", width: 140 },
  { prop: "money_end", label: "变更后", width: 120 },
  { prop: "source_id", label: "来源ID", width: 100 },
  { prop: "rmark", label: "备注", minWidth: 180 },
  {
    prop: "create_time",
    label: "创建时间",
    minWidth: 180,
    search: {
      el: "date-picker",
      order: 5,
      key: "date_range",
      span: 2,
      props: { type: "datetimerange", valueFormat: "YYYY-MM-DD HH:mm:ss" }
    }
  }
]);

const requestMoneyLogList = (params: Record<string, any>) => {
  const newParams: PayMoneyLog.ReqParams = {
    page: params.pageNum,
    limit: params.pageSize,
    user_id: params.uid,
    type: params.type,
    money_type: params.money_type,
    status: params.status
  };

  if (Array.isArray(params.date_range)) {
    newParams.start_time = params.date_range[0];
    newParams.end_time = params.date_range[1];
  }

  return getPayMoneyLogList(newParams);
};

const dataCallback = (data: PayMoneyLog.ResListData) => {
  return {
    list: data.data || [],
    total: data.total || 0
  };
};

const formatMoney = (value: number | string) => Number(value || 0).toFixed(2);

const getTypeText = (value: number | string) => (Number(value) === 1 ? "收入" : "支出");

const getMoneyTypeText = (value: number | string) => (Number(value) === 1 ? "余额" : "积分");

const getStatusText = (value: number | string) => {
  const current = statusOptions.find(item => Number(item.value) === Number(value));
  return current?.label || `状态${value}`;
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

.amount-up {
  font-weight: 600;
  color: #16a34a;
}

.amount-down {
  font-weight: 600;
  color: #dc2626;
}

@media (max-width: 1200px) {
  .period-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .period-grid {
    grid-template-columns: 1fr;
  }
}
</style>
