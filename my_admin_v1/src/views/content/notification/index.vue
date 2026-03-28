<template>
  <div class="content-page">
    <div class="panel">
      <div class="panel-header">
        <div class="page-title">
          <span>通知列表</span>
          <el-tag type="success" effect="plain">真实接口：/content/notification/list</el-tag>
        </div>
        <div class="header-actions">
          <el-input v-model="search.uid" clearable placeholder="用户ID" style="width: 120px" @keyup.enter="handleSearch" />
          <el-input v-model="search.title" clearable placeholder="标题" style="width: 180px" @keyup.enter="handleSearch" />
          <el-select v-model="search.type" clearable placeholder="通知类型" style="width: 120px">
            <el-option label="系统通知" :value="1" />
            <el-option label="交易通知" :value="2" />
          </el-select>
          <el-select v-model="search.is_read" clearable placeholder="阅读状态" style="width: 120px">
            <el-option label="未读" :value="0" />
            <el-option label="已读" :value="1" />
          </el-select>
          <el-date-picker
            v-model="search.date_range"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 320px"
          />
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="fetchList">刷新</el-button>
          <el-button type="primary" @click="openDialog()">发送通知</el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="list" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="uid" label="用户ID" width="100" />
        <el-table-column label="用户信息" min-width="220">
          <template #default="{ row }">
            <div class="info-cell">
              <span>账号：{{ row.user_name || "-" }}</span>
              <span>昵称：{{ row.nickname || "-" }}</span>
              <span>电话：{{ row.phone || "-" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="110">
          <template #default="{ row }">
            <el-tag :type="Number(row.type) === 1 ? 'primary' : 'success'" effect="light">
              {{ Number(row.type) === 1 ? "系统通知" : "交易通知" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="content" label="内容" min-width="260" show-overflow-tooltip />
        <el-table-column prop="is_read" label="阅读状态" width="110">
          <template #default="{ row }">
            <el-tag :type="Number(row.is_read) === 1 ? 'success' : 'warning'" effect="light">
              {{ Number(row.is_read) === 1 ? "已读" : "未读" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDialog(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
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

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑通知' : '发送通知'" width="620px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="用户ID">
          <el-input-number v-model="form.uid" :min="1" style="width: 100%" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="通知类型">
              <el-select v-model="form.type" style="width: 100%">
                <el-option label="系统通知" :value="1" />
                <el-option label="交易通知" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="已读状态">
              <el-select v-model="form.is_read" style="width: 100%">
                <el-option label="未读" :value="0" />
                <el-option label="已读" :value="1" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="请输入通知标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="5" placeholder="请输入通知内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="notificationManage">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Content } from "@/api/interface";
import { addNotification, deleteNotification, getNotificationList, updateNotification } from "@/api/modules/content";

const loading = ref(false);
const dialogVisible = ref(false);
const list = ref<Content.NotificationItem[]>([]);
const pagination = reactive({ page: 1, limit: 20, total: 0 });

const search = reactive({
  uid: "",
  title: "",
  type: undefined as number | undefined,
  is_read: undefined as number | undefined,
  date_range: [] as string[]
});

const createDefaultForm = (): Content.NotificationSaveParams => ({
  uid: 1,
  type: 1,
  title: "",
  content: "",
  is_read: 0
});

const form = reactive<Content.NotificationSaveParams>(createDefaultForm());

const resetForm = () => {
  Object.assign(form, createDefaultForm());
  delete form.id;
};

const openDialog = (row?: Content.NotificationItem) => {
  resetForm();
  if (row) {
    form.id = row.id;
    form.uid = Number(row.uid);
    form.type = Number(row.type);
    form.title = row.title;
    form.content = row.content;
    form.is_read = Number(row.is_read);
  }
  dialogVisible.value = true;
};

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await getNotificationList({
      page: pagination.page,
      limit: pagination.limit,
      uid: search.uid || undefined,
      title: search.title || undefined,
      type: search.type,
      is_read: search.is_read,
      start_time: search.date_range?.[0],
      end_time: search.date_range?.[1]
    });
    list.value = res.data.data || [];
    pagination.total = Number(res.data.total || 0);
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  const payload: Content.NotificationSaveParams = {
    ...(form.id ? { id: form.id } : {}),
    uid: Number(form.uid),
    type: Number(form.type),
    title: form.title,
    content: form.content,
    is_read: Number(form.is_read || 0)
  };
  const res = form.id ? await updateNotification(payload) : await addNotification(payload);
  ElMessage.success(res.message || "保存成功");
  dialogVisible.value = false;
  await fetchList();
};

const handleDelete = (row: Content.NotificationItem) => {
  ElMessageBox.confirm(`确认删除通知【${row.title}】吗？`, "删除确认", { type: "warning" }).then(async () => {
    const res = await deleteNotification({ id: row.id });
    ElMessage.success(res.message || "删除成功");
    await fetchList();
  });
};

const handleSearch = async () => {
  pagination.page = 1;
  await fetchList();
};

const resetSearch = async () => {
  search.uid = "";
  search.title = "";
  search.type = undefined;
  search.is_read = undefined;
  search.date_range = [];
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

onMounted(fetchList);
</script>

<style scoped lang="scss">
.content-page {
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

@media (max-width: 768px) {
  .panel-header,
  .page-title,
  .header-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
