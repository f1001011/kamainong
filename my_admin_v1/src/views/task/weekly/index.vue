<template>
  <div class="task-page">
    <div class="summary-grid">
      <div class="summary-card">
        <span class="summary-label">任务配置数</span>
        <strong>{{ configPagination.total }}</strong>
      </div>
      <div class="summary-card success">
        <span class="summary-label">启用任务数</span>
        <strong>{{ enabledTaskCount }}</strong>
      </div>
      <div class="summary-card primary">
        <span class="summary-label">任务进度记录</span>
        <strong>{{ progressPagination.total }}</strong>
      </div>
      <div class="summary-card warning">
        <span class="summary-label">奖励发放记录</span>
        <strong>{{ rewardPagination.total }}</strong>
      </div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="任务配置" name="config">
        <div class="panel">
          <div class="panel-header">
            <div class="page-title">
              <span>周任务配置</span>
              <el-tag type="success" effect="plain">真实接口：/task/config/list</el-tag>
            </div>
            <div class="header-actions">
              <el-input
                v-model="configSearch.id"
                clearable
                placeholder="ID"
                style="width: 100px"
                @keyup.enter="handleConfigSearch"
              />
              <el-select v-model="configSearch.task_group" clearable placeholder="任务组" style="width: 150px">
                <el-option label="LV2邀请任务" :value="1" />
                <el-option label="LV1邀请任务" :value="2" />
              </el-select>
              <el-select v-model="configSearch.invite_level" clearable placeholder="邀请等级" style="width: 120px">
                <el-option label="LV1" value="LV1" />
                <el-option label="LV2" value="LV2" />
              </el-select>
              <el-select v-model="configSearch.status" clearable placeholder="状态" style="width: 120px">
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="0" />
              </el-select>
              <el-button @click="resetConfigSearch">重置</el-button>
              <el-button type="primary" plain @click="handleConfigSearch">查询</el-button>
              <el-button @click="fetchConfigList">刷新</el-button>
              <el-button type="primary" @click="openConfigDialog()">新增任务</el-button>
            </div>
          </div>

          <el-table v-loading="configLoading" :data="configList" border>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="task_group" label="任务组" min-width="140">
              <template #default="{ row }">
                <el-tag :type="Number(row.task_group) === 1 ? 'warning' : 'primary'" effect="plain">
                  {{ getTaskGroupText(row.task_group) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="task_name" label="任务名称" min-width="220" />
            <el-table-column prop="required_invites" label="需邀请人数" min-width="120" />
            <el-table-column prop="invite_level" label="邀请等级" min-width="120">
              <template #default="{ row }">
                <el-tag :type="row.invite_level === 'LV2' ? 'success' : 'info'" effect="light">{{ row.invite_level }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reward_amount" label="奖励金额" min-width="120">
              <template #default="{ row }">{{ currencyPrefix }}{{ formatMoney(row.reward_amount) }}</template>
            </el-table-column>
            <el-table-column prop="sort" label="排序" min-width="80" />
            <el-table-column prop="status" label="状态" min-width="100">
              <template #default="{ row }">
                <el-tag :type="Number(row.status) === 1 ? 'success' : 'info'" effect="light">
                  {{ Number(row.status) === 1 ? "启用" : "禁用" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="openConfigDialog(row)">编辑</el-button>
                <el-button type="danger" link @click="handleDeleteConfig(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              :current-page="configPagination.page"
              :page-size="configPagination.limit"
              :page-sizes="[10, 20, 50, 100]"
              :total="configPagination.total"
              background
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="handleConfigPageChange"
              @size-change="handleConfigSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="任务进度" name="progress">
        <div class="panel">
          <div class="panel-header">
            <div class="page-title">
              <span>任务进度记录</span>
              <el-tag type="info" effect="plain">真实接口：/task/progress/list</el-tag>
            </div>
            <div class="header-actions">
              <el-input
                v-model="progressSearch.user_id"
                clearable
                placeholder="用户ID"
                style="width: 120px"
                @keyup.enter="handleProgressSearch"
              />
              <el-select v-model="progressSearch.task_group" clearable placeholder="任务组" style="width: 150px">
                <el-option label="LV2邀请任务" :value="1" />
                <el-option label="LV1邀请任务" :value="2" />
              </el-select>
              <el-select v-model="progressSearch.is_completed" clearable placeholder="完成状态" style="width: 130px">
                <el-option label="未完成" :value="0" />
                <el-option label="已完成" :value="1" />
              </el-select>
              <el-select v-model="progressSearch.is_claimed" clearable placeholder="领取状态" style="width: 130px">
                <el-option label="未领取" :value="0" />
                <el-option label="已领取" :value="1" />
              </el-select>
              <el-input
                v-model="progressSearch.task_id"
                clearable
                placeholder="任务ID"
                style="width: 120px"
                @keyup.enter="handleProgressSearch"
              />
              <el-date-picker
                v-model="progressSearch.date_range"
                type="datetimerange"
                value-format="YYYY-MM-DD HH:mm:ss"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                style="width: 320px"
              />
              <el-button @click="resetProgressSearch">重置</el-button>
              <el-button type="primary" @click="handleProgressSearch">查询</el-button>
            </div>
          </div>

          <el-table v-loading="progressLoading" :data="progressList" border>
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
            <el-table-column prop="task_name" label="任务名称" min-width="220" />
            <el-table-column prop="task_group" label="任务组" min-width="130">
              <template #default="{ row }">{{ getTaskGroupText(row.task_group) }}</template>
            </el-table-column>
            <el-table-column prop="current_progress" label="当前进度" min-width="100" />
            <el-table-column prop="reward_amount" label="奖励金额" min-width="120">
              <template #default="{ row }">{{ currencyPrefix }}{{ formatMoney(row.reward_amount || 0) }}</template>
            </el-table-column>
            <el-table-column prop="is_completed" label="完成状态" min-width="110">
              <template #default="{ row }">
                <el-tag :type="Number(row.is_completed) === 1 ? 'success' : 'info'" effect="light">
                  {{ Number(row.is_completed) === 1 ? "已完成" : "未完成" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="is_claimed" label="领取状态" min-width="110">
              <template #default="{ row }">
                <el-tag :type="Number(row.is_claimed) === 1 ? 'success' : 'warning'" effect="light">
                  {{ Number(row.is_claimed) === 1 ? "已领取" : "未领取" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="week_start_date" label="周开始日期" min-width="140" />
            <el-table-column prop="update_time" label="更新时间" min-width="180" />
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              :current-page="progressPagination.page"
              :page-size="progressPagination.limit"
              :page-sizes="[10, 20, 50, 100]"
              :total="progressPagination.total"
              background
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="handleProgressPageChange"
              @size-change="handleProgressSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="奖励记录" name="reward">
        <div class="panel">
          <div class="summary-grid reward-summary-grid">
            <div v-for="item in rewardPeriodCards" :key="item.key" class="summary-card primary">
              <span class="summary-label">{{ item.title }}</span>
              <strong>{{ currencyPrefix }}{{ formatMoney(item.data.reward_amount) }}</strong>
              <span class="summary-label">人数 {{ item.data.user_count }} · 任务 {{ item.data.task_count }}</span>
            </div>
          </div>

          <div class="panel-header">
            <div class="page-title">
              <span>任务奖励记录</span>
              <el-tag type="info" effect="plain">真实接口：/task/reward/log/list</el-tag>
            </div>
            <div class="header-actions">
              <el-input
                v-model="rewardSearch.user_id"
                clearable
                placeholder="用户ID"
                style="width: 120px"
                @keyup.enter="handleRewardSearch"
              />
              <el-input
                v-model="rewardSearch.task_id"
                clearable
                placeholder="任务ID"
                style="width: 120px"
                @keyup.enter="handleRewardSearch"
              />
              <el-date-picker
                v-model="rewardSearch.date_range"
                type="datetimerange"
                value-format="YYYY-MM-DD HH:mm:ss"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                style="width: 320px"
              />
              <el-button @click="resetRewardSearch">重置</el-button>
              <el-button type="primary" @click="handleRewardSearch">查询</el-button>
            </div>
          </div>

          <el-table v-loading="rewardLoading" :data="rewardList" border>
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
            <el-table-column prop="task_name" label="任务名称" min-width="220" />
            <el-table-column prop="reward_amount" label="奖励金额" min-width="120">
              <template #default="{ row }">{{ currencyPrefix }}{{ formatMoney(row.reward_amount) }}</template>
            </el-table-column>
            <el-table-column prop="week_start_date" label="周开始日期" min-width="140" />
            <el-table-column prop="create_time" label="领取时间" min-width="180" />
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              :current-page="rewardPagination.page"
              :page-size="rewardPagination.limit"
              :page-sizes="[10, 20, 50, 100]"
              :total="rewardPagination.total"
              background
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="handleRewardPageChange"
              @size-change="handleRewardSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="configDialogVisible" :title="configForm.id ? '编辑任务配置' : '新增任务配置'" width="620px">
      <el-form :model="configForm" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="任务组">
              <el-select v-model="configForm.task_group" style="width: 100%">
                <el-option label="LV2邀请任务" :value="1" />
                <el-option label="LV1邀请任务" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务名称">
              <el-input v-model="configForm.task_name" placeholder="请输入任务名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邀请人数">
              <el-input-number v-model="configForm.required_invites" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邀请等级">
              <el-select v-model="configForm.invite_level" style="width: 100%">
                <el-option label="LV1" value="LV1" />
                <el-option label="LV2" value="LV2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="奖励金额">
              <el-input-number v-model="configForm.reward_amount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="configForm.sort" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="configForm.status" style="width: 100%">
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="0" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveConfig">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="weeklyTaskManage">
import dayjs from "dayjs";
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Task } from "@/api/interface";
import {
  addTaskConfig,
  deleteTaskConfig,
  getTaskConfigList,
  getTaskProgressList,
  getTaskRewardLogList,
  getTaskRewardStats,
  updateTaskConfig
} from "@/api/modules/task";
import { currencyPrefix } from "@/utils";

const activeTab = ref("config");

const configLoading = ref(false);
const progressLoading = ref(false);
const rewardLoading = ref(false);

const configList = ref<Task.ResConfigItem[]>([]);
const progressList = ref<Task.ResProgressItem[]>([]);
const rewardList = ref<Task.ResRewardLogItem[]>([]);

const configPagination = reactive({ page: 1, limit: 20, total: 0 });
const progressPagination = reactive({ page: 1, limit: 20, total: 0 });
const rewardPagination = reactive({ page: 1, limit: 20, total: 0 });

const configSearch = reactive({
  id: "",
  task_group: undefined as number | undefined,
  invite_level: "",
  status: undefined as number | undefined
});

const progressSearch = reactive({
  user_id: "",
  task_id: "",
  task_group: undefined as number | undefined,
  is_completed: undefined as number | undefined,
  is_claimed: undefined as number | undefined,
  date_range: [] as string[]
});

const rewardSearch = reactive({
  user_id: "",
  task_id: "",
  date_range: [] as string[]
});

const createRewardStats = (): Task.RewardStatsData => ({
  total_count: 0,
  user_count: 0,
  task_count: 0,
  reward_amount: 0
});

const rewardPeriodStats = reactive<Record<string, Task.RewardStatsData>>({
  today: createRewardStats(),
  yesterday: createRewardStats(),
  week: createRewardStats(),
  month: createRewardStats()
});

const configDialogVisible = ref(false);

const configForm = reactive<Task.SaveConfigParams>({
  task_group: 1,
  task_name: "",
  required_invites: 1,
  invite_level: "LV2",
  reward_amount: 0,
  sort: 0,
  status: 1
});

const enabledTaskCount = computed(() => configList.value.filter(item => Number(item.status) === 1).length);
const rewardPeriodCards = computed(() => [
  { key: "today", title: "今天", data: rewardPeriodStats.today },
  { key: "yesterday", title: "昨天", data: rewardPeriodStats.yesterday },
  { key: "week", title: "本周", data: rewardPeriodStats.week },
  { key: "month", title: "本月", data: rewardPeriodStats.month }
]);

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

const fetchRewardPeriodStats = async () => {
  const [todayRes, yesterdayRes, weekRes, monthRes] = await Promise.all([
    getTaskRewardStats(getPeriodRange("today")),
    getTaskRewardStats(getPeriodRange("yesterday")),
    getTaskRewardStats(getPeriodRange("week")),
    getTaskRewardStats(getPeriodRange("month"))
  ]);

  rewardPeriodStats.today = todayRes.data;
  rewardPeriodStats.yesterday = yesterdayRes.data;
  rewardPeriodStats.week = weekRes.data;
  rewardPeriodStats.month = monthRes.data;
};

const resetConfigForm = () => {
  delete configForm.id;
  configForm.task_group = 1;
  configForm.task_name = "";
  configForm.required_invites = 1;
  configForm.invite_level = "LV2";
  configForm.reward_amount = 0;
  configForm.sort = 0;
  configForm.status = 1;
};

const openConfigDialog = (row?: Task.ResConfigItem) => {
  resetConfigForm();
  if (row) {
    configForm.id = row.id;
    configForm.task_group = Number(row.task_group);
    configForm.task_name = row.task_name;
    configForm.required_invites = Number(row.required_invites);
    configForm.invite_level = row.invite_level;
    configForm.reward_amount = Number(row.reward_amount);
    configForm.sort = Number(row.sort);
    configForm.status = Number(row.status);
  }
  configDialogVisible.value = true;
};

const fetchConfigList = async () => {
  configLoading.value = true;
  try {
    const res = await getTaskConfigList({
      page: configPagination.page,
      limit: configPagination.limit,
      id: configSearch.id || undefined,
      task_group: configSearch.task_group,
      invite_level: configSearch.invite_level || undefined,
      status: configSearch.status
    });
    configList.value = res.data.data || [];
    configPagination.total = Number(res.data.total || 0);
  } finally {
    configLoading.value = false;
  }
};

const fetchProgressList = async () => {
  progressLoading.value = true;
  try {
    const res = await getTaskProgressList({
      page: progressPagination.page,
      limit: progressPagination.limit,
      user_id: progressSearch.user_id || undefined,
      task_id: progressSearch.task_id || undefined,
      task_group: progressSearch.task_group,
      is_completed: progressSearch.is_completed,
      is_claimed: progressSearch.is_claimed,
      start_time: progressSearch.date_range?.[0],
      end_time: progressSearch.date_range?.[1]
    });
    progressList.value = res.data.data || [];
    progressPagination.total = Number(res.data.total || 0);
  } finally {
    progressLoading.value = false;
  }
};

const fetchRewardList = async () => {
  rewardLoading.value = true;
  try {
    const res = await getTaskRewardLogList({
      page: rewardPagination.page,
      limit: rewardPagination.limit,
      user_id: rewardSearch.user_id || undefined,
      task_id: rewardSearch.task_id || undefined,
      start_time: rewardSearch.date_range?.[0],
      end_time: rewardSearch.date_range?.[1]
    });
    rewardList.value = res.data.data || [];
    rewardPagination.total = Number(res.data.total || 0);
  } finally {
    rewardLoading.value = false;
  }
};

const handleSaveConfig = async () => {
  const payload: Task.SaveConfigParams = {
    ...(configForm.id ? { id: configForm.id } : {}),
    task_group: Number(configForm.task_group),
    task_name: configForm.task_name,
    required_invites: Number(configForm.required_invites),
    invite_level: configForm.invite_level,
    reward_amount: Number(configForm.reward_amount),
    sort: Number(configForm.sort),
    status: Number(configForm.status)
  };

  const res = configForm.id ? await updateTaskConfig(payload) : await addTaskConfig(payload);
  ElMessage.success(res.message || "任务配置保存成功");
  configDialogVisible.value = false;
  await fetchConfigList();
};

const handleDeleteConfig = (row: Task.ResConfigItem) => {
  ElMessageBox.confirm(`确认删除任务“${row.task_name}”吗？`, "删除确认", { type: "warning" }).then(async () => {
    const res = await deleteTaskConfig({ id: row.id });
    ElMessage.success(res.message || "任务配置已删除");
    await fetchConfigList();
  });
};

const handleProgressSearch = async () => {
  progressPagination.page = 1;
  await fetchProgressList();
};

const handleConfigSearch = async () => {
  configPagination.page = 1;
  await fetchConfigList();
};

const resetConfigSearch = async () => {
  configSearch.id = "";
  configSearch.task_group = undefined;
  configSearch.invite_level = "";
  configSearch.status = undefined;
  configPagination.page = 1;
  await fetchConfigList();
};

const resetProgressSearch = async () => {
  progressSearch.user_id = "";
  progressSearch.task_id = "";
  progressSearch.task_group = undefined;
  progressSearch.is_completed = undefined;
  progressSearch.is_claimed = undefined;
  progressSearch.date_range = [];
  progressPagination.page = 1;
  await fetchProgressList();
};

const handleRewardSearch = async () => {
  rewardPagination.page = 1;
  await fetchRewardList();
};

const resetRewardSearch = async () => {
  rewardSearch.user_id = "";
  rewardSearch.task_id = "";
  rewardSearch.date_range = [];
  rewardPagination.page = 1;
  await fetchRewardList();
};

const handleConfigPageChange = (page: number) => {
  configPagination.page = page;
  fetchConfigList();
};

const handleConfigSizeChange = (size: number) => {
  configPagination.limit = size;
  configPagination.page = 1;
  fetchConfigList();
};

const handleProgressPageChange = (page: number) => {
  progressPagination.page = page;
  fetchProgressList();
};

const handleProgressSizeChange = (size: number) => {
  progressPagination.limit = size;
  progressPagination.page = 1;
  fetchProgressList();
};

const handleRewardPageChange = (page: number) => {
  rewardPagination.page = page;
  fetchRewardList();
};

const handleRewardSizeChange = (size: number) => {
  rewardPagination.limit = size;
  rewardPagination.page = 1;
  fetchRewardList();
};

const getTaskGroupText = (value?: number | string) => {
  return Number(value) === 1 ? "LV2邀请任务" : "LV1邀请任务";
};

const formatMoney = (value: number | string) => Number(value || 0).toFixed(2);

onMounted(async () => {
  await Promise.allSettled([fetchConfigList(), fetchProgressList(), fetchRewardList(), fetchRewardPeriodStats()]);
});
</script>

<style scoped lang="scss">
.task-page {
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
  background: #ffffff;
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

.reward-summary-grid {
  margin-bottom: 16px;
}

.panel {
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
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
  .header-actions,
  .page-title {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }
}
</style>
