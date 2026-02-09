<script setup lang="ts">
import { ref, watch } from 'vue';
import { useToolStore } from '@/stores/toolStore';

const store = useToolStore();
const searchInput = ref(store.filter.search || '');
const statusFilter = ref(store.filter.status || 'all');

watch([searchInput, statusFilter], () => {
  store.setFilter({
    search: searchInput.value,
    status: statusFilter.value as 'all' | 'active' | 'inactive',
  });
});

const clearFilter = () => {
  searchInput.value = '';
  statusFilter.value = 'all';
  store.clearFilter();
};
</script>

<template>
  <div class="tool-filter">
    <div class="search-box">
      <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
      <input
        v-model="searchInput"
        type="text"
        placeholder="搜索工具名称或描述..."
        class="search-input"
      />
      <button v-if="searchInput" class="clear-btn" @click="searchInput = ''">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M15 9l-6 6M9 9l6 6"/>
        </svg>
      </button>
    </div>

    <div class="filter-group">
      <button
        :class="['filter-btn', { active: statusFilter === 'all' }]"
        @click="statusFilter = 'all'"
      >
        全部
        <span class="count">{{ store.tools.length }}</span>
      </button>
      <button
        :class="['filter-btn', { active: statusFilter === 'active' }]"
        @click="statusFilter = 'active'"
      >
        活跃
        <span class="count">{{ store.activeToolsCount }}</span>
      </button>
      <button
        :class="['filter-btn', { active: statusFilter === 'inactive' }]"
        @click="statusFilter = 'inactive'"
      >
        停用
        <span class="count">{{ store.inactiveToolsCount }}</span>
      </button>
    </div>

    <div class="actions">
      <button class="manus-btn" @click="$emit('import')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        导入
      </button>
      <button class="manus-btn" @click="$emit('export')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        导出
      </button>
      <button class="manus-btn primary" @click="$emit('create')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        新建工具
      </button>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  emits: ['create', 'import', 'export'],
};
</script>

<style scoped>
.tool-filter {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 280px;
  max-width: 400px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #8e8e93;
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 40px 0 44px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 20px;
  font-size: 14px;
  background: #fafafa;
  color: #1a1a1a;
  outline: none;
  transition: all 0.2s ease;
}

.search-input::placeholder {
  color: #8e8e93;
}

.search-input:focus {
  background: #ffffff;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.clear-btn {
  position: absolute;
  right: 12px;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8e8e93;
  transition: all 0.15s ease;
}

.clear-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #37352f;
}

.filter-group {
  display: flex;
  gap: 6px;
  background: #f1f1f0;
  padding: 4px;
  border-radius: 10px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  color: #7e7d7a;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-btn:hover {
  color: #37352f;
}

.filter-btn.active {
  background: #ffffff;
  color: #1a1a1a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.filter-btn .count {
  font-size: 11px;
  padding: 1px 6px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 10px;
}

.filter-btn.active .count {
  background: #f1f1f0;
}

.actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.manus-btn.primary {
  background: #007aff;
  border-color: #007aff;
  color: #ffffff;
}

.manus-btn.primary:hover {
  background: #0066d6;
  border-color: #0066d6;
}

.manus-btn.primary .icon {
  color: #ffffff;
}

@media (max-width: 768px) {
  .tool-filter {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }

  .filter-group {
    order: 3;
  }

  .actions {
    order: 2;
    margin-left: 0;
    justify-content: flex-end;
  }
}
</style>
