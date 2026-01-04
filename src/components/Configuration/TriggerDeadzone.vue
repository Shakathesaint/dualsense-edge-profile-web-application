<script setup lang="ts">
import Trigger from "../../model/Trigger.ts";
import {byteToPercent} from "../../helper/converters";

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
      <input type="range" :value="leftTrigger.getMin()" @input="(e: any) => leftTrigger.setMin(e.target.value)" min="0" max="255">
      <span class="value-label">{{ byteToPercent(leftTrigger.getMin()) }}</span>
    </div>
    <div class="control-row">
      <span class="label">Max:</span>
      <input type="range" :value="leftTrigger.getMax()" @input="(e: any) => leftTrigger.setMax(e.target.value)" min="0" max="255">
      <span class="value-label">{{ byteToPercent(leftTrigger.getMax()) }}</span>
    </div>
  </section>
  <section>
    <h3>Right trigger</h3>
    <div class="control-row">
      <span class="label">Min:</span>
      <input type="range" :value="rightTrigger.getMin()" @input="(e: any) => rightTrigger.setMin(e.target.value)" min="0" max="255">
      <span class="value-label">{{ byteToPercent(rightTrigger.getMin()) }}</span>
    </div>
    <div class="control-row">
      <span class="label">Max:</span>
      <input type="range" :value="rightTrigger.getMax()" @input="(e: any) => rightTrigger.setMax(e.target.value)" min="0" max="255">
      <span class="value-label">{{ byteToPercent(rightTrigger.getMax()) }}</span>
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
  background: linear-gradient(90deg, var(--bg-secondary) 0%, var(--bg-card-hover) 100%);
  border-radius: 3px;
  outline: none;
  transition: background var(--transition-base);
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: var(--accent-blue);
  border-radius: 50%;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: 0 2px 6px rgba(0, 112, 209, 0.3);
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 10px rgba(0, 112, 209, 0.4);
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