import { ResultData, User } from "@/api/interface/index";
import { PORT1 } from "@/api/config/servicePort";
import http from "@/api";

const mockResult = <T>(data: T): Promise<ResultData<T>> =>
  Promise.resolve({
    code: 200,
    message: "success",
    data
  });

const statusOptions: User.ResStatus[] = [
  { userLabel: "禁用", userValue: 0, userStatus: 0 },
  { userLabel: "启用", userValue: 1, userStatus: 1 }
];

const genderOptions: User.ResGender[] = [
  { genderLabel: "未知", genderValue: 0 },
  { genderLabel: "男", genderValue: 1 },
  { genderLabel: "女", genderValue: 2 }
];

const emptyTree: User.ResDepartment[] = [];
const emptyRole: User.ResRole[] = [];

/**
 * @name 用户管理模块
 */
export const getUserList = (params: User.ReqUserParams) => {
  return http.post<User.ResUserListData>(PORT1 + `/user/list`, params);
};

export const updateUserBase = (params: User.UpdateBaseParams) => {
  return http.post(PORT1 + `/user/update/base`, params);
};

export const updateUserStatus = (params: User.UpdateStatusParams) => {
  return http.post(PORT1 + `/user/update/status`, params);
};

export const updateUserState = (params: User.UpdateStateParams) => {
  return http.post(PORT1 + `/user/update/state`, params);
};

export const updateUserBalance = (params: User.UpdateAmountParams) => {
  return http.post<ResultData<{ money_before: number; money_end: number }>>(PORT1 + `/user/update/balance`, params);
};

export const updateUserIntegral = (params: User.UpdateAmountParams) => {
  return http.post<ResultData<{ integral_before: number; integral_end: number }>>(PORT1 + `/user/update/integral`, params);
};

// 以下导出用于兼容模板自带的演示页面，后续可逐步删除
export const getUserTreeList = (params: User.ReqUserParams) => getUserList(params);

export const addUser = (params: any) => mockResult(params);

export const editUser = (params: any) => mockResult(params);

export const deleteUser = (params: any) => mockResult(params);

export const changeUserStatus = (params: { id: string; status: number }) =>
  updateUserStatus({ id: Number(params.id), status: Number(params.status) });

export const resetUserPassWord = (params: { id: string }) => updateUserBase({ id: Number(params.id), pwd: "123456" });

export const exportUserInfo = () => Promise.resolve(new Blob());

export const BatchAddUser = () => mockResult(true);

export const getUserStatus = () => mockResult(statusOptions);

export const getUserGender = () => mockResult(genderOptions);

export const getUserDepartment = () => mockResult(emptyTree);

export const getUserRole = () => mockResult(emptyRole);
