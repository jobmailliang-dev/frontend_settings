<template>
  <div class="manus-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-title">
        <h1>工作台</h1>
        <span class="header-subtitle">查看和管理您的任务</span>
      </div>
      <div class="header-actions">
        <button class="manus-btn">
          <span class="icon"><el-icon><Plus /></el-icon></span>
          <span class="text">新建任务</span>
        </button>
      </div>
    </div>

    <!-- Data Table Card -->
    <div class="manus-card table-card">
      <!-- Toolbar -->
      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索任务名称..."
            class="manus-input search-input"
            :prefix-icon="Search"
            size="small"
          />
        </div>
        <div class="toolbar-right">
          <button class="manus-btn">
            <span class="icon"><el-icon><Filter /></el-icon></span>
            <span class="text">筛选</span>
          </button>
          <button class="manus-btn">
            <span class="icon"><el-icon><Grid /></el-icon></span>
            <span class="text">视图</span>
          </button>
          <button class="manus-btn">
            <span class="icon"><el-icon><MoreFilled /></el-icon></span>
          </button>
        </div>
      </div>

      <!-- Table Header -->
      <div class="table-header">
        <div class="table-row">
          <div class="table-cell checkbox-cell">
            <el-checkbox v-model="selectAll" />
          </div>
          <div class="table-cell" style="flex: 1.5">任务名称</div>
          <div class="table-cell" style="flex: 0.8">状态</div>
          <div class="table-cell" style="flex: 0.8">优先级</div>
          <div class="table-cell" style="flex: 1">负责人</div>
          <div class="table-cell" style="flex: 1">截止时间</div>
          <div class="table-cell action-cell">操作</div>
        </div>
      </div>

      <!-- Table Body -->
      <div class="table-body">
        <div
          v-for="item in filteredTasks"
          :key="item.id"
          class="table-row"
          :class="{ 'is-selected': selectedIds.includes(item.id) }"
        >
          <div class="table-cell checkbox-cell">
            <el-checkbox v-model="selectedIds" :value="item.id" />
          </div>
          <div class="table-cell" style="flex: 1.5">
            <a class="manus-link task-name">{{ item.name }}</a>
          </div>
          <div class="table-cell" style="flex: 0.8">
            <el-tag :type="getStatusType(item.status)" size="small" effect="light" round>
              {{ item.status }}
            </el-tag>
          </div>
          <div class="table-cell" style="flex: 0.8">
            <span class="priority" :class="'priority-' + item.priority">
              {{ getPriorityLabel(item.priority) }}
            </span>
          </div>
          <div class="table-cell" style="flex: 1">
            <div class="user-avatar">
              <el-avatar :size="24">{{ item.assignee.charAt(0) }}</el-avatar>
              <span class="user-name">{{ item.assignee }}</span>
            </div>
          </div>
          <div class="table-cell" style="flex: 1">
            <span class="due-date" :class="{ 'is-overdue': isOverdue(item.dueDate) }">
              {{ item.dueDate }}
            </span>
          </div>
          <div class="table-cell action-cell">
            <button class="manus-btn icon-btn">
              <span class="icon"><el-icon><MoreFilled /></el-icon></span>
            </button>
          </div>
        </div>
      </div>

      <!-- Table Footer -->
      <div class="table-footer">
        <div class="footer-left">
          <span class="selected-count">已选择 {{ selectedIds.length }} 项</span>
          <button class="manus-btn">
            <span class="text">批量操作</span>
          </button>
        </div>
        <div class="footer-right">
          <span class="page-info">共 {{ tasks.length }} 条</span>
          <el-pagination
            v-model:current-page="currentPage"
            :total="tasks.length"
            :page-size="10"
            layout="prev, pager, next"
            small
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Filter, Grid, MoreFilled, Plus } from '@element-plus/icons-vue'

// 模拟数据
const tasks = ref([
  { id: 1, name: '完成用户认证模块开发', status: '已完成', priority: 'high', assignee: '张伟', dueDate: '2026-01-20' },
  { id: 2, name: '修复登录页面样式问题', status: '进行中', priority: 'medium', assignee: '李娜', dueDate: '2026-02-10' },
  { id: 3, name: '优化数据表格性能', status: '待开始', priority: 'low', assignee: '王明', dueDate: '2026-02-15' },
  { id: 4, name: '集成第三方 API 接口', status: '进行中', priority: 'high', assignee: '赵芳', dueDate: '2026-02-08' },
  { id: 5, name: '编写单元测试用例', status: '待开始', priority: 'medium', assignee: '陈刚', dueDate: '2026-02-20' },
])

const searchKeyword = ref('')
const selectAll = ref(false)
const selectedIds = ref<number[]>([])
const currentPage = ref(1)

const filteredTasks = computed(() => {
  if (!searchKeyword.value) return tasks.value
  return tasks.value.filter(t =>
    t.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

const getStatusType = (status: string) => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
    '已完成': 'success',
    '进行中': 'warning',
    '待开始': 'info'
  }
  return map[status] || 'info'
}

const getPriorityLabel = (priority: string) => {
  const map: Record<string, string> = {
    'high': '高',
    'medium': '中',
    'low': '低'
  }
  return map[priority] || priority
}

const isOverdue = (date: string) => {
  return new Date(date) < new Date()
}
</script>

<style scoped lang="scss">

.manus-page {
  padding: 12px 16px;
  background: transparent;
  min-height: 100%;
}

// Page Header
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  .header-title {
    h1 {
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 2px;
    }

    .header-subtitle {
      font-size: 12px;
      color: $text-secondary;
    }
  }

  .header-actions {
    display: flex;
    gap: 6px;
  }
}

// Table Card
.table-card {
  overflow: hidden;
}

// Toolbar
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid $border-base;

  .toolbar-left {
    .search-input {
      width: 200px;
    }
  }

  .toolbar-right {
    display: flex;
    gap: 4px;
  }
}

// Table Header
.table-header {
  background: $bg-hover;
  border-bottom: 1px solid $border-base;

  .table-row {
    border-bottom: none;
  }
}

// Table Row
.table-row {
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid $border-light;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: $bg-hover;
  }

  &.is-selected {
    background-color: $bg-selected;
  }
}

.table-cell {
  padding: 8px 6px;
  font-size: 12px;
  color: $text-primary;
  display: flex;
  align-items: center;

  &.checkbox-cell {
    width: 32px;
  }

  &.action-cell {
    width: 48px;
    justify-content: center;
  }
}

.table-header .table-cell {
  font-weight: 500;
  color: $text-secondary;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

// Task Name
.task-name {
  font-weight: 500;
}

// Priority
.priority {
  display: inline-flex;
  align-items: center;
  font-size: 12px;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
  }

  &.priority-high::before {
    background: $danger-color;
  }

  &.priority-medium::before {
    background: $warning-color;
  }

  &.priority-low::before {
    background: $info-color;
  }
}

// User Avatar
.user-avatar {
  display: flex;
  align-items: center;
  gap: 6px;

  .user-name {
    color: $text-primary;
  }
}

// Due Date
.due-date {
  color: $text-secondary;

  &.is-overdue {
    color: $danger-color;
  }
}

// Icon Button
.icon-btn {
  padding: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

// Table Footer
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid $border-base;
  background: $bg-page;

  .footer-left {
    display: flex;
    align-items: center;
    gap: 8px;

    .selected-count {
      font-size: 13px;
      color: $text-secondary;
    }
  }

  .footer-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .page-info {
      font-size: 13px;
      color: $text-secondary;
    }
  }
}
</style>
