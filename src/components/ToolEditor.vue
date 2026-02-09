<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, shallowRef } from 'vue';
import type { editor } from 'monaco-editor';

interface Props {
  modelValue: string;
  language?: string;
  readOnly?: boolean;
  height?: string;
}

const props = withDefaults(defineProps<Props>(), {
  language: 'javascript',
  readOnly: false,
  height: '400px',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'change': [value: string];
}>();

const editorContainer = ref<HTMLElement | null>(null);
const monacoEditor = shallowRef<editor.IStandaloneCodeEditor | null>(null);
const isMonacoLoaded = ref(false);

// 模拟 Monaco Editor（在真实项目中需要安装 monaco-editor）
const mockEditor = ref<{
  getValue: () => string;
  setValue: (val: string) => void;
  onDidChangeModelContent: (callback: () => void) => { dispose: () => void };
  dispose: () => void;
} | null>(null);

const initEditor = async () => {
  // 尝试加载 Monaco Editor
  try {
    const monaco = await import('monaco-editor');
    await import('monaco-editor/esm/vs/basic-languages/javascript/javascript.js');

    // 配置 Monaco
    monaco.editor.defineTheme('tool-theme', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#f8f8f7',
        'editor.foreground': '#37352f',
        'editor.lineHighlightBackground': '#f1f1f0',
        'editorLineNumber.foreground': '#8e8e93',
        'editorCursor.foreground': '#007aff',
      },
    });

    if (editorContainer.value) {
      monacoEditor.value = monaco.editor.create(editorContainer.value, {
        value: props.modelValue,
        language: props.language,
        theme: 'tool-theme',
        readOnly: props.readOnly,
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        padding: { top: 16, bottom: 16 },
        renderLineHighlight: 'line',
        occurrencesHighlight: false,
        folding: true,
        bracketPairColorization: { enabled: true },
      });

      monacoEditor.value.onDidChangeModelContent(() => {
        const value = monacoEditor.value?.getValue() || '';
        emit('update:modelValue', value);
        emit('change', value);
      });

      isMonacoLoaded.value = true;
    }
  } catch {
    // 如果 Monaco 不可用，使用简单的文本区域
    console.warn('Monaco Editor not available, using textarea fallback');
    initTextareaFallback();
  }
};

const initTextareaFallback = () => {
  if (editorContainer.value) {
    const textarea = document.createElement('textarea');
    textarea.value = props.modelValue;
    textarea.className = 'editor-textarea';
    textarea.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
      resize: none;
      font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
      font-size: 13px;
      line-height: 1.6;
      padding: 16px;
      background: #f8f8f7;
      color: #37352f;
      border-radius: 8px;
    `;

    textarea.addEventListener('input', () => {
      emit('update:modelValue', textarea.value);
      emit('change', textarea.value);
    });

    editorContainer.value.appendChild(textarea);
    mockEditor.value = {
      getValue: () => textarea.value,
      setValue: (val: string) => { textarea.value = val; },
      onDidChangeModelContent: (callback) => {
        textarea.addEventListener('input', callback);
        return { dispose: () => textarea.removeEventListener('input', callback) };
      },
      dispose: () => textarea.remove(),
    };
    isMonacoLoaded.value = true;
  }
};

watch(() => props.modelValue, (newValue) => {
  if (monacoEditor.value && newValue !== monacoEditor.value.getValue()) {
    monacoEditor.value.setValue(newValue);
  }
});

watch(() => props.readOnly, (readOnly) => {
  monacoEditor.value?.updateOptions({ readOnly });
});

onMounted(() => {
  initEditor();
});

onUnmounted(() => {
  monacoEditor.value?.dispose();
});

// 暴露方法给父组件
defineExpose({
  focus: () => monacoEditor.value?.focus(),
  getValue: () => monacoEditor.value?.getValue() || '',
});
</script>

<template>
  <div class="tool-editor">
    <div class="editor-header">
      <span class="editor-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
        代码编辑器
      </span>
      <span class="editor-lang">{{ language }}</span>
    </div>
    <div
      ref="editorContainer"
      class="editor-content"
      :style="{ height }"
    >
      <div v-if="!isMonacoLoaded" class="editor-loading">
        <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
        </svg>
        加载编辑器中...
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f8f8f7;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.editor-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #37352f;
}

.editor-lang {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  color: #7e7d7a;
  font-family: 'JetBrains Mono', monospace;
}

.editor-content {
  flex: 1;
  min-height: 200px;
}

.editor-textarea {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  padding: 16px;
  background: #f8f8f7;
  color: #37352f;
}

.editor-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 100%;
  color: #8e8e93;
  font-size: 13px;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
