<template>
  <div class="lottery-log-page">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="转盘开奖记录" name="log">
        <div class="panel">
          <div class="panel-header">
            <div class="page-title">
              <span>转盘开奖记录</span>
              <el-tag type="info" effect="plain">真实接口：/lottery/log/list</el-tag>
            </div>
            <div class="header-actions">
              <el-input
                v-model="logSearch.user_id"
                clearable
                placeholder="用户ID"
                style="width: 120px"
                @keyup.enter="handleLogSearch"
              />
              <el-select v-model="logSearch.prize_type" clearable placeholder="奖品类型" style="width: 120px">
                <el-option label="现金" :value="1" />
                <el-option label="实物" :value="2" />
              </el-select>
              <el-date-picker
                v-model="logSearch.date_range"
                type="datetimerange"
                value-format="YYYY-MM-DD HH:mm:ss"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                style="width: 320px"
              />
              <el-button @click="resetLogSearch">重置</el-button>
              <el-button type="primary" @click="handleLogSearch">查询</el-button>
            </div>
          </div>

          <el-table v-loading="logLoading" :data="logList" border>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column label="用户信息" min-width="220">
              <template #default="{ row }">
                <div class="info-cell">
                  <span>ID：{{ row.user_id }}</span>
                  <span>账号：{{ row.user_name || "-" }}</span>
                  <span>电话：{{ row.phone || "-" }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="prize_name" label="奖品名称" min-width="180" />
            <el-table-column prop="prize_type" label="奖品类型" min-width="100">
              <template #default="{ row }">{{ Number(row.prize_type) === 1 ? "现金" : "实物" }}</template>
            </el-table-column>
            <el-table-column prop="amount" label="中奖金额" min-width="120">
              <template #default="{ row }">{{ currencyPrefix }}{{ formatMoney(row.amount) }}</template>
            </el-table-column>
            <el-table-column prop="create_time" label="创建时间" min-width="180" />
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              :current-page="logPagination.page"
              :page-size="logPagination.limit"
              :page-sizes="[10, 20, 50, 100]"
              :total="logPagination.total"
              background
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="handleLogPageChange"
              @size-change="handleLogSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="转盘次数数据" name="chance">
        <div class="panel">
          <div class="panel-header">
            <div class="page-title">
              <span>转盘次数数据</span>
              <el-tag type="info" effect="plain">真实接口：/lottery/chance/list</el-tag>
            </div>
            <div class="header-actions">
              <el-input
                v-model="chanceSearch.user_id"
                clearable
                placeholder="用户ID"
                style="width: 120px"
                @keyup.enter="handleChanceSearch"
              />
              <el-date-picker
                v-model="chanceSearch.date_range"
                type="datetimerange"
                value-format="YYYY-MM-DD HH:mm:ss"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                style="width: 320px"
              />
              <el-button @click="resetChanceSearch">重置</el-button>
              <el-button type="primary" @click="handleChanceSearch">查询</el-button>
            </div>
          </div>

          <el-table v-loading="chanceLoading" :data="chanceList" border>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column label="用户信息" min-width="220">
              <template #default="{ row }">
                <div class="info-cell">
                  <span>ID：{{ row.user_id }}</span>
                  <span>账号：{{ row.user_name || "-" }}</span>
                  <span>电话：{{ row.phone || "-" }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="total_chance" label="总次数" min-width="100" />
            <el-table-column prop="used_chance" label="已使用" min-width="100" />
            <el-table-column prop="today_chance" label="今日已转" min-width="100" />
            <el-table-column prop="rest_chance" label="剩余次数" min-width="100" />
            <el-table-column prop="last_spin_date" label="最后转盘日期" min-width="140" />
            <el-table-column prop="update_time" label="更新时间" min-width="180" />
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              :current-page="chancePagination.page"
              :page-size="chancePagination.limit"
              :page-sizes="[10, 20, 50, 100]"
              :total="chancePagination.total"
              background
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="handleChancePageChange"
              @size-change="handleChanceSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts" name="lotteryLogManage">
import { onMounted, reactive, ref } from "vue";
import { Activity } from "@/api/interface";
import { getLotteryChanceList, getLotteryLogList } from "@/api/modules/activity";
import { currencyPrefix } from "@/utils";

const activeTab = ref("log");
const logLoading = ref(false);
const chanceLoading = ref(false);
const logList = ref<Activity.LotteryLogItem[]>([]);
const chanceList = ref<Activity.LotteryChanceItem[]>([]);

const logPagination = reactive({ page: 1, limit: 20, total: 0 });
const chancePagination = reactive({ page: 1, limit: 20, total: 0 });
const logSearch = reactive({
  user_id: "",
  prize_type: undefined as number | undefined,
  date_range: [] as string[]
});
const chanceSearch = reactive({
  user_id: "",
  date_range: [] as string[]
});

const fetchLogList = async () => {
  logLoading.value = true;
  try {
    const res = await getLotteryLogList({
      page: logPagination.page,
      limit: logPagination.limit,
      user_id: logSearch.user_id || undefined,
      prize_type: logSearch.prize_type,
      start_time: logSearch.date_range?.[0],
      end_time: logSearch.date_range?.[1]
    });
    logList.value = res.data.data || [];
    logPagination.total = Number(res.data.total || 0);
  } finally {
    logLoading.value = false;
  }
};

const fetchChanceList = async () => {
  chanceLoading.value = true;
  try {
    const res = await getLotteryChanceList({
      page: chancePagination.page,
      limit: chancePagination.limit,
      user_id: chanceSearch.user_id || undefined,
      start_time: chanceSearch.date_range?.[0],
      end_time: chanceSearch.date_range?.[1]
    });
    chanceList.value = res.data.data || [];
    chancePagination.total = Number(res.data.total || 0);
  } finally {
    chanceLoading.value = false;
  }
};

const handleLogSearch = async () => {
  logPagination.page = 1;
  await fetchLogList();
};

const resetLogSearch = async () => {
  logSearch.user_id = "";
  logSearch.prize_type = undefined;
  logSearch.date_range = [];
  logPagination.page = 1;
  await fetchLogList();
};

const handleChanceSearch = async () => {
  chancePagination.page = 1;
  await fetchChanceList();
};

const resetChanceSearch = async () => {
  chanceSearch.user_id = "";
  chanceSearch.date_range = [];
  chancePagination.page = 1;
  await fetchChanceList();
};

const handleLogPageChange = (page: number) => {
  logPagination.page = page;
  fetchLogList();
};

const handleLogSizeChange = (size: number) => {
  logPagination.limit = size;
  logPagination.page = 1;
  fetchLogList();
};

const handleChancePageChange = (page: number) => {
  chancePagination.page = page;
  fetchChanceList();
};

const handleChanceSizeChange = (size: number) => {
  chancePagination.limit = size;
  chancePagination.page = 1;
  fetchChanceList();
};

const formatMoney = (value: number | string) => Number(value || 0).toFixed(2);

onMounted(async () => {
  await Promise.allSettled([fetchLogList(), fetchChanceList()]);
});
</script>

<style scoped lang="scss">
.lottery-log-page {
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
.panel-header,
.page-title,
.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.panel-header {
  justify-content: space-between;
  margin-bottom: 16px;
}
.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.info-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #4b5563;
}
@media (max-width: 768px) {
  .panel-header,
  .page-title,
  .header-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
