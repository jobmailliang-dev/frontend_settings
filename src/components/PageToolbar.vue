<script setup lang="ts">
// PageToolbar - 页面顶部工具栏组件
// 提供统一的工具栏布局：左侧导航/标题 + 右侧操作按钮
</script>

<template>
  <div class="page-toolbar">
    <div class="toolbar-left">
      <slot name="left">
        <!-- 左侧内容：导航图标、面包屑、标题等 -->
      </slot>
    </div>
    <div class="toolbar-right">
      <slot name="right">
        <!-- 右侧内容：操作按钮 -->
      </slot>
    </div>
  </div>
</template>

<style scoped>
.page-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 0;
  width: 100%;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
</style>
