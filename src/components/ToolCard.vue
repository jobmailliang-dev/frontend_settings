<script setup lang="ts">
import { computed } from 'vue';
import type { ToolConfig } from '@/types/tool';

interface Props {
  tool: ToolConfig;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  test: [tool: ToolConfig];
  edit: [tool: ToolConfig];
  duplicate: [tool: ToolConfig];
  delete: [tool: ToolConfig];
}>();

const statusText = computed(() => props.tool.is_active ? '活跃' : '停用');
const statusClass = computed(() => props.tool.is_active ? 'status-active' : 'status-inactive');
</script>

<template>
  <div class="tool-card">
    <div class="tool-header">
      <div class="tool-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </div>
      <div class="tool-title">
        <h3>{{ tool.name }}</h3>
        <span :class="['status-tag', statusClass]">{{ statusText }}</span>
      </div>
    </div>

    <p class="tool-description">{{ tool.description }}</p>

    <div class="tool-meta">
      <span v-if="tool.parameters?.length" class="meta-item">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {{ tool.parameters.length }} 个参数
      </span>
      <span v-if="tool.inherit_from" class="meta-item">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="8.5" cy="7" r="4"/>
          <polyline points="17 11 19 13 23 9"/>
        </svg>
        继承: {{ tool.inherit_from }}
      </span>
    </div>

    <div class="tool-actions">
      <button class="icon-btn" @click="emit('test', tool)" title="测试">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      </button>
      <button class="icon-btn" @click="emit('edit', tool)" title="编辑">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="icon-btn" @click="emit('duplicate', tool)" title="复制">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
      <button class="icon-btn btn-danger" @click="emit('delete', tool)" title="删除">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.tool-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.tool-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.12);
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.tool-icon {
  width: 36px;
  height: 36px;
  background: #f1f1f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #37352f;
}

.tool-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-title h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.status-tag {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 10px;
}

.status-active {
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
}

.status-inactive {
  background: rgba(142, 142, 147, 0.15);
  color: #8e8e93;
}

.tool-description {
  font-size: 13px;
  color: #7e7d7a;
  line-height: 1.5;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tool-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #858481;
}

.tool-actions {
  display: flex;
  gap: 6px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f8f8f7;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7e7d7a;
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: #f1f1f0;
  color: #37352f;
}

.icon-btn.btn-danger:hover {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}
</style>
