<template>
  <div class="console-section" :class="{ minimized: isMinimized }" :style="{ height: isMinimized ? 'auto' : panelHeight }">
    <div class="console-header" @mousedown="startDrag">
      <div class="console-title">
        <el-icon><Document /></el-icon>
        控制台
        <span class="console-count">({{ logs.length }})</span>
      </div>
      <div class="console-controls" @click.stop>
        <el-button size="small" text @click="clearLogs">
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
        <el-button size="small" text @click="toggleMinimize">
          <el-icon>
            <Remove v-if="!isMinimized" />
            <Plus v-else />
          </el-icon>
        </el-button>
        <el-button size="small" text @click="close">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
    </div>
    <div ref="contentRef" class="console-content" v-show="!isMinimized" tabindex="0" @keydown="handleKeydown">
      <DynamicScroller
        ref="scrollerRef"
        v-if="logs.length > 0"
        :key="scrollerKey"
        class="virtual-scroller"
        :items="logsWithIds"
        :min-item-size="32"
        key-field="uniqueId"
        :buffer="300"
        :prerender="20"
        emit-update
        @scroll="handleScroll"
      >
        <template #default="{ item, index, active }">
          <DynamicScrollerItem
            :item="item"
            :active="active"
            :size-dependencies="[item.message, item.type]"
            :data-index="index"
            :ignore-resize="true"
            @click="selectLog(index)"
          >
            <div class="console-log" :class="[item.type, { selected: index === selectedIndex }]">
              <span class="log-timestamp">
                {{ formatTimestamp(item.timestamp) }}
              </span>
              <span class="log-type">[{{ item.type.toUpperCase() }}]</span>
              <span v-if="item.packageName" class="log-package">{{ item.packageName }}</span>
              <span class="log-message">{{ item.message }}</span>
            </div>
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>
      <div v-else class="console-empty">暂无日志</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from "vue";
import { Document, Delete, Remove, Close, Plus } from "@element-plus/icons-vue";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import "./Console.scss";

interface ConsoleLog {
  type: "log" | "error" | "warn" | "info";
  message: string;
  timestamp: Date;
  packageName?: string; // 可选的包名字段
}

interface Props {
  logs: ConsoleLog[];
  autoScroll?: boolean; // 是否自动滚动，默认为 false
}

const props = withDefaults(defineProps<Props>(), {
  autoScroll: false
});

const emit = defineEmits<{
  close: [];
  clear: [];
}>();

const scrollerRef = ref<InstanceType<typeof DynamicScroller>>();
const contentRef = ref<HTMLElement>();
const isMinimized = ref(false);
const scrollerKey = ref(0); // 用于强制重新渲染虚拟列表的 key

const selectedIndex = ref<number>(-1); // 选中的日志索引，-1 表示未选中

const panelHeight = ref<string>("300px");

// 为日志添加唯一 ID，避免虚拟列表 key 冲突
const logsWithIds = computed(() => {
  return props.logs.map((log, index) => ({
    ...log,
    uniqueId: `${log.timestamp.getTime()}-${index}` // 组合时间戳和索引作为唯一ID
  }));
});

// 缓存格式化结果，避免重复计算
const timestampCache = new Map<number, string>();
const formatTimestamp = (timestamp: Date) => {
  const time = timestamp.getTime();
  if (timestampCache.has(time)) {
    return timestampCache.get(time)!;
  }

  const hours = timestamp.getHours().toString().padStart(2, "0");
  const minutes = timestamp.getMinutes().toString().padStart(2, "0");
  const seconds = timestamp.getSeconds().toString().padStart(2, "0");
  const milliseconds = timestamp.getMilliseconds().toString().padStart(3, "0");
  const formatted = `${hours}:${minutes}:${seconds}.${milliseconds}`;

  // 限制缓存大小，避免内存泄漏
  if (timestampCache.size > 1000) {
    timestampCache.clear();
  }
  timestampCache.set(time, formatted);

  return formatted;
};

const clearLogs = () => {
  emit("clear");
};

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value;
};

const close = () => {
  emit("close");
};

// 键盘导航
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (selectedIndex.value > 0) {
      selectedIndex.value--;
      scrollToSelected();
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (selectedIndex.value < props.logs.length - 1) {
      selectedIndex.value++;
      scrollToSelected();
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    selectedIndex.value = -1; // 取消选中
  } else if (e.key === 'c' && (e.ctrlKey || e.metaKey) && selectedIndex.value >= 0) {
    e.preventDefault();
    // 复制选中的完整日志数据（包含所有字段）
    const selectedLog = props.logs[selectedIndex.value];
    if (selectedLog) {
      const copyData = {
        type: selectedLog.type,
        message: selectedLog.message,
        timestamp: selectedLog.timestamp.toISOString(),
        ...(selectedLog.packageName && { packageName: selectedLog.packageName })
      };
      navigator.clipboard.writeText(JSON.stringify(copyData, null, 2));
    }
  }
};

// 滚动到选中项
const scrollToSelected = () => {
  if (scrollerRef.value && selectedIndex.value >= 0) {
    nextTick(() => {
      scrollerRef.value?.scrollToItem(selectedIndex.value);
    });
  }
};

// 点击选中日志
const selectLog = (index: number) => {
  selectedIndex.value = index;
};

// 监听虚拟列表滚动事件，判断是否在底部
const handleScroll = (e: Event) => {
  if (!contentRef.value) return;
  const target = e.target as HTMLElement;
  const scrollTop = target.scrollTop;
  const scrollHeight = target.scrollHeight;
  const clientHeight = target.clientHeight;
};

// 拖拽调整高度
const isDragging = ref(false);

const startDrag = (e: MouseEvent) => {
  // 只在顶部边缘（header 的 ::before 区域）触发拖拽
  const headerRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const headerTop = headerRect.top;
  const triggerHeight = 8; // 触发拖拽的顶部区域高度

  // 检查鼠标是否在顶部触发区域内
  if (e.clientY - headerTop > triggerHeight) {
    // 不在拖拽区域，执行正常的点击行为（折叠/展开）
    return;
  }

  isDragging.value = true;
  const startY = e.clientY;
  const sectionElement = document.querySelector('.console-section') as HTMLElement;
  const startHeight = sectionElement?.offsetHeight || 300;

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (!isDragging.value) return;
    const deltaY = startY - moveEvent.clientY;
    const newHeight = Math.max(100, Math.min(1000, startHeight + deltaY));
    panelHeight.value = `${newHeight}px`;
  };

  const onMouseUp = () => {
    isDragging.value = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "";
    // 恢复过渡效果
    sectionElement?.classList.remove('dragging');
  };

  // 禁用过渡效果以获得流畅的拖拽体验
  sectionElement?.classList.add('dragging');
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
  document.body.style.cursor = "row-resize";
};

// 监听日志变化，自动滚动到底部
watch(
  () => props.logs,
  (newLogs) => {
      console.log(1111,props.autoScroll && scrollerRef.value)
    if (props.autoScroll && scrollerRef.value) {
      nextTick(() => {
        requestAnimationFrame(() => {
          console.log(1111,scrollerRef.value && props.autoScroll)
          if (scrollerRef.value && props.autoScroll) {
            // 使用虚拟滚动组件的 scrollToBottom 方法
            scrollerRef.value.scrollToBottom();
          }
        });
      });
    }
  },
  { deep: true }
);

// 暴露给父组件的方法
defineExpose({
  toggleMinimize,
  clearLogs,
  // 强制重新渲染虚拟列表，用于解决大数据量推送结束后滚动条卡死的问题
  refreshScroller: () => {
    scrollerKey.value++
    // 重新渲染后滚动到底部
    nextTick(() => {
      if (scrollerRef.value) {
        scrollerRef.value.scrollToBottom()
      }
    })
  }
});
</script>
