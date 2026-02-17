# WIMI CHAT - 前端设置模块

[根目录../../CLAUDE.md] > [frontend-master](../) > **frontend_settings**

## 项目愿景 (Project Vision)

WIMI CHAT 前端设置模块 - 基于 Vue 3 的设置管理界面。

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

## 环境变量 (Environment Variables)

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_TARGET` | 真实 API 目标地址 | `http://localhost:8000` |
| `VITE_USE_MOCK` | 是否启用 MSW Mock | `false` |

## 目录结构详解 (Directory Structure)

### api/ - API 层

```typescript
// 认证接口
authApi.login(data)       // POST /api/auth/login
authApi.register(data)    // POST /api/auth/register
authApi.getCurrentUser()  // GET /api/auth/me
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
| `/workbench` | 工作台 | 需要认证 |
| `/tools` | 工具管理 | 需要认证 |
| `/*` | 404 页面 | - |

## 设计风格 (Design Style)

### 风格定位

采用 **Manus AI 风格**，现代浅色主题，简洁的卡片式布局，类似于 Notion 的极简设计风格。

### 色彩方案

| 元素 | 颜色值 | 用途 |
|------|--------|------|
| 页面背景 | `#ffffff` | 主内容区 |
| 侧边栏背景 | `#ebebeb` | 侧边栏导航 |
| 卡片背景 | `#fafafa` | 任务卡片 |
| 面板背景 | `#f8f8f7` | 输入区域 |
| 悬停背景 | `rgba(55, 53, 47, 0.06)` | 行悬停状态 |
| 选中背景 | `rgba(55, 53, 47, 0.08)` | 选中状态 |
| 主文字 | `#34322d` | 标题、正文 |
| 次要文字 | `#858481` | 辅助说明、时间 |
| 边框线 | `rgba(0, 0, 0, 0.12)` | 分隔线 |
| 强调色 | `#e4e4e4` | 浅灰按钮、选中状态 |

### 关键视觉特征

- **浅色主题**：白色页面 + 浅灰侧边栏
- **极简设计**：无阴影或少阴影，使用纯色为主
- **柔和悬停**：半透明背景叠加
- **圆角适中**：8-10px
- **Notion 风格**：类似 Notion 的浅灰色系

### 工具类

```scss
.manus-card    // 卡片容器样式
.manus-btn     // 按钮样式
.manus-link    // 链接样式
.manus-input   // 输入框样式
```

### 设计tokens (`src/styles/variables.scss`)

```scss
// --- 基础颜色 (Colors) ---
$bg-page: #ffffff;           // 页面主背景
$bg-sidebar: #f8f8f7;        // 侧边栏，微调为 Manus 的浅灰感
$bg-card: #ffffff;           // 卡片背景，Manus 首页卡片多为纯白悬浮
$bg-panel: #f1f1f0;          // 底部/搜索面板背景，参考 Sublime 搜索栏
$bg-hover: rgba(55, 53, 47, 0.08);   // 增加不透明度，提升交互感知
$bg-selected: rgba(55, 53, 47, 0.12); // 选中态，更接近 Sublime 选区

// --- 文字与语义 (Text & Semantics) ---
$text-primary: #1a1a1a;      // 提升对比度，Manus 标题更黑
$text-secondary: #7e7d7a;    // 辅助文字
$text-code: #d4d4d4;         // 模拟图1中的代码文本色
$border-base: rgba(0, 0, 0, 0.08);  // 更细致的边框
$primary-blue: #007aff;      // 补充：AI 激活态或链接色
$icon-color: #5f5e5b;        // 图标颜色

// --- 深度与阴影 (Shadows) ---
$shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
$shadow-md: 0 4px 12px rgba(0,0,0,0.08); // 用于 Manus 搜索框悬浮

// --- 布局规格 (Layout) ---
$sidebar-width: 260px;       // 参考 Manus 侧边栏宽度
$panel-header-h: 48px;       // 顶部条高度

// --- 按钮与输入框 (Component Tokens) ---
$btn-height: 40px;
$btn-padding-x: 16px;
$btn-border-radius-pill: 20px;
$input-border-radius: 12px;  // 搜索框采用大圆角矩形
```

### 按钮风格 (Button Style)

| 属性 | 修改/补充值 | 说明 |
|------|------------|------|
| 形状 | pill | |
| 高度 | 40px | |
| 阴影 | `inset 0 0 0 1px $border-base` | 使用内阴影模拟边框，更显精致 |
| 间距 | gap: 6px | 图标与文字间距微调 |
| 字体 | 500 (Medium) | 按钮文字比正文略重，提升引导性 |
| 过渡 | `all 0.2s cubic-bezier(0.4, 0, 0.2, 1)` | 模拟 AI 产品丝滑的反馈感 |

### 按钮工具类

```scss
.manus-btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 7px 14px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 20px;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(55, 53, 47, 0.06);
  }

  .icon {
    width: 18px;
    height: 18px;
    color: #37352f;
  }

  .text {
    color: #37352f;
    font-size: 14px;
    font-weight: 400;
  }
}
```

## 变更记录 (Changelog)

| 时间戳 | 操作 | 说明 |
|--------|------|------|
| 2026-02-06 | 初始化 | 创建前端脚手架项目 |
| 2026-02-06 | 设计风格 | 引入飞书多维表格设计风格 |
| 2026-02-06 | 新增页面 | 新增工作台页面 |
| 2026-02-06 | 设计风格 | 更新为 Manus AI 浅色主题风格 |
| 2026-02-09 | API 规范 | 整合工具管理 API 路径规则，统一使用查询参数 |
| 2026-02-17 | 更新 | 更新为 WIMI CHAT 项目文档 |
