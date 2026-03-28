<template>
  <div class="activity-page">
    <div class="summary-grid">
      <div class="summary-card">
        <span class="summary-label">每日注入金额</span>
        <strong>{{ currencyPrefix }}{{ formatMoney(currentConfig?.daily_amount || 0) }}</strong>
      </div>
      <div class="summary-card success">
        <span class="summary-label">开奖时间</span>
        <strong>{{ currentConfig?.draw_time || "--:--" }}</strong>
      </div>
      <div class="summary-card primary">
        <span class="summary-label">一等奖</span>
        <strong>{{ currencyPrefix }}{{ formatMoney(currentConfig?.prize_1_amount || 0) }}</strong>
      </div>
      <div class="summary-card warning">
        <span class="summary-label">开奖记录</span>
        <strong>{{ logPagination.total }}</strong>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="page-title">
          <span>奖池配置</span>
          <el-tag type="success" effect="plain">真实接口：/prize/pool/config/list</el-tag>
        </div>
        <el-button type="primary" @click="openConfigDialog(currentConfig)">编辑配置</el-button>
      </div>

      <el-table v-loading="configLoading" :data="configList" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="daily_amount" label="每日注入金额" min-width="150">
          <template #default="{ row }">{{ currencyPrefix }}{{ formatMoney(row.daily_amount) }}</template>
        </el-table-column>
        <el-table-column prop="prize_1_amount" label="一等奖" min-width="120">
          <template #default="{ row }">{{ currencyPrefix }}{{ formatMoney(row.prize_1_amount) }}</template>
        </el-table-column>
        <el-table-column prop="prize_2_amount" label="二等奖" min-width="120">
          <template #default="{ row }">{{ currencyPrefix }}{{ formatMoney(row.prize_2_amount) }}</template>
        </el-table-column>
        <el-table-column prop="prize_3_amount" label="三等奖" min-width="120">
          <template #default="{ row }">{{ currencyPrefix }}{{ formatMoney(row.prize_3_amount) }}</template>
        </el-table-column>
        <el-table-column prop="draw_time" label="开奖时间" min-width="100" />
      </el-table>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="page-title">
          <span>奖池开奖记录</span>
          <el-tag type="info" effect="plain">真实接口：/prize/pool/log/list</el-tag>
        </div>
        <div class="header-actions">
          <el-input
            v-model="logSearch.user_id"
            clearable
            placeholder="用户ID"
            style="width: 120px"
            @keyup.enter="handleLogSearch"
          />
          <el-select v-model="logSearch.prize_level" clearable placeholder="奖项" style="width: 120px">
            <el-option label="一等奖" :value="1" />
            <el-option label="二等奖" :value="2" />
            <el-option label="三等奖" :value="3" />
          </el-select>
          <el-select v-model="logSearch.status" clearable placeholder="状态" style="width: 120px">
            <el-option label="待领取" :value="0" />
            <el-option label="已领取" :value="1" />
            <el-option label="已过期" :value="2" />
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
        <el-table-column prop="user_id" label="用户ID" width="100" />
        <el-table-column prop="user_name" label="账号" min-width="160" />
        <el-table-column prop="prize_level" label="奖项" min-width="100">
          <template #default="{ row }">{{ getPrizeLevelText(row.prize_level) }}</template>
        </el-table-column>
        <el-table-column prop="prize_amount" label="奖金" min-width="120">
          <template #default="{ row }">{{ currencyPrefix }}{{ formatMoney(row.prize_amount) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">{{ getPrizeStatusText(row.status) }}</template>
        </el-table-column>
        <el-table-column prop="prize_date" label="获奖日期" min-width="120" />
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

    <el-dialog v-model="configDialogVisible" :title="configForm.id ? '编辑奖池配置' : '新增奖池配置'" width="560px">
      <el-form :model="configForm" label-width="110px">
        <el-form-item label="每日注入金额">
          <el-input-number v-model="configForm.daily_amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="一等奖金额">
          <el-input-number v-model="configForm.prize_1_amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="二等奖金额">
          <el-input-number v-model="configForm.prize_2_amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="三等奖金额">
          <el-input-number v-model="configForm.prize_3_amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="开奖时间"><el-input v-model="configForm.draw_time" placeholder="例如 05:00" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveConfig">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="prizePoolManage">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Activity } from "@/api/interface";
import { addPrizePoolConfig, getPrizePoolConfigList, getPrizePoolLogList, updatePrizePoolConfig } from "@/api/modules/activity";
import { currencyPrefix } from "@/utils";

const configLoading = ref(false);
const logLoading = ref(false);
const configDialogVisible = ref(false);

const configList = ref<Activity.PrizePoolConfigItem[]>([]);
const logList = ref<Activity.PrizePoolLogItem[]>([]);

const logPagination = reactive({ page: 1, limit: 20, total: 0 });
const logSearch = reactive({
  user_id: "",
  prize_level: undefined as number | undefined,
  status: undefined as number | undefined,
  date_range: [] as string[]
});

const configForm = reactive<Activity.SavePrizePoolConfigParams>({
  daily_amount: 0,
  prize_1_amount: 0,
  prize_2_amount: 0,
  prize_3_amount: 0,
  draw_time: "05:00"
});

const currentConfig = computed(() => configList.value[0]);

const resetConfigForm = () => {
  delete configForm.id;
  configForm.daily_amount = 0;
  configForm.prize_1_amount = 0;
  configForm.prize_2_amount = 0;
  configForm.prize_3_amount = 0;
  configForm.draw_time = "05:00";
};

const openConfigDialog = (row?: Activity.PrizePoolConfigItem) => {
  resetConfigForm();
  if (row) {
    configForm.id = row.id;
    configForm.daily_amount = Number(row.daily_amount);
    configForm.prize_1_amount = Number(row.prize_1_amount);
    configForm.prize_2_amount = Number(row.prize_2_amount);
    configForm.prize_3_amount = Number(row.prize_3_amount);
    configForm.draw_time = row.draw_time;
  }
  configDialogVisible.value = true;
};

const fetchConfigList = async () => {
  configLoading.value = true;
  try {
    const res = await getPrizePoolConfigList({ page: 1, limit: 20 });
    configList.value = res.data.data || [];
    if (!configList.value.length) openConfigDialog();
  } finally {
    configLoading.value = false;
  }
};

const fetchLogList = async () => {
  logLoading.value = true;
  try {
    const res = await getPrizePoolLogList({
      page: logPagination.page,
      limit: logPagination.limit,
      user_id: logSearch.user_id || undefined,
      prize_level: logSearch.prize_level,
      status: logSearch.status,
      start_time: logSearch.date_range?.[0],
      end_time: logSearch.date_range?.[1]
    });
    logList.value = res.data.data || [];
    logPagination.total = Number(res.data.total || 0);
  } finally {
    logLoading.value = false;
  }
};

const handleSaveConfig = async () => {
  const payload: Activity.SavePrizePoolConfigParams = {
    ...(configForm.id ? { id: configForm.id } : {}),
    daily_amount: Number(configForm.daily_amount),
    prize_1_amount: Number(configForm.prize_1_amount),
    prize_2_amount: Number(configForm.prize_2_amount),
    prize_3_amount: Number(configForm.prize_3_amount),
    draw_time: configForm.draw_time
  };
  const res = configForm.id ? await updatePrizePoolConfig(payload) : await addPrizePoolConfig(payload);
  ElMessage.success(res.message || "奖池配置保存成功");
  configDialogVisible.value = false;
  await fetchConfigList();
};

const handleLogSearch = async () => {
  logPagination.page = 1;
  await fetchLogList();
};

const resetLogSearch = async () => {
  logSearch.user_id = "";
  logSearch.prize_level = undefined;
  logSearch.status = undefined;
  logSearch.date_range = [];
  logPagination.page = 1;
  await fetchLogList();
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

const getPrizeLevelText = (value: number | string) =>
  ({ 1: "一等奖", 2: "二等奖", 3: "三等奖" })[Number(value)] || `奖项${value}`;
const getPrizeStatusText = (value: number | string) =>
  ({ 0: "待领取", 1: "已领取", 2: "已过期" })[Number(value)] || `状态${value}`;
const formatMoney = (value: number | string) => Number(value || 0).toFixed(2);

onMounted(async () => {
  await Promise.allSettled([fetchConfigList(), fetchLogList()]);
});
</script>

<style scoped lang="scss">
.activity-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
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
.summary-card.success {
  border-color: #bbf7d0;
  background: #f0fdf4;
}
.summary-card.primary {
  border-color: #bfdbfe;
  background: #eff6ff;
}
.summary-card.warning {
  border-color: #fde68a;
  background: #fffbeb;
}
.summary-label {
  font-size: 13px;
  color: #6b7280;
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
@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 768px) {
  .summary-grid {
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
