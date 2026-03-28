<template>
  <div class="vip-page">
    <div class="summary-grid">
      <div class="summary-card">
        <span class="summary-label">VIP 档位总数</span>
        <strong>{{ vipPagination.total }}</strong>
      </div>
      <div class="summary-card success">
        <span class="summary-label">最高 VIP</span>
        <strong>VIP{{ highestVip }}</strong>
      </div>
      <div class="summary-card primary">
        <span class="summary-label">代理等级数</span>
        <strong>{{ agentPagination.total }}</strong>
      </div>
      <div class="summary-card warning">
        <span class="summary-label">奖励记录数</span>
        <strong>{{ rewardLogPagination.total }}</strong>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="vip-tabs">
      <el-tab-pane label="VIP 配置" name="vip">
        <div class="panel">
          <div class="panel-header">
            <div class="page-title">
              <span>VIP 等级配置</span>
              <el-tag type="success" effect="plain">真实接口：/vip/list</el-tag>
            </div>
            <div class="header-actions">
              <el-input v-model="vipSearch.id" clearable placeholder="ID" style="width: 100px" @keyup.enter="handleVipSearch" />
              <el-input
                v-model="vipSearch.vip"
                clearable
                placeholder="VIP等级"
                style="width: 120px"
                @keyup.enter="handleVipSearch"
              />
              <el-button @click="resetVipSearch">重置</el-button>
              <el-button type="primary" plain @click="handleVipSearch">查询</el-button>
              <el-button @click="fetchVipList">刷新</el-button>
              <el-button type="primary" @click="openVipDialog()">新增 VIP</el-button>
            </div>
          </div>

          <el-table v-loading="vipLoading" :data="vipList" border>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="vip" label="VIP 等级" width="120">
              <template #default="{ row }">
                <el-tag type="warning" effect="light">VIP{{ row.vip }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="experience" label="所需经验" min-width="120" />
            <el-table-column prop="reward_money" label="每日奖励" min-width="120">
              <template #default="{ row }">{{ currencyPrefix }}{{ formatMoney(row.reward_money) }}</template>
            </el-table-column>
            <el-table-column prop="buy_goods_id" label="产品 ID" min-width="120" />
            <el-table-column prop="buy_goods_num" label="购买数量" min-width="120" />
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="openVipDialog(row)">编辑</el-button>
                <el-button type="danger" link @click="handleDeleteVip(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              :current-page="vipPagination.page"
              :page-size="vipPagination.limit"
              :page-sizes="[10, 20, 50, 100]"
              :total="vipPagination.total"
              background
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="handleVipPageChange"
              @size-change="handleVipSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="代理等级配置" name="agent">
        <div class="panel">
          <div class="panel-header">
            <div class="page-title">
              <span>代理等级配置</span>
              <el-tag type="success" effect="plain">真实接口：/agent/level/config/list</el-tag>
            </div>
            <div class="header-actions">
              <el-input
                v-model="agentSearch.id"
                clearable
                placeholder="ID"
                style="width: 100px"
                @keyup.enter="handleAgentSearch"
              />
              <el-input
                v-model="agentSearch.level"
                clearable
                placeholder="等级"
                style="width: 100px"
                @keyup.enter="handleAgentSearch"
              />
              <el-select v-model="agentSearch.member_type" clearable placeholder="会员类型" style="width: 140px">
                <el-option label="LV1" value="LV1" />
                <el-option label="LV123" value="LV123" />
              </el-select>
              <el-button @click="resetAgentSearch">重置</el-button>
              <el-button type="primary" plain @click="handleAgentSearch">查询</el-button>
              <el-button @click="fetchAgentList">刷新</el-button>
              <el-button type="primary" @click="openAgentDialog()">新增等级</el-button>
            </div>
          </div>

          <el-table v-loading="agentLoading" :data="agentList" border>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="level" label="等级" width="100">
              <template #default="{ row }">
                <el-tag type="primary" effect="light">LV{{ row.level }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="level_name" label="等级名称" min-width="160" />
            <el-table-column prop="required_members" label="所需会员数" min-width="140" />
            <el-table-column prop="member_type" label="会员类型" min-width="120">
              <template #default="{ row }">
                <el-tag :type="row.member_type === 'LV1' ? 'success' : 'warning'" effect="plain">
                  {{ row.member_type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reward_amount" label="一次性奖励" min-width="140">
              <template #default="{ row }">{{ currencyPrefix }}{{ formatMoney(row.reward_amount) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="openAgentDialog(row)">编辑</el-button>
                <el-button type="danger" link @click="handleDeleteAgent(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              :current-page="agentPagination.page"
              :page-size="agentPagination.limit"
              :page-sizes="[10, 20, 50, 100]"
              :total="agentPagination.total"
              background
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="handleAgentPageChange"
              @size-change="handleAgentSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="VIP 变更日志" name="vip-log">
        <div class="panel">
          <div class="panel-header">
            <div class="page-title">
              <span>VIP 变更日志</span>
              <el-tag type="info" effect="plain">真实接口：/vip/log/list</el-tag>
            </div>
            <div class="header-actions">
              <el-input
                v-model="vipLogSearch.start_level"
                clearable
                placeholder="开始等级"
                style="width: 120px"
                @keyup.enter="handleVipLogSearch"
              />
              <el-input
                v-model="vipLogSearch.end_level"
                clearable
                placeholder="结束等级"
                style="width: 120px"
                @keyup.enter="handleVipLogSearch"
              />
              <el-date-picker
                v-model="vipLogSearch.date_range"
                type="datetimerange"
                value-format="YYYY-MM-DD HH:mm:ss"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                style="width: 320px"
              />
              <el-button @click="resetVipLogSearch">重置</el-button>
              <el-button type="primary" plain @click="handleVipLogSearch">查询</el-button>
              <el-button @click="fetchVipLogList">刷新</el-button>
            </div>
          </div>

          <el-table v-loading="vipLogLoading" :data="vipLogList" border>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="start_exp" label="开始经验" min-width="120" />
            <el-table-column prop="end_exp" label="结束经验" min-width="120" />
            <el-table-column prop="start_level" label="开始等级" min-width="120">
              <template #default="{ row }">VIP{{ row.start_level }}</template>
            </el-table-column>
            <el-table-column prop="end_level" label="结束等级" min-width="120">
              <template #default="{ row }">VIP{{ row.end_level }}</template>
            </el-table-column>
            <el-table-column prop="remarks" label="备注" min-width="220" show-overflow-tooltip />
            <el-table-column prop="create_time" label="创建时间" min-width="180" />
            <el-table-column prop="update_time" label="更新时间" min-width="180" />
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              :current-page="vipLogPagination.page"
              :page-size="vipLogPagination.limit"
              :page-sizes="[10, 20, 50, 100]"
              :total="vipLogPagination.total"
              background
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="handleVipLogPageChange"
              @size-change="handleVipLogSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="每日奖励记录" name="reward-log">
        <div class="panel">
          <div class="panel-header">
            <div class="page-title">
              <span>VIP 每日奖励记录</span>
              <el-tag type="info" effect="plain">真实接口：/vip/daily/reward/log/list</el-tag>
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
                v-model="rewardSearch.vip_level"
                clearable
                placeholder="VIP等级"
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

          <el-table v-loading="rewardLogLoading" :data="rewardLogList" border>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="user_id" label="用户ID" width="100" />
            <el-table-column label="用户信息" min-width="240">
              <template #default="{ row }">
                <div class="info-cell">
                  <span>账号：{{ row.user_name || "-" }}</span>
                  <span>昵称：{{ row.nickname || "-" }}</span>
                  <span>电话：{{ row.phone || "-" }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="vip_level" label="VIP等级" min-width="100">
              <template #default="{ row }">
                <el-tag type="warning" effect="light">VIP{{ row.vip_level }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reward_amount" label="奖励金额" min-width="120">
              <template #default="{ row }">{{ currencyPrefix }}{{ formatMoney(row.reward_amount) }}</template>
            </el-table-column>
            <el-table-column prop="claim_date" label="领取日期" min-width="140" />
            <el-table-column prop="create_time" label="创建时间" min-width="180" />
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              :current-page="rewardLogPagination.page"
              :page-size="rewardLogPagination.limit"
              :page-sizes="[10, 20, 50, 100]"
              :total="rewardLogPagination.total"
              background
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="handleRewardPageChange"
              @size-change="handleRewardSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="vipDialogVisible" :title="vipForm.id ? '编辑 VIP 配置' : '新增 VIP 配置'" width="560px">
      <el-form :model="vipForm" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="VIP等级">
              <el-input-number v-model="vipForm.vip" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所需经验">
              <el-input-number v-model="vipForm.experience" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每日奖励">
              <el-input-number v-model="vipForm.reward_money" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品ID">
              <el-input-number v-model="vipForm.buy_goods_id" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="购买数量">
              <el-input-number v-model="vipForm.buy_goods_num" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="vipDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveVip">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="agentDialogVisible" :title="agentForm.id ? '编辑代理等级' : '新增代理等级'" width="560px">
      <el-form :model="agentForm" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="代理等级">
              <el-input-number v-model="agentForm.level" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="等级名称">
              <el-input v-model="agentForm.level_name" placeholder="请输入等级名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所需会员数">
              <el-input-number v-model="agentForm.required_members" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="会员类型">
              <el-select v-model="agentForm.member_type" style="width: 100%">
                <el-option label="LV1" value="LV1" />
                <el-option label="LV123" value="LV123" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="奖励金额">
              <el-input-number v-model="agentForm.reward_amount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="agentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAgent">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="vipLevelManage">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Vip } from "@/api/interface";
import {
  addAgentLevelConfig,
  addVip,
  deleteAgentLevelConfig,
  deleteVip,
  getAgentLevelConfigList,
  getVipDailyRewardLogList,
  getVipList,
  getVipLogList,
  updateAgentLevelConfig,
  updateVip
} from "@/api/modules/vip";
import { currencyPrefix } from "@/utils";

const activeTab = ref("vip");

const vipLoading = ref(false);
const agentLoading = ref(false);
const vipLogLoading = ref(false);
const rewardLogLoading = ref(false);

const vipList = ref<Vip.ResVipListItem[]>([]);
const agentList = ref<Vip.ResAgentLevelConfigItem[]>([]);
const vipLogList = ref<Vip.ResVipLogItem[]>([]);
const rewardLogList = ref<Vip.ResVipDailyRewardLogItem[]>([]);

const vipPagination = reactive({ page: 1, limit: 20, total: 0 });
const agentPagination = reactive({ page: 1, limit: 20, total: 0 });
const vipLogPagination = reactive({ page: 1, limit: 20, total: 0 });
const rewardLogPagination = reactive({ page: 1, limit: 20, total: 0 });

const vipSearch = reactive({
  id: "",
  vip: ""
});

const agentSearch = reactive({
  id: "",
  level: "",
  member_type: ""
});

const vipLogSearch = reactive({
  start_level: "",
  end_level: "",
  date_range: [] as string[]
});

const rewardSearch = reactive({
  user_id: "",
  vip_level: "",
  date_range: [] as string[]
});

const vipDialogVisible = ref(false);
const agentDialogVisible = ref(false);

const vipForm = reactive<Vip.SaveVipParams>({
  vip: 1,
  experience: 0,
  reward_money: 0,
  buy_goods_id: 0,
  buy_goods_num: 0
});

const agentForm = reactive<Vip.SaveAgentLevelConfigParams>({
  level: 1,
  level_name: "",
  required_members: 0,
  member_type: "LV1",
  reward_amount: 0
});

const highestVip = computed(() => {
  if (!vipList.value.length) return 0;
  return Math.max(...vipList.value.map(item => Number(item.vip || 0)));
});

const resetVipForm = () => {
  delete vipForm.id;
  vipForm.vip = 1;
  vipForm.experience = 0;
  vipForm.reward_money = 0;
  vipForm.buy_goods_id = 0;
  vipForm.buy_goods_num = 0;
};

const resetAgentForm = () => {
  delete agentForm.id;
  agentForm.level = 1;
  agentForm.level_name = "";
  agentForm.required_members = 0;
  agentForm.member_type = "LV1";
  agentForm.reward_amount = 0;
};

const openVipDialog = (row?: Vip.ResVipListItem) => {
  resetVipForm();
  if (row) {
    vipForm.id = row.id;
    vipForm.vip = Number(row.vip);
    vipForm.experience = Number(row.experience);
    vipForm.reward_money = Number(row.reward_money);
    vipForm.buy_goods_id = Number(row.buy_goods_id);
    vipForm.buy_goods_num = Number(row.buy_goods_num);
  }
  vipDialogVisible.value = true;
};

const openAgentDialog = (row?: Vip.ResAgentLevelConfigItem) => {
  resetAgentForm();
  if (row) {
    agentForm.id = row.id;
    agentForm.level = Number(row.level);
    agentForm.level_name = row.level_name;
    agentForm.required_members = Number(row.required_members);
    agentForm.member_type = row.member_type;
    agentForm.reward_amount = Number(row.reward_amount);
  }
  agentDialogVisible.value = true;
};

const fetchVipList = async () => {
  vipLoading.value = true;
  try {
    const res = await getVipList({
      page: vipPagination.page,
      limit: vipPagination.limit,
      id: vipSearch.id || undefined,
      vip: vipSearch.vip || undefined
    });
    vipList.value = res.data.data || [];
    vipPagination.total = Number(res.data.total || 0);
  } finally {
    vipLoading.value = false;
  }
};

const fetchAgentList = async () => {
  agentLoading.value = true;
  try {
    const res = await getAgentLevelConfigList({
      page: agentPagination.page,
      limit: agentPagination.limit,
      id: agentSearch.id || undefined,
      level: agentSearch.level || undefined,
      member_type: agentSearch.member_type || undefined
    });
    agentList.value = res.data.data || [];
    agentPagination.total = Number(res.data.total || 0);
  } finally {
    agentLoading.value = false;
  }
};

const fetchVipLogList = async () => {
  vipLogLoading.value = true;
  try {
    const res = await getVipLogList({
      page: vipLogPagination.page,
      limit: vipLogPagination.limit,
      start_level: vipLogSearch.start_level || undefined,
      end_level: vipLogSearch.end_level || undefined,
      start_time: vipLogSearch.date_range?.[0],
      end_time: vipLogSearch.date_range?.[1]
    });
    vipLogList.value = res.data.data || [];
    vipLogPagination.total = Number(res.data.total || 0);
  } finally {
    vipLogLoading.value = false;
  }
};

const fetchRewardLogList = async () => {
  rewardLogLoading.value = true;
  try {
    const res = await getVipDailyRewardLogList({
      page: rewardLogPagination.page,
      limit: rewardLogPagination.limit,
      user_id: rewardSearch.user_id || undefined,
      vip_level: rewardSearch.vip_level || undefined,
      start_time: rewardSearch.date_range?.[0],
      end_time: rewardSearch.date_range?.[1]
    });
    rewardLogList.value = res.data.data || [];
    rewardLogPagination.total = Number(res.data.total || 0);
  } finally {
    rewardLogLoading.value = false;
  }
};

const handleSaveVip = async () => {
  const payload: Vip.SaveVipParams = {
    ...(vipForm.id ? { id: vipForm.id } : {}),
    vip: Number(vipForm.vip),
    experience: Number(vipForm.experience),
    reward_money: Number(vipForm.reward_money),
    buy_goods_id: Number(vipForm.buy_goods_id),
    buy_goods_num: Number(vipForm.buy_goods_num)
  };

  const res = vipForm.id ? await updateVip(payload) : await addVip(payload);
  ElMessage.success(res.message || "VIP 配置保存成功");
  vipDialogVisible.value = false;
  await fetchVipList();
};

const handleSaveAgent = async () => {
  const payload: Vip.SaveAgentLevelConfigParams = {
    ...(agentForm.id ? { id: agentForm.id } : {}),
    level: Number(agentForm.level),
    level_name: agentForm.level_name,
    required_members: Number(agentForm.required_members),
    member_type: agentForm.member_type,
    reward_amount: Number(agentForm.reward_amount)
  };

  const res = agentForm.id ? await updateAgentLevelConfig(payload) : await addAgentLevelConfig(payload);
  ElMessage.success(res.message || "代理等级保存成功");
  agentDialogVisible.value = false;
  await fetchAgentList();
};

const handleDeleteVip = (row: Vip.ResVipListItem) => {
  ElMessageBox.confirm(`确认删除 VIP${row.vip} 配置吗？`, "删除确认", { type: "warning" }).then(async () => {
    const res = await deleteVip({ id: row.id });
    ElMessage.success(res.message || "VIP 配置已删除");
    await fetchVipList();
  });
};

const handleDeleteAgent = (row: Vip.ResAgentLevelConfigItem) => {
  ElMessageBox.confirm(`确认删除代理等级 ${row.level_name} 吗？`, "删除确认", { type: "warning" }).then(async () => {
    const res = await deleteAgentLevelConfig({ id: row.id });
    ElMessage.success(res.message || "代理等级已删除");
    await fetchAgentList();
  });
};

const handleRewardSearch = async () => {
  rewardLogPagination.page = 1;
  await fetchRewardLogList();
};

const handleVipSearch = async () => {
  vipPagination.page = 1;
  await fetchVipList();
};

const resetVipSearch = async () => {
  vipSearch.id = "";
  vipSearch.vip = "";
  vipPagination.page = 1;
  await fetchVipList();
};

const handleAgentSearch = async () => {
  agentPagination.page = 1;
  await fetchAgentList();
};

const resetAgentSearch = async () => {
  agentSearch.id = "";
  agentSearch.level = "";
  agentSearch.member_type = "";
  agentPagination.page = 1;
  await fetchAgentList();
};

const handleVipLogSearch = async () => {
  vipLogPagination.page = 1;
  await fetchVipLogList();
};

const resetVipLogSearch = async () => {
  vipLogSearch.start_level = "";
  vipLogSearch.end_level = "";
  vipLogSearch.date_range = [];
  vipLogPagination.page = 1;
  await fetchVipLogList();
};

const resetRewardSearch = async () => {
  rewardSearch.user_id = "";
  rewardSearch.vip_level = "";
  rewardSearch.date_range = [];
  rewardLogPagination.page = 1;
  await fetchRewardLogList();
};

const handleVipPageChange = (page: number) => {
  vipPagination.page = page;
  fetchVipList();
};

const handleVipSizeChange = (size: number) => {
  vipPagination.limit = size;
  vipPagination.page = 1;
  fetchVipList();
};

const handleAgentPageChange = (page: number) => {
  agentPagination.page = page;
  fetchAgentList();
};

const handleAgentSizeChange = (size: number) => {
  agentPagination.limit = size;
  agentPagination.page = 1;
  fetchAgentList();
};

const handleVipLogPageChange = (page: number) => {
  vipLogPagination.page = page;
  fetchVipLogList();
};

const handleVipLogSizeChange = (size: number) => {
  vipLogPagination.limit = size;
  vipLogPagination.page = 1;
  fetchVipLogList();
};

const handleRewardPageChange = (page: number) => {
  rewardLogPagination.page = page;
  fetchRewardLogList();
};

const handleRewardSizeChange = (size: number) => {
  rewardLogPagination.limit = size;
  rewardLogPagination.page = 1;
  fetchRewardLogList();
};

const formatMoney = (value: number | string) => Number(value || 0).toFixed(2);

onMounted(async () => {
  await Promise.allSettled([fetchVipList(), fetchAgentList(), fetchVipLogList(), fetchRewardLogList()]);
});
</script>

<style scoped lang="scss">
.vip-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.vip-tabs :deep(.el-tabs__content) {
  overflow: visible;
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
