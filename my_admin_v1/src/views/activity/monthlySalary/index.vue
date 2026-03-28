<template>
  <div class="report-page">
    <div class="panel">
      <div class="panel-header">
        <div class="page-title">
          <span>月薪记录</span>
          <el-tag type="success" effect="plain">真实接口：/report/monthly/salary/list + /report/monthly/salary/stats</el-tag>
        </div>
        <div class="header-actions">
          <el-radio-group v-model="rangeType" @change="handlePresetChange">
            <el-radio-button label="today">当日</el-radio-button>
            <el-radio-button label="yesterday">昨日</el-radio-button>
            <el-radio-button label="last7">7日</el-radio-button>
            <el-radio-button label="week">本周</el-radio-button>
            <el-radio-button label="month">本月</el-radio-button>
          </el-radio-group>
          <el-input v-model="search.user_id" clearable placeholder="用户ID" style="width: 120px" @keyup.enter="handleSearch" />
          <el-select v-model="search.status" clearable placeholder="状态" style="width: 120px">
            <el-option label="待领取" :value="0" />
            <el-option label="已领取" :value="1" />
            <el-option label="已过期" :value="2" />
          </el-select>
          <el-date-picker
            v-model="customRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 320px"
          />
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </div>
      </div>

      <div class="summary-grid">
        <div v-for="item in periodCards" :key="item.key" class="summary-card period-card">
          <span class="summary-label">{{ item.title }}</span>
          <strong>{{ currencyPrefix }}{{ formatMoney(item.data.gift_amount || 0) }}</strong>
          <small>人数 {{ item.data.salary_user_count || 0 }} · 团队充值 {{ currencyPrefix }}{{ formatMoney(item.data.team_recharge_amount || 0) }}</small>
        </div>
      </div>

      <div class="summary-grid current-grid">
        <div class="summary-card">
          <span class="summary-label">发放人数</span>
          <strong>{{ stats.salary_user_count || 0 }}</strong>
        </div>
        <div class="summary-card success">
          <span class="summary-label">奖励金额</span>
          <strong>{{ currencyPrefix }}{{ formatMoney(stats.gift_amount || 0) }}</strong>
        </div>
        <div class="summary-card primary">
          <span class="summary-label">团队充值额</span>
          <strong>{{ currencyPrefix }}{{ formatMoney(stats.team_recharge_amount || 0) }}</strong>
        </div>
      </div>

      <div class="breakdown-card">
        <div class="breakdown-title">状态统计</div>
        <div class="breakdown-list">
          <div v-for="item in stats.reward_breakdown || []" :key="item.status" class="breakdown-item">
            <span>{{ salaryStatusText(item.status) }}</span>
            <span>{{ item.total_count }} 条</span>
            <strong>{{ currencyPrefix }}{{ formatMoney(item.total_amount) }}</strong>
          </div>
          <el-empty v-if="!(stats.reward_breakdown || []).length" description="暂无统计" />
        </div>
      </div>

      <el-table v-loading="loading" :data="list" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="user_id" label="用户ID" width="100" />
        <el-table-column label="用户信息" min-width="220">
          <template #default="{ row }">
            <div class="info-cell">
              <span>账号：{{ row.user_name || "-" }}</span>
              <span>昵称：{{ row.nickname || "-" }}</span>
              <span>电话：{{ row.phone || "-" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="claim_month" label="领取月份" min-width="120" />
        <el-table-column prop="team_recharge_amount" label="团队充值金额" min-width="140">
          <template #default="{ row }">{{ currencyPrefix }}{{ formatMoney(row.team_recharge_amount) }}</template>
        </el-table-column>
        <el-table-column prop="reward_amount" label="奖励金额" min-width="120">
          <template #default="{ row }">{{ currencyPrefix }}{{ formatMoney(row.reward_amount) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="salaryStatusType(row.status)" effect="light">{{ salaryStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" min-width="180" />
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="monthlySalaryManage">
import dayjs from "dayjs";
import { computed, onMounted, reactive, ref } from "vue";
import { Report } from "@/api/interface";
import { getMonthlySalaryLogList, getMonthlySalaryStats } from "@/api/modules/report";
import { currencyPrefix } from "@/utils";

const loading = ref(false);
const rangeType = ref("today");
const customRange = ref<string[]>([]);
const list = ref<Report.SalaryItem[]>([]);
const stats = reactive<Report.SalaryStatsData>({
  salary_user_count: 0,
  gift_amount: 0,
  team_recharge_amount: 0,
  record_count: 0,
  reward_breakdown: []
});
const pagination = reactive({ page: 1, limit: 20, total: 0 });
const search = reactive({
  user_id: "",
  status: undefined as number | undefined
});

const createEmptyStats = (): Report.SalaryStatsData => ({
  salary_user_count: 0,
  gift_amount: 0,
  team_recharge_amount: 0,
  record_count: 0,
  reward_breakdown: []
});

const periodStats = reactive<Record<string, Report.SalaryStatsData>>({
  today: createEmptyStats(),
  yesterday: createEmptyStats(),
  week: createEmptyStats(),
  month: createEmptyStats()
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

const fetchPeriodStats = async () => {
  const [todayRes, yesterdayRes, weekRes, monthRes] = await Promise.all([
    getMonthlySalaryStats(getPeriodRange("today")),
    getMonthlySalaryStats(getPeriodRange("yesterday")),
    getMonthlySalaryStats(getPeriodRange("week")),
    getMonthlySalaryStats(getPeriodRange("month"))
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

const fetchList = async () => {
  loading.value = true;
  try {
    const [start_time, end_time] = getCurrentRange();
    const [listRes, statsRes] = await Promise.all([
      getMonthlySalaryLogList({
        page: pagination.page,
        limit: pagination.limit,
        user_id: search.user_id || undefined,
        status: search.status,
        start_time,
        end_time
      }),
      getMonthlySalaryStats({
        user_id: search.user_id || undefined,
        status: search.status,
        start_time,
        end_time
      })
    ]);
    list.value = listRes.data.data || [];
    pagination.total = Number(listRes.data.total || 0);
    stats.salary_user_count = Number(statsRes.data.salary_user_count || 0);
    stats.gift_amount = Number(statsRes.data.gift_amount || 0);
    stats.team_recharge_amount = Number(statsRes.data.team_recharge_amount || 0);
    stats.record_count = Number(statsRes.data.record_count || 0);
    stats.reward_breakdown = statsRes.data.reward_breakdown || [];
  } finally {
    loading.value = false;
  }
};

const handlePresetChange = async () => {
  customRange.value = [];
  pagination.page = 1;
  await fetchList();
};

const handleSearch = async () => {
  pagination.page = 1;
  await fetchList();
};

const resetSearch = async () => {
  rangeType.value = "today";
  customRange.value = [];
  search.user_id = "";
  search.status = undefined;
  pagination.page = 1;
  await fetchList();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchList();
};

const handleSizeChange = (size: number) => {
  pagination.limit = size;
  pagination.page = 1;
  fetchList();
};

const formatMoney = (value: number | string) => Number(value || 0).toFixed(2);
const salaryStatusText = (value?: number | string) =>
  ({ 0: "待领取", 1: "已领取", 2: "已过期" })[Number(value)] || `状态${value}`;
const salaryStatusType = (value?: number | string): "success" | "warning" | "info" | "primary" | "danger" => {
  return ({ 0: "warning", 1: "success", 2: "info" } as Record<number, "success" | "warning" | "info">)[Number(value)] || "info";
};

onMounted(async () => {
  await Promise.allSettled([fetchList(), fetchPeriodStats()]);
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.current-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

.period-card {
  border-color: #dbeafe;
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
}

.period-card small {
  color: #64748b;
  line-height: 1.5;
}

.summary-card.success {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.summary-card.primary {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.summary-label {
  font-size: 13px;
  color: #6b7280;
}

.breakdown-card {
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f8fafc;
}

.breakdown-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.breakdown-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.breakdown-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.breakdown-item strong {
  color: #0f172a;
}

.info-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #4b5563;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 1200px) {
  .summary-grid,
  .breakdown-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .current-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .summary-grid,
  .breakdown-list {
    grid-template-columns: 1fr;
  }

  .current-grid {
    grid-template-columns: 1fr;
  }

  .panel-header,
  .page-title,
  .header-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
