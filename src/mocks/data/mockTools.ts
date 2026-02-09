import type { ToolConfig } from '@/types/tool';

/**
 * Mock 工具数据
 * 用于 MSW Mock 服务模拟工具管理 API
 */
export const mockTools: ToolConfig[] = [
  {
    id: 1,
    name: 'database_query',
    description: '数据库查询工具，支持 SQLite、PostgreSQL、MySQL 等多种数据库',
    is_active: true,
    parameters: [
      { name: 'sql', description: 'SQL 查询语句', type: 'string', required: true },
      { name: 'params', description: '查询参数', type: 'array', required: false, default: [] }
    ],
    inherit_from: 'mcp__sqlite__query',
    code: `// 数据库查询工具
function execute(params) {
  const { sql, params: queryParams } = params;
  // 执行查询逻辑
  return { success: true, data: [] };
}`,
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-08T14:30:00Z'
  },
  {
    id: 2,
    name: 'file_reader',
    description: '文件读取工具，支持读取文本文件和 JSON 文件',
    is_active: true,
    parameters: [
      { name: 'path', description: '文件路径', type: 'string', required: true },
      { name: 'encoding', description: '文件编码', type: 'string', required: false, default: 'utf-8', enum: ['utf-8', 'gbk', 'latin1'] }
    ],
    code: `// 文件读取工具
function execute(params) {
  const { path, encoding } = params;
  // 读取文件逻辑
  return { success: true, content: '' };
}`,
    created_at: '2026-02-02T09:00:00Z',
    updated_at: '2026-02-07T16:20:00Z'
  },
  {
    id: 3,
    name: 'http_request',
    description: 'HTTP 请求工具，支持 GET、POST、PUT、DELETE 等方法',
    is_active: false,
    parameters: [
      { name: 'url', description: '请求 URL', type: 'string', required: true },
      { name: 'method', description: 'HTTP 方法', type: 'string', required: true, enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
      { name: 'headers', description: '请求头', type: 'object', required: false, default: {} },
      { name: 'body', description: '请求体', type: 'object', required: false }
    ],
    code: `// HTTP 请求工具
async function execute(params) {
  const { url, method, headers, body } = params;
  // 发送请求逻辑
  return { success: true, status: 200, data: {} };
}`,
    created_at: '2026-02-03T11:00:00Z',
    updated_at: '2026-02-06T10:15:00Z'
  }
];
