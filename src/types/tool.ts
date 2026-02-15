/**
 * 工具配置类型定义
 */

/** 工具参数类型 */
export type ParameterType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';

/** 工具参数定义 */
export interface ToolParameter {
  name: string;
  description: string;
  type: ParameterType;
  required: boolean;
  default?: any;
  enum?: string[];
  hasEnum?: boolean;
}

/** 工具配置 */
export interface ToolConfig {
  id?: number;
  name: string;
  description: string;
  is_active: boolean;
  parameters: ToolParameter[];
  inherit_from?: string;
  code: string;
  created_at?: string;
  updated_at?: string;
}

/** 工具执行请求 */
export interface ToolExecuteRequest {
  params: Record<string, any>;
}

/** 工具执行响应 */
export interface ToolExecuteResponse {
  success: boolean;
  data?: any;
  error?: string;
  execution_time?: string;
}

/** 导入工具请求 */
export interface ImportToolsRequest {
  tools: ToolConfig[];
}

/** 工具筛选条件 */
export interface ToolFilter {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
}

/** 工具操作结果 */
export interface ToolOperationResult {
  success: boolean;
  message: string;
  data?: ToolConfig | ToolConfig[];
}
