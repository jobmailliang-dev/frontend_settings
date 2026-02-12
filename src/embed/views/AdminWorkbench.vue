<template>
  <div class="admin-workbench">
    <div class="page-header">
      <h2>工作台</h2>
      <p>管理您的工具和工作流</p>
    </div>

    <el-card class="content-card">
      <template #header>
        <div class="card-header">
          <span>工作台功能开发中</span>
        </div>
      </template>
      <div class="workbench-content">
        <el-empty description="工作台功能即将上线" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// 工作台页面
</script>

<style scoped>
.admin-workbench {
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

.workbench-content {
  padding: 40px 0;
}
</style>
