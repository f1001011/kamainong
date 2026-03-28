<template>
  <div class="sys-config-page">
    <section class="hero-card">
      <div>
        <p class="hero-eyebrow">SYSTEM CONFIG</p>
        <h2>系统配置管理</h2>
        <p class="hero-desc">统一维护 `sys_config` 配置项。`value` 字段按原文保存，不做解析、不做格式化、不做删除。</p>
      </div>
      <div class="hero-tags">
        <el-tag effect="dark" type="primary">接口：/config/list</el-tag>
        <el-tag effect="plain" type="success">仅支持新增 / 修改</el-tag>
      </div>
    </section>

    <section class="stat-grid">
      <article class="stat-card">
        <span>配置总数</span>
        <strong>{{ pagination.total }}</strong>
      </article>
      <article class="stat-card success">
        <span>已填写值</span>
        <strong>{{ filledCount }}</strong>
      </article>
      <article class="stat-card warning">
        <span>空值配置</span>
        <strong>{{ emptyValueCount }}</strong>
      </article>
    </section>

    <section class="panel-card">
      <el-alert
        title="value 字段会按你输入的原文直接保存，包括空格、换行、JSON 文本或普通字符串。"
        type="info"
        :closable="false"
        show-icon
      />

      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="searchForm.id"
            clearable
            placeholder="按 ID 查询"
            style="width: 140px"
            @keyup.enter="handleSearch"
          />
          <el-input
            v-model="searchForm.name"
            clearable
            placeholder="按配置名称查询"
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
          <el-input
            v-model="searchForm.mark"
            clearable
            placeholder="按备注查询"
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="toolbar-right">
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" plain @click="handleSearch">查询</el-button>
          <el-button @click="fetchList">刷新</el-button>
          <el-button type="primary" @click="openDialog()">新增配置</el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="list" border class="config-table">
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="name" label="配置名称" min-width="220" />
        <el-table-column prop="value" label="配置值" min-width="420">
          <template #default="{ row }">
            <div class="value-preview">{{ row.value || "-" }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="mark" label="备注" min-width="180">
          <template #default="{ row }">
            <span>{{ row.mark || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDialog(row)">编辑</el-button>
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
    </section>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑系统配置' : '新增系统配置'" width="760px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="配置名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入配置名称" />
        </el-form-item>
        <el-form-item label="配置值">
          <el-input
            v-model="form.value"
            type="textarea"
            :rows="12"
            resize="vertical"
            placeholder="这里输入什么，就原样保存什么"
          />
        </el-form-item>
        <el-form-item label="备注" prop="mark">
          <el-input v-model="form.mark" placeholder="请输入备注，选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="sysConfigManage">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { SysConfig } from "@/api/interface";
import { addSysConfig, getSysConfigList, updateSysConfig } from "@/api/modules/config";

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();

const list = ref<SysConfig.ResListItem[]>([]);

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
});

const searchForm = reactive({
  id: "",
  name: "",
  mark: ""
});

const createDefaultForm = (): SysConfig.SaveParams => ({
  name: "",
  value: "",
  mark: ""
});

const form = reactive<SysConfig.SaveParams>(createDefaultForm());

const rules = reactive<FormRules<SysConfig.SaveParams>>({
  name: [{ required: true, message: "请输入配置名称", trigger: "blur" }],
  mark: [{ max: 200, message: "备注长度不能超过 200 个字符", trigger: "blur" }]
});

const filledCount = computed(() => list.value.filter(item => item.value !== "").length);
const emptyValueCount = computed(() => list.value.filter(item => item.value === "").length);

const resetForm = () => {
  delete form.id;
  form.name = "";
  form.value = "";
  form.mark = "";
};

const openDialog = (row?: SysConfig.ResListItem) => {
  resetForm();
  formRef.value?.clearValidate();
  if (row) {
    form.id = row.id;
    form.name = row.name;
    form.value = row.value ?? "";
    form.mark = row.mark ?? "";
  }
  dialogVisible.value = true;
};

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await getSysConfigList({
      page: pagination.page,
      limit: pagination.limit,
      id: searchForm.id || undefined,
      name: searchForm.name || undefined,
      mark: searchForm.mark || undefined
    });
    list.value = res.data.data || [];
    pagination.total = Number(res.data.total || 0);
    pagination.page = Number(res.data.current_page || pagination.page);
    pagination.limit = Number(res.data.per_page || pagination.limit);
  } finally {
    loading.value = false;
  }
};

const handleSearch = async () => {
  pagination.page = 1;
  await fetchList();
};

const resetSearch = async () => {
  searchForm.id = "";
  searchForm.name = "";
  searchForm.mark = "";
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

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate();

  submitLoading.value = true;
  try {
    const payload: SysConfig.SaveParams = {
      ...(form.id ? { id: form.id } : {}),
      name: form.name,
      value: form.value ?? "",
      mark: form.mark ?? ""
    };

    const res = form.id ? await updateSysConfig(payload) : await addSysConfig(payload);
    ElMessage.success(res.message || "保存成功");
    dialogVisible.value = false;
    await fetchList();
  } finally {
    submitLoading.value = false;
  }
};

onMounted(() => {
  fetchList();
});
</script>

<style scoped lang="scss">
.sys-config-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 28px;
  border-radius: 18px;
  color: #ffffff;
  background: linear-gradient(135deg, #1d4ed8 0%, #4338ca 55%, #7c3aed 100%);
  box-shadow: 0 16px 40px rgba(67, 56, 202, 0.22);
}

.hero-eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.18em;
  opacity: 0.72;
}

.hero-card h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.hero-desc {
  max-width: 760px;
  margin: 12px 0 0;
  line-height: 1.7;
  opacity: 0.9;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-content: flex-start;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px 22px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
}

.stat-card span {
  color: #64748b;
  font-size: 13px;
}

.stat-card strong {
  color: #0f172a;
  font-size: 28px;
  font-weight: 700;
}

.stat-card.success {
  background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
  border-color: #bbf7d0;
}

.stat-card.warning {
  background: linear-gradient(180deg, #fffbeb 0%, #ffffff 100%);
  border-color: #fde68a;
}

.panel-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.config-table :deep(.el-table__cell) {
  vertical-align: top;
}

.value-preview {
  max-height: 132px;
  overflow: auto;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8fafc;
  color: #334155;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  border: 1px solid #e2e8f0;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1200px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .hero-card,
  .toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
  }
}
</style>
