<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ToolParameter, ParameterType } from '@/types/tool';
import ObjectKeyValueInput from './ObjectKeyValueInput.vue';
import ListValueInput from './ListValueInput.vue';

interface Props {
  modelValue: ToolParameter[];
  inheritFrom?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [params: ToolParameter[]];
  'sync-params': [];
}>();

const parameterTypes: { value: ParameterType; label: string }[] = [
  { value: 'string', label: '字符串' },
  { value: 'number', label: '数字' },
  { value: 'boolean', label: '布尔值' },
  { value: 'array', label: '数组' },
  { value: 'object', label: '对象' },
];

const localParams = ref<ToolParameter[]>([...props.modelValue]);

watch(() => props.modelValue, (newVal) => {
  localParams.value = [...newVal];
}, { deep: true });

watch(localParams, (newVal) => {
  emit('update:modelValue', [...newVal]);
}, { deep: true });

const addParameter = () => {
  localParams.value.push({
    name: '',
    description: '',
    type: 'string',
    required: false,
    default: undefined,
  });
};

const removeParameter = (index: number) => {
  localParams.value.splice(index, 1);
};

const onTypeChange = (param: ToolParameter) => {
  // 切换类型时清空默认值，避免类型不匹配导致的回显异常
  param.default = undefined;
  // 切换类型时清空枚举值（枚举只支持字符串和数字）
  if (param.type !== 'string' && param.type !== 'number') {
    param.enum = undefined;
  }
};

// 判断类型是否支持枚举
const supportsEnum = (param: ToolParameter) => {
  return param.type === 'string' || param.type === 'number';
};

const emptyCount = computed(() => localParams.value.filter(p => !p.name).length);

let draggedIndex: number | null = null;

const onDragStart = (index: number) => {
  draggedIndex = index;
};

const onDragOver = (e: DragEvent) => {
  e.preventDefault();
};

const onDrop = (e: DragEvent, dropIndex: number) => {
  e.preventDefault();
  if (draggedIndex !== null && draggedIndex !== dropIndex) {
    const item = localParams.value.splice(draggedIndex, 1)[0];
    localParams.value.splice(dropIndex, 0, item);
  }
  draggedIndex = null;
};
</script>

<template>
  <div class="param-form">
    <div class="param-header">
      <h4>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        参数配置
      </h4>
      <div class="header-actions">
        <button class="manus-btn" @click="addParameter">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          添加参数
        </button>
      </div>
    </div>

    <div v-if="localParams.length === 0" class="empty-state">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
      <p>暂无参数，点击上方按钮添加</p>
    </div>

    <div v-else class="param-list">
      <div
        v-for="(param, index) in localParams"
        :key="index"
        class="param-item"
        draggable="true"
        @dragstart="onDragStart(index)"
        @dragover="onDragOver"
        @drop="onDrop($event, index)"
      >
        <div class="param-left">
          <div class="param-drag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="5" r="1.5"/>
              <circle cx="15" cy="5" r="1.5"/>
              <circle cx="9" cy="12" r="1.5"/>
              <circle cx="15" cy="12" r="1.5"/>
              <circle cx="9" cy="19" r="1.5"/>
              <circle cx="15" cy="19" r="1.5"/>
            </svg>
          </div>

          <div class="param-fields">
            <div class="param-field">
              <label class="param-label">名称</label>
              <input
                v-model="param.name"
                type="text"
                placeholder="参数名称"
                class="param-input"
              />
            </div>
            <div class="param-field">
              <label class="param-label">描述</label>
              <input
                v-model="param.description"
                type="text"
                placeholder="参数描述"
                class="param-input"
              />
            </div>
            <!-- 默认值 -->
            <div class="param-field-row">
              <div class="param-field">
                <label class="param-label">默认值</label>
                <!-- 数组类型使用列表输入 -->
                <ListValueInput
                  v-if="param.type === 'array'"
                  v-model="param.default"
                />
                <!-- 对象类型使用键值对输入 -->
                <ObjectKeyValueInput
                  v-else-if="param.type === 'object'"
                  v-model="param.default"
                  class="object-input-fixed"
                />
                <!-- 布尔类型使用开关 -->
                <label v-else-if="param.type === 'boolean'" class="switch">
                  <input type="checkbox" v-model="param.default" />
                  <span class="slider"></span>
                </label>
                <!-- 其他类型使用输入框 -->
                <input
                  v-else
                  v-model="param.default"
                  type="text"
                  placeholder="默认值"
                  class="param-input"
                />
              </div>
            </div>
            <div class="param-field-row">
              <div class="param-field">
                <label class="param-label">类型</label>
                <select v-model="param.type" class="param-input" @change="onTypeChange(param)">
                  <option v-for="t in parameterTypes" :key="t.value" :value="t.value">
                    {{ t.label }}
                  </option>
                </select>
              </div>
              <div class="param-field param-field-checkbox">
                <label class="param-label">必填</label>
                <input v-model="param.required" type="checkbox" class="checkbox-input" />
              </div>
              <div v-if="supportsEnum(param)" class="param-field param-field-checkbox">
                <label class="param-label">枚举</label>
                <input v-model="param.hasEnum" type="checkbox" class="checkbox-input" />
              </div>
            </div>
            <!-- 枚举值输入（仅字符串和数字类型，且启用枚举时显示） -->
            <div v-if="param.hasEnum" class="param-field-row enum-field-row">
              <div class="param-field">
                <label class="param-label">枚举值</label>
                <ListValueInput v-model="param.enum" />
              </div>
            </div>
          </div>
        </div>

        <div class="param-actions">
          <button class="icon-btn delete" @click="removeParameter(index)" title="删除">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.param-form {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
}

.param-header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f8f7;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.param-header h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #37352f;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.sync-btn, .add-btn {
  height: 32px;
  padding: 6px 12px;
  font-size: 12px;
}

.add-btn {
  background: #007aff;
  border-color: #007aff;
  color: #ffffff;
}

.add-btn:hover {
  background: #0066d6;
  border-color: #0066d6;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #8e8e93;
}

.empty-state svg {
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 13px;
}

.param-list {
  padding: 8px;
}

.param-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 8px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 6px;
  transition: background 0.15s ease;
}

.param-item:hover {
  background: #f1f1f0;
}

.param-item:hover .param-actions {
  opacity: 1;
}

.param-item:last-child {
  margin-bottom: 0;
}

.param-left {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
}

.param-drag {
  color: #c7c5c0;
  cursor: grab;
  padding: 4px 0;
}

.param-drag:active {
  cursor: grabbing;
}

.param-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.param-field {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.param-field-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.param-field-checkbox {
  flex-shrink: 0;
}

.enum-field-row {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px dashed rgba(0, 0, 0, 0.08);
}

.param-label {
  width: 40px;
  flex-shrink: 0;
  font-size: 12px;
  color: #7e7d7a;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default;
}

.param-label:hover {
  overflow: visible;
  white-space: normal;
}

.param-input {
  flex: 1;
  height: 32px;
  padding: 0 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-size: 13px;
  background: #ffffff;
  color: #37352f;
  outline: none;
  transition: border-color 0.15s ease;
}

.param-input:focus {
  border-color: #007aff;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #007aff;
}

/* 对象类型键值对固定宽度 */
.object-input-fixed {
  width: 240px;
  flex-shrink: 0;
}

/* 开关样式 */
.switch {
  position: relative;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch .slider {
  position: absolute;
  inset: 0;
  background-color: #e9e9e9;
  border-radius: 24px;
  transition: 0.3s;
}

.switch .slider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.switch input:checked + .slider {
  background-color: #34c759;
}

.switch input:checked + .slider::before {
  transform: translateX(20px);
}

.param-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.icon-btn {
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

.icon-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #37352f;
}

.icon-btn.delete:hover {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}

@media (max-width: 768px) {
  .param-fields {
    flex-wrap: wrap;
  }

  .name-input {
    width: 100%;
  }

  .type-select {
    width: auto;
    flex: 1;
  }
}
</style>
