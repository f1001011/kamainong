# my_app 世界杯 H5 / PC 交接日志

更新时间：2026-03-28

## 1. 项目当前定位

当前 `my_app` 已从旧版 H5 壳子，改造成一套以世界杯足球内容氛围为核心的静态前端项目。

这不是简单换皮，当前版本已经完成以下方向的落地：

- 主导航重组为 `首页 / 游戏 / 体育 / 我的`
- 页面内容从旧投资风，切换为世界杯主题内容展示
- 视觉风格统一为深绿 + 米白 + 金色 / 蓝色点缀
- 图片资源迁移到项目内固定目录
- H5 主页面重构
- PC / H5 自动识别并切换不同页面结构
- 我的页子页面 `充值 / 提现 / 历史记录` 已补齐 PC 版

当前不是：

- 不是新开一个 PC 项目
- 不是另起一个 `/pc` 路由体系
- 不是把 H5 页面简单拉宽当 PC

当前是：

- 同一个项目
- 同一套路由
- 同一个 mock 数据源
- 根据窗口宽度自动切换 PC / H5 页面结构

---

## 2. 视觉系统与配色

世界杯主题当前采用“高级、克制、现代”的足球风，不走土味博彩绿。

### 全局色板

色板定义位置：

- `src/App.vue`

当前主要 token 与值：

- `--wc-bg: #0d2319`
- `--wc-bg-deep: #091912`
- `--wc-bg-soft: #143429`
- `--wc-surface: #f3eee3`
- `--wc-surface-elevated: #fbf8f1`
- `--wc-card: rgba(255, 250, 243, 0.92)`
- `--wc-card-strong: #ffffff`
- `--wc-border: rgba(13, 35, 25, 0.08)`
- `--wc-border-strong: rgba(13, 35, 25, 0.14)`
- `--wc-text: #10281f`
- `--wc-text-soft: rgba(16, 40, 31, 0.68)`
- `--wc-text-faint: rgba(16, 40, 31, 0.48)`
- `--wc-text-on-dark: rgba(255, 251, 245, 0.96)`
- `--wc-text-on-dark-soft: rgba(255, 251, 245, 0.72)`
- `--wc-green: #1b5b41`
- `--wc-green-soft: #2d7456`
- `--wc-gold: #c8a76a`
- `--wc-gold-soft: #e7cb94`
- `--wc-blue: #7dc4f4`

### 视觉语言

- 主背景不是纯黑，而是深球场绿
- 内容面不是纯白，而是带暖调的米白
- 金色只用于强调，不做大面积俗气高饱和铺色
- 蓝色只做辅助高光和状态点缀
- 整体尽量维持“体育资讯感 + 赛事海报感”

### 字体与层级

当前统一采用无衬线字体：

- `'PingFang SC', 'Microsoft YaHei', Inter, sans-serif`

层级思路：

- 大标题用于英雄区和页面核心意图
- 次标题用于 section 标题和面板标题
- 辅助信息统一压低到 `text-soft`
- 避免整页字号接近导致层级不清

### 组件风格

- 大卡片统一大圆角
- 阴影是柔和投影，不是厚重浮夸阴影
- badge 目前改为小图标角标，不再使用大面积遮罩标签
- 首页和游戏页使用小型图标 badge，文件：
  - `src/components/ui/MiniTagBadge.vue`

### 当前圆角 / 阴影 token

- `--wc-radius-xl: 32px`
- `--wc-radius-lg: 24px`
- `--wc-radius-md: 18px`
- `--wc-shadow-soft: 0 18px 40px rgba(10, 27, 19, 0.08)`
- `--wc-shadow-card: 0 22px 56px rgba(10, 27, 19, 0.12)`

---

## 3. 产品与信息架构说明

当前 4 个主页面不是随便分的，而是按浏览任务拆开的。

### 首页 Home

用户任务：

- 快速感受到世界杯氛围
- 快速看到当前最值得点开的内容
- 先浏览推荐内容，而不是进入复杂操作流程

当前信息层级：

- 顶部主视觉 Banner
- 第一屏快速画廊
- 后续专题 section，如热门赛事、球队图鉴、世界杯瞬间

PC 版处理方式：

- 左侧大主视觉
- 右侧导览和热点摘要
- 下方多列画廊与专题网格

H5 版处理方式：

- Banner + 宫格 + 分段专题内容

### 游戏页 Games

用户任务：

- 看另一批足球内容池
- 用目录式方式扫图，而不是再看一个首页复制品

当前信息层级：

- 顶部导语
- 分组专题块
- 每个专题有英雄图 + 卡片组

PC 版处理方式：

- 左侧专题说明
- 右侧多列内容卡

H5 版处理方式：

- 每个 section 一块
- 卡片以横向滑动 / 稳定内容池方式展开

### 体育页 Sports

用户任务：

- 尽快进入外部体育主体
- 需要明确返回路径
- 需要加载态和空地址状态

当前信息层级：

- 顶部返回
- iframe 主区域
- 如果没地址，展示空状态承载页

PC 版处理方式：

- 左侧说明与状态
- 右侧 iframe 主承载器

H5 版处理方式：

- 顶部固定头部
- 下方 iframe 或空状态

### 我的页 Profile

用户任务：

- 快速进入充值 / 提现 / 历史记录
- 不想看到复杂后台设置页

当前信息层级：

- 顶部个人中心入口区
- 高频动作区
- 历史入口区
- 退出登录

PC 版处理方式：

- 左侧高频操作
- 右侧记录入口和退出

H5 版处理方式：

- 顶部英雄区
- 两列动作卡
- 历史列表
- 底部退出

---

## 4. 路由结构

当前主路由：

- `/` -> `Home`
- `/games` -> `Games`
- `/sports` -> `Sports`
- `/profile` -> `Profile`
- `/recharge` -> `Recharge`
- `/withdraw` -> `Withdraw`
- `/records/:type` -> `RecordHistory`

说明：

- 当前没有 `Activities` 主页面
- 当前底部导航就是 4 个 Tab
- `Games` 当前是显示状态，不是隐藏状态

路由文件：

- `src/router/index.ts`

---

## 5. PC / H5 自动切换规则

当前采用统一断点自动切换：

- `< 1100px` 走 H5 页面结构
- `>= 1100px` 走 PC 页面结构

实现文件：

- `src/composables/useViewportMode.ts`

实现方式：

- 使用 `window.matchMedia('(min-width: 1100px)')`
- 首屏进入时就会同步一次
- 浏览器宽度变化时实时切换

布局同步规则：

- H5 显示底部导航
- PC 显示左侧 Sidebar

相关文件：

- `src/layouts/MainLayout.vue`
- `src/components/layout/AppBottomNav.vue`
- `src/components/layout/AppSidebar.vue`

重要说明：

- 目前没有独立 `/pc` 页面
- 当前就是同一路由自动切结构

---

## 6. 页面组件组织方式

当前主页面和我的页子页面基本都采用：

- 路由包装页
- `Mobile.vue`
- `Desktop.vue`

包装页只负责读取 `isDesktop` 并切换组件。

### 已完成双结构的页面

#### 主页面

- 首页
  - `src/views/main/HomeView.vue`
  - `src/views/main/home/HomeMobile.vue`
  - `src/views/main/home/HomeDesktop.vue`

- 游戏
  - `src/views/main/GamesView.vue`
  - `src/views/main/games/GamesMobile.vue`
  - `src/views/main/games/GamesDesktop.vue`

- 体育
  - `src/views/main/SportsView.vue`
  - `src/views/main/sports/SportsMobile.vue`
  - `src/views/main/sports/SportsDesktop.vue`

- 我的
  - `src/views/main/profile/ProfileView.vue`
  - `src/views/main/profile/ProfileMobile.vue`
  - `src/views/main/profile/ProfileDesktop.vue`

#### 我的子页面

- 充值
  - `src/views/main/profile/RechargeView.vue`
  - `src/views/main/profile/RechargeMobile.vue`
  - `src/views/main/profile/RechargeDesktop.vue`

- 提现
  - `src/views/main/profile/WithdrawView.vue`
  - `src/views/main/profile/WithdrawMobile.vue`
  - `src/views/main/profile/WithdrawDesktop.vue`

- 历史记录
  - `src/views/main/profile/RecordHistoryView.vue`
  - `src/views/main/profile/RecordHistoryMobile.vue`
  - `src/views/main/profile/RecordHistoryDesktop.vue`

---

## 7. 数据与 mock 组织方式

当前 mock 和内容源集中在：

- `src/config/worldCup.ts`
- `src/services/worldCupContent.ts`

### `worldCup.ts` 负责

- 首页 Banner
- 首页快速画廊
- 首页专题 section
- 游戏页专题数据
- 体育页说明文案
- 我的页菜单
- 历史记录 mock 分页
- 充值二维码常量
- 体育 iframe 地址常量

### `worldCupContent.ts` 负责

- 给页面层提供统一读取入口
- 后续如果接真实 API，优先从这里替换

当前对外方法：

- `fetchHomeContent()`
- `fetchGamesContent()`
- `fetchSportsShell()`
- `fetchProfileContent()`
- `fetchRecordPages(type)`
- `getRecordTitle(type)`

---

## 8. 历史记录逻辑

历史记录分页逻辑已抽成 composable：

- `src/composables/useRecordHistory.ts`

当前能力：

- 自动读取 `route.params.type`
- 支持 `recharge / withdraw / bet`
- 首次进入自动加载第一页
- 滚动到底部自动追加下一页
- 页面切换类型时自动重置
- PC / H5 共用同一套逻辑

建议：

- 接真实分页接口时，优先改这里或 `worldCupContent.ts`

---

## 9. 当前文案与内容主题

当前所有页面默认文案方向已经切成中文，并且围绕足球内容，不再保留原投资类叙事。

### 首页内容主题

- 世界波之夜
- 金杯巡礼
- 球迷主场
- 经典对决
- 热门赛事
- 球队图鉴
- 世界杯瞬间

### 游戏页内容主题

- 竞猜专区
- 热门对决
- 传奇球星

### 体育页

- 当前是承载页，不是内容详情页
- `SPORTS_IFRAME_URL` 目前还是空字符串
- 所以当前先显示精致空状态

### 我的页

- 充值
- 提现
- 我的充值历史
- 我的提现历史
- 我的下注历史
- 退出登录

---

## 10. 图片资源固定目录

当前世界杯图片已经迁移到项目内固定目录，后续要换图片，直接替换这些文件即可。

根目录：

- `public/worldcup`

子目录：

- `public/worldcup/banners`
- `public/worldcup/quick`
- `public/worldcup/sections`
- `public/worldcup/games`
- `public/worldcup/posters`
- `public/worldcup/profile`
- `public/worldcup/welcome`

### 当前目录含义

- `banners`：首页 Banner 主视觉
- `quick`：首页第一屏小图卡
- `sections`：首页各 section 的专题图
- `games`：游戏页专题图和卡图
- `profile`：充值二维码等个人中心相关素材
- `welcome`：欢迎页素材

### 已知固定素材

- 充值二维码：
  - `public/worldcup/profile/recharge-qr.svg`

### 欢迎页图片

- 页面：`src/views/public/WelcomeView.vue`
- 素材目录：`public/worldcup/welcome`

---

## 11. 当前使用的库与技术选择

当前已经在项目里使用：

- `vue`
- `vue-router`
- `vue-i18n`
- `@vueuse/motion`
- `lucide-vue-next`

### 当前库的实际用途

- `@vueuse/motion`
  - 用于页面 / 卡片轻量入场动效

- `lucide-vue-next`
  - 用于统一线性图标风格
  - 包括底部导航、侧边栏、角标图标、桌面页说明图标

### 当前没有做的事

- 没有引入 `shadcn-vue`
- 没有引入 `Reka UI`
- 没有引入 Tailwind 体系
- 当前主要继续沿用自写 CSS + 全局 token

原因：

- 当前项目不是原子类体系
- 强行引入整套 UI 库会增加维护成本
- 当前页面更适合继续使用已有结构和 design token 自控样式

---

## 12. 当前已做过的重要设计决策

下一个窗口要注意这些不是偶然，而是已经定过方向：

- 世界杯风不是靠贴很多发光元素，而是靠深绿场景、米白表面、金蓝点缀和海报式图片
- 首页角标已经从大遮罩标签改成小图标 badge
- 页面不是堆满功能按钮，而是优先做内容氛围和浏览节奏
- PC 页不是把 H5 直接放大，而是单独重排信息层级
- 图片必须放在项目固定目录，不再散落网络地址
- mock 数据必须集中管理，不散写在模板里

---

## 13. 当前已知状态与保留项

### 已完成

- 世界杯主题主框架已完成
- H5 结构已完成
- PC 自动识别切换已完成
- 主页面和我的子页面 PC 版已补齐
- 图片本地化已完成
- 欢迎页图片已迁移到本地目录
- 充值二维码本地化已完成
- 构建已通过

### 当前保留状态

- `SPORTS_IFRAME_URL` 仍为空
- 体育页现在是空状态承载器
- 登录页和欢迎页尚未补完整 PC 结构
- 当前仍然是静态 mock 展示，不接真实后端

### 登录态

- 退出登录会清理本地 `token`
- 然后跳回 `Login`
- 文件：
  - `src/hooks/useAuth.ts`

---

## 14. 已验证结果

本轮已执行：

- `npm run build`

当前结果：

- 2026-03-28 构建通过

---

## 15. 下一个窗口建议先读的文件顺序

建议按下面顺序读取：

1. `docs/世界杯H5-PC交接文档.md`
2. `src/router/index.ts`
3. `src/App.vue`
4. `src/composables/useViewportMode.ts`
5. `src/config/worldCup.ts`
6. `src/services/worldCupContent.ts`
7. `src/composables/useRecordHistory.ts`
8. `src/layouts/MainLayout.vue`
9. 相关页面包装页与 `Mobile/Desktop` 组件

---

## 16. 下一个窗口继续开发时，优先建议

建议优先级如下：

1. 给 `Login` 和 `Welcome` 也补 PC 结构
2. 补真实 `SPORTS_IFRAME_URL`
3. 如果接真实接口，优先改 `worldCupContent.ts`
4. 如果接真实分页，优先改 `useRecordHistory.ts`
5. 如果换图片，直接替换 `public/worldcup/*`
6. 继续补充 PC hover、active、滚动细节

---

## 17. 给下一个 AI 窗口的一句话说明

当前 `my_app` 已是世界杯主题版本，采用同一路由自动区分 PC / H5，主页面和我的子页面都已有双结构，图片全部走项目内固定目录，当前下一步重点是补登录欢迎页 PC、接体育 iframe 和替换真实 API。
