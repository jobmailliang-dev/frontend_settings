<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import type { ToolParameter } from '@settings/types/tool';
import { toolConfigApi } from '@settings/api/toolConfig';
import ObjectKeyValueInput from '@settings/components/ObjectKeyValueInput.vue';
import ListValueInput from '@settings/components/ListValueInput.vue';

interface Props {
  toolName?: string;
  toolDescription?: string;
  toolId?: number;
  parameters?: ToolParameter[];
  showHeader?: boolean; // 是否显示头部信息
  useStream?: boolean; // 是否使用流式执行
}

const props = withDefaults(defineProps<Props>(), {
  toolName: '',
  toolDescription: '',
  toolId: undefined,
  parameters: () => [],
  showHeader: true, // 默认显示完整模式
  useStream: false, // 默认使用同步执行
});

const emit = defineEmits<{
  'close': [];
  'start': [onReady: () => void];
  'stream-event': [data: { event: string; data: any }];
}>();

// 调试参数（表单方式）
const debugParams = ref<Record<string, any>>({});
const result = ref('');
const isExecuting = ref(false);
const executionTime = ref('');

// 记录参数签名，避免不必要的初始化
let lastParamsSignature = '';

// 生成参数签名
const generateParamsSignature = (params: ToolParameter[]): string => {
  return JSON.stringify(params.map(p => ({
    n: p.name,
    t: p.type
  })));
};

// 初始化调试参数
const initDebugParams = () => {
  const params: Record<string, any> = {};

  if (props.parameters) {
    props.parameters.forEach(param => {
      if (param.default !== undefined && param.default !== '') {
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

// 重置为默认值
const resetToDefaults = () => {
  initDebugParams();
  ElMessage.success('参数已重置为默认值');
};

// 处理数字输入（限制只能输入数字）
const handleNumberInput = (paramName: string, value: string) => {
  const numericValue = value.replace(/[^0-9.-]/g, '');
  const cleanValue = numericValue.replace(/-/g, (match, offset) => offset === 0 ? match : '');
  const finalValue = cleanValue.replace(/\./g, (match, offset, string) => {
    return string.indexOf('.') === offset ? match : '';
  });
  debugParams.value[paramName] = finalValue;
};

// 监听参数变化，初始化参数（带签名比较避免递归）
watch(() => props.parameters, (newParams) => {
  console.log(111)
  if (!newParams) {
    newParams = [];
  }
  const newSignature = generateParamsSignature(newParams);
  // 只有当参数名称或类型真正变化时才重新初始化
  console.log("watch", lastParamsSignature, newSignature )
  if (newSignature !== lastParamsSignature) {
    lastParamsSignature = newSignature;
    initDebugParams();
  }
}, { immediate: true, deep: true });

// 将表单参数转换为JSON对象
const convertParamsToJson = (): Record<string, any> => {
  const params: Record<string, any> = {};

  if (props.parameters) {
    props.parameters.forEach(param => {
      let value = debugParams.value[param.name];

      if (param.type === 'object') {
        if (Array.isArray(value)) {
          const newObject: Record<string, any> = {};
          value.forEach((item: any) => {
            if (item.key && item.key.trim() !== '') {
              let parsedValue = item.value;
              try {
                parsedValue = JSON.parse(item.value);
              } catch {
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

  return params;
};

// 格式化结果
const formatResult = (data: any) => {
  if (!data) return '';
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
};

// 检查必填参数
const checkRequiredParams = () => {
  if (!props.parameters) return true;

  const missingParams = props.parameters.filter(param => {
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

// 流式事件处理
const handleStreamEvent = (event: string, data: any) => {
  emit('stream-event', { event, data });

  switch (event) {
    case 'status':
      result.value = formatResult({ message: data.message });
      break;
    case 'console':
      result.value = formatResult(data);
      break;
    case 'error':
      result.value = formatResult({ success: false, error: data.message });
      break;
    case 'done':
      result.value = formatResult(data.result);
      executionTime.value = data.execution_time ? `${data.execution_time}s` : '';
      break;
  }
};

// 流式执行工具
const executeStream = async () => {
  if (!checkRequiredParams()) return;

  // 通知父组件开始执行，等待保存完成后再继续
  await new Promise<void>((resolve) => {
    emit('start', resolve);
  });

  isExecuting.value = true;
  result.value = '';
  executionTime.value = '';

  const params = convertParamsToJson();

  try {
    await toolConfigApi.executeToolStream(props.toolId!, { params }, handleStreamEvent);
    ElMessage.success('执行成功');
  } catch (e: any) {
    result.value = formatResult({ success: false, error: e.message || '执行失败' });
    executionTime.value = '0.000s';
    ElMessage.error('执行失败');
  } finally {
    isExecuting.value = false;
  }
};

// 执行工具
const execute = async () => {
  if (!checkRequiredParams()) return;

  // 如果使用流式执行
  if (props.useStream) {
    await executeStream();
    return;
  }

  // 通知父组件开始执行，等待保存完成后再继续
  await new Promise<void>((resolve) => {
    emit('start', resolve);
  });

  isExecuting.value = true;
  result.value = '';
  executionTime.value = '';

  try {
    const startTime = Date.now();
    const params = convertParamsToJson();
    const response = await toolConfigApi.executeTool(props.toolId!, { params });
    result.value = formatResult(response);
    executionTime.value = response.execution_time || `${((Date.now() - startTime) / 1000).toFixed(3)}s`;
    ElMessage.success('执行成功');
  } catch (e: any) {
    result.value = formatResult({
      success: false,
      error: e.response?.data?.error || e.message || '执行失败'
    });
    executionTime.value = '0.000s';
    ElMessage.error('执行失败');
  } finally {
    isExecuting.value = false;
  }
};
</script>

<template>
  <div class="debug-panel">
    <!-- 完整模式：显示头部 -->
    <div v-if="props.showHeader" class="panel-header">
      <h4>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        调试面板 - {{ toolName || '未知工具' }}
      </h4>
      <button class="close-btn" @click="$emit('close')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <div class="panel-content">
      <!-- 工具描述 -->
      <div v-if="toolDescription" class="tool-desc">
        {{ toolDescription }}
      </div>

      <!-- 参数表单 -->
      <div class="params-section">
        <div class="section-header">
          <span>参数配置</span>
          <button class="reset-btn" @click="resetToDefaults" title="重置为默认值">
            <el-icon><Refresh /></el-icon>
            重置
          </button>
        </div>

        <!-- 有参数时显示表单 -->
        <div v-if="parameters && parameters.length > 0" class="params-form">
          <div v-for="param in parameters" :key="param.name" class="param-item">
            <label class="param-label">
              {{ param.name }}
              <span v-if="param.required" class="required-mark">*</span>
              <span class="param-type">({{ param.type }})</span>
            </label>

            <div class="param-input-wrapper">
              <!-- 枚举类型 -->
              <el-select
                v-if="param.enum && param.enum.length > 0"
                v-model="debugParams[param.name]"
                :placeholder="param.description || `请选择${param.name}`"
                size="small"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="enumVal in param.enum"
                  :key="enumVal"
                  :label="enumVal"
                  :value="enumVal"
                />
              </el-select>

              <!-- 数组类型 -->
              <div v-else-if="param.type === 'array'" class="array-input-container">
                <ListValueInput
                  v-model="debugParams[param.name]"
                  :key="'debug-' + param.name"
                />
              </div>

              <!-- 对象类型 -->
              <div v-else-if="param.type === 'object'" class="object-input-container">
                <ObjectKeyValueInput
                  v-model="debugParams[param.name]"
                  :key="'debug-' + param.name"
                />
              </div>

              <!-- 字符串类型 -->
              <el-input
                v-else-if="param.type === 'string'"
                v-model="debugParams[param.name]"
                :placeholder="param.description || `请输入${param.name}`"
                size="small"
                :type="param.name.includes('password') ? 'password' : 'text'"
              />

              <!-- 数字类型 -->
              <el-input
                v-else-if="param.type === 'number' || param.type === 'integer'"
                v-model="debugParams[param.name]"
                :placeholder="param.description || `请输入${param.name}`"
                size="small"
                style="width: 100%"
                @input="handleNumberInput(param.name, $event)"
              />

              <!-- 布尔类型 -->
              <el-switch
                v-else-if="param.type === 'boolean'"
                v-model="debugParams[param.name]"
                size="small"
              />

              <!-- 其他类型 -->
              <el-input
                v-else
                v-model="debugParams[param.name]"
                :placeholder="param.description || `请输入${param.name}`"
                size="small"
              />
            </div>

            <!-- 参数说明 -->
            <div class="param-extra" v-if="param.description || (param.default !== undefined && param.default !== '')">
              <div v-if="param.description" class="param-desc">{{ param.description }}</div>
              <div v-if="param.default !== undefined && param.default !== ''" class="param-default">
                默认值: {{ param.default }}
              </div>
            </div>
          </div>
        </div>

        <!-- 无参数时显示提示 -->
        <div v-else class="no-params">
          该工具无需参数
        </div>
      </div>

      <!-- 执行按钮 -->
      <div class="actions-bar">
        <button
          class="execute-btn"
          :disabled="isExecuting || !toolId"
          @click="execute"
        >
          <svg v-if="!isExecuting" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <svg v-else class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10"/>
          </svg>
          {{ isExecuting ? '执行中...' : '执行工具' }}
        </button>
      </div>

      <!-- 执行结果 -->
      <div v-if="result || executionTime" class="result-section">
        <div class="section-header">
          <span>执行结果</span>
          <span v-if="executionTime" class="exec-time">耗时: {{ executionTime }}</span>
        </div>
        <pre class="result-output"><code>{{ result }}</code></pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.debug-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f8f7;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.panel-header h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #37352f;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
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

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
}

.tool-desc {
  font-size: 13px;
  color: #7e7d7a;
  line-height: 1.5;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f8f7;
  border-radius: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 500;
  color: #37352f;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  background: transparent;
  color: #7e7d7a;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.reset-btn:hover {
  background: rgba(55, 53, 47, 0.06);
  color: #37352f;
}

.params-section {
  overflow-y: auto;
}

.params-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.param-item {
  margin-bottom: 4px;
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

.param-type {
  font-size: 11px;
  color: #858481;
  font-weight: 400;
  margin-left: 6px;
}

.param-input-wrapper {
  margin-bottom: 4px;
}

.param-extra {
  font-size: 12px;
  color: #858481;
  line-height: 1.4;
}

.param-desc {
  margin-bottom: 2px;
}

.param-default {
  color: #007aff;
  font-style: normal;
}

.no-params {
  padding: 24px;
  background: #f8f8f7;
  border-radius: 8px;
  text-align: center;
  color: #858481;
  font-size: 13px;
}

/* 数组类型输入样式 */
.array-input-container,
.object-input-container {
  width: 100%;
}

.array-items,
.object-items {
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

.array-item-remove,
.object-item-remove {
  flex-shrink: 0;
  padding: 6px !important;
  border-radius: 4px !important;
  min-width: auto !important;
  width: 28px !important;
  height: 28px !important;
}

.array-item-remove:hover,
.object-item-remove:hover {
  background-color: rgba(239, 68, 68, 0.1) !important;
}

.add-array-item-btn,
.add-object-item-btn {
  width: 100%;
  border-style: dashed !important;
  border-color: #007aff !important;
  color: #37352f !important;
  transition: all 0.2s ease !important;
}

.add-array-item-btn:hover,
.add-object-item-btn:hover {
  background-color: rgba(0, 122, 255, 0.1) !important;
  border-color: #007aff !important;
  color: #007aff !important;
}

/* 对象类型输入样式 */
.object-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.object-key-input {
  width: 90px;
  flex-shrink: 0;
}

.object-value-input {
  flex: 1;
}

/* Element Plus 样式定制 */
.debug-panel :deep(.el-input__wrapper) {
  background-color: #fafafa !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  border-radius: 6px !important;
  box-shadow: none !important;
}

.debug-panel :deep(.el-input__wrapper:hover) {
  border-color: #007aff !important;
}

.debug-panel :deep(.el-input__wrapper.is-focus) {
  border-color: #007aff !important;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.1) !important;
}

.debug-panel :deep(.el-input__inner) {
  color: #37352f !important;
  background-color: transparent !important;
  font-size: 13px !important;
}

.debug-panel :deep(.el-input__inner::placeholder) {
  color: #858481 !important;
}

.debug-panel :deep(.el-select .el-input__wrapper) {
  background-color: #fafafa !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  border-radius: 6px !important;
  box-shadow: none !important;
}

.debug-panel :deep(.el-select-dropdown) {
  background-color: #ffffff !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  border-radius: 6px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.debug-panel :deep(.el-select-dropdown__item) {
  color: #37352f !important;
  background-color: transparent !important;
}

.debug-panel :deep(.el-select-dropdown__item:hover) {
  background-color: #f8f8f7 !important;
}

.debug-panel :deep(.el-select-dropdown__item.is-selected) {
  background-color: rgba(0, 122, 255, 0.1) !important;
  color: #007aff !important;
}

.debug-panel :deep(.el-switch__core) {
  background-color: #e0e0de !important;
  border-color: #e0e0de !important;
}

.debug-panel :deep(.el-switch.is-checked .el-switch__core) {
  background-color: #34c759 !important;
  border-color: #34c759 !important;
}

/* 操作栏 */
.actions-bar {
  display: flex;
  gap: 10px;
  padding: 16px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  margin-top: 16px;
}

.execute-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 24px;
  background: #34c759;
  border: none;
  border-radius: 20px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.execute-btn:hover:not(:disabled) {
  background: #2db84d;
}

.execute-btn:disabled {
  background: #c7c5c0;
  cursor: not-allowed;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 结果区域 */
.result-section {
  margin-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding-top: 16px;
}

.exec-time {
  font-size: 12px;
  color: #8e8e93;
}

.result-output {
  margin: 8px 0 0 0;
  padding: 12px;
  background: #f8f8f7;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  overflow: auto;
  max-height: 200px;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #37352f;
}

.result-output code {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
