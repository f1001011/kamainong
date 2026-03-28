<template>
  <div class="table-box">
    <div class="period-grid">
      <div v-for="item in periodCards" :key="item.key" class="period-card">
        <div class="period-title">{{ item.title }}</div>
        <strong>{{ currencyPrefix }}{{ formatMoney(item.data.total_amount) }}</strong>
        <div class="period-meta">
          <span>待审 {{ item.data.pending_count }}</span>
          <span>通过 {{ item.data.success_count }}</span>
        </div>
      </div>
    </div>

    <ProTable
      :columns="columns"
      :request-api="requestVoucherList"
      :data-callback="dataCallback"
      :tool-button="['refresh', 'setting', 'search']"
    >
      <template #tableHeader>
        <div class="page-title">
          <span>充值凭证列表</span>
          <el-tag type="info" effect="plain">真实接口：/recharge/voucher/list</el-tag>
        </div>
      </template>

      <template #status="scope">
        <el-tag :type="statusType(scope.row.status)" effect="light">{{ statusText(scope.row.status) }}</el-tag>
      </template>

      <template #amount="scope">
        <span class="amount">{{ currencyPrefix }}{{ formatMoney(scope.row.amount) }}</span>
      </template>

      <template #voucher_image="scope">
        <el-link v-if="scope.row.voucher_image" :href="scope.row.voucher_image" target="_blank" type="primary">查看凭证</el-link>
        <span v-else>-</span>
      </template>

      <template #user_info="scope">
        <div class="info-cell">
          <span>账号：{{ scope.row.user_name || "-" }}</span>
          <span>昵称：{{ scope.row.nickname || "-" }}</span>
          <span>电话：{{ scope.row.phone || "-" }}</span>
        </div>
      </template>
    </ProTable>
  </div>
</template>

<script setup lang="ts" name="rechargeVoucherManage">
import dayjs from "dayjs";
import { computed, onMounted, reactive } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps } from "@/components/ProTable/interface";
import { RechargeVoucher } from "@/api/interface";
import { getRechargeVoucherList, getRechargeVoucherStats } from "@/api/modules/payment";
import { currencyPrefix } from "@/utils";

const createEmptyStats = (): RechargeVoucher.StatsData => ({
  total_count: 0,
  user_count: 0,
  pending_count: 0,
  success_count: 0,
  reject_count: 0,
  total_amount: 0
});

const periodStats = reactive<Record<string, RechargeVoucher.StatsData>>({
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
    getRechargeVoucherStats(getPeriodRange("today")),
    getRechargeVoucherStats(getPeriodRange("yesterday")),
    getRechargeVoucherStats(getPeriodRange("week")),
    getRechargeVoucherStats(getPeriodRange("month"))
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

const columns = reactive<ColumnProps<RechargeVoucher.ResListItem>[]>([
  { type: "index", label: "#", width: 70 },
  { prop: "id", label: "ID", width: 80 },
  { prop: "user_id", label: "用户ID", width: 100, search: { el: "input" } },
  { prop: "user_info", label: "用户信息", minWidth: 220 },
  { prop: "recharge_id", label: "充值订单ID", width: 130, search: { el: "input" } },
  { prop: "amount", label: "充值金额", width: 120 },
  {
    prop: "status",
    label: "状态",
    width: 100,
    enum: [
      { label: "待审核", value: 0 },
      { label: "通过", value: 1 },
      { label: "拒绝", value: 2 }
    ],
    search: { el: "select", props: { clearable: true } },
    fieldNames: { label: "label", value: "value" }
  },
  { prop: "voucher_image", label: "凭证图", width: 100 },
  { prop: "create_time", label: "创建时间", minWidth: 180 },
  {
    prop: "date_range",
    label: "时间范围",
    isShow: false,
    search: { el: "date-picker", span: 2, props: { type: "datetimerange", valueFormat: "YYYY-MM-DD HH:mm:ss" } }
  }
]);

const requestVoucherList = (params: Record<string, any>) => {
  const newParams: RechargeVoucher.ReqParams = {
    page: params.pageNum,
    limit: params.pageSize,
    user_id: params.user_id,
    recharge_id: params.recharge_id,
    status: params.status
  };

  if (Array.isArray(params.date_range)) {
    newParams.start_time = params.date_range[0];
    newParams.end_time = params.date_range[1];
  }

  return getRechargeVoucherList(newParams);
};

const dataCallback = (res: RechargeVoucher.ResListData) => ({
  list: res.data || [],
  total: res.total || 0
});

const formatMoney = (value: number | string) => Number(value || 0).toFixed(2);
const statusText = (value: number | string) => ({ 0: "待审核", 1: "通过", 2: "拒绝" })[Number(value)] || `状态${value}`;
const statusType = (value: number | string): "success" | "warning" | "info" | "primary" | "danger" => {
  return (
    ({ 0: "warning", 1: "success", 2: "danger" } as Record<number, "success" | "warning" | "danger">)[Number(value)] || "info"
  );
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

.amount {
  font-weight: 600;
  color: #16a34a;
}

.info-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #4b5563;
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
