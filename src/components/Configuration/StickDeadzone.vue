<script setup lang="ts">
import StickDeadzoneModel from "../../model/StickDeadzone.ts";
import {byteToPercent, percentToByte} from "../../helper/converters";

const props = defineProps({
  leftStickDeadzone: {
    type: StickDeadzoneModel,
    required: true,
  },
  rightStickDeadzone: {
    type: StickDeadzoneModel,
    required: true,
  },
});

const onLeftChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const percent = Number(target.value);
  props.leftStickDeadzone.setValue(percentToByte(percent));
};

const onRightChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const percent = Number(target.value);
  props.rightStickDeadzone.setValue(percentToByte(percent));
};
</script>
<template>
  <section>
    <span class="note">
      Deadzone is the range you can tilt the stick before input is recognized.
      A higher value helps compensate for stick drift.
    </span>
    <h3>Left stick</h3>
    <div class="deadzone-control">
      <input
        type="range"
        :value="byteToPercent(leftStickDeadzone.getValue())"
        @input="onLeftChange"
        min="0"
        max="30"
      >
      <span class="value-label">{{ byteToPercent(leftStickDeadzone.getValue()) }}%</span>
    </div>
  </section>
  <section>
    <h3>Right stick</h3>
    <div class="deadzone-control">
      <input
        type="range"
        :value="byteToPercent(rightStickDeadzone.getValue())"
        @input="onRightChange"
        min="0"
        max="30"
      >
      <span class="value-label">{{ byteToPercent(rightStickDeadzone.getValue()) }}%</span>
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

.note {
  display: block;
  margin-bottom: 24px;
  padding: 12px 16px 12px 14px;
  background-color: rgba(139, 148, 158, 0.08);
  border: 1px solid rgba(139, 148, 158, 0.2);
  border-left: 3px solid var(--text-muted);
  border-radius: var(--border-radius-sm);
  color: var(--text-secondary);
  font-size: 0.85rem;
  line-height: 1.5;
}

.deadzone-control {
  display: flex;
  align-items: center;
  gap: 16px;
}

.value-label {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 500;
  min-width: 40px;
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
