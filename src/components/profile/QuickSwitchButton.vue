<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  buttonType: 'square' | 'cross' | 'circle';
  disabled?: boolean;
  isSwapping?: boolean;
}>();

defineEmits(['click']);

const buttonIcon = computed(() => {
  const icons: Record<string, string> = {
    square: new URL('../../assets/buttons/square.svg', import.meta.url).href,
    cross: new URL('../../assets/buttons/cross.svg', import.meta.url).href,
    circle: new URL('../../assets/buttons/circle.svg', import.meta.url).href,
  };
  return icons[props.buttonType];
});

const buttonTitle = computed(() => {
  const titles: Record<string, string> = {
    square: 'Swap with Slot 2 (FN + Square)',
    cross: 'Swap with Slot 3 (FN + Cross)',
    circle: 'Swap with Slot 4 (FN + Circle)',
  };
  return props.disabled 
    ? 'Connect controller to enable swap' 
    : titles[props.buttonType];
});
</script>

<template>
  <button
    class="quick-switch-btn"
    :class="{ 'is-swapping': isSwapping }"
    :disabled="disabled"
    :title="buttonTitle"
    @click.stop="!isSwapping && !disabled && $emit('click')"
  >
    <img :src="buttonIcon" :alt="buttonType" class="btn-icon" />
  </button>
</template>

<style scoped>
.quick-switch-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  transition: all 0.2s ease;
}

.quick-switch-btn:hover:not(:disabled):not(.is-swapping) {
  background: rgba(0, 112, 209, 0.2);
  border-color: rgba(0, 112, 209, 0.4);
  box-shadow: 0 0 8px rgba(0, 112, 209, 0.4);
}

.quick-switch-btn:active:not(:disabled):not(.is-swapping) {
  transform: scale(0.95);
}

.quick-switch-btn.is-swapping {
  animation: buttonPulse 0.5s ease-in-out infinite;
  opacity: 1 !important;
  background: rgba(0, 112, 209, 0.3);
  box-shadow: 0 0 12px rgba(0, 112, 209, 0.6);
  pointer-events: none; /* Prevent clicks during animation */
  border-color: rgba(0, 112, 209, 0.5);
}

.quick-switch-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-icon {
  width: 16px;
  height: 16px;
  filter: invert(1) brightness(0.85);
}

@keyframes buttonPulse {
  0%, 100% { 
    transform: scale(1); 
    box-shadow: 0 0 8px rgba(0, 112, 209, 0.4);
  }
  50% { 
    transform: scale(1.2); 
    box-shadow: 0 0 16px rgba(0, 112, 209, 0.8);
  }
}
</style>
