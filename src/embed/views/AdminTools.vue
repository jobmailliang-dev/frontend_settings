<template>
  <div class="admin-tools">
    <div class="page-header">
      <h2>工具管理</h2>
      <p>管理系统中的工具配置</p>
    </div>

    <el-card class="content-card">
      <template #header>
        <div class="card-header">
          <span>工具列表</span>
          <el-button type="primary" size="small">新增工具</el-button>
        </div>
      </template>

      <el-table :data="tools" style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button-group>
              <el-button size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && tools.length === 0" description="暂无工具" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { ToolConfig } from '@shared-types';

const loading = ref(false);
const tools = ref<ToolConfig[]>([]);

// 模拟工具数据
const mockTools: ToolConfig[] = [
  {
    id: 1,
    name: 'bash',
    description: '执行 Bash 命令',
    is_active: true,
    parameters: [],
    code: ''
  },
  {
    id: 2,
    name: 'datetime',
    description: '日期时间操作',
    is_active: true,
    parameters: [],
    code: ''
  },
  {
    id: 3,
    name: 'calculator',
    description: '计算器',
    is_active: true,
    parameters: [],
    code: ''
  }
];

onMounted(() => {
  loading.value = true;
  setTimeout(() => {
    tools.value = mockTools;
    loading.value = false;
  }, 500);
});

const handleEdit = (row: ToolConfig) => {
  ElMessage.info(`编辑工具: ${row.name}`);
};

const handleDelete = async (row: ToolConfig) => {
  try {
    await ElMessageBox.confirm(`确定要删除工具 "${row.name}" 吗？`, '确认删除');
    tools.value = tools.value.filter(t => t.id !== row.id);
    ElMessage.success('删除成功');
  } catch {
    // 用户取消
  }
};
</script>

<style scoped>
.admin-tools {
  padding: 16px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin-bottom: 8px;
  color: #1a1a1a;
}

.page-header p {
  color: #7e7d7a;
}

.content-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
