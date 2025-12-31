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
    <p>Min:</p><input type="range" :value="leftTrigger.getMin()" @change="(e: any) => leftTrigger.setMin(e.target.value)" min="0" max="255">
    <p>Max:</p><input type="range" :value="leftTrigger.getMax()" @change="(e: any) => leftTrigger.setMax(e.target.value)" min="0" max="255">
  </section>
  <section>
    <h3>Right trigger</h3>
    <p>Min:</p><input type="range" :value="rightTrigger.getMin()" @change="(e: any) => rightTrigger.setMin(e.target.value)" min="0" max="255">
    <p>Max:</p><input type="range" :value="rightTrigger.getMax()" @change="(e: any) => rightTrigger.setMax(e.target.value)" min="0" max="255">
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

p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 12px 0 4px 0;
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