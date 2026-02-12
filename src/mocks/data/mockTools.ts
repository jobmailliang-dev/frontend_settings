import type { ToolConfig } from '@next/types/tool';

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
  },
  {
    id: 4,
    name: 'json_parser',
    description: 'JSON 解析工具，用于解析和验证 JSON 字符串',
    is_active: true,
    parameters: [
      { name: 'json', description: 'JSON 字符串', type: 'string', required: true },
      { name: 'strict', description: '严格模式', type: 'boolean', required: false, default: true }
    ],
    code: `// JSON 解析工具
function execute(params) {
  const { json: jsonStr, strict } = params;
  return { success: true, data: JSON.parse(jsonStr) };
}`,
    created_at: '2026-02-04T08:00:00Z',
    updated_at: '2026-02-05T12:00:00Z'
  },
  {
    id: 5,
    name: 'date_formatter',
    description: '日期格式化工具，支持多种日期格式转换',
    is_active: true,
    parameters: [
      { name: 'date', description: '日期字符串', type: 'string', required: true },
      { name: 'format', description: '输出格式', type: 'string', required: false, default: 'YYYY-MM-DD', enum: ['YYYY-MM-DD', 'YYYY/MM/DD', 'DD/MM/YYYY', 'MM/DD/YYYY'] }
    ],
    code: `// 日期格式化工具
function execute(params) {
  const { date, format } = params;
  return { success: true, result: date };
}`,
    created_at: '2026-02-05T10:00:00Z',
    updated_at: '2026-02-09T09:00:00Z'
  },
  {
    id: 6,
    name: 'csv_converter',
    description: 'CSV 文件转换工具，支持 CSV 与 JSON 互转',
    is_active: true,
    parameters: [
      { name: 'content', description: '文件内容', type: 'string', required: true },
      { name: 'delimiter', description: '分隔符', type: 'string', required: false, default: ',', enum: [',', ';', '\\t', '|'] }
    ],
    code: `// CSV 转换工具
function execute(params) {
  const { content, delimiter } = params;
  return { success: true, data: [] };
}`,
    created_at: '2026-02-06T14:00:00Z',
    updated_at: '2026-02-08T16:30:00Z'
  },
  {
    id: 7,
    name: 'image_processor',
    description: '图片处理工具，支持缩放、裁剪、格式转换',
    is_active: false,
    parameters: [
      { name: 'image_path', description: '图片路径', type: 'string', required: true },
      { name: 'operation', description: '操作类型', type: 'string', required: true, enum: ['resize', 'crop', 'rotate', 'convert'] },
      { name: 'quality', description: '质量', type: 'number', required: false, default: 80 }
    ],
    code: `// 图片处理工具
function execute(params) {
  const { image_path, operation, quality } = params;
  return { success: true, result: 'processed_image_path' };
}`,
    created_at: '2026-02-07T09:30:00Z',
    updated_at: '2026-02-09T11:00:00Z'
  },
  {
    id: 8,
    name: 'encrypt_decrypt',
    description: '加密解密工具，支持 AES、DES、RSA 等算法',
    is_active: true,
    parameters: [
      { name: 'text', description: '待处理文本', type: 'string', required: true },
      { name: 'algorithm', description: '加密算法', type: 'string', required: false, default: 'AES', enum: ['AES', 'DES', 'RSA'] },
      { name: 'action', description: '操作', type: 'string', required: true, enum: ['encrypt', 'decrypt'] }
    ],
    code: `// 加密解密工具
function execute(params) {
  const { text, algorithm, action } = params;
  return { success: true, result: 'processed_text' };
}`,
    created_at: '2026-02-08T11:00:00Z',
    updated_at: '2026-02-09T14:00:00Z'
  }
];
