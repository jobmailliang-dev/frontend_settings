<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import type { ToolConfig } from "@settings/types/tool";
import { useToolStore } from "@settings/stores/toolStore";
import ToolCard from "@settings/components/ToolCard.vue";
import ToolListFilter from "@settings/components/ToolListFilter.vue";
import ToolImportDialog from "@settings/components/ToolImportDialog.vue";
import ToolDebugPanel from "@settings/components/ToolDebugPanel.vue";

const router = useRouter();
const store = useToolStore();

// 页面状态
const showImportDialog = ref(false);

// 调试面板相关状态
const debugTool = ref<ToolConfig | null>(null);
const showDebugPanel = ref(false);

// 跳转到新建工具页面
const handleCreate = () => {
  router.push("/tools/edit");
};

// 跳转到编辑工具页面
const handleEdit = (tool: ToolConfig) => {
  router.push(`/tools/edit/${tool.id}`);
};

// 处理删除
const handleDelete = async (tool: ToolConfig) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除工具 "${tool.name}" 吗？此操作不可恢复。`,
      "确认删除",
      {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    const success = await store.deleteTool(tool.id!);
    if (success) {
      ElMessage.success("删除成功");
    } else {
      ElMessage.error(store.error || "删除失败");
    }
  } catch {
    // 用户取消
  }
};

// 处理复制（跳转到新建页面并预填充数据）
const handleDuplicate = async (tool: ToolConfig) => {
  const result = await store.duplicateTool(tool);
  if (result) {
    ElMessage.success("复制成功");
    router.push(`/tools/edit/${result.id}`);
  } else {
    ElMessage.error(store.error || "复制失败");
  }
};

const handleToggle = async (tool: ToolConfig) => {
  const newStatus = !tool.is_active;
  const result = await store.toggleTool(tool.id!, newStatus);
  if (result) {
    ElMessage.success(newStatus ? "已启用" : "已停用");
  } else {
    ElMessage.error(store.error || "操作失败");
  }
};

const handleTest = (tool: ToolConfig) => {
  debugTool.value = tool;
  showDebugPanel.value = true;
};

const closeDebugPanel = () => {
  showDebugPanel.value = false;
  debugTool.value = null;
};

const handleImport = async (tools: ToolConfig[]) => {
  const success = await store.importToolsFromFile(
    new File([JSON.stringify(tools)], "import.json", {
      type: "application/json",
    }),
  );

  if (success) {
    ElMessage.success(`成功导入 ${tools.length} 个工具`);
    showImportDialog.value = false;
  } else {
    ElMessage.error(store.error || "导入失败");
  }
};

const handleExport = () => {
  store.exportAllTools();
  ElMessage.success("导出成功");
};

// 加载数据
onMounted(async () => {
  await store.loadTools();
});
</script>

<template>
  <div class="tool-management page-container">
    <!-- 顶部筛选栏 -->
    <ToolListFilter
      @create="handleCreate"
      @import="showImportDialog = true"
      @export="handleExport"
    />

    <!-- 主体内容 -->
    <div class="content-wrapper">
      <!-- 加载状态 -->
      <div v-if="store.loading" class="loading-state">
        <svg
          class="spinner"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
        <p>加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="store.filteredTools.length === 0" class="empty-state">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1"
        >
          <path
            d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
          />
        </svg>
        <h3>暂无工具</h3>
        <p>点击上方"新建工具"按钮创建第一个工具</p>
      </div>

      <!-- 工具列表 -->
      <div v-else class="tool-grid">
        <ToolCard
          v-for="tool in store.filteredTools"
          :key="tool.id"
          :tool="tool"
          @test="handleTest"
          @edit="handleEdit"
          @duplicate="handleDuplicate"
          @delete="handleDelete"
          @toggle="handleToggle"
        />
      </div>
    </div>

    <!-- 导入对话框 -->
    <ToolImportDialog v-model="showImportDialog" @import="handleImport" />

    <!-- 调试面板 -->
    <div v-if="showDebugPanel" class="debug-panel-overlay">
      <div class="debug-panel-wrapper">
        <ToolDebugPanel
          :tool-name="debugTool?.name"
          :tool-description="debugTool?.description"
          :tool-id="debugTool?.id"
          :parameters="debugTool?.parameters || []"
          @close="closeDebugPanel"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-management {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #ffffff;
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.tool-list {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #8e8e93;
}

.spinner {
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.empty-state svg {
  margin-bottom: 20px;
  opacity: 0.4;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #37352f;
}

.empty-state p {
  margin: 0;
  font-size: 13px;
}

/* 调试面板遮罩 */
.debug-panel-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  background: rgba(0, 0, 0, 0.3);
}

.debug-panel-wrapper {
  width: 500px;
  height: 100%;
  background: #ffffff;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.2s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
