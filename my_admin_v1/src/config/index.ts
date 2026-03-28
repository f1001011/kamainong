// ? 全局默认配置项

// 首页地址（默认）
export const HOME_URL: string = "/home/index";

// 登录页地址（默认）
export const LOGIN_URL: string = "/login";

// 默认主题颜色
export const DEFAULT_PRIMARY: string = "#009688";

// 图片访问域名
export const IMAGE_URL: string = import.meta.env.VITE_IMAGE_URL || "";

// 货币展示配置
export const CURRENCY_SYMBOL: string = "S";
export const CURRENCY_SEPARATOR: string = "/";
export const CURRENCY_SPACE: string = " ";
export const CURRENCY_PREFIX: string = `${CURRENCY_SYMBOL}${CURRENCY_SEPARATOR}${CURRENCY_SPACE}`;

// 路由白名单地址（本地存在的路由 staticRouter.ts 中）
export const ROUTER_WHITE_LIST: string[] = ["/500"];

// 高德地图 key
export const AMAP_MAP_KEY: string = "";

// 百度地图 key
export const BAIDU_MAP_KEY: string = "";
