/**
 * 工具管理 Store
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ToolConfig, ToolFilter, ToolOperationResult } from '@/types/tool';
import { toolConfigApi } from '@/api/toolConfig';

export const useToolStore = defineStore('tool', () => {
  // 状态
  const tools = ref<ToolConfig[]>([]);
  const currentTool = ref<ToolConfig | null>(null);
  const inheritableTools = ref<ToolConfig[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filter = ref<ToolFilter>({
    search: '',
    status: 'all',
  });

  // 计算属性
  const filteredTools = computed(() => {
    const allTools = Array.isArray(tools.value) ? tools.value : [];
    let result = allTools.slice();

    // 搜索过滤
    if (filter.value.search) {
      const searchLower = filter.value.search.toLowerCase();
      result = result.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchLower) ||
          tool.description.toLowerCase().includes(searchLower)
      );
    }

    // 状态过滤
    if (filter.value.status === 'active') {
      result = result.filter((tool) => tool.is_active);
    } else if (filter.value.status === 'inactive') {
      result = result.filter((tool) => !tool.is_active);
    }

    return result;
  });

  const activeToolsCount = computed(() => {
    const list = Array.isArray(tools.value) ? tools.value : [];
    return list.filter((t) => t.is_active).length;
  });

  const inactiveToolsCount = computed(() => {
    const list = Array.isArray(tools.value) ? tools.value : [];
    return list.filter((t) => !t.is_active).length;
  });

  // Actions
  async function loadTools() {
    loading.value = true;
    error.value = null;
    try {
      tools.value = await toolConfigApi.getTools();
      console.log("=========", tools.value)
    } catch (e: any) {
      error.value = e.message || '加载工具列表失败';
      console.error('Failed to load tools:', e);
    } finally {
      loading.value = false;
    }
  }

  async function loadTool(id: number) {
    loading.value = true;
    error.value = null;
    try {
      currentTool.value = await toolConfigApi.getTool(id);
      return currentTool.value;
    } catch (e: any) {
      error.value = e.message || '加载工具失败';
      console.error('Failed to load tool:', e);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function loadInheritableTools() {
    try {
      inheritableTools.value = await toolConfigApi.getInheritableTools();
    } catch (e) {
      console.error('Failed to load inheritable tools:', e);
    }
  }

  async function createTool(tool: Partial<ToolConfig>): Promise<ToolConfig | null> {
    loading.value = true;
    error.value = null;
    try {
      const result = await toolConfigApi.createTool(tool);
      if (result.success) {
        await loadTools();
        return result.data || null;
      }
      error.value = result.message || '创建工具失败';
      return null;
    } catch (e: any) {
      error.value = e.message || '创建工具失败';
      console.error('Failed to create tool:', e);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function updateTool(id: number, tool: Partial<ToolConfig>): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const result = await toolConfigApi.updateTool(id, tool);
      if (result.success) {
        await loadTools();
        return true;
      }
      error.value = result.message || '更新工具失败';
      return false;
    } catch (e: any) {
      error.value = e.message || '更新工具失败';
      console.error('Failed to update tool:', e);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteTool(id: number): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const result = await toolConfigApi.deleteTool(id);
      if (result.success) {
        await loadTools();
        if (currentTool.value?.id === id) {
          currentTool.value = null;
        }
        return true;
      }
      error.value = result.message || '删除工具失败';
      return false;
    } catch (e: any) {
      error.value = e.message || '删除工具失败';
      console.error('Failed to delete tool:', e);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function duplicateTool(tool: ToolConfig): Promise<ToolConfig | null> {
    const duplicate: Partial<ToolConfig> = {
      name: `${tool.name}_copy`,
      description: tool.description,
      is_active: false,
      parameters: [...tool.parameters],
      inherit_from: tool.inherit_from,
      code: tool.code,
    };
    return createTool(duplicate);
  }

  async function toggleTool(id: number, is_active: boolean): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const result = await toolConfigApi.toggleToolActive(id, is_active);
      if (result.success) {
        await loadTools();
        return true;
      }
      error.value = result.message || '切换状态失败';
      return false;
    } catch (e: any) {
      error.value = e.message || '切换状态失败';
      console.error('Failed to toggle tool:', e);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function importToolsFromFile(file: File): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const tools = await toolConfigApi.parseToolsFromJson(file);
      const result = await toolConfigApi.importTools(tools);
      if (result.success) {
        await loadTools();
        return true;
      }
      error.value = result.message || '导入工具失败';
      return false;
    } catch (e: any) {
      error.value = e.message || '导入工具失败';
      console.error('Failed to import tools:', e);
      return false;
    } finally {
      loading.value = false;
    }
  }

  function exportAllTools(): void {
    toolConfigApi.downloadToolsAsJson(tools.value, 'tools_export.json');
  }

  function setFilter(newFilter: Partial<ToolFilter>) {
    filter.value = { ...filter.value, ...newFilter };
  }

  function clearFilter() {
    filter.value = { search: '', status: 'all' };
  }

  function clearCurrentTool() {
    currentTool.value = null;
  }

  function clearError() {
    error.value = null;
  }

  return {
    // 状态
    tools,
    currentTool,
    inheritableTools,
    loading,
    error,
    filter,
    // 计算属性
    filteredTools,
    activeToolsCount,
    inactiveToolsCount,
    // Actions
    loadTools,
    loadTool,
    loadInheritableTools,
    createTool,
    updateTool,
    deleteTool,
    duplicateTool,
    toggleTool,
    importToolsFromFile,
    exportAllTools,
    setFilter,
    clearFilter,
    clearCurrentTool,
    clearError,
  };
});
