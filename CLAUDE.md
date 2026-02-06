# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## 项目愿景 (Project Vision)

Frontend Next Scaffold - 基于 Vue 3 的前端脚手架项目，包含完整的前端架构和 MSW Mock 支持。

## 架构总览 (Architecture Overview)

```
src/
├── api/              # HTTP 请求层
├── components/      # 共享 Vue 组件
├── mocks/          # MSW Mock 服务
├── router/          # Vue Router 配置
├── stores/          # Pinia 状态管理
├── styles/         # 全局样式
├── types/          # TypeScript 类型定义
├── views/          # 页面级组件
├── App.vue         # 根组件
├── env.d.ts        # 环境类型声明
└── main.ts         # 应用入口
```

## 技术栈 (Tech Stack)

| 技术 | 用途 |
|------|------|
| **Vue 3** | 前端框架 (Composition API + TypeScript) |
| **Vite** | 构建工具 |
| **Element Plus** | UI 组件库 (自动注册) |
| **Pinia** | 状态管理 |
| **Vue Router** | 路由管理，包含导航守卫 |
| **Axios** | HTTP 客户端 |
| **MSW** | Mock Service Worker |

## 运行与开发 (Commands)

```bash
# Mock 模式开发
pnpm dev:mock          # 启用 MSW Mock（默认使用 .env.mock）

# 真实 API 开发
pnpm dev               # 使用真实后端 API（使用 .env）

# 构建
pnpm build            # 生产构建

# 代码检查
pnpm lint             # ESLint
pnpm format           # Prettier
```

## Mock 方案 (Mock Scheme)

### 启用 Mock

```bash
# 方式1：使用预设命令
pnpm dev:mock

# 方式2：设置环境变量
export VITE_USE_MOCK=true
pnpm dev
```

### Mock 行为

- 登录：任意邮箱密码组合均可登录成功
- 返回数据：固定的 mock 用户信息和 token
- API 拦截：MSW 在浏览器端拦截所有 /api/* 请求

### Mock 文件说明

| 文件 | 说明 |
|------|------|
| `src/mocks/handlers.ts` | MSW 请求处理器定义 |
| `src/mocks/mockUser.ts` | Mock 用户数据 |
| `src/mocks/server.ts` | MSW 服务初始化 |

## 目录结构详解 (Directory Structure)

### api/ - API 层

```typescript
// 认证接口
authApi.login(data)       // POST /auth/login
authApi.register(data)    // POST /auth/register
authApi.getCurrentUser()  // GET /auth/me
authApi.logout()          // 清除本地 token
```

### stores/ - 状态管理

```typescript
// useUserStore
user              // 当前用户信息
isAuthenticated   // 是否已认证
isAdmin           // 是否有管理员权限
login()           // 登录
logout()          // 退出登录
```

### router/ - 路由配置

| 路由 | 说明 | 权限 |
|------|------|------|
| `/login` | 登录页面 | 无需认证 |
| `/home` | 首页 | 需要认证 |
| `/*` | 404 页面 | - |

## 环境变量 (Environment Variables)

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_TARGET` | 真实 API 目标地址 | `http://localhost:8000` |
| `VITE_USE_MOCK` | 是否启用 MSW Mock | `false` |

### .env vs .env.mock

- `.env`: 真实 API 模式
- `.env.mock`: Mock 模式（VITE_USE_MOCK=true）

## 变更记录 (Changelog)

| 时间戳 | 操作 | 说明 |
|--------|------|------|
| 2026-02-06 | 初始化 | 创建前端脚手架项目 |
