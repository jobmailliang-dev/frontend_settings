<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue';
import type { editor } from 'monaco-editor';
import { ElMessage } from 'element-plus';
import './MonacoEditor.scss';

interface Props {
  modelValue: string;
  placeholder?: string;
  title?: string;
  showHeader?: boolean;
  height?: string;
  width?: string;
  language?: string;
  theme?: 'vs-dark' | 'vs' | 'hc-black';
  options?: editor.IStandaloneEditorConstructionOptions;
  readOnly?: boolean;
  minimap?: boolean;
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  fontSize?: number;
  formatOnPaste?: boolean;
  formatOnType?: boolean;
  autoIndent?: 'none' | 'keep' | 'brackets' | 'advanced' | 'full';
  suggestOnTriggerCharacters?: boolean;
  quickSuggestions?: boolean | { other: boolean; comments: boolean; strings: boolean };
  parameterHints?: boolean;
  folding?: boolean;
  bracketPairColorization?: boolean;
  enableSave?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '在此输入JavaScript代码...',
  title: '代码编辑器',
  showHeader: true,
  height: '100%',
  width: '100%',
  language: 'javascript',
  theme: 'vs',
  readOnly: false,
  minimap: false,
  lineNumbers: 'on',
  wordWrap: 'on',
  fontSize: 13,
  formatOnPaste: true,
  formatOnType: true,
  autoIndent: 'advanced',
  suggestOnTriggerCharacters: true,
  quickSuggestions: true,
  parameterHints: true,
  folding: true,
  bracketPairColorization: true,
  enableSave: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'save': [];
}>();

const editorContainer = ref<HTMLElement>();
const editor = shallowRef<editor.IStandaloneCodeEditor | null>(null);
const isInitialized = ref(false);
const isDestroyed = ref(false);
const currentTheme = ref<'vs-dark' | 'vs'>('vs');
let workerErrorHandler: ((event: ErrorEvent) => void) | null = null;

// 设置JavaScript智能感知和类型定义
const setupJavaScriptIntelliSense = () => {
  const monaco = (window as any).monaco;
  if (!monaco) return;

  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    allowNonTsExtensions: true,
    checkJs: true,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    allowSyntheticDefaultImports: true,
    noEmit: true,
    esModuleInterop: true,
    skipLibCheck: true,
    strict: false,
    alwaysStrict: false,
    noImplicitAny: false,
    strictNullChecks: false,
    strictPropertyInitialization: false,
    strictFunctionTypes: false,
    noUnusedLocals: false,
    noUnusedParameters: false,
    noImplicitReturns: false,
  });

  const libSource = `
    declare interface Context {
      args: Record<string, any>;
      data: any;
    }
    declare function callTool(toolName: string, args: Record<string, any>): any;
    declare const context: Context;
    declare const console: {
      log(...args: any[]): void;
      error(...args: any[]): void;
      warn(...args: any[]): void;
      info(...args: any[]): void;
      debug(...args: any[]): void;
    };
    declare const JSON: {
      parse(text: string): any;
      stringify(value: any, replacer?: (key: string, value: any) => any, space?: string | number): string;
    };
    declare const setTimeout: (callback: () => void, delay: number) => number;
    declare const clearTimeout: (id: number) => void;
    declare const setInterval: (callback: () => void, interval: number) => number;
    declare const clearInterval: (id: number) => void;
  `;

  const libUri = 'ts:filename/toolbox.d.ts';
  const oldModel = monaco.editor.getModel(monaco.Uri.parse(libUri));
  if (oldModel) {
    oldModel.setValue(libSource);
  } else {
    monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource, libUri);
  }
};

// 设置JavaScript语言特性
const setupJavaScriptFeatures = () => {
  const monaco = (window as any).monaco;
  if (!monaco) return;

  monaco.languages.setLanguageConfiguration('javascript', {
    comments: {
      blockComment: ['/*', '*/'],
      lineComment: '//',
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"', notIn: ['string'] },
      { open: "'", close: "'", notIn: ['string'] },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  });

  monaco.languages.registerCompletionItemProvider('javascript', {
    triggerCharacters: ['.'],
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const lineContent = model.getLineContent(position.lineNumber);
      const textBeforePosition = lineContent.substring(0, position.column - 1);
      const isAfterConsoleDot = /console\.(\w*)$/.test(textBeforePosition);
      const isAfterContextDot = /context\.(\w*)$/.test(textBeforePosition);

      if (isAfterConsoleDot) {
        return {
          suggestions: [
            { label: 'log', kind: monaco.languages.CompletionItemKind.Method, insertText: 'log(${1:message});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, documentation: 'Console日志输出' },
            { label: 'error', kind: monaco.languages.CompletionItemKind.Method, insertText: 'error(${1:msg});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, documentation: 'Console错误输出' },
            { label: 'warn', kind: monaco.languages.CompletionItemKind.Method, insertText: 'warn(${1:warning});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, documentation: 'Console警告输出' },
            { label: 'info', kind: monaco.languages.CompletionItemKind.Method, insertText: 'info(${1:message});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, documentation: 'Console信息输出' },
          ],
        };
      }

      if (isAfterContextDot) {
        return {
          suggestions: [
            { label: 'args', kind: monaco.languages.CompletionItemKind.Property, insertText: 'args', range, documentation: '大模型解析出的输入参数' },
            { label: 'data', kind: monaco.languages.CompletionItemKind.Property, insertText: 'data', range, documentation: '继承自前置工具的执行结果' },
          ],
        };
      }

      return {
        suggestions: [
          { label: 'callTool', kind: monaco.languages.CompletionItemKind.Function, insertText: 'callTool("${1:toolName}", { ${2} })', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, documentation: '调用其他工具' },
          { label: 'context', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'context', range, documentation: '工具执行上下文对象' },
          { label: 'console', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'console', range, documentation: 'console对象用于浏览器控制台输出' },
        ],
      };
    },
  });
};

// 初始化Monaco Editor
const initEditor = async () => {
  if (!editorContainer.value || isInitialized.value || isDestroyed.value) return;

  try {
    const monaco = await import('monaco-editor');

    // 定义浅色主题
    monaco.editor.defineTheme('manus-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#f8f8f7',
        'editor.foreground': '#37352f',
        'editor.lineHighlightBackground': '#f1f1f0',
        'editorLineNumber.foreground': '#8e8e93',
        'editorCursor.foreground': '#007aff',
        'editor.selectionBackground': 'rgba(0, 122, 255, 0.2)',
        'editor.inactiveSelectionBackground': 'rgba(0, 122, 255, 0.1)',
      },
    });

    workerErrorHandler = (event: ErrorEvent) => {
      if (event.message?.includes('Unexpected usage')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('error', workerErrorHandler);

    setupJavaScriptIntelliSense();
    setupJavaScriptFeatures();

    const editorOptions: editor.IStandaloneEditorConstructionOptions = {
      value: props.modelValue,
      language: props.language,
      theme: 'manus-light',
      readOnly: props.readOnly,
      automaticLayout: true,
      minimap: { enabled: props.minimap },
      fontSize: props.fontSize,
      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      lineNumbers: props.lineNumbers,
      scrollBeyondLastLine: false,
      wordWrap: props.wordWrap,
      bracketPairColorization: { enabled: props.bracketPairColorization },
      quickSuggestions: props.quickSuggestions,
      parameterHints: { enabled: props.parameterHints },
      folding: props.folding,
      formatOnPaste: props.formatOnPaste,
      formatOnType: props.formatOnType,
      autoIndent: props.autoIndent,
      tabSize: 4,
      insertSpaces: true,
      renderLineHighlight: 'line',
      renderWhitespace: 'selection',
      suggestOnTriggerCharacters: props.suggestOnTriggerCharacters,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      foldingStrategy: 'indentation',
      showFoldingControls: 'always',
      ...props.options,
    };

    editor.value = monaco.editor.create(editorContainer.value, editorOptions);

    editor.value.onDidChangeModelContent(() => {
      const value = editor.value?.getValue() || '';
      emit('update:modelValue', value);
    });

    // Ctrl+S 保存快捷键
    editor.value.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (props.enableSave) {
        emit('save');
      } else {
        ElMessage.info('请使用页面上的保存按钮');
      }
    });

    nextTick(() => {
      editor.value?.focus();
    });

    isInitialized.value = true;
  } catch (error) {
    console.error('Monaco Editor初始化失败:', error);
    ElMessage.error('代码编辑器初始化失败');
  }
};

// 重新布局编辑器
const layoutEditor = () => {
  editor.value?.layout();
};

// 监听modelValue变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (editor.value && editor.value.getValue() !== newValue) {
      editor.value.setValue(newValue);
    }
  },
  { flush: 'post' }
);

// 监听只读状态变化
watch(
  () => props.readOnly,
  (readOnly) => {
    if (editor.value) {
      editor.value.updateOptions({ readOnly });
    }
  }
);

// 暴露给父组件的方法
defineExpose({
  focus: () => editor.value?.focus(),
  getValue: () => editor.value?.getValue() || '',
  setValue: (value: string) => {
    if (editor.value) {
      editor.value.setValue(value);
    }
  },
  layout: layoutEditor,
});

onMounted(() => {
  nextTick(() => {
    initEditor();
  });
});

onBeforeUnmount(() => {
  isDestroyed.value = true;
  editor.value?.dispose();
  if (workerErrorHandler) {
    window.removeEventListener('error', workerErrorHandler);
    workerErrorHandler = null;
  }
});
</script>

<template>
  <div class="monaco-editor-container">
    <div class="editor-header" v-if="showHeader">
      <span class="editor-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
        {{ title }}
      </span>
      <span class="editor-lang">{{ language }}</span>
      <div class="header-actions">
        <slot name="actions"></slot>
      </div>
    </div>
    <div class="editor-section">
      <div ref="editorContainer" class="monaco-editor-wrapper" :style="{ height, width }"></div>
      <slot name="extension"></slot>
    </div>
  </div>
</template>
