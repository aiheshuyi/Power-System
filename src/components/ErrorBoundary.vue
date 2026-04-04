<template>
  <div v-if="hasError" style="padding: 40px 20px; text-align: center; background: #f5f5f5; min-height: 400px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
    <div style="background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 500px;">
      <h2 style="color: #ff4d4f; margin-bottom: 16px;">应用出现错误</h2>
      <p style="color: #666; margin-bottom: 20px;">抱歉，应用遇到了一个错误：</p>
      <div style="background: #f5f5f5; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-family: monospace; font-size: 12px; color: #ff4d4f; word-break: break-all;">
        {{ errorMessage || '未知错误' }}
      </div>
      <button
        @click="refreshPage"
        style="background: #1890ff; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;"
      >
        刷新页面
      </button>
    </div>
  </div>

  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';

const hasError = ref(false);
const errorMessage = ref<string>('');

function refreshPage() {
  window.location.reload();
}

onErrorCaptured((err) => {
  hasError.value = true;
  errorMessage.value = err instanceof Error ? err.message : String(err);
  // Return true to mark the error as handled.
  return true;
});
</script>

