<script setup lang="ts">

defineProps<{
  title: string;
  isOpen: boolean;
  confirmText?: string;
  cancelText?: string;
  type?: 'default' | 'danger';
}>();

const emit = defineEmits(['close', 'confirm']);
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click="$emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-body">
        <slot></slot>
      </div>
      <div class="modal-footer">
        <button class="btn secondary" @click="$emit('close')">{{ cancelText || 'Cancel' }}</button>
        <button
          class="btn primary"
          :class="type"
          @click="$emit('confirm')"
        >
          {{ confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal {
  background-color: var(--bg-card, #1c2128);
  border: 1px solid var(--border-primary, #30363d);
  border-radius: var(--border-radius-lg, 8px);
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  animation: scaleUp 0.2s ease;
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-primary, #30363d);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary, #ffffff);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary, #8b949e);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-primary, #ffffff);
}

.modal-body {
  padding: 24px;
  color: var(--text-primary, #ffffff);
  font-size: 0.95rem;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-primary, #30363d);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: var(--border-radius-md, 6px);
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color 0.2s ease;
}

.btn.secondary {
  background-color: transparent;
  border-color: var(--border-primary, #30363d);
  color: var(--text-secondary, #8b949e);
}

.btn.secondary:hover {
  background-color: var(--bg-card-hover, rgba(255, 255, 255, 0.1));
  color: var(--text-primary, #ffffff);
}

.btn.primary {
  background-color: var(--accent-blue, #2f81f7);
  color: #ffffff;
}

.btn.primary:hover {
  background-color: var(--accent-blue-hover, #58a6ff);
}

.btn.primary.danger {
  background-color: var(--accent-red, #da3633);
}

.btn.primary.danger:hover {
  background-color: #f85149;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
