<script setup lang="ts">
import { Toast } from '../../composables/useToast';

defineProps<{
  toast: Toast;
}>();

defineEmits(['close']);

</script>

<template>
  <div class="toast" :class="toast.type" @click="$emit('close')">
    <div class="message">{{ toast.message }}</div>
    <button class="close-btn">&times;</button>
  </div>
</template>

<style scoped>
.toast {
  padding: 12px 16px;
  border-radius: var(--border-radius-md, 6px);
  background-color: var(--bg-card, #1c2128);
  color: var(--text-primary, #ffffff);
  border: 1px solid var(--border-primary, #30363d);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 300px;
  max-width: 400px;
  cursor: pointer;
  animation: slideIn 0.3s ease;
  margin-bottom: 10px;
  border-left: 4px solid;
}

.toast.success {
  border-left-color: #2da44e; /* Green */
}

.toast.error {
  border-left-color: #cf222e; /* Red */
}

.toast.info {
  border-left-color: #0969da; /* Blue */
}

.toast.warning {
  border-left-color: #d29922; /* Yellow */
}

.message {
  font-size: 0.9rem;
  line-height: 1.4;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary, #8b949e);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.close-btn:hover {
  color: var(--text-primary, #ffffff);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
