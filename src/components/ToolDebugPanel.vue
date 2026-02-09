<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { ToolConfig, ToolParameter } from '@/types/tool';
import { toolConfigApi } from '@/api/toolConfig';

interface Props {
  tool: ToolConfig | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'close': [];
}>();

const paramsJson = ref('{}');
const result = ref('');
const isExecuting = ref(false);
const executionTime = ref('');

const defaultParams = computed(() => {
  if (!props.tool?.parameters) return {};

  const params: Record<string, any> = {};
  props.tool.parameters.forEach(p => {
    // 优先使用默认值
    if (p.default !== undefined && p.default !== '') {
      if (p.type === 'boolean') {
        params[p.name] = p.default === 'true' || p.default === true;
      } else if (p.type === 'number' || p.type === 'integer') {
        const numValue = parseFloat(p.default);
        params[p.name] = isNaN(numValue) ? '' : numValue;
      } else if (p.type === 'object') {
        // 对象类型：处理数组格式（来自 ObjectKeyValueInput）或对象格式
        if (Array.isArray(p.default)) {
          const obj: Record<string, any> = {};
          p.default.forEach((item: any) => {
            if (item.key && item.key.trim() !== '') {
              let parsedValue = item.value;
              try {
                parsedValue = JSON.parse(item.value);
              } catch {
                // 不是有效JSON，保持原字符串
              }
              obj[item.key] = parsedValue;
            }
          });
          params[p.name] = obj;
        } else if (typeof p.default === 'object' && p.default !== null) {
          params[p.name] = p.default;
        } else {
          params[p.name] = {};
        }
      } else {
        params[p.name] = p.default;
      }
    } else {
      // 没有默认值时，根据类型初始化
      if (p.type === 'array') {
        params[p.name] = [];
      } else if (p.type === 'object') {
        params[p.name] = {};
      } else if (p.type === 'boolean') {
        params[p.name] = false;
      } else if (p.type === 'number' || p.type === 'integer') {
        params[p.name] = '';
      } else {
        params[p.name] = '';
      }
    }
  });
  return params;
});

watch(() => props.tool, (newTool) => {
  if (newTool) {
    paramsJson.value = JSON.stringify(defaultParams.value, null, 2);
    result.value = '';
    executionTime.value = '';
  }
}, { immediate: true });

watch(paramsJson, (val) => {
  // 实时验证 JSON 格式
  try {
    JSON.parse(val);
  } catch {
    // 暂时忽略无效 JSON
  }
});

const isValidJson = computed(() => {
  try {
    JSON.parse(paramsJson.value);
    return true;
  } catch {
    return false;
  }
});

const examplePayload = computed(() => {
  if (!props.tool?.parameters) return '{}';
  const example: Record<string, any> = {};
  props.tool.parameters.forEach(p => {
    // 优先使用默认值
    if (p.default !== undefined && p.default !== '') {
      if (p.type === 'boolean') {
        example[p.name] = p.default === 'true' || p.default === true;
      } else if (p.type === 'number' || p.type === 'integer') {
        const numValue = parseFloat(p.default);
        example[p.name] = isNaN(numValue) ? 42 : numValue;
      } else if (p.type === 'object') {
        if (Array.isArray(p.default)) {
          const obj: Record<string, any> = {};
          p.default.forEach((item: any) => {
            if (item.key) {
              obj[item.key] = item.value || 'value';
            }
          });
          example[p.name] = Object.keys(obj).length > 0 ? obj : { key: 'value' };
        } else if (typeof p.default === 'object') {
          example[p.name] = p.default;
        } else {
          example[p.name] = { key: 'value' };
        }
      } else {
        example[p.name] = p.default;
      }
    } else {
      // 没有默认值时使用示例值
      switch (p.type) {
        case 'string':
          example[p.name] = `示例${p.name}`;
          break;
        case 'number':
        case 'integer':
          example[p.name] = 42;
          break;
        case 'boolean':
          example[p.name] = true;
          break;
        case 'array':
          example[p.name] = [`item1`, `item2`];
          break;
        case 'object':
          example[p.name] = { key: `value` };
          break;
      }
    }
  });
  return JSON.stringify(example, null, 2);
});

const loadExample = () => {
  paramsJson.value = examplePayload.value;
};

const execute = async () => {
  if (!isValidJson.value || !props.tool?.id) return;

  isExecuting.value = true;
  result.value = '';

  try {
    const startTime = Date.now();
    const parsedParams = JSON.parse(paramsJson.value);
    const response = await toolConfigApi.executeTool(props.tool.id, { params: parsedParams });
    result.value = JSON.stringify(response, null, 2);
    executionTime.value = `${((Date.now() - startTime) / 1000).toFixed(3)}s`;
  } catch (e: any) {
    result.value = JSON.stringify({
      success: false,
      error: e.response.data.error || '执行失败',
    }, null, 2);
    executionTime.value = '0.000s';
  } finally {
    isExecuting.value = false;
  }
};

const clearResult = () => {
  result.value = '';
  executionTime.value = '';
};

const resetToDefaults = () => {
  paramsJson.value = JSON.stringify(defaultParams.value, null, 2);
};
</script>

<template>
  <div class="debug-panel">
    <div class="panel-header">
      <h4>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        调试面板
      </h4>
      <button class="close-btn" @click="$emit('close')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <div class="panel-content">
      <div class="input-section">
        <div class="section-header">
          <span>输入参数 (JSON)</span>
          <div class="header-actions">
            <button class="manus-btn" @click="resetToDefaults" title="重置为默认值">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              默认值
            </button>
            <button class="manus-btn" @click="loadExample">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              示例
            </button>
            <button class="manus-btn" @click="paramsJson = '{}'">清空</button>
          </div>
        </div>
        <textarea
          v-model="paramsJson"
          class="json-input"
          :class="{ 'has-error': !isValidJson }"
          placeholder="请输入 JSON 格式的参数..."
          spellcheck="false"
        ></textarea>
        <div v-if="!isValidJson" class="json-error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          JSON 格式无效
        </div>
      </div>

      <div class="actions-bar">
        <button
          class="execute-btn"
          :disabled="!isValidJson || isExecuting || !tool?.id"
          @click="execute"
        >
          <svg v-if="!isExecuting" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <svg v-else class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10"/>
          </svg>
          {{ isExecuting ? '执行中...' : '执行' }}
        </button>
        <button
          v-if="result"
          class="manus-btn"
          @click="clearResult"
        >
          清空结果
        </button>
      </div>

      <div v-if="result || executionTime" class="output-section">
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
  border-left: 1px solid rgba(0, 0, 0, 0.08);
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
  font-size: 13px;
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
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 500;
  color: #7e7d7a;
}

.header-actions {
  display: flex;
  gap: 6px;
}

.header-actions .manus-btn {
  height: 28px;
  padding: 5px 10px;
  font-size: 11px;
}

.json-input {
  flex: 1;
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 13px;
  line-height: 1.5;
  background: #fafafa;
  color: #37352f;
  outline: none;
  resize: none;
  transition: all 0.2s ease;
}

.json-input:focus {
  background: #ffffff;
  border-color: #007aff;
}

.json-input.has-error {
  border-color: #ff3b30;
  background: rgba(255, 59, 48, 0.02);
}

.json-error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: #ff3b30;
}

.actions-bar {
  display: flex;
  gap: 10px;
  padding: 14px 0;
}

.execute-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
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

.output-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.exec-time {
  font-size: 11px;
  color: #8e8e93;
}

.result-output {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 12px;
  background: #f8f8f7;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  overflow: auto;
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
