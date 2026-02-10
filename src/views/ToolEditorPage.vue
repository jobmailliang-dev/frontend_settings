<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Close, CopyDocument } from '@element-plus/icons-vue';
import type { ToolConfig, ToolParameter } from '@/types/tool';
import { useToolStore } from '@/stores/toolStore';
import ToolEditor from '@/components/ToolEditor.vue';
import ToolParamForm from '@/components/ToolParamForm.vue';
import ToolDebugPanel from '@/components/ToolDebugPanel.vue';
import Console from '@/components/MonacoEditor/Console.vue';
import PageToolbar from '@/components/PageToolbar.vue';

const route = useRoute();
const router = useRouter();
const store = useToolStore();

// 页面状态
const toolId = ref<number | null>(null);
const isCreating = ref(false);
const loading = ref(true);

// 全屏状态
const isFullscreen = ref(false);
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

// 控制台相关状态
const showEditorConsole = ref(false);
const consoleAutoScroll = ref(false);
const editorConsoleData = ref<Array<{ type: 'log' | 'error' | 'warn' | 'info', message: string, timestamp: Date }>>([]);
const consoleRef = ref();
const editorRef = ref();
const isRunningTool = ref(false);

// 编辑表单数据
const editForm = ref<Partial<ToolConfig>>({
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
});

// 调试面板相关状态
const activeTab = ref('config');
const debugResult = ref<any>(undefined);

// 调试面板独立参数（避免与 editForm.parameters 形成双向绑定导致递归监听）
const toolTestParams = ref<ToolParameter[]>([]);


// 初始化调试面板参数
const initToolTestParams = () => {
  const sourceParams = editForm.value.parameters || [];
  toolTestParams.value = sourceParams.map(p => ({ ...p }));
};

// 处理参数变化事件（来自 ToolParamForm）
const handleParamsChange = (params: ToolParameter[]) => {
  toolTestParams.value = params.map(p => ({ ...p }));
  // 清空之前的调试结果
  debugResult.value = undefined;
};

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
  initToolTestParams();
};

const loadTool = async () => {
  loading.value = true;
  try {
    const id = route.params.id;
    if (id) {
      toolId.value = parseInt(id as string);
      const tool = await store.loadTool(toolId.value);
      if (tool) {
        editForm.value = { ...tool, parameters: [...(tool.parameters || [])] };
        isCreating.value = false;
      } else {
        ElMessage.error('工具不存在');
        router.push('/tools');
        return;
      }
    } else {
      resetEditForm();
    }
    initToolTestParams();
    debugResult.value = undefined;
  } finally {
    loading.value = false;
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

  const names = editForm.value.parameters?.map(p => p.name).filter(n => n);
  if (names && new Set(names).size !== names.length) {
    ElMessage.warning('参数名称不能重复');
    return false;
  }

  return true;
};

const saveTool = async () => {
  if (!validateEditForm()) return;

  const result = isCreating.value
    ? await store.createTool(editForm.value)
    : await store.updateTool(editForm.value.id!, editForm.value);

  if (result) {
    ElMessage.success(isCreating.value ? '创建成功' : '保存成功');
    await store.loadInheritableTools();

    // 如果是新建的，更新状态为编辑模式
    if (isCreating.value && result.id) {
      toolId.value = result.id;
      editForm.value.id = result.id;
      isCreating.value = false;
      // 更新 URL 但不跳转
      window.history.replaceState({}, '', `/tools/edit/${result.id}`);
    }
  } else {
    ElMessage.error(store.error || '操作失败');
  }
};

const handleBack = () => {
  router.push('/tools');
};

const syncParameters = () => {
  const inheritableTool = store.inheritableTools.find(t => t.name === editForm.value.inherit_from);
  if (inheritableTool?.parameters) {
    editForm.value.parameters = inheritableTool.parameters.map(p => ({ ...p, required: false }));
    ElMessage.success('已同步参数');
  }
};

// 控制台相关方法
const handleCloseConsole = () => {
  showEditorConsole.value = false;
  editorConsoleData.value = [];
};

const handleClearConsole = () => {
  editorConsoleData.value = [];
};

// 运行工具
const handleRunTool = () => {
  showEditorConsole.value = true;
  consoleAutoScroll.value = true;
  isRunningTool.value = true;

  const now = Date.now();
  editorConsoleData.value = [
    {
      type: 'info',
      message: '开始执行工具...',
      timestamp: new Date(now)
    }
  ];

  setTimeout(() => {
    isRunningTool.value = false;
    editorConsoleData.value.push({
      type: 'log',
      message: '工具执行完成',
      timestamp: new Date(now + 100)
    });
    consoleAutoScroll.value = false;
  }, 500);
};

const handleUpdateConsoleData = (data: Array<{ type: 'log' | 'error' | 'warn' | 'info', message: string, timestamp: number }> | { type: 'log' | 'error' | 'warn' | 'info', message: string, timestamp: number }) => {
  if (!data) {
    editorConsoleData.value = [];
    return;
  }

  const dataArray = Array.isArray(data) ? data : [data];
  const formattedData = dataArray.map(item => ({
    type: item.type,
    message: item.message,
    timestamp: new Date(item.timestamp)
  }));
  editorConsoleData.value.push(...formattedData);
};

onMounted(async () => {
  await store.loadInheritableTools();
  await loadTool();
});
</script>

<template>
  <div class="tool-editor-page page-container" :class="{ 'is-fullscreen': isFullscreen }">
    <!-- 页面头部 -->
    <!-- 页面头部 -->
    <PageToolbar>
      <template #left>
        <button class="manus-btn" @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </button>
        <button class="manus-btn" @click="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '全屏'">
          <svg v-if="!isFullscreen" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
          </svg>
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </button>
      </template>
      <template #right>
        <button class="manus-btn" @click="handleBack">取消</button>
        <button class="save-btn" @click="saveTool">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          保存
        </button>
      </template>
    </PageToolbar>

    <!-- 主体内容 -->
    <div class="edit-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <svg class="spinner" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
        <p>加载中...</p>
      </div>

      <!-- 编辑区域 -->
      <template v-else>
        <!-- 左侧：代码编辑器 -->
        <div class="editor-section">
          <ToolEditor
            ref="editorRef"
            v-model="editForm.code!"
            language="javascript"
            height="100%"
            :show-run-button="true"
            :run-loading="isRunningTool"
            @run="handleRunTool"
          >
            <template #extension>
              <Console
                ref="consoleRef"
                v-if="showEditorConsole"
                :logs="editorConsoleData"
                :auto-scroll="consoleAutoScroll"
                @close="handleCloseConsole"
                @clear="handleClearConsole"
              />
            </template>
          </ToolEditor>
        </div>

        <!-- 右侧：配置面板 -->
        <div class="config-section">
          <el-tabs v-model="activeTab" type="border-card">
            <el-tab-pane label="配置" name="config">
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

                <div v-if="store.inheritableTools.length > 0" class="form-group">
                  <label>继承工具</label>
                  <div class="inherit-row">
                    <select v-model="editForm.inherit_from" class="form-input">
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

                <div class="form-group-inline">
                  <label class="checkbox-label">
                    <input v-model="editForm.is_active" type="checkbox" />
                    <span>启用此工具</span>
                  </label>
                </div>
              </div>

              <!-- 参数配置 -->
              <div class="param-form-wrapper">
                <ToolParamForm
                  v-model="editForm.parameters!"
                  :inherit-from="editForm.inherit_from"
                  @sync-params="syncParameters"
                  @change="handleParamsChange"
                />
              </div>
            </el-tab-pane>

            <!-- 调试面板 -->
            <el-tab-pane label="调试" name="debug">
              <div class="debug-panel-container">
                <ToolDebugPanel
                  :tool-id="toolId || undefined"
                  :parameters="toolTestParams"
                  :show-header="false"
                />
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.tool-editor-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 32px;
  background: #ffffff;
  overflow: hidden;
}

.tool-editor-page.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  height: 100vh;
  max-width: none;
  margin: 0;
  padding: 0;
  border-radius: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
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

/* 保存按钮 */
.save-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 24px;
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

.edit-content {
  flex: 1;
  display: flex;
  gap: 0;
  overflow: hidden;
  width: 100%;
}

.editor-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  border-radius: 8px;
  padding: 16px;
}

.param-form-wrapper {
  margin-top: 12px;
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

.inherit-row {
  display: flex;
  gap: 8px;
}

.inherit-row .form-input {
  flex: 1;
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

.sync-btn {
  height: 32px;
  padding: 6px 12px;
  font-size: 12px;
}

/* Element Plus Tabs 样式定制 */
.config-section :deep(.el-tabs--border-card) {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: none;
}

.config-section :deep(.el-tabs__header) {
  background: #fafafa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  margin: 0;
}

.config-section :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.config-section :deep(.el-tabs__item) {
  height: 40px;
  line-height: 40px;
  font-size: 14px;
  color: #858481;
  border: none !important;
  transition: all 0.2s ease;
}

.config-section :deep(.el-tabs__item:hover) {
  color: #37352f;
}

.config-section :deep(.el-tabs__item.is-active) {
  color: #007aff !important;
  background: #ffffff;
  font-weight: 500;
}

.config-section :deep(.el-tabs__active-bar) {
  background: #007aff;
  height: 2px;
}

.config-section :deep(.el-tabs__content) {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #ffffff;
}

.config-section :deep(.el-tab-pane) {
  height: 100%;
}

.debug-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px;
}

.debug-panel-container {
  height: 100%;
  overflow-y: auto;
}

@media (max-width: 1024px) {
  .edit-content {
    flex-direction: column;
    overflow-y: auto;
  }

  .editor-section {
    height: 300px;
  }

  .config-section {
    width: 100%;
    border-left: none;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }
}
</style>
