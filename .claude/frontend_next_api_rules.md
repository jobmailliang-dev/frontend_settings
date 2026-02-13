# Claude Code Rules for frontend_settings

## API Path Rules for Tools

When working with tool management APIs, follow these rules:

### 1. Path Pattern

All tool APIs use the base path `/tools` with HTTP method + query parameter distinction:

| Operation | MSW Path | Frontend Code |
|-----------|----------|---------------|
| List | `GET /api/tools` | `${API_BASE}` |
| Get | `GET /api/tools?id={id}` | `${API_BASE}?id=${id}` |
| Create | `POST /api/tools` | `${API_BASE}` |
| Update | `PUT /api/tools?id={id}` | `${API_BASE}?id=${id}` |
| Delete | `DELETE /api/tools?id={id}` | `${API_BASE}?id=${id}` |
| Import | `POST /api/tools/import` | `${API_BASE}/import` |
| Export | `GET /api/tools/export` | `${API_BASE}/export` |
| Inheritable | `GET /api/tools/inheritable` | `${API_BASE}/inheritable` |
| Execute | `POST /api/tools/execute?id={id}` | `${API_BASE}/execute?id=${id}` |

### 2. Never Use Path Parameters

**WRONG**: `/api/tools/:id` or `/tools/:id`
**RIGHT**: `/api/tools?id={id}` or `/tools?id={id}`

Path parameters like `/tools/:id` cause MSW matching conflicts.

### 3. Frontend Code Template

```typescript
// api/toolConfig.ts
const API_BASE = '/tools';

// Collection operations - no query param needed
export async function getTools(): Promise<ToolConfig[]> {
  const response = await request.get<ApiResponse<ToolConfig[]>>(API_BASE);
  return response.data.data || [];
}

// Single resource operations - MUST include ?id={id}
export async function getTool(id: number): Promise<ToolConfig | null> {
  const response = await request.get<ApiResponse<ToolConfig>>(`${API_BASE}?id=${id}`);
  return response.data.data || null;
}

export async function updateTool(id: number, tool: Partial<ToolConfig>): Promise<ToolOperationResult> {
  const response = await request.put<ApiResponse<ToolConfig>>(`${API_BASE}?id=${id}`, tool);
  // ...
}

export async function deleteTool(id: number): Promise<ToolOperationResult> {
  const response = await request.delete<ApiResponse<null>>(`${API_BASE}?id=${id}`);
  // ...
}

// Secondary routes - direct concatenation
export async function getInheritableTools(): Promise<ToolConfig[]> {
  const response = await request.get<ApiResponse<ToolConfig[]>>(`${API_BASE}/inheritable`);
  return response.data.data || [];
}

export async function executeTool(toolId: number, params: Record<string, any>): Promise<ToolExecuteResponse> {
  const response = await request.post<ApiResponse<ToolExecuteResponse>>(`${API_BASE}/execute?id=${toolId}`, params);
  return response.data.data;
}
```

### 4. Response Format

All API responses must be wrapped:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
```

### 5. MSW Handler Template

```typescript
// handlers.ts
import { http, HttpResponse } from 'msw';

// List
http.get('/api/tools', () => {
  return HttpResponse.json({ success: true, data: mockTools })
}),

// Get single (with query param parsing)
http.get('/api/tools', ({ request }) => {
  const url = new URL(request.url)
  const id = parseInt(url.searchParams.get('id') || '0')
  const tool = mockTools.find(t => t.id === id)
  if (tool) {
    return HttpResponse.json({ success: true, data: tool })
  }
  return HttpResponse.json({ success: false, error: 'Tool not found' }, { status: 404 })
}),

// Update (PUT with query param)
http.put('/api/tools', async ({ request }) => {
  const url = new URL(request.url)
  const id = parseInt(url.searchParams.get('id') || '0')
  const body = await request.json()
  // Update logic...
  return HttpResponse.json({ success: true, message: 'Tool updated', data: updatedTool })
}),

// Delete (DELETE with query param)
http.delete('/api/tools', ({ request }) => {
  const url = new URL(request.url)
  const id = parseInt(url.searchParams.get('id') || '0')
  // Delete logic...
  return HttpResponse.json({ success: true, message: 'Tool deleted' })
}),

// Secondary routes
http.get('/api/tools/inheritable', () => {
  return HttpResponse.json({ success: true, data: mockTools.filter(t => t.is_active) })
}),

http.post('/api/tools/execute', async ({ request }) => {
  const url = new URL(request.url)
  const id = parseInt(url.searchParams.get('id') || '0')
  return HttpResponse.json({ success: true, data: { result: 'Mock result' } })
})
```

### 6. Key Takeaways

1. Always use `/tools` as base path
2. Single resource operations use `?id={id}` query parameter
3. Secondary routes: `/import`, `/export`, `/inheritable`, `/execute`
4. MSW handlers for single resource share the same path `/api/tools`
5. Parse query parameters in MSW handlers using `new URL(request.url)`
