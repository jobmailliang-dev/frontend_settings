import { http, HttpResponse } from 'msw'
import { mockTools } from '../data/mockTools'

/**
 * Tool 相关的 Mock Handlers
 * 用于 MSW Mock 服务模拟工具管理 API
 */

// ========== Tool Handlers ==========

export const toolHandlers = [
  // Get tools list
  http.get('/api/tools', () => {
    return HttpResponse.json({
      success: true,
      data: mockTools
    })
  }),

  // Get single tool (使用查询参数)
  http.get('/api/tools', ({ request }) => {
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
    const body = await request.json() as Record<string, any>
    const newTool = {
      ...body,
      id: Math.max(...mockTools.map(t => t.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as any
    mockTools.push(newTool)
    return HttpResponse.json({ success: true, message: 'Tool created', data: newTool })
  }),

  // Update tool (使用查询参数)
  http.put('/api/tools', async ({ request }) => {
    const url = new URL(request.url)
    const id = parseInt(url.searchParams.get('id') || '0')
    const body = await request.json() as Record<string, any>
    const index = mockTools.findIndex(t => t.id === id)
    if (index !== -1) {
      mockTools[index] = { ...mockTools[index], ...body, updated_at: new Date().toISOString() }
      return HttpResponse.json({ success: true, message: 'Tool updated', data: mockTools[index] })
    }
    return HttpResponse.json({ success: false, error: 'Tool not found' }, { status: 404 })
  }),

  // Delete tool (使用查询参数)
  http.delete('/api/tools', ({ request }) => {
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

  // Toggle tool active status (切换启用状态)
  http.put('/api/tools/active', async ({ request }) => {
    const url = new URL(request.url)
    const id = parseInt(url.searchParams.get('id') || '0')
    const body = await request.json() as { is_active: boolean }
    const index = mockTools.findIndex(t => t.id === id)
    if (index !== -1) {
      mockTools[index] = { ...mockTools[index], is_active: body.is_active, updated_at: new Date().toISOString() }
      return HttpResponse.json({ success: true, message: body.is_active ? '已启用' : '已停用', data: mockTools[index] })
    }
    return HttpResponse.json({ success: false, error: 'Tool not found' }, { status: 404 })
  }),

  // Execute tool (使用查询参数)
  http.post('/api/tools/execute', async ({ request }) => {
    const url = new URL(request.url)
    const id = parseInt(url.searchParams.get('id') || '0')
    // 模拟工具执行
    return HttpResponse.json({
      success: true,
      data: { result: 'Mock execution result', execution_time: '0.023s' }
    })
  })
]
