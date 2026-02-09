<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { ToolConfig } from '@/types/tool';
import { useToolStore } from '@/stores/toolStore';
import ToolCard from '@/components/ToolCard.vue';
import ToolListFilter from '@/components/ToolListFilter.vue';
import ToolEditor from '@/components/ToolEditor.vue';
import ToolParamForm from '@/components/ToolParamForm.vue';
import ToolDebugPanel from '@/components/ToolDebugPanel.vue';
import ToolImportDialog from '@/components/ToolImportDialog.vue';

const store = useToolStore();

// 页面状态
const showImportDialog = ref(false);
const editingTool = ref<ToolConfig | null>(null);
const showDebugPanel = ref(false);
const isCreating = ref(false);

// 编辑表单数据
const editForm = ref<Partial<ToolConfig>>({
  name: '',
  description: '',
  is_active: true,
  parameters: [],
  inherit_from: '',
  code: '',
});

const resetEditForm = () => {
  editForm.value = {
    name: '',
    description: '',
    is_active: true,
    parameters: [],
    inherit_from: '',
    code: `// 在此编写工具代码
function execute(params) {
  // 工具逻辑
  return { success: true, result: null };
}`,
  };
  isCreating.value = true;
};

const startEdit = (tool?: ToolConfig) => {
  if (tool) {
    editForm.value = { ...tool, parameters: [...(tool.parameters || [])] };
    isCreating.value = false;
  } else {
    resetEditForm();
  }
  editingTool.value = tool || {} as ToolConfig;
  showDebugPanel.value = false;
};

const saveTool = async () => {
  if (!validateEditForm()) return;

  const result = isCreating.value
    ? await store.createTool(editForm.value)
    : await store.updateTool(editForm.value.id!, editForm.value);

  if (result) {
    ElMessage.success(isCreating.value ? '创建成功' : '保存成功');
    editingTool.value = null;
  } else {
    ElMessage.error(store.error || '操作失败');
  }
};

const validateEditForm = () => {
  if (!editForm.value.name?.trim()) {
    ElMessage.warning('请输入工具名称');
    return false;
  }
  if (!editForm.value.description?.trim()) {
    ElMessage.warning('请输入工具描述');
    return false;
  }
  if (!editForm.value.code?.trim()) {
    ElMessage.warning('请输入工具代码');
    return false;
  }

  // 验证参数名称不重复
  const names = editForm.value.parameters?.map(p => p.name).filter(n => n);
  if (names && new Set(names).size !== names.length) {
    ElMessage.warning('参数名称不能重复');
    return false;
  }

  return true;
};

const handleDelete = async (tool: ToolConfig) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除工具 "${tool.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    const success = await store.deleteTool(tool.id!);
    if (success) {
      ElMessage.success('删除成功');
    } else {
      ElMessage.error(store.error || '删除失败');
    }
  } catch {
    // 用户取消
  }
};

const handleDuplicate = async (tool: ToolConfig) => {
  const result = await store.duplicateTool(tool);
  if (result) {
    ElMessage.success('复制成功');
    startEdit(result);
  } else {
    ElMessage.error(store.error || '复制失败');
  }
};

const handleTest = (tool: ToolConfig) => {
  editingTool.value = tool;
  showDebugPanel.value = true;
};

const closeEditDialog = () => {
  editingTool.value = null;
  isCreating.value = false;
};

const handleImport = async (tools: ToolConfig[]) => {
  const success = await store.importToolsFromFile(
    new File([JSON.stringify(tools)], 'import.json', { type: 'application/json' })
  );

  if (success) {
    ElMessage.success(`成功导入 ${tools.length} 个工具`);
    showImportDialog.value = false;
  } else {
    ElMessage.error(store.error || '导入失败');
  }
};

const handleExport = () => {
  store.exportAllTools();
  ElMessage.success('导出成功');
};

const syncParameters = () => {
  const inheritableTool = store.inheritableTools.find(t => t.name === editForm.value.inherit_from);
  if (inheritableTool?.parameters) {
    editForm.value.parameters = inheritableTool.parameters.map(p => ({ ...p, required: false }));
    ElMessage.success('已同步参数');
  }
};

// 加载数据
onMounted(async () => {
  await Promise.all([
    store.loadTools(),
    store.loadInheritableTools(),
  ]);
});

// 全屏状态
const isFullscreen = ref(false);

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};
</script>

<template>
  <div class="tool-management">
    <!-- 顶部筛选栏 -->
    <ToolListFilter
      @create="startEdit()"
      @import="showImportDialog = true"
      @export="handleExport"
    />

    <!-- 主体内容 -->
    <div class="content-wrapper">
      <!-- 加载状态 -->
      <div v-if="store.loading" class="loading-state">
        <svg class="spinner" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
        <p>加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="store.filteredTools.length === 0" class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
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
          @edit="startEdit($event)"
          @duplicate="handleDuplicate"
          @delete="handleDelete"
        />
      </div>
    </div>

    <!-- 编辑弹框 -->
    <Teleport to="body">
      <Transition name="dialog">
        <div v-if="editingTool" class="edit-dialog-overlay" :class="{ 'is-fullscreen': isFullscreen }" @click.self="closeEditDialog">
          <div class="edit-dialog" :class="{ 'is-fullscreen': isFullscreen }">
            <!-- 弹框头部 -->
            <div class="dialog-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
                {{ isCreating ? '新建工具' : '编辑工具' }}
              </h3>
              <div class="header-actions">
                <button class="icon-btn" @click="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '全屏'">
                  <svg v-if="!isFullscreen" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                  </svg>
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                  </svg>
                </button>
                <button class="close-btn" @click="closeEditDialog">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- 弹框内容 -->
            <div class="dialog-content">
              <!-- 左侧：代码编辑器 -->
              <div class="editor-section">
                <ToolEditor
                  v-model="editForm.code!"
                  language="javascript"
                  height="400px"
                />

                <!-- 继承信息 -->
                <div v-if="store.inheritableTools.length > 0" class="inherit-info">
                  <label>继承自:</label>
                  <select v-model="editForm.inherit_from" class="inherit-select">
                    <option value="">无</option>
                    <option
                      v-for="tool in store.inheritableTools"
                      :key="tool.id"
                      :value="tool.name"
                    >
                      {{ tool.name }}
                    </option>
                  </select>
                  <button
                    v-if="editForm.inherit_from"
                    class="manus-btn sync-btn"
                    @click="syncParameters"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="23 4 23 10 17 10"/>
                      <polyline points="1 20 1 14 7 14"/>
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                    </svg>
                    同步参数
                  </button>
                </div>
              </div>

              <!-- 右侧：配置面板 -->
              <div class="config-section">
                <!-- 基本信息 -->
                <div class="config-card">
                  <h4>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    基本信息
                  </h4>

                  <div class="form-group">
                    <label>工具名称 <span class="required">*</span></label>
                    <input
                      v-model="editForm.name"
                      type="text"
                      placeholder="请输入工具名称"
                      class="form-input"
                    />
                  </div>

                  <div class="form-group">
                    <label>工具描述 <span class="required">*</span></label>
                    <textarea
                      v-model="editForm.description"
                      placeholder="请输入工具描述"
                      class="form-textarea"
                      rows="3"
                    ></textarea>
                  </div>

                  <div class="form-group-inline">
                    <label class="checkbox-label">
                      <input v-model="editForm.is_active" type="checkbox" />
                      <span>启用此工具</span>
                    </label>
                  </div>
                </div>

                <!-- 参数配置 -->
                <ToolParamForm
                  v-model="editForm.parameters!"
                  :inherit-from="editForm.inherit_from"
                  @sync-params="syncParameters"
                />
              </div>
            </div>

            <!-- 弹框底部 -->
            <div class="dialog-footer">
              <button class="manus-btn" @click="closeEditDialog">取消</button>
              <button class="save-btn" @click="saveTool">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                保存
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 调试弹框 -->
    <Teleport to="body">
      <Transition name="dialog">
        <div v-if="showDebugPanel" class="debug-dialog-overlay" @click.self="showDebugPanel = false">
          <div class="debug-dialog">
            <ToolDebugPanel
              :tool="editingTool"
              @close="showDebugPanel = false"
            />
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 导入对话框 -->
    <ToolImportDialog
      v-model="showImportDialog"
      @import="handleImport"
    />
  </div>
</template>

<style scoped>
.tool-management {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}

.content-wrapper {
  flex: 1;
  overflow: hidden;
  transition: padding-right 0.3s ease;
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
  height: 100%;
  min-height: 300px;
  color: #8e8e93;
}

.spinner {
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.edit-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #f8f8f7;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  color: #7e7d7a;
  cursor: pointer;
  transition: all 0.15s ease;
}

.back-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #37352f;
}

.edit-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.edit-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.edit-badge.creating {
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
}

.edit-badge.editing {
  background: rgba(52, 199, 89, 0.1);
  color: #34c759;
}

.edit-content {
  flex: 1;
  display: flex;
  gap: 0;
  overflow: hidden;
}

.editor-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
}

.inherit-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  margin-top: 10px;
  background: #f8f8f7;
  border-radius: 8px;
  font-size: 13px;
}

.inherit-info label {
  color: #7e7d7a;
  white-space: nowrap;
}

.inherit-select {
  flex: 1;
  height: 32px;
  padding: 0 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-size: 13px;
  background: #ffffff;
  color: #37352f;
  outline: none;
}

.sync-btn {
  height: 32px;
  padding: 6px 12px;
  font-size: 12px;
}

.config-section {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
  overflow-y: auto;
  border-left: 1px solid rgba(0, 0, 0, 0.08);
}

.config-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 16px;
}

.config-card h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 13px;
  font-weight: 600;
  color: #37352f;
}

.form-group {
  margin-bottom: 14px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #7e7d7a;
}

.required {
  color: #ff3b30;
}

.form-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 14px;
  background: #fafafa;
  color: #37352f;
  outline: none;
  transition: all 0.2s ease;
}

.form-input:focus {
  background: #ffffff;
  border-color: #007aff;
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 14px;
  background: #fafafa;
  color: #37352f;
  outline: none;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s ease;
}

.form-textarea:focus {
  background: #ffffff;
  border-color: #007aff;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #37352f;
  cursor: pointer;
}

.checkbox-label input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.debug-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 16px;
}

.debug-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8f8f7;
  border: 1px dashed rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #37352f;
  cursor: pointer;
  transition: all 0.2s ease;
}

.debug-btn:hover {
  background: #f1f1f0;
  border-color: #007aff;
  color: #007aff;
}

.debug-container {
  position: fixed;
  top: 0;
  right: 0;
  width: 450px;
  height: 100vh;
  z-index: 100;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

@media (max-width: 1024px) {
  .edit-content {
    flex-direction: column;
  }

  .config-section {
    width: 100%;
    border-left: none;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }

  .debug-container {
    width: 100%;
  }
}

/* ========== 编辑弹框样式 ========== */
.edit-dialog-overlay,
.debug-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.edit-dialog {
  width: 90%;
  max-width: 1200px;
  height: 88vh;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.debug-dialog {
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.dialog-header h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8e8e93;
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #37352f;
}

.dialog-content {
  flex: 1;
  display: flex;
  gap: 0;
  padding: 0;
  overflow: hidden;
}

.dialog-content .editor-section {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.dialog-content .config-section {
  width: 380px;
  overflow-y: auto;
  border-left: 1px solid rgba(0, 0, 0, 0.08);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: #fafafa;
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: #007aff;
  border: none;
  border-radius: 20px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn:hover {
  background: #0066d6;
}

/* 弹框动画 */
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .edit-dialog,
.dialog-leave-to .edit-dialog {
  transform: scale(0.95);
}

.dialog-enter-from .debug-dialog,
.dialog-leave-to .debug-dialog {
  transform: scale(0.95);
}

@media (max-width: 1024px) {
  .edit-dialog {
    width: 95%;
    max-height: 95vh;
    border-radius: 12px;
  }

  .dialog-content {
    flex-direction: column;
    overflow-y: auto;
  }

  .dialog-content .editor-section {
    height: 300px;
  }

  .dialog-content .config-section {
    width: 100%;
    border-left: none;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }
}

/* 全屏样式 */
.edit-dialog-overlay.is-fullscreen {
  background: rgba(0, 0, 0, 0.5);
}

.edit-dialog.is-fullscreen {
  width: 100%;
  max-width: 100%;
  height: 100vh;
  max-height: 100vh;
  border-radius: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions .icon-btn,
.header-actions .close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8e8e93;
  transition: all 0.15s ease;
}

.header-actions .icon-btn:hover,
.header-actions .close-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #37352f;
}
</style>
