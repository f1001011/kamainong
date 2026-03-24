# Honeywell

秘鲁市场理财投资平台

## 技术栈

- **包管理**: pnpm 9.x
- **Monorepo**: Turborepo
- **前端框架**: Next.js 16.x
- **用户端 UI**: shadcn/ui (Vega)
- **后台 UI**: Ant Design Pro
- **ORM**: Prisma 6.x
- **数据库**: MySQL 8.0+
- **缓存**: Redis 7.x
- **认证**: NextAuth.js v5
- **状态管理**: Zustand + React Query

## 项目结构

```
honeywell/
├── apps/
│   ├── web/          # 用户端 (Next.js + shadcn/ui) :3000
│   ├── admin/        # 后台 (Next.js + Ant Design Pro) :3001
│   └── api/          # 服务端 (Next.js API Routes) :3002
├── packages/
│   ├── database/     # Prisma Schema + Client
│   ├── payment/      # 支付通道模块 (策略模式)
│   ├── config/       # 共享配置
│   ├── types/        # 共享类型定义
│   └── utils/        # 共享工具函数
├── docker-compose.yml
├── pnpm-workspace.yaml
└── turbo.json
```

## 快速开始

### 环境要求

- Node.js 20.x LTS
- pnpm 9.x
- Docker (用于 MySQL 和 Redis)

### 安装依赖

```bash
pnpm install
```

### 启动 Docker 服务

```bash
docker-compose up -d
```

### 配置环境变量

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
cp apps/api/.env.example apps/api/.env.local
cp packages/database/.env.example packages/database/.env
```

### 初始化数据库

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 启动开发服务

```bash
# 启动所有服务
pnpm dev

# 或分别启动
pnpm --filter @honeywell/web dev     # 用户端 :3000
pnpm --filter @honeywell/admin dev   # 后台 :3001
pnpm --filter @honeywell/api dev     # API :3002
```

## 常用命令

```bash
# 开发
pnpm dev              # 启动所有服务
pnpm build            # 构建所有服务
pnpm lint             # 代码检查
pnpm typecheck        # 类型检查

# 数据库
pnpm db:generate      # 生成 Prisma Client
pnpm db:migrate       # 执行迁移
pnpm db:reset         # 重置数据库
pnpm db:studio        # 打开 Prisma Studio
pnpm db:seed          # 初始化种子数据

# Docker
docker-compose up -d  # 启动 MySQL + Redis
docker-compose down   # 停止服务
```

## 端口分配

| 服务 | 端口 |
|-----|------|
| 用户端 (web) | 3000 |
| 后台 (admin) | 3001 |
| API 服务 (api) | 3002 |
| MySQL | 3306 |
| Redis | 6379 |

## 开发文档

详细开发文档请参阅 `开发文档/` 目录。
