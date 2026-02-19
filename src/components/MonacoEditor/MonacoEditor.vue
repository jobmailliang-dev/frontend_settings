<template>
  <div class="monaco-editor-container">
    <div class="editor-header" v-if="showHeader">
      <h3>{{ title }}</h3>
      <div class="editor-actions">
        <slot name="actions"></slot>
      </div>
    </div>
    <div class="editor-section">
      <div ref="editorContainer" class="monaco-editor-wrapper"></div>

      <!-- 插槽：用于放置控制台或其他扩展组件 -->
      <slot name="extension"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
  shallowRef,
} from "vue";
import * as monaco from "monaco-editor";
import { ElMessage } from "element-plus";
import "./MonacoEditor.scss";

interface Props {
  modelValue: string;
  placeholder?: string;
  title?: string;
  showHeader?: boolean;
  height?: string;
  width?: string;
  language?: string;
  theme?: "vs-dark" | "vs" | "hc-black";
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  readOnly?: boolean;
  minimap?: boolean;
  lineNumbers?: "on" | "off" | "relative" | "interval";
  wordWrap?: "on" | "off" | "wordWrapColumn" | "bounded";
  fontSize?: number;
  formatOnPaste?: boolean;
  formatOnType?: boolean;
  autoIndent?: "none" | "keep" | "brackets" | "advanced" | "full";
  suggestOnTriggerCharacters?: boolean;
  quickSuggestions?:
    | boolean
    | { other: boolean; comments: boolean; strings: boolean };
  parameterHints?: boolean;
  folding?: boolean;
  bracketPairColorization?: boolean;
  defaultCode?: string;
  enableSave?: boolean; // 是否启用Ctrl+S保存
  consoleData?: Array<{
    type: "log" | "error" | "warn" | "info";
    message: string;
    timestamp: Date;
  }>; // 控制台数据
  showConsole?: boolean; // 是否显示控制台
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "在此输入JavaScript代码...",
  title: "代码编辑器",
  showHeader: true,
  height: "100%",
  width: "100%",
  language: "javascript",
  theme: "vs",
  readOnly: false,
  minimap: true,
  lineNumbers: "on",
  wordWrap: "on",
  fontSize: 14,
  formatOnPaste: true,
  formatOnType: true,
  autoIndent: "advanced",
  suggestOnTriggerCharacters: true,
  quickSuggestions: true,
  parameterHints: true,
  folding: true,
  bracketPairColorization: true,
  enableSave: false,
  consoleData: () => [],
  showConsole: true,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  save: [];
  "close-console": [];
}>();

const editorContainer = ref<HTMLElement>();
const editor = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null);
const isInitialized = ref(false);
const isDestroyed = ref(false);
const formatting = ref(false);
const currentTheme = ref<"vs-dark" | "vs">("vs-dark");
let workerErrorHandler: ((event: ErrorEvent) => void) | null = null; // 保存错误处理器引用
let languageFeaturesDisposables: monaco.IDisposable[] | null = null; // 保存语言特性注册的 disposables，用于清理

// 控制台相关
const consoleLogs = ref<
  Array<{
    type: "log" | "error" | "warn" | "info";
    message: string;
    timestamp: Date;
  }>
>([]);
const autoScroll = ref(true);

// 设置JavaScript智能感知和类型定义
const setupJavaScriptIntelliSense = () => {
  // 1. 配置TypeScript编译器选项
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    allowNonTsExtensions: true, // 允许非 .ts 扩展
    checkJs: true, // 启用JS语法检查，但不启用严格模式
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    allowSyntheticDefaultImports: true,
    noEmit: true,
    esModuleInterop: true,
    skipLibCheck: true,
    strict: false, // 关闭严格模式，适合纯 JS 代码
    alwaysStrict: false, // 关闭严格模式
    noImplicitAny: false, // 不要求显式类型注解
    strictNullChecks: false, // 不进行严格的空值检查
    strictPropertyInitialization: false, // 不要求属性初始化
    strictFunctionTypes: false, // 不要求严格函数类型
    noUnusedLocals: false, // 不检查未使用的变量
    noUnusedParameters: false, // 不检查未使用的参数
    noImplicitReturns: false, // 不要求所有分支都有返回
  });

  // 2. 注入工具箱特有的类型定义 (d.ts)
  const libSource = `
    declare interface AField<T> {
      targetClass: new () => T;
      targetProperty: string;
    }

    declare interface Context {
      /** 大模型解析出的输入参数 */
      args: Record<string, any>;
      /** 继承自前置工具的执行结果 */
      data: any;
    }

    /** 
     * 同步调用其他工具
     * @param toolName 工具标识名
     * @param args 传递给工具的参数
     */
    declare function callTool(toolName: string, args: Record<string, any>): any;

    /** 工具执行上下文 */
    declare const context: Context;

    // 内置API类型定义
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

  const libUri = "ts:filename/toolbox.d.ts";

  // 避免重复注册
  const oldModel = monaco.editor.getModel(monaco.Uri.parse(libUri));
  if (oldModel) {
    oldModel.setValue(libSource);
  } else {
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      libSource,
      libUri
    );
  }

  // 3. 设置TypeScript诊断配置
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false, // 不禁用语义验证
    noSyntaxValidation: false, // 不禁用语法验证
    noSuggestionDiagnostics: true, // 禁用建议诊断（减少不必要的提示）
    validateAll: false, // 不完全验证所有文件
    semanticDelay: 500, // 增加语义验证延迟，减少频繁验证
  });
};

// 设置JavaScript语言特性和代码片段
const setupJavaScriptFeatures = (): monaco.IDisposable[] => {
  // 配置JavaScript语言特性
  monaco.languages.setLanguageConfiguration("javascript", {
    comments: {
      blockComment: ["/*", "*/"],
      lineComment: "//",
    },
    brackets: [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"', notIn: ["string"] },
      { open: "'", close: "'", notIn: ["string"] },
      { open: "`", close: "`", notIn: ["string"] },
    ],
    surroundingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: "`", close: "`" },
    ],
  });

  // 注册JavaScript代码片段和智能提示
  const completionDisposable = monaco.languages.registerCompletionItemProvider("javascript", {
    triggerCharacters: ['.'],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      // 获取当前行的文本，判断输入上下文
      const lineContent = model.getLineContent(position.lineNumber);
      const textBeforePosition = lineContent.substring(0, position.column - 1);

      // 检测是否在输入 console. 或 context. 后
      const isAfterConsoleDot = /console\.(\w*)$/.test(textBeforePosition);
      const isAfterContextDot = /context\.(\w*)$/.test(textBeforePosition);

      // 如果是 console. 或 context. 后面，只显示对应的方法/属性
      if (isAfterConsoleDot) {
        const suggestions: monaco.languages.CompletionItem[] = [
          {
            label: "log",
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: "log(${1:message});",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            documentation: "Console日志输出",
            detail: "log(message)",
          },
          {
            label: "error",
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: "error(${1:msg});",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            documentation: "Console错误输出",
            detail: "error(msg)",
          },
          {
            label: "warn",
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: "warn(${1:warning});",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            documentation: "Console警告输出",
            detail: "warn(warning)",
          },
          {
            label: "info",
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: "info(${1:message});",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            documentation: "Console信息输出",
            detail: "info(message)",
          },
          {
            label: "debug",
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: "debug(${1:message});",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            documentation: "Console调试输出",
            detail: "debug(message)",
          },
        ];
        return { suggestions };
      }

      if (isAfterContextDot) {
        const suggestions: monaco.languages.CompletionItem[] = [
          {
            label: "args",
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: "args",
            range,
            documentation: "大模型解析出的输入参数",
            detail: "Record<string, any>",
          },
          {
            label: "data",
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: "data",
            range,
            documentation: "继承自前置工具的执行结果",
            detail: "any",
          },
        ];
        return { suggestions };
      }

      // 默认情况下显示完整的建议列表
      const suggestions: monaco.languages.CompletionItem[] = [
        {
          label: "callTool",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'callTool("${1:toolName}", { ${2} })',
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          documentation: "调用其他工具",
          detail: "同步调用其他工具，传递参数并返回结果",
        },
        {
          label: "context",
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: "context",
          range,
          documentation: "工具执行上下文对象",
          detail: "Context - 包含 args 和 data",
        },
        {
          label: "console",
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: "console",
          range,
          documentation: "console对象用于浏览器控制台输出",
          detail: "Console",
        },
        // 控制流
        {
          label: "if",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: ["if (${1:condition}) {", "\t${2:// body}", "}"].join(
            "\n"
          ),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          documentation: "if条件语句",
        },
        {
          label: "for loop",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {",
            "\t${3:// body}",
            "}",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          documentation: "for循环",
        },
        {
          label: "for...of",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "for (const ${1:item} of ${2:iterable}) {",
            "\t${3:// body}",
            "}",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          documentation: "for...of循环",
        },
        {
          label: "try...catch",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "try {",
            "\t${1:// try block}",
            "} catch (${2:error}) {",
            "\t${3:// catch block}",
            "}",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          documentation: "try...catch错误处理",
        },
        // 常用代码块
        {
          label: "class",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "class ${1:ClassName} {",
            "\tconstructor(${2:parameters}) {",
            "\t\t${3:// constructor body}",
            "\t}",
            "}",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          documentation: "ES6类定义",
        },
        // 工具箱常用模板
        {
          label: "json_parse",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "const ${1:parsedData} = JSON.parse(${2:jsonString});",
            "console.log(${1:parsedData});",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          documentation: "JSON解析模板",
          detail: "安全解析JSON字符串",
        },
        {
          label: "json_stringify",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "const ${1:result} = JSON.stringify(${2:data}, null, 2);",
            "console.log(${1:result});",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          documentation: "JSON序列化模板",
          detail: "格式化JSON对象",
        },
      ];

      return { suggestions };
    },
  });

  // 注册JavaScript格式化提供者
  monaco.languages.registerDocumentFormattingEditProvider("javascript", {
    provideDocumentFormattingEdits: (model, options) => {
      try {
        const text = model.getValue();
        if (!text.trim()) {
          return [];
        }

        // 精确的JavaScript格式化算法
        const formatJavaScript = (code: string): string => {
          const lines = code.split("\n");
          const result: string[] = [];
          let indentLevel = 0;

          const countBracesInLine = (
            line: string,
            ignoreFirst: boolean = false
          ): { open: number; close: number } => {
            let open = 0,
              close = 0;
            let inString = false;
            let stringChar = "";
            let startIdx = ignoreFirst && line.startsWith("}") ? 1 : 0;

            for (let i = startIdx; i < line.length; i++) {
              const char = line[i];

              // 跳过字符串内容
              if (!inString && (char === '"' || char === "'" || char === "`")) {
                inString = true;
                stringChar = char;
              } else if (
                inString &&
                char === stringChar &&
                line[i - 1] !== "\\"
              ) {
                inString = false;
                stringChar = "";
              } else if (!inString) {
                if (char === "{") open++;
                else if (char === "}") close++;
              }
            }
            return { open, close };
          };

          for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            // 空行处理
            if (!line) {
              result.push("");
              continue;
            }

            // 计算当前行的缩进
            let currentIndent = indentLevel;

            // 处理以 } 开头的行
            if (line.startsWith("}")) {
              currentIndent = Math.max(0, currentIndent - 1);

              // 分离 } 和后面的内容
              const braceMatch = line.match(/^\}\s*(.*)/);
              if (braceMatch) {
                const restContent = braceMatch[1].trim();
                line = "}" + (restContent ? " " + restContent : "");
              }
            }

            // 添加格式化后的行
            result.push("    ".repeat(currentIndent) + line);

            // 计算下一行的缩进级别
            const braces = countBracesInLine(line, line.startsWith("}"));

            if (line.endsWith("{")) {
              // 行以 { 结尾，下一行增加一级缩进
              indentLevel = currentIndent + 1;
            } else {
              // 根据净大括号数调整缩进
              const netChange = braces.open - braces.close;
              if (line.startsWith("}")) {
                // 已经减少了1级缩进，现在加上净变化
                indentLevel = currentIndent + netChange;
              } else {
                indentLevel = currentIndent + netChange;
              }

              indentLevel = Math.max(0, indentLevel);
            }
          }

          return result.join("\n");
        };

        const formattedText = formatJavaScript(text);

        return [
          {
            range: model.getFullModelRange(),
            text: formattedText,
          },
        ];
      } catch (error) {
        console.error("格式化提供者错误:", error);
        return [];
      }
    },
  });

  // 注册悬停提示
  const hoverDisposable = monaco.languages.registerHoverProvider("javascript", {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return;

      const hoverInfo: { [key: string]: string } = {
        console: "console对象用于浏览器控制台输出",
        log: "输出一般信息到控制台",
        error: "输出错误信息到控制台",
        warn: "输出警告信息到控制台",
        async: "声明异步函数",
        await: "等待Promise完成",
        Promise: "Promise对象用于异步操作",
      };

      const info = hoverInfo[word.word];
      if (info) {
        return {
          range: new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [{ value: info }],
        };
      }
    },
  });

  // 返回所有需要清理的 disposables
  return [completionDisposable, hoverDisposable];
};

// 初始化Monaco Editor
const initEditor = async () => {
  if (!editorContainer.value || isInitialized.value || isDestroyed.value)
    return;

  try {
    // 捕获 Monaco Editor Worker 错误
    workerErrorHandler = (event: ErrorEvent) => {
      // 过滤掉 TypeScript Worker 的 "Unexpected usage" 错误
      if (event.message && event.message.includes('Unexpected usage')) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    // 监听全局错误事件
    if (workerErrorHandler) {
      window.addEventListener('error', workerErrorHandler);
    }

    // 设置JavaScript智能感知和类型定义
    setupJavaScriptIntelliSense();

    // 设置JavaScript语言特性（保存返回的 disposables，用于清理）
    languageFeaturesDisposables = setupJavaScriptFeatures();

    // 构建编辑器配置选项
    const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
      value: props.modelValue,
      language: props.language,
      theme: props.theme,
      readOnly: props.readOnly,
      automaticLayout: true,
      minimap: {
        enabled: props.minimap,
        side: "right",
      },
      fontSize: props.fontSize,
      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
      lineNumbers: props.lineNumbers,
      scrollBeyondLastLine: false,
      wordWrap: props.wordWrap,
      bracketPairColorization: { enabled: props.bracketPairColorization },
      suggest: {
        showKeywords: true,
        showSnippets: true,
        showFunctions: true,
        showVariables: true,
      },
      quickSuggestions:
        typeof props.quickSuggestions === "boolean"
          ? { other: props.quickSuggestions, comments: false, strings: false }
          : props.quickSuggestions,
      parameterHints: {
        enabled: props.parameterHints,
      },
      folding: {
        enabled: props.folding,
      },
      foldingStrategy: "indentation",
      showFoldingControls: "always",
      formatOnPaste: props.formatOnPaste,
      formatOnType: props.formatOnType,
      autoIndent: props.autoIndent,
      tabSize: 4,
      insertSpaces: true,
      detectIndentation: false,
      renderLineHighlight: "line",
      renderWhitespace: "selection",
      suggestOnTriggerCharacters: props.suggestOnTriggerCharacters,
      acceptSuggestionOnEnter: "on",
      tabCompletion: "on",
      snippetSuggestions: "top", // 代码片段优先
      suggestSelection: "first",
      hover: { enabled: true, delay: 300 }, // 开启悬停提示（如查看 AField 结构）
      lightbulb: { enabled: true }, // 左侧快速修复小灯泡
      wordBasedSuggestions: true, // 基于文档中已出现过的单词提供补全
      links: true, // 自动识别变量引用关系
      validate: false, // 关闭实时验证，减少 Worker 压力
      ...props.options,
    };

    // 创建编辑器实例
    editor.value = monaco.editor.create(editorContainer.value, editorOptions);

    // 监听内容变化
    editor.value.onDidChangeModelContent(() => {
      const value = editor.value?.getValue() || "";
      emit("update:modelValue", value);
    });

    // 添加快捷键
    editor.value.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (props.enableSave) {
        // 触发父组件的保存事件
        formatCode();
        emit("save");
      } else {
        ElMessage.info("请使用页面上的保存按钮");
      }
    });

    // 设置编辑器焦点
    nextTick(() => {
      editor.value?.focus();
    });

    isInitialized.value = true;
  } catch (error) {
    console.error("Monaco Editor初始化失败:", error);
    ElMessage.error("代码编辑器初始化失败");
  }
};

// 格式化代码
const formatCode = async () => {
  if (!editor.value) {
    console.warn("编辑器未初始化，无法格式化代码");
    ElMessage.warning("编辑器未初始化");
    return;
  }

  // 检查当前语言是否支持格式化
  const model = editor.value.getModel();
  if (!model) {
    console.warn("无法获取编辑器模型");
    ElMessage.warning("无法获取编辑器内容");
    return;
  }

  const languageId = model.getLanguageId();
  console.log("当前语言:", languageId);

  formatting.value = true;
  try {
    console.log("尝试Monaco内置格式化");
    const formatAction = editor.value.getAction("editor.action.formatDocument");
    if (formatAction) {
      console.log("执行文档格式化");
      await formatAction.run();
      ElMessage.success("代码格式化完成");
      return;
    }

    // 最后尝试格式化选中内容
    const formatSelectionAction = editor.value.getAction(
      "editor.action.formatSelection"
    );
    if (formatSelectionAction) {
      console.log("执行选中内容格式化");
      await formatSelectionAction.run();
      ElMessage.success("代码格式化完成");
      return;
    }

    throw new Error("所有格式化方法都不可用");
  } catch (error) {
    console.error("格式化失败:", error);
    console.error("错误详情:", {
      language: languageId,
      hasModel: !!model,
      modelValue: model.getValue().substring(0, 100) + "...",
      editorAvailable: !!editor.value,
    });

    // 手动尝试格式化
    try {
      console.log("尝试手动格式化");
      const text = model.getValue();
      const formattedText = formatJavaScriptManually(text);
      if (formattedText !== text) {
        editor.value.setValue(formattedText);
        console.log("代码格式化成功（手动模式）");
        return;
      }
    } catch (manualError) {
      console.error("手动格式化也失败:", manualError);
    }

    // 提供更具体的错误信息
    let errorMessage = "代码格式化失败";
    if (error instanceof Error) {
      if (error.message.includes("No provider")) {
        errorMessage = "当前语言不支持自动格式化";
      } else if (error.message.includes("No action")) {
        errorMessage = "格式化功能不可用";
      } else {
        errorMessage = `格式化失败: ${error.message}`;
      }
    }

    ElMessage.error(errorMessage);
  } finally {
    formatting.value = false;
  }
};

// 手动格式化JavaScript代码（备用方案）
const formatJavaScriptManually = (code: string): string => {
  const lines = code.split("\n");
  const result: string[] = [];
  let indentLevel = 0;

  const countBracesInLine = (
    line: string,
    ignoreFirst: boolean = false
  ): { open: number; close: number } => {
    let open = 0,
      close = 0;
    let inString = false;
    let stringChar = "";
    let startIdx = ignoreFirst && line.startsWith("}") ? 1 : 0;

    for (let i = startIdx; i < line.length; i++) {
      const char = line[i];

      // 跳过字符串内容
      if (!inString && (char === '"' || char === "'" || char === "`")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && line[i - 1] !== "\\") {
        inString = false;
        stringChar = "";
      } else if (!inString) {
        if (char === "{") open++;
        else if (char === "}") close++;
      }
    }
    return { open, close };
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // 空行处理
    if (!line) {
      result.push("");
      continue;
    }

    // 计算当前行的缩进
    let currentIndent = indentLevel;

    // 处理以 } 开头的行
    if (line.startsWith("}")) {
      currentIndent = Math.max(0, currentIndent - 1);

      // 分离 } 和后面的内容
      const braceMatch = line.match(/^\}\s*(.*)/);
      if (braceMatch) {
        const restContent = braceMatch[1].trim();
        line = "}" + (restContent ? " " + restContent : "");
      }
    }

    // 添加格式化后的行
    result.push("    ".repeat(currentIndent) + line);

    // 计算下一行的缩进级别
    const braces = countBracesInLine(line, line.startsWith("}"));

    if (line.endsWith("{")) {
      // 行以 { 结尾，下一行增加一级缩进
      indentLevel = currentIndent + 1;
    } else {
      // 根据净大括号数调整缩进
      const netChange = braces.open - braces.close;
      if (line.startsWith("}")) {
        // 已经减少了1级缩进，现在加上净变化
        indentLevel = currentIndent + netChange;
      } else {
        indentLevel = currentIndent + netChange;
      }

      indentLevel = Math.max(0, indentLevel);
    }
  }

  return result.join("\n");
};

// 测试编辑器功能
const testEditor = () => {
  if (!editor.value) {
    ElMessage.warning("编辑器未初始化");
    return;
  }

  const model = editor.value.getModel();
  if (!model) {
    ElMessage.warning("无法获取编辑器模型");
    return;
  }

  const position = editor.value.getPosition();
  const selection = editor.value.getSelection();
  const value = editor.value.getValue();

  console.log("=== 编辑器测试信息 ===");
  console.log("编辑器实例:", !!editor.value);
  console.log("编辑器模型:", !!model);
  console.log("当前语言:", model.getLanguageId());
  console.log("光标位置:", position);
  console.log("选中范围:", selection);
  console.log("内容长度:", value.length);
  console.log(
    "格式化操作可用:",
    !!editor.value.getAction("editor.action.formatDocument")
  );
  console.log("=====================");

  ElMessage({
    message: `编辑器状态正常 - 语言: ${model.getLanguageId()}, 光标: ${position?.lineNumber}:${position?.column}`,
    type: "success",
    duration: 3000,
  });
};

// 切换主题
const toggleTheme = () => {
  const newTheme = currentTheme.value === "vs-dark" ? "vs" : "vs-dark";
  currentTheme.value = newTheme;
  monaco.editor.setTheme(newTheme);
};
// 重新布局编辑器
const layoutEditor = () => {
  if (editor.value) {
    editor.value.layout();
  }
};

// 监听modelValue变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (editor.value && editor.value.getValue() !== newValue) {
      editor.value.setValue(newValue);
    }
  },
  { flush: "post" }
);

// 监听主题变化
watch(
  () => props.theme,
  (newTheme) => {
    if (editor.value) {
      monaco.editor.setTheme(newTheme);
      currentTheme.value = newTheme as "vs-dark" | "vs";
    }
  }
);

// 监听语言变化
watch(
  () => props.language,
  (newLanguage) => {
    if (editor.value) {
      const model = editor.value.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, newLanguage);
      }
    }
  }
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

// 监听编辑器尺寸变化
watch([() => props.height, () => props.width], () => {
  nextTick(() => {
    layoutEditor();
  });
});

// 监听其他配置变化
watch(
  [
    () => props.fontSize,
    () => props.lineNumbers,
    () => props.wordWrap,
    () => props.minimap,
    () => props.bracketPairColorization,
    () => props.folding,
  ],
  () => {
    if (editor.value) {
      editor.value.updateOptions({
        fontSize: props.fontSize,
        lineNumbers: props.lineNumbers,
        wordWrap: props.wordWrap,
        minimap: { enabled: props.minimap },
        bracketPairColorization: { enabled: props.bracketPairColorization },
        folding: { enabled: props.folding },
      });
    }
  }
);

// 监听控制台数据变化
watch(
  () => props.consoleData,
  (newData) => {
    if (!newData || newData.length === 0) {
      consoleLogs.value = [];
      return;
    }
    consoleLogs.value = [...newData];
  },
  { immediate: true, deep: true }
);

// 控制台日志更新回调
const onConsoleLogsUpdate = (newLogs: typeof props.consoleData) => {
  consoleLogs.value = newLogs;
};

// 控制台相关方法
const addConsoleLog = (
  type: "log" | "error" | "warn" | "info",
  message: string
) => {
  const newLog = { type, message, timestamp: new Date() };
  consoleLogs.value.push(newLog);
};

const clearConsole = () => {
  consoleLogs.value = [];
};

const closeConsole = () => {
  emit("close-console");
};

const toggleAutoScroll = () => {
  autoScroll.value = !autoScroll.value;
};

// 暴露给父组件的方法和属性
defineExpose({
  formatCode,
  getEditor: () => editor.value,
  focus: () => editor.value?.focus(),
  getValue: () => editor.value?.getValue() || "",
  setValue: (value: string) => {
    if (editor.value) {
      editor.value.setValue(value);
    }
  },
  getPosition: () => editor.value?.getPosition(),
  setPosition: (position: monaco.Position) =>
    editor.value?.setPosition(position),
  getSelection: () => editor.value?.getSelection(),
  setSelection: (selection: monaco.Selection) =>
    editor.value?.setSelection(selection),
  layout: layoutEditor,
  getModel: () => editor.value?.getModel(),
  updateOptions: (options: monaco.editor.IEditorOptions) =>
    editor.value?.updateOptions(options),
  revealLine: (lineNumber: number) =>
    editor.value?.revealLineInCenter(lineNumber),
  revealPosition: (position: monaco.Position) =>
    editor.value?.revealPositionInCenter(position),
  triggerSuggest: () => editor.value?.triggerSuggest(),
  insertText: (text: string) => editor.value?.trigger("type", { text }),
  isDisposed: () => !editor.value,
  addConsoleLog,
  clearConsole,
  getConsoleLogs: () => consoleLogs.value,
});

onMounted(() => {
  nextTick(() => {
    initEditor();
  });
});

onBeforeUnmount(() => {
  isDestroyed.value = true;
  if (editor.value) {
    editor.value.dispose();
    editor.value = null;
    isInitialized.value = false;
  }
  // 清理语言特性注册的 providers
  if (languageFeaturesDisposables) {
    languageFeaturesDisposables.forEach(disposable => disposable.dispose());
    languageFeaturesDisposables = null;
  }
  // 移除全局错误监听器
  if (workerErrorHandler) {
    window.removeEventListener('error', workerErrorHandler);
    workerErrorHandler = null;
  }
});
</script>
