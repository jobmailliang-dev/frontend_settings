<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ToolConfig } from '@/types/tool';

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'import': [tools: ToolConfig[]];
  'export': [];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const importedTools = ref<ToolConfig[]>([]);
const importError = ref<string | null>(null);
const dragOver = ref(false);

const isValidTool = (tool: any): tool is ToolConfig => {
  return (
    typeof tool === 'object' &&
    typeof tool.name === 'string' &&
    typeof tool.description === 'string' &&
    typeof tool.code === 'string' &&
    Array.isArray(tool.parameters)
  );
};

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  importError.value = null;
  importedTools.value = [];

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed)) {
      const validTools = parsed.filter(isValidTool);
      if (validTools.length === 0) {
        importError.value = '文件中未找到有效的工具配置';
      } else {
        importedTools.value = validTools as ToolConfig[];
      }
    } else if (isValidTool(parsed)) {
      importedTools.value = [parsed as ToolConfig];
    } else {
      importError.value = '文件格式无效，必须是工具对象或工具数组';
    }
  } catch (e: any) {
    importError.value = e.message || '解析文件失败';
  }

  // 清空 input 以便重复选择同一文件
  target.value = '';
};

const handleDrop = async (event: DragEvent) => {
  dragOver.value = false;
  const file = event.dataTransfer?.files[0];
  if (!file) return;

  if (!file.name.endsWith('.json')) {
    importError.value = '仅支持 JSON 格式文件';
    return;
  }

  importError.value = null;
  importedTools.value = [];

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed)) {
      const validTools = parsed.filter(isValidTool);
      if (validTools.length === 0) {
        importError.value = '文件中未找到有效的工具配置';
      } else {
        importedTools.value = validTools as ToolConfig[];
      }
    } else if (isValidTool(parsed)) {
      importedTools.value = [parsed as ToolConfig];
    } else {
      importError.value = '文件格式无效';
    }
  } catch (e: any) {
    importError.value = e.message || '解析文件失败';
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const confirmImport = () => {
  if (importedTools.value.length > 0) {
    emit('import', importedTools.value);
    closeDialog();
  }
};

const closeDialog = () => {
  emit('update:modelValue', false);
  importedTools.value = [];
  importError.value = null;
};

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="dialogVisible" class="dialog-overlay" @click.self="closeDialog">
        <div class="dialog">
          <div class="dialog-header">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              导入工具
            </h3>
            <button class="close-btn" @click="closeDialog">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="dialog-content">
            <!-- 拖拽上传区域 -->
            <div
              :class="['drop-zone', { 'drag-over': dragOver }]"
              @dragover.prevent="dragOver = true"
              @dragleave.prevent="dragOver = false"
              @drop.prevent="handleDrop"
              @click="triggerFileInput"
            >
              <input
                ref="fileInput"
                type="file"
                accept=".json"
                @change="handleFileSelect"
                hidden
              />
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p class="drop-text">拖拽 JSON 文件到此处，或点击选择文件</p>
              <p class="drop-hint">支持单个工具或工具数组的 JSON 文件</p>
            </div>

            <!-- 错误提示 -->
            <div v-if="importError" class="error-message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {{ importError }}
            </div>

            <!-- 预览区域 -->
            <div v-if="importedTools.length > 0" class="preview-section">
              <h4>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                预览 ({{ importedTools.length }} 个工具)
              </h4>
              <div class="preview-list">
                <div v-for="(tool, index) in importedTools" :key="index" class="preview-item">
                  <span class="tool-name">{{ tool.name }}</span>
                  <span class="tool-desc">{{ tool.description }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="manus-btn" @click="closeDialog">取消</button>
            <button
              class="import-btn"
              :disabled="importedTools.length === 0"
              @click="confirmImport"
            >
              导入 {{ importedTools.length }} 个工具
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.dialog {
  width: 90%;
  max-width: 560px;
  max-height: 80vh;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
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
  padding: 24px;
  overflow-y: auto;
}

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  border: 2px dashed rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #8e8e93;
}

.drop-zone:hover,
.drop-zone.drag-over {
  border-color: #007aff;
  background: rgba(0, 122, 255, 0.02);
  color: #007aff;
}

.drop-zone svg {
  margin-bottom: 16px;
}

.drop-text {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: #37352f;
}

.drop-hint {
  margin: 0;
  font-size: 12px;
  color: #8e8e93;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(255, 59, 48, 0.08);
  border: 1px solid rgba(255, 59, 48, 0.2);
  border-radius: 8px;
  font-size: 13px;
  color: #ff3b30;
}

.preview-section {
  margin-top: 20px;
}

.preview-section h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #37352f;
}

.preview-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.preview-item:last-child {
  border-bottom: none;
}

.preview-item .tool-name {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  white-space: nowrap;
}

.preview-item .tool-desc {
  font-size: 12px;
  color: #8e8e93;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: #fafafa;
}

.import-btn {
  padding: 10px 20px;
  background: #007aff;
  border: none;
  border-radius: 20px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.import-btn:hover:not(:disabled) {
  background: #0066d6;
}

.import-btn:disabled {
  background: #c7c5c0;
  cursor: not-allowed;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .dialog,
.modal-leave-to .dialog {
  transform: scale(0.95);
}
</style>
