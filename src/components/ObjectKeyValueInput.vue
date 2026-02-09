<script setup lang="ts">
import { ref, watch } from 'vue';

interface KeyValueItem {
  key: string;
  value: string;
}

interface Props {
  modelValue?: Record<string, any> | KeyValueItem[];
}

interface Emits {
  (e: 'update:modelValue', value: KeyValueItem[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const componentId = Math.random().toString(36).substr(2, 9);
const internalItems = ref<KeyValueItem[]>([{ key: '', value: '' }]);

const initializeItems = (value: any) => {
  if (Array.isArray(value)) {
    internalItems.value = [...value];
    if (internalItems.value.length === 0) {
      internalItems.value.push({ key: '', value: '' });
    }
  } else if (value && typeof value === 'object' && Object.keys(value).length > 0) {
    internalItems.value = Object.entries(value).map(([key, val]) => ({
      key,
      value: typeof val === 'string' ? val : JSON.stringify(val),
    }));
  } else {
    internalItems.value = [{ key: '', value: '' }];
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
  emit('update:modelValue', [...internalItems.value]);
};

const addItem = () => {
  internalItems.value.push({ key: '', value: '' });
  emitChange();
};

const removeItem = (index: number) => {
  internalItems.value.splice(index, 1);
  emitChange();
};
</script>

<template>
  <div class="object-input-container">
    <div class="object-items">
      <div
        v-for="(item, index) in internalItems"
        :key="`item-${componentId}-${index}`"
        class="object-item"
      >
        <input
          v-model="item.key"
          @input="emitChange"
          placeholder="键名"
          class="object-item-input"
        />
        <input
          v-model="item.value"
          @input="emitChange"
          placeholder="值"
          class="object-item-input"
        />
        <button
          type="button"
          class="object-item-remove"
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
    <button type="button" class="add-object-item-btn" @click="addItem">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      添加键值对
    </button>
  </div>
</template>

<style scoped>
.object-input-container {
  width: 200px;
}

.object-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 6px;
}

.object-item {
  display: flex;
  gap: 6px;
  align-items: center;
}

.object-item-input {
  width: 80px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-size: 12px;
  background: #ffffff;
  outline: none;
}

.object-item-input:focus {
  border-color: #007aff;
}

.object-item-remove {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8e8e93;
  flex-shrink: 0;
}

.object-item-remove:hover {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}

.add-object-item-btn {
  width: 100%;
  height: 28px;
  border: 1px dashed rgba(0, 122, 255, 0.4);
  border-radius: 4px;
  background: transparent;
  color: #007aff;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.15s ease;
}

.add-object-item-btn:hover {
  background: rgba(0, 122, 255, 0.05);
  border-color: #007aff;
}
</style>
