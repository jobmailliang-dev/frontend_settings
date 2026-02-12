/**
 * 工具配置 API
 */
import type { ToolConfig, ToolExecuteRequest, ToolExecuteResponse, ToolOperationResult } from '@next/types/tool';
import request from './request';
import { streamRequest } from '@next/utils/streamRequest';

/**
 * API 统一响应包装类型
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

/**
 * 工具列表响应（包含元数据）
 */
interface ToolListResponse {
  tools: ToolConfig[];
  total: number;
}

/** API 基础路径 */
const API_BASE = '/tools';

/**
 * 获取工具列表
 * GET /tools
 * Response: { success: true, data: { tools: ToolConfig[], total: number } }
 */
export async function getTools(): Promise<ToolConfig[]> {
  const response = await request.get<ApiResponse<ToolListResponse>>(API_BASE);
  return response.data.data || [];
}

/**
 * 获取单个工具
 * GET /tool?id={id}
 * Response: { success: true, data: ToolConfig }
 */
export async function getTool(id: number): Promise<ToolConfig | null> {
  const response = await request.get<ApiResponse<ToolConfig>>(`${API_BASE}?id=${id}`);
  return response.data.data || null;
}

/**
 * 创建工具
 * POST /tools
 * Body: Partial<ToolConfig>
 * Response: { success: true, data: ToolConfig, message: string }
 */
export async function createTool(tool: Partial<ToolConfig>): Promise<ToolOperationResult> {
  const response = await request.post<ApiResponse<ToolConfig>>(API_BASE, tool);
  return {
    success: response.data.success,
    message: response.data.message || '创建成功',
    data: response.data.data
  };
}

/**
 * 更新工具
 * PUT /tool?id={id}
 * Body: Partial<ToolConfig>
 * Response: { success: true, data: ToolConfig, message: string }
 */
export async function updateTool(id: number, tool: Partial<ToolConfig>): Promise<ToolOperationResult> {
  const response = await request.put<ApiResponse<ToolConfig>>(`${API_BASE}?id=${id}`, tool);
  return {
    success: response.data.success,
    message: response.data.message || '更新成功',
    data: response.data.data
  };
}

/**
 * 删除工具
 * DELETE /tool?id={id}
 * Response: { success: true, message: string }
 */
export async function deleteTool(id: number): Promise<ToolOperationResult> {
  const response = await request.delete<ApiResponse<null>>(`${API_BASE}?id=${id}`);
  return {
    success: response.data.success,
    message: response.data.message || '删除成功'
  };
}

/**
 * 切换工具启用状态
 * PUT /tools/active?id={id}
 * Body: { is_active: boolean }
 * Response: { success: true, data: ToolConfig, message: string }
 */
export async function toggleToolActive(id: number, is_active: boolean): Promise<ToolOperationResult> {
  const response = await request.put<ApiResponse<ToolConfig>>(`${API_BASE}/active?id=${id}`, { is_active });
  return {
    success: response.data.success,
    message: response.data.message || (is_active ? '已启用' : '已停用'),
    data: response.data.data
  };
}

/**
 * 批量导入工具
 * POST /tools/import
 * Body: { tools: ToolConfig[] }
 * Response: { success: true, data: ToolConfig[], message: string }
 */
export async function importTools(tools: ToolConfig[]): Promise<ToolOperationResult> {
  const response = await request.post<ApiResponse<ToolConfig[]>>(`${API_BASE}/import`, { tools });
  return {
    success: response.data.success,
    message: response.data.message || `导入成功 ${response.data.data?.length || 0} 个工具`,
    data: response.data.data
  };
}

/**
 * 导出工具
 * GET /tools/export
 * Response: Blob (JSON file)
 */
export async function exportTools(): Promise<Blob> {
  const response = await request.get(`${API_BASE}/export`, {
    responseType: 'blob',
  });
  return response.data as unknown as Blob;
}

/**
 * 获取可继承的工具列表（下拉选择用）
 * GET /tools/inheritable
 * Response: { success: true, data: ToolConfig[] }
 */
export async function getInheritableTools(): Promise<ToolConfig[]> {
  const response = await request.get<ApiResponse<ToolConfig[]>>(`${API_BASE}/inheritable`);
  return response.data.data || [];
}

/**
 * 执行工具（流式）
 * POST /tools/execute?id={id}
 * Body: { params: Record<string, any> }
 * Response: SSE stream
 */
export function executeToolStream(
  toolId: number,
  params: ToolExecuteRequest,
  eventHandler: (event: string, data: any) => void
): Promise<void> {
  return streamRequest(
    `/api${API_BASE}/execute/stream?id=${toolId}`,
    params,
    eventHandler,
    {
      method: 'POST',
      onError: (error) => {
        console.error('工具执行失败:', error);
      }
    }
  );
}

/**
 * 执行工具（Promise 方式）
 * POST /tool/execute?id={id}
 * Body: { params: Record<string, any> }
 * Response: { success: true, data: any, execution_time?: string }
 */
export async function executeTool(
  toolId: number,
  params: ToolExecuteRequest
): Promise<ToolExecuteResponse> {
  const response = await request.post<ApiResponse<ToolExecuteResponse>>(`${API_BASE}/execute?id=${toolId}`, params);
  return response.data.data;
}

/**
 * 从 JSON 文件导入工具
 * 解析本地文件，不涉及 API
 */
export function parseToolsFromJson(file: File): Promise<ToolConfig[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const tools = JSON.parse(content);
        if (Array.isArray(tools)) {
          resolve(tools);
        } else {
          reject(new Error('Invalid format: expected array of tools'));
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * 下载工具为 JSON 文件
 * 生成 Blob 并触发下载
 */
export function downloadToolsAsJson(tools: ToolConfig[], filename: string = 'tools.json'): void {
  const json = JSON.stringify(tools, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const toolConfigApi = {
  getTools,
  getTool,
  createTool,
  updateTool,
  deleteTool,
  toggleToolActive,
  importTools,
  exportTools,
  getInheritableTools,
  executeToolStream,
  executeTool,
  parseToolsFromJson,
  downloadToolsAsJson,
};
