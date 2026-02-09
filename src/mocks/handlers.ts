import { http, HttpResponse } from 'msw'
import { mockUser } from './mockUser'

// Mock 工具数据
const mockTools = [
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
]

export const handlers = [
  // Login handler
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email?: string; password?: string }

    // 模拟任意邮箱密码登录成功
    if (body.email && body.password) {
      const token = 'mock_access_token_' + Date.now()
      return HttpResponse.json({
        success: true,
        data: {
          access_token: token,
          refresh_token: 'mock_refresh_token_' + Date.now(),
          token_type: 'Bearer'
        }
      })
    }

    return HttpResponse.json(
      { success: false, error: '邮箱和密码不能为空' },
      { status: 400 }
    )
  }),

  // Register handler
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      success: true,
      data: {
        ...mockUser,
        id: Math.floor(Math.random() * 1000),
        username: body.username || 'new_user',
        email: body.email || 'new@example.com'
      }
    })
  }),

  // Get current user handler
  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      success: true,
      data: mockUser
    })
  }),

  // Refresh token handler
  http.post('/api/auth/refresh', async ({ request }) => {
    const body = await request.json()
    if (body.refresh_token) {
      return HttpResponse.json({
        success: true,
        data: {
          access_token: 'mock_refreshed_token_' + Date.now(),
          refresh_token: body.refresh_token,
          token_type: 'Bearer'
        }
      })
    }
    return HttpResponse.json(
      { success: false, error: 'Invalid refresh token' },
      { status: 401 }
    )
  }),

  // ========== Tool Handlers ==========

  // Get tools list
  http.get('/api/tools', () => {
    return HttpResponse.json({
      success: true,
      data: mockTools
    })
  }),

  // Get single tool (使用查询参数)
  http.get('/api/tool', ({ request }) => {
    const url = new URL(request.url)
    const id = parseInt(url.searchParams.get('id') || '0')
    const tool = mockTools.find(t => t.id === id)
    if (tool) {
      return HttpResponse.json({ success: true, data: tool })
    }
    return HttpResponse.json({ success: false, error: 'Tool not found' }, { status: 404 })
  }),

  // Create tool
  http.post('/api/tools', async ({ request }) => {
    const body = await request.json()
    const newTool = {
      ...body,
      id: Math.max(...mockTools.map(t => t.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    mockTools.push(newTool)
    return HttpResponse.json({ success: true, message: 'Tool created', data: newTool })
  }),

  // Update tool (使用查询参数)
  http.put('/api/tool', async ({ request }) => {
    const url = new URL(request.url)
    const id = parseInt(url.searchParams.get('id') || '0')
    const body = await request.json()
    const index = mockTools.findIndex(t => t.id === id)
    if (index !== -1) {
      mockTools[index] = { ...mockTools[index], ...body, updated_at: new Date().toISOString() }
      return HttpResponse.json({ success: true, message: 'Tool updated', data: mockTools[index] })
    }
    return HttpResponse.json({ success: false, error: 'Tool not found' }, { status: 404 })
  }),

  // Delete tool (使用查询参数)
  http.delete('/api/tool', ({ request }) => {
    const url = new URL(request.url)
    const id = parseInt(url.searchParams.get('id') || '0')
    const index = mockTools.findIndex(t => t.id === id)
    if (index !== -1) {
      mockTools.splice(index, 1)
      return HttpResponse.json({ success: true, message: 'Tool deleted' })
    }
    return HttpResponse.json({ success: false, error: 'Tool not found' }, { status: 404 })
  }),

  // Import tools
  http.post('/api/tools/import', async ({ request }) => {
    const body = await request.json()
    const { tools } = body as { tools: typeof mockTools }
    const newTools = tools.map((t, i) => ({
      ...t,
      id: Math.max(...mockTools.map(tool => tool.id), 0) + i + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
    mockTools.push(...newTools)
    return HttpResponse.json({ success: true, message: `${newTools.length} tools imported`, data: newTools })
  }),

  // Get inheritable tools (二级路由)
  http.get('/api/tools/inheritable', () => {
    return HttpResponse.json({
      success: true,
      data: mockTools.filter((t: any) => t.is_active)
    })
  }),

  // Execute tool (使用查询参数)
  http.post('/api/tool/execute', async ({ request }) => {
    const url = new URL(request.url)
    const id = parseInt(url.searchParams.get('id') || '0')
    // 模拟工具执行
    return HttpResponse.json({
      success: true,
      data: { result: 'Mock execution result', execution_time: '0.023s' }
    })
  })
]
