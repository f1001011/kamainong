<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="用户ID">
        <el-input :model-value="String(form.id || '')" disabled />
      </el-form-item>
      <el-form-item label="账号" prop="user_name">
        <el-input v-model.trim="form.user_name" placeholder="请输入账号" />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model.trim="form.phone" placeholder="请输入手机号" />
      </el-form-item>
      <el-form-item label="昵称" prop="nickname">
        <el-input v-model.trim="form.nickname" placeholder="请输入昵称" />
      </el-form-item>
      <el-form-item label="VIP等级" prop="level_vip">
        <el-input-number v-model="form.level_vip" :min="0" :step="1" controls-position="right" />
      </el-form-item>
      <el-form-item label="登录密码" prop="pwd">
        <el-input v-model.trim="form.pwd" type="password" show-password placeholder="不修改请留空" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { User } from "@/api/interface";
import { updateUserBase } from "@/api/modules/user";

interface DialogParams {
  row: User.ResUserList;
  getTableList?: () => void;
}

const dialogVisible = ref(false);
const dialogTitle = ref("编辑用户");
const formRef = ref<FormInstance>();
const refreshTable = ref<(() => void) | undefined>();

const form = reactive<User.UpdateBaseParams>({
  id: 0,
  user_name: "",
  phone: "",
  nickname: "",
  level_vip: 0,
  pwd: ""
});

const rules: FormRules = {
  user_name: [{ max: 30, message: "账号长度不能超过 30 位", trigger: "blur" }],
  phone: [{ max: 20, message: "手机号长度不能超过 20 位", trigger: "blur" }],
  nickname: [{ max: 30, message: "昵称长度不能超过 30 位", trigger: "blur" }],
  pwd: [{ max: 50, message: "密码长度不能超过 50 位", trigger: "blur" }]
};

const acceptParams = ({ row, getTableList }: DialogParams) => {
  form.id = row.id;
  form.user_name = row.user_name || "";
  form.phone = row.phone || "";
  form.nickname = row.nickname || "";
  form.level_vip = Number(row.level_vip || 0);
  form.pwd = "";
  refreshTable.value = getTableList;
  dialogVisible.value = true;
};

const handleSubmit = () => {
  formRef.value?.validate(async valid => {
    if (!valid) return;
    const payload: User.UpdateBaseParams = { id: form.id };

    if (form.user_name) payload.user_name = form.user_name;
    if (form.phone) payload.phone = form.phone;
    if (form.nickname) payload.nickname = form.nickname;
    if (typeof form.level_vip === "number") payload.level_vip = form.level_vip;
    if (form.pwd) payload.pwd = form.pwd;

    await updateUserBase(payload);
    ElMessage.success("用户信息已更新");
    dialogVisible.value = false;
    refreshTable.value?.();
  });
};

defineExpose({
  acceptParams
});
</script>
