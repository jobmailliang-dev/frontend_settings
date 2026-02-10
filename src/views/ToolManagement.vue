<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Close, Plus, Tools, CopyDocument } from '@element-plus/icons-vue';
import type { ToolConfig } from '@/types/tool';
import { useToolStore } from '@/stores/toolStore';
import ToolCard from '@/components/ToolCard.vue';
import ToolListFilter from '@/components/ToolListFilter.vue';
import ToolEditor from '@/components/ToolEditor.vue';
import ToolParamForm from '@/components/ToolParamForm.vue';
import ToolImportDialog from '@/components/ToolImportDialog.vue';
import Console from '@/components/MonacoEditor/Console.vue';

const store = useToolStore();

// 页面状态
const showImportDialog = ref(false);
const editingTool = ref<ToolConfig | null>(null);
const isCreating = ref(false);

// 控制台相关状态
const showEditorConsole = ref(false);
const consoleAutoScroll = ref(false);
const editorConsoleData = ref<Array<{ type: 'log' | 'error' | 'warn' | 'info', message: string, timestamp: Date }>>([]);
const consoleRef = ref();
const editorRef = ref();
const isRunningTool = ref(false);

// 调试面板相关状态
const activeTab = ref('config');
const debugParams = ref<Record<string, any>>({});
const debugResult = ref<any>(undefined);
const debugTestLoading = ref(false);

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
  activeTab.value = 'config';
  initDebugParams();
  debugResult.value = undefined;
};

const saveTool = async () => {
  if (!validateEditForm()) return;

  const result = isCreating.value
    ? await store.createTool(editForm.value)
    : await store.updateTool(editForm.value.id!, editForm.value);

  if (result) {
    ElMessage.success(isCreating.value ? '创建成功' : '保存成功');
    await store.loadInheritableTools(); // 刷新可继承工具列表
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

const handleToggle = async (tool: ToolConfig) => {
  const newStatus = !tool.is_active;
  const result = await store.toggleTool(tool.id!, newStatus);
  if (result) {
    ElMessage.success(newStatus ? '已启用' : '已停用');
  } else {
    ElMessage.error(store.error || '操作失败');
  }
};

const handleTest = (tool: ToolConfig) => {
  debugTool.value = tool;
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
  // 显示控制台
  showEditorConsole.value = true;
  consoleAutoScroll.value = true;
  isRunningTool.value = true;

  // 模拟执行输出（实际应调用工具执行API）
  const now = Date.now();
  editorConsoleData.value = [
    {
      type: 'info',
      message: '开始执行工具...',
      timestamp: new Date(now)
    }
  ];

  // 模拟执行完成
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

// ==================== 调试面板相关方法 ====================

// 初始化调试参数
const initDebugParams = () => {
  if (!editForm.value) {
    debugParams.value = {};
    return;
  }

  const params: Record<string, any> = {};

  if (editForm.value.parameters) {
    editForm.value.parameters.forEach(param => {
      // 优先使用默认值
      if (param.default !== undefined && param.default !== '') {
        // 根据类型转换默认值
        if (param.type === 'boolean') {
          params[param.name] = param.default === 'true' || param.default === true;
        } else if (param.type === 'number' || param.type === 'integer') {
          const numValue = parseFloat(param.default);
          params[param.name] = isNaN(numValue) ? '' : numValue;
        } else if (param.type === 'object') {
          if (typeof param.default === 'object' && param.default !== null && !Array.isArray(param.default)) {
            params[param.name] = Object.entries(param.default).map(([key, value]) => ({
              key,
              value: typeof value === 'string' ? value : JSON.stringify(value)
            }));
          } else {
            params[param.name] = [{ key: '', value: '' }];
          }
        } else {
          params[param.name] = param.default;
        }
      } else {
        // 没有默认值时的初始化
        if (param.type === 'boolean') {
          params[param.name] = false;
        } else if (param.type === 'array') {
          params[param.name] = [];
        } else if (param.type === 'object') {
          params[param.name] = [{ key: '', value: '' }];
        } else if (param.type === 'number' || param.type === 'integer') {
          params[param.name] = '';
        } else {
          params[param.name] = '';
        }
      }
    });
  }

  debugParams.value = params;
};

// 检查必填参数
const checkRequiredParams = () => {
  if (!editForm.value || !editForm.value.parameters) return true;

  const missingParams = editForm.value.parameters.filter(param => {
    if (!param.required) return false;
    const value = debugParams.value[param.name];
    return value === undefined || value === '' || value === null;
  });

  if (missingParams.length > 0) {
    const paramNames = missingParams.map(p => p.name).join('、');
    ElMessage.warning(`请填写必填参数：${paramNames}`);
    return false;
  }

  return true;
};

// 测试工具
const testTool = async () => {
  if (!editForm.value || !editForm.value.name) {
    ElMessage.warning('请先保存工具或确保工具名称不为空');
    return;
  }

  // 检查必填参数
  if (!checkRequiredParams()) return;

  // 显示控制台
  showEditorConsole.value = true;
  consoleAutoScroll.value = true;

  debugTestLoading.value = true;
  debugResult.value = undefined;

  try {
    // 准备参数
    const params: Record<string, any> = {};

    if (editForm.value.parameters) {
      editForm.value.parameters.forEach(param => {
        let value = debugParams.value[param.name];

        // 处理对象类型的参数
        if (param.type === 'object') {
          if (Array.isArray(value)) {
            const newObject: Record<string, any> = {};
            value.forEach((item: any) => {
              if (item.key && item.key.trim() !== '') {
                let parsedValue = item.value;
                try {
                  parsedValue = JSON.parse(item.value);
                } catch {
                  // 不是有效JSON，保持原字符串
                }
                newObject[item.key] = parsedValue;
              }
            });
            value = newObject;
          }
        } else if (value === '') {
          value = null;
        } else if (param.type === 'number' && value !== null && value !== '') {
          value = parseFloat(value);
          if (isNaN(value)) value = null;
        } else if (param.type === 'integer' && value !== null && value !== '') {
          value = parseInt(value, 10);
          if (isNaN(value)) value = null;
        }

        params[param.name] = value;
      });
    }

    // 模拟执行结果（实际应调用工具执行API）
    await new Promise(resolve => setTimeout(resolve, 500));

    debugResult.value = {
      success: true,
      message: '测试执行成功',
      data: params,
      execution_time: '0.05s'
    };

    ElMessage.success('工具测试完成');
  } catch (error) {
    debugResult.value = { success: false, error: String(error) };
    ElMessage.error('工具执行失败');
  } finally {
    debugTestLoading.value = false;
    consoleAutoScroll.value = false;
  }
};

// 清除调试结果
const clearDebugResult = () => {
  debugResult.value = undefined;
};

// 拷贝调试结果
const copyDebugResult = () => {
  try {
    const resultText = formatDebugResult(debugResult.value);
    navigator.clipboard.writeText(resultText).then(() => {
      ElMessage.success('执行结果已拷贝到剪贴板');
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = resultText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      ElMessage.success('执行结果已拷贝到剪贴板');
    });
  } catch (error) {
    console.error('拷贝执行结果失败:', error);
    ElMessage.error('拷贝失败');
  }
};

// 刷新调试参数
const refreshDebugParams = () => {
  initDebugParams();
  ElMessage.success('参数已重置为配置默认值');
};

// 格式化调试结果
const formatDebugResult = (result: any) => {
  if (!result) return '';
  if (typeof result === 'string') {
    if (result.startsWith('{') || result.startsWith('[')) {
      try {
        return JSON.stringify(JSON.parse(result), null, 2);
      } catch {
        return result;
      }
    }
    return result;
  }
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
};

// 添加调试数组项
const addDebugArrayItem = (paramName: string) => {
  if (!debugParams.value[paramName]) {
    debugParams.value[paramName] = [];
  }
  debugParams.value[paramName].push('');
};

// 删除调试数组项
const removeDebugArrayItem = (paramName: string, index: number) => {
  if (debugParams.value[paramName] && debugParams.value[paramName].length > index) {
    debugParams.value[paramName].splice(index, 1);
  }
};

// 处理数字输入
const handleDebugNumberInput = (paramName: string, value: string) => {
  const numericValue = value.replace(/[^0-9.-]/g, '');
  const cleanValue = numericValue.replace(/-/g, (match, offset) => offset === 0 ? match : '');
  const finalValue = cleanValue.replace(/\./g, (match, offset, string) => {
    return string.indexOf('.') === offset ? match : '';
  });
  debugParams.value[paramName] = finalValue;
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
          @toggle="handleToggle"
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
                    <ToolParamForm
                      v-model="editForm.parameters!"
                      :inherit-from="editForm.inherit_from"
                      @sync-params="syncParameters"
                    />
                  </el-tab-pane>

                  <!-- 调试面板 -->
                  <el-tab-pane label="调试" name="debug">
                    <div class="debug-section">
                      <!-- 参数输入表单 -->
                      <div class="debug-form" v-if="editForm.parameters && editForm.parameters.length > 0">
                        <div class="form-title">
                          参数配置
                          <el-button size="small" text type="primary" @click="refreshDebugParams" class="refresh-params-btn" title="重置为配置默认值">
                            <el-icon>
                              <Refresh />
                            </el-icon>
                          </el-button>
                        </div>
                        <div v-for="param in editForm.parameters" :key="param.name" class="param-item">
                          <label class="param-label">
                            {{ param.name }}
                            <span v-if="param.required" class="required-mark">*</span>
                          </label>
                          <div class="param-input-wrapper">
                            <!-- 枚举类型使用下拉选择 -->
                            <el-select v-if="param.enum && param.enum.length > 0" v-model="debugParams[param.name]"
                              :placeholder="param.description || `请选择${param.name}`" size="small" clearable>
                              <el-option v-for="enumVal in param.enum" :key="enumVal" :label="enumVal" :value="enumVal" />
                            </el-select>
                            <!-- 数组类型使用列表输入组件 -->
                            <div v-else-if="param.type === 'array'" class="array-input-container">
                              <div class="array-items">
                                <div v-for="(item, index) in (debugParams[param.name] || [])" :key="index" class="array-item">
                                  <el-input v-model="debugParams[param.name][index]" :placeholder="`${param.name} ${index + 1}`"
                                    size="small" class="array-item-input" @keyup.enter="addDebugArrayItem(param.name)" />
                                  <el-button size="small" text type="danger" @click="removeDebugArrayItem(param.name, index)"
                                    class="array-item-remove">
                                    <el-icon>
                                      <Close />
                                    </el-icon>
                                  </el-button>
                                </div>
                              </div>
                              <el-button size="small" text type="primary" @click="addDebugArrayItem(param.name)"
                                class="add-array-item-btn">
                                <el-icon>
                                  <Plus />
                                </el-icon>
                                添加项目
                              </el-button>
                            </div>
                            <!-- 对象类型使用键值对输入组件 -->
                            <div v-else-if="param.type === 'object'" class="object-input-container">
                              <ObjectKeyValueInput
                                v-model="debugParams[param.name]"
                                :key="'debug-' + param.name"
                              />
                            </div>
                            <!-- 字符串类型 -->
                            <el-input v-else-if="param.type === 'string'" v-model="debugParams[param.name]"
                              :placeholder="param.description || `请输入${param.name}`" size="small"
                              :type="param.name.includes('password') ? 'password' : 'text'" />
                            <!-- 数字类型 -->
                            <el-input v-else-if="param.type === 'number' || param.type === 'integer'"
                              v-model="debugParams[param.name]" :placeholder="param.description || `请输入${param.name}`"
                              size="small" style="width: 100%" @input="handleDebugNumberInput(param.name, $event)" />
                            <!-- 布尔类型 -->
                            <el-switch v-else-if="param.type === 'boolean'" v-model="debugParams[param.name]" size="small" />
                            <!-- 其他类型使用文本输入 -->
                            <el-input v-else v-model="debugParams[param.name]"
                              :placeholder="param.description || `请输入${param.name}`" size="small" />
                          </div>
                          <div class="param-description" v-if="param.description || param.default">
                            <div v-if="param.description">{{ param.description }}</div>
                            <div v-if="param.default !== undefined && param.default !== ''" class="default-value">
                              默认值: {{ param.default }}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="no-params" v-else>
                        该工具无需参数
                      </div>

                      <!-- 测试按钮 -->
                      <div class="debug-actions">
                        <el-button type="primary" size="small" @click="testTool" :loading="debugTestLoading">
                          <el-icon>
                            <Tools />
                          </el-icon>
                          测试工具
                        </el-button>
                        <el-button size="small" @click="clearDebugResult" v-if="debugResult">
                          清除结果
                        </el-button>
                      </div>

                      <!-- 测试结果显示 -->
                      <div class="test-result" v-if="debugResult !== undefined">
                        <div class="result-header">
                          <span>执行结果</span>
                          <el-button size="small" text type="primary" @click="copyDebugResult" class="copy-result-btn" title="拷贝执行结果">
                            <el-icon>
                              <CopyDocument />
                            </el-icon>
                          </el-button>
                        </div>
                        <div class="result-content">
                          <pre>{{ formatDebugResult(debugResult) }}</pre>
                        </div>
                      </div>
                    </div>
                  </el-tab-pane>
                </el-tabs>
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
  height: calc(100vh - 156px);
  background: #ffffff;
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  transition: padding-right 0.3s ease;
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

/* ========== 调试面板样式 ========== */
.debug-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px;
}

.debug-form {
  margin-bottom: 16px;
}

.form-title {
  font-size: 14px;
  font-weight: 500;
  color: #37352f;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.refresh-params-btn {
  padding: 4px !important;
  min-width: auto !important;
  width: 24px !important;
  height: 24px !important;
  border-radius: 4px !important;
  opacity: 0.7;
  transition: all 0.2s ease;
}

.refresh-params-btn:hover {
  opacity: 1;
  background-color: rgba(0, 122, 255, 0.1) !important;
  transform: rotate(180deg);
}

.debug-section .param-item {
  margin-bottom: 16px;
}

.param-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #37352f;
  margin-bottom: 6px;
}

.required-mark {
  color: #ef4444;
  margin-left: 2px;
}

.param-input-wrapper {
  margin-bottom: 4px;
}

.param-description {
  font-size: 12px;
  color: #858481;
  line-height: 1.4;
  font-style: italic;
}

.default-value {
  color: #007aff;
  font-size: 11px;
  margin-top: 2px;
  font-style: normal;
}

/* 数组输入组件样式 */
.array-input-container {
  width: 100%;
}

.array-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.array-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.array-item-input {
  flex: 1;
}

.array-item-remove {
  flex-shrink: 0;
  padding: 6px !important;
  border-radius: 4px !important;
  min-width: auto !important;
  width: 28px !important;
  height: 28px !important;
}

.array-item-remove:hover {
  background-color: rgba(239, 68, 68, 0.1) !important;
}

.add-array-item-btn {
  width: 100%;
  border-style: dashed !important;
  border-color: #007aff !important;
  color: #37352f !important;
  transition: all 0.2s ease !important;
  margin-top: 8px;
}

.add-array-item-btn:hover {
  background-color: rgba(0, 122, 255, 0.1) !important;
  border-color: #007aff !important;
  color: #007aff !important;
}

/* 对象输入组件样式 */
.object-input-container {
  width: 100%;
}

.debug-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.test-result {
  margin-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding-top: 12px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.result-header span {
  font-size: 14px;
  font-weight: 500;
  color: #37352f;
}

.copy-result-btn {
  padding: 4px !important;
  min-width: auto !important;
  width: 24px !important;
  height: 24px !important;
  border-radius: 4px !important;
  opacity: 0.7;
  transition: all 0.2s ease;
}

.copy-result-btn:hover {
  opacity: 1;
  background-color: rgba(0, 122, 255, 0.1) !important;
  transform: scale(1.1);
}

.result-content {
  background: #f8f8f7;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.result-content pre {
  margin: 0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  color: #37352f;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.5;
}

.no-params {
  padding: 24px;
  background: #f8f8f7;
  border-radius: 8px;
  text-align: center;
  color: #858481;
  font-size: 14px;
}

/* 调试按钮样式 */
.debug-actions .el-button {
  display: flex;
  align-items: center;
  gap: 4px;
}

.debug-actions .el-button .el-icon {
  font-size: 14px;
}

/* 输入框组件适配 */
.debug-section .el-input__wrapper {
  background-color: #fafafa !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  border-radius: 6px !important;
  box-shadow: none !important;
}

.debug-section .el-input__wrapper:hover {
  border-color: #007aff !important;
}

.debug-section .el-input__wrapper.is-focus {
  border-color: #007aff !important;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.1) !important;
}

.debug-section .el-input__inner {
  color: #37352f !important;
  background-color: transparent !important;
  font-size: 13px !important;
}

.debug-section .el-input__inner::placeholder {
  color: #858481 !important;
}

/* 下拉框适配 */
.debug-section .el-select .el-input__wrapper {
  background-color: #fafafa !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  border-radius: 6px !important;
  box-shadow: none !important;
}

.debug-section .el-select-dropdown {
  background-color: #ffffff !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  border-radius: 6px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.debug-section .el-select-dropdown__item {
  color: #37352f !important;
  background-color: transparent !important;
}

.debug-section .el-select-dropdown__item:hover {
  background-color: #f8f8f7 !important;
}

.debug-section .el-select-dropdown__item.is-selected {
  background-color: rgba(0, 122, 255, 0.1) !important;
  color: #007aff !important;
}

/* 开关适配 */
.debug-section .el-switch__core {
  background-color: #e0e0de !important;
  border-color: #e0e0de !important;
}

.debug-section .el-switch.is-checked .el-switch__core {
  background-color: #007aff !important;
  border-color: #007aff !important;
}
</style>
