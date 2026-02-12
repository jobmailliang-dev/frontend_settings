<template>
  <div class="admin-home">
    <div class="welcome-section">
      <h2>欢迎使用 WMAI 管理后台</h2>
      <p>您可以在这里管理系统工具和配置</p>
    </div>

    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="工具数量" :value="toolCount" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="活跃工具" :value="activeCount" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="今日执行" :value="executionCount" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// 统计数据
const toolCount = ref(0);
const activeCount = ref(0);
const executionCount = ref(0);

onMounted(() => {
  // 模拟加载数据
  toolCount.value = 5;
  activeCount.value = 3;
  executionCount.value = 12;
});
</script>

<style scoped>
.admin-home {
  padding: 16px;
}

.welcome-section {
  margin-bottom: 24px;
}

.welcome-section h2 {
  margin-bottom: 8px;
  color: #1a1a1a;
}

.welcome-section p {
  color: #7e7d7a;
}

.stat-card {
  margin-bottom: 16px;
}
</style>
