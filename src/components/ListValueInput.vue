<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  modelValue?: (string | number | boolean | object | null)[];
}

interface Emits {
  (e: 'update:modelValue', value: (string | number | boolean | object | null)[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const componentId = Math.random().toString(36).substr(2, 9);
const internalItems = ref<string[]>(['']);

const initializeItems = (value: any) => {
  if (Array.isArray(value)) {
    internalItems.value = value.map((v) => {
      if (typeof v === 'string') return v;
      return JSON.stringify(v);
    });
    if (internalItems.value.length === 0) {
      internalItems.value.push('');
    }
  } else {
    internalItems.value = [''];
  }
};

watch(
  () => props.modelValue,
  (newValue) => {
    const currentArray = [...internalItems.value];
    if (JSON.stringify(newValue) !== JSON.stringify(currentArray)) {
      initializeItems(newValue);
    }
  },
  { immediate: true, deep: true }
);

const emitChange = () => {
  const result = internalItems.value.map((v) => {
    if (!v || v.trim() === '') return '';
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  });
  emit('update:modelValue', result);
};

const addItem = () => {
  internalItems.value.push('');
  emitChange();
};

const removeItem = (index: number) => {
  internalItems.value.splice(index, 1);
  emitChange();
};
</script>

<template>
  <div class="list-input-container">
    <div class="list-items">
      <div
        v-for="(item, index) in internalItems"
        :key="`item-${componentId}-${index}`"
        class="list-item"
      >
        <input
          v-model="internalItems[index]"
          @input="emitChange"
          placeholder="值（支持 JSON）"
          class="list-item-input"
        />
        <button
          type="button"
          class="list-item-remove"
          @click="removeItem(index)"
          title="删除"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
    <button type="button" class="add-list-item-btn" @click="addItem">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      添加元素
    </button>
  </div>
</template>

<style scoped>
.list-input-container {
  width: 100%;
}

.list-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 6px;
}

.list-item {
  display: flex;
  gap: 6px;
  align-items: center;
}

.list-item-input {
  flex: 1;
  min-width: 0;
  height: 32px;
  padding: 0 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-size: 13px;
  background: #ffffff;
  outline: none;
}

.list-item-input:focus {
  border-color: #007aff;
}

.list-item-remove {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8e8e93;
  flex-shrink: 0;
}

.list-item-remove:hover {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}

.add-list-item-btn {
  width: 100%;
  height: 32px;
  border: 1px dashed rgba(0, 122, 255, 0.4);
  border-radius: 6px;
  background: transparent;
  color: #007aff;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.15s ease;
}

.add-list-item-btn:hover {
  background: rgba(0, 122, 255, 0.05);
  border-color: #007aff;
}
</style>
