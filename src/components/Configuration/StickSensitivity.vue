<script setup lang="ts">
import {JoystickProfileId} from "../../enum/JoystickProfileId";
import Joystick from "../../model/Joystick";
import {PS5_JOYSTICK_CURVE} from "../../helper/bytesToProfile";
import {onMounted, ref, inject, onUnmounted} from "vue";
import type {Ref} from "vue";

const props = defineProps({
  leftJoystick: {
    type: Joystick,
    required: true,
  },
  rightJoystick: {
    type: Joystick,
    required: true,
  },
});

const leftJoystickRange = ref();
const leftStickCurveCanvas: Ref<HTMLCanvasElement | undefined> = ref();
const rightStickCurveCanvas: Ref<HTMLCanvasElement | undefined> = ref();
const rightJoystickRange = ref();

const edgeHIDController: Ref<HIDDevice> = inject('HIDController')!;

const getCurrentCurve = (joystick: Joystick): number => {
  let indexCurve: number;

  for (indexCurve = 0; indexCurve <= 10; indexCurve++) {
    let arrAdjustments = PS5_JOYSTICK_CURVE[joystick.getProfileId()].getAdjustments().map(curve => curve.getByIndex(indexCurve));
    if (arrAdjustments.toString() === joystick.getCurveValues().toString()) break;
  }

  return Math.min(indexCurve, 10); // Clamp to valid range
}

const changeJoyStickIndex = (joystick: Joystick, event: Event) => {
  const sliderValue = Number((event.target as HTMLInputElement).value);
  joystick.setCurveValues(PS5_JOYSTICK_CURVE[joystick.getProfileId()].getAdjustments().map(curve => curve.getByIndex(sliderValue)));
}

const drawCurve = (ctx: CanvasRenderingContext2D, joystick: Joystick, testProgress: number) => {

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const rows = 4;
  const cols = 4;

  const cellWidth = ctx.canvas.width / cols;
  const cellHeight = ctx.canvas.height / rows;

  // Grid color for dark theme
  ctx.strokeStyle = '#8b949e';
  ctx.lineWidth = 0.1;

  // Draw the grid
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = i * cellWidth;
      const y = j * cellHeight;
      ctx.strokeRect(x, y, cellWidth, cellHeight);
    }
  }

  // Curve line color for dark theme
  ctx.strokeStyle = '#f0f6fc';
  ctx.beginPath();
  ctx.moveTo(0, ctx.canvas.height);
  ctx.lineWidth = 2;

  for (let i = 0; i < joystick.getModifier() - 1; i++) {
    ctx.lineTo((joystick.getCurveValues()[i + i] / 255) * ctx.canvas.width, ctx.canvas.height - (joystick.getCurveValues()[i+i+1] / 255) * ctx.canvas.height);
  }
  ctx.lineTo(ctx.canvas.width,0);
  ctx.stroke();
  ctx.closePath();

  // Progress overlay - PlayStation blue
  ctx.beginPath();
  ctx.fillStyle = 'rgba(0, 112, 209, 0.3)';
  ctx.fillRect(0, 0, (testProgress * 2 / 255) * ctx.canvas.width, ctx.canvas.height);
  ctx.stroke();
  ctx.closePath();
}

const readInput = (e: any) => {
  const inputStream = new Uint8Array(e.data.buffer);
  let maxInputLeft = Math.max(inputStream[0], inputStream[1]) - 128;
  let maxInputRight = Math.max(inputStream[2], inputStream[3]) - 128;
  drawCurve(leftStickCurveCanvas.value!.getContext('2d')!, props.leftJoystick, maxInputLeft);
  drawCurve(rightStickCurveCanvas.value!.getContext('2d')!, props.rightJoystick, maxInputRight);
}

onMounted(() => {
  edgeHIDController.value.addEventListener('inputreport', readInput);
});

onUnmounted(() => {
  edgeHIDController.value.removeEventListener('inputreport', readInput);
});

</script>
<template>
  <section>
    <span class="note">
      Note: Changing curve values will not be applied immediately.
      Save your changes first in order to test them.
    </span>
    <span class="note">
      Before testing, make sure your controller is set to the right profile using FN + ACTION button.
    </span>
    <h3>Left stick</h3>
    <div class="canvasContainer">
      <canvas ref="leftStickCurveCanvas" class="curve"></canvas>
    </div>
    <div class="controls-row">
      <select
          v-bind:value="leftJoystick.getProfileId()"
          @change="(e: any) => {
            leftJoystick.setProfileId(e.target.value);
            leftJoystick.setModifier(PS5_JOYSTICK_CURVE[e.target.value].getModifier());
            leftJoystick.setCurveValues(PS5_JOYSTICK_CURVE[leftJoystick.getProfileId()].getAdjustments().map(curve => curve.getByIndex(5)));
            leftJoystickRange.disabled = Number(leftJoystick.getProfileId()) === JoystickProfileId.DEFAULT
        }"
      >
        <option :value="JoystickProfileId.DEFAULT">
          Default
        </option>
        <option :value="JoystickProfileId.QUICK">
          Quick
        </option>
        <option :value="JoystickProfileId.PRECISE">
          Precise
        </option>
        <option :value="JoystickProfileId.STEADY">
          Steady
        </option>
        <option :value="JoystickProfileId.DIGITAL">
          Digital
        </option>
        <option :value="JoystickProfileId.DYNAMIC">
          Dynamic
        </option>
      </select>
      <div class="slider-container">
        <input type="range"
               @input="e => changeJoyStickIndex(leftJoystick, e)"
               :value="getCurrentCurve(leftJoystick)"
               min="0"
               max="10"
               :disabled="leftJoystick.getProfileId() === JoystickProfileId.DEFAULT"
               ref="leftJoystickRange"
        >
        <span class="value-label">{{ (getCurrentCurve(leftJoystick) - 5) > 0 ? '+' : '' }}{{ getCurrentCurve(leftJoystick) - 5 }}</span>
      </div>
    </div>
  </section>
  <section>
    <h3>Right stick</h3>
    <div class="canvasContainer">
      <canvas ref="rightStickCurveCanvas" class="curve"></canvas>
    </div>
    <div class="controls-row">
      <select
          v-bind:value="rightJoystick.getProfileId()"
          @change="(e: any) => {
            rightJoystick.setProfileId(e.target.value);
            rightJoystick.setModifier(PS5_JOYSTICK_CURVE[e.target.value].getModifier());
            rightJoystick.setCurveValues(PS5_JOYSTICK_CURVE[rightJoystick.getProfileId()].getAdjustments().map(curve => curve.getByIndex(5)));
            rightJoystickRange.disabled = Number(rightJoystick.getProfileId()) === JoystickProfileId.DEFAULT
        }"
      >
        <option :value="JoystickProfileId.DEFAULT">
          Default
        </option>
        <option :value="JoystickProfileId.QUICK">
          Quick
        </option>
        <option :value="JoystickProfileId.PRECISE">
          Precise
        </option>
        <option :value="JoystickProfileId.STEADY">
          Steady
        </option>
        <option :value="JoystickProfileId.DIGITAL">
          Digital
        </option>
        <option :value="JoystickProfileId.DYNAMIC">
          Dynamic
        </option>
      </select>
      <div class="slider-container">
        <input type="range"
               @input="(e: any) => changeJoyStickIndex(rightJoystick, e)"
               :value="getCurrentCurve(rightJoystick)"
               min="0"
               max="10"
               :disabled="rightJoystick.getProfileId() === JoystickProfileId.DEFAULT"
               ref="rightJoystickRange"
        >
        <span class="value-label">{{ (getCurrentCurve(rightJoystick) - 5) > 0 ? '+' : '' }}{{ getCurrentCurve(rightJoystick) - 5 }}</span>
      </div>
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
  margin-bottom: 16px;
  padding: 12px 16px;
  background-color: rgba(210, 153, 34, 0.1);
  border: 1px solid rgba(210, 153, 34, 0.3);
  border-radius: var(--border-radius-sm);
  color: var(--accent-orange);
  font-size: 0.85rem;
}

.canvasContainer {
  width: 520px;
  max-width: 100%;
  height: 255px;
  resize: both;
  overflow: hidden;
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius-md);
  background-color: var(--bg-input);
  margin-bottom: 16px;
}

.curve {
  width: 100%;
  height: 100%;
  display: block;
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.value-label {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 500;
  min-width: 24px;
}

select {
  background-color: var(--bg-input);
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius-sm);
  color: var(--text-primary);
  padding: 8px 12px;
  font-size: 0.9rem;
  min-width: 120px;
}

select:focus {
  outline: none;
  border-color: var(--border-focus);
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

input[type="range"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input[type="range"]:disabled::-webkit-slider-thumb {
  cursor: not-allowed;
}
</style>