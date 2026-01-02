<script setup lang="ts">
import Trigger from "../../model/Trigger.ts";

defineProps({
  leftTrigger: {
    type: Trigger,
    required: true,
  },
  rightTrigger: {
    type: Trigger,
    required: true,
  },
});
</script>
<template>
  <section>
    <h3>Left trigger</h3>
    <div class="control-row">
      <span class="label">Min:</span>
      <input type="range" :value="leftTrigger.getMin()" @change="(e: any) => leftTrigger.setMin(e.target.value)" min="0" max="255">
      <span class="value-label">{{ Math.round(leftTrigger.getMin() * 100 / 255) }}</span>
    </div>
    <div class="control-row">
      <span class="label">Max:</span>
      <input type="range" :value="leftTrigger.getMax()" @change="(e: any) => leftTrigger.setMax(e.target.value)" min="0" max="255">
      <span class="value-label">{{ Math.round(leftTrigger.getMax() * 100 / 255) }}</span>
    </div>
  </section>
  <section>
    <h3>Right trigger</h3>
    <div class="control-row">
      <span class="label">Min:</span>
      <input type="range" :value="rightTrigger.getMin()" @change="(e: any) => rightTrigger.setMin(e.target.value)" min="0" max="255">
      <span class="value-label">{{ Math.round(rightTrigger.getMin() * 100 / 255) }}</span>
    </div>
    <div class="control-row">
      <span class="label">Max:</span>
      <input type="range" :value="rightTrigger.getMax()" @change="(e: any) => rightTrigger.setMax(e.target.value)" min="0" max="255">
      <span class="value-label">{{ Math.round(rightTrigger.getMax() * 100 / 255) }}</span>
    </div>
  </section>
</template>
<style scoped>
section {
  margin-bottom: 32px;
}

h3 {
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.label {
  width: 40px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.value-label {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 500;
  min-width: 30px;
}

input[type="range"] {
  width: 300px;
  max-width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--bg-card-hover);
  border-radius: 3px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: var(--accent-blue);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.1s ease;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: var(--accent-blue);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
</style>