import { Login, ResultData } from "@/api/interface/index";
import { PORT1 } from "@/api/config/servicePort";
import authMenuList from "@/assets/json/authMenuList.json";
import authButtonList from "@/assets/json/authButtonList.json";
import http from "@/api";

const mockResult = <T>(data: T): Promise<ResultData<T>> =>
  Promise.resolve({
    code: 200,
    message: "success",
    data
  });

/**
 * @name 登录模块
 */
// 用户登录
export const loginApi = (params: Login.ReqLoginForm) => {
  // admin_api 登录参数为 user_name + pwd
  const payload = { user_name: params.username, pwd: params.password };
  return http.post<Login.ResLogin>(PORT1 + `/login`, payload, { loading: false });
  // return http.post<Login.ResLogin>(PORT1 + `/login`, params, { loading: false }); // 控制当前请求不显示 loading
  // return http.post<Login.ResLogin>(PORT1 + `/login`, {}, { params }); // post 请求携带 query 参数  ==>  ?username=admin&password=123456
  // return http.post<Login.ResLogin>(PORT1 + `/login`, qs.stringify(params)); // post 请求携带表单参数  ==>  application/x-www-form-urlencoded
  // return http.get<Login.ResLogin>(PORT1 + `/login?${qs.stringify(params, { arrayFormat: "repeat" })}`); // get 请求可以携带数组等复杂参数
};

// 获取菜单列表
export const getAuthMenuListApi = () => {
  // admin_api 当前无菜单接口，这里先走本地菜单避免动态路由报错
  return mockResult(((authMenuList as any).data ?? authMenuList) as Menu.MenuOptions[]);
};

// 获取按钮权限
export const getAuthButtonListApi = () => {
  // admin_api 当前无按钮权限接口，这里先走本地权限
  return mockResult(((authButtonList as any).data ?? authButtonList) as Login.ResAuthButtons);
};

// 用户退出登录
export const logoutApi = () => {
  // admin_api 当前无退出接口，前端仅清理本地状态
  return mockResult(true);
};
