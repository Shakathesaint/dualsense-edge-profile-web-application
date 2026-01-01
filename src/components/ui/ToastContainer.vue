<script setup lang="ts">
import { useToast } from '../../composables/useToast';
import ToastComponent from './Toast.vue';

const { toasts, remove } = useToast();
</script>

<template>
  <div class="toast-container">
    <transition-group name="list">
      <ToastComponent
        v-for="toast in toasts"
        :key="toast.id"
        :toast="toast"
        @close="remove(toast.id)"
      />
    </transition-group>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  pointer-events: none; /* Allow clicking through empty space */
}

.toast-container > * {
  pointer-events: auto; /* Re-enable pointer events for toasts */
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
