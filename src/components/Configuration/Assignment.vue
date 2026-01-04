<script setup lang="ts">

import {computed, ref} from "vue";
import {Button, ButtonIndex} from "../../enum/Button";
import Profile from "../../model/Profile";
import {JoystickProfileId} from "../../enum/JoystickProfileId";
import {byteToPercent, getCurrentCurveIndex} from "../../helper/converters";

const props = defineProps({
  profile: {
    type: Profile,
    required: true,
  },
});

const buttonLabels = Object.keys(Button).filter(key => isNaN(Number(key)));

const select_popup = ref();

const selectedButtonOriginalValue = ref();
const selectedButtonAssignedValue = ref();

const updateButton = (e: Event) => {
  //@ts-ignore
  const element: any = e.target;

  const buttons = props.profile.getButtonMapping().getButtons();

  const value = Number(element.value);

  selectedButtonAssignedValue.value = value;
  buttons[selectedButtonOriginalValue.value] = value;

  props.profile.getButtonMapping().setButtons(buttons);
}

const scanSelected = (e: Event) => {

  const element: any = e.target;

  // Close popup if clicking on close button or the container background
  if (element.id === "select-popup-close" || element.id === "controller") {
    select_popup.value.style.display = "none";
    return;
  }

  // Ignore clicks inside the popup itself
  //@ts-ignore
  if (element.id === "select-popup" || element.parentElement?.id === "select-popup") {
    return;
  }

  // Only show popup if clicking on an interactable button element
  if (!element.classList.contains('interactable')) {
    select_popup.value.style.display = "none";
    return;
  }

  const original: number = Number(element.dataset.original);

  // Validate that we have a valid button index
  if (isNaN(original)) {
    return;
  }

  selectedButtonOriginalValue.value = original;

  selectedButtonAssignedValue.value = Number(Object.values(props.profile.getButtonMapping().getButtons())[original]);

  select_popup.value.style.display = "block";

  // Center popup over the controller image
  select_popup.value.style.left = '50%';
  select_popup.value.style.top = '360px';
  select_popup.value.style.transform = 'translateX(-50%)';
}

const getCurveName = (id: number) => {
  return JoystickProfileId[id] ? JoystickProfileId[id].charAt(0) + JoystickProfileId[id].slice(1).toLowerCase() : 'Custom';
}

const leftStickInfo = computed(() => {
  const stick = props.profile.getLeftJoyStick();
  const deadzone = props.profile.getLeftStickDeadzone().getValue();
  const curveName = getCurveName(stick.getProfileId());
  const isDefault = Number(stick.getProfileId()) === JoystickProfileId.DEFAULT;
  
  // Calculate modifier based on curve index (0-10 -> -5 to +5)
  // Only show modifier if not default (default is not adjustable)
  let curveDisplay = curveName;
  if (!isDefault) {
    const curveIndex = getCurrentCurveIndex(stick);
    const modifierVal = curveIndex - 5;
    const modifierStr = modifierVal > 0 ? `(+${modifierVal})` : `(${modifierVal})`;
    curveDisplay = `${curveName} ${modifierStr}`;
  }
  
  return {
    curve: curveDisplay,
    deadzone: `${byteToPercent(deadzone)}%`
  };
});

const rightStickInfo = computed(() => {
  const stick = props.profile.getRightJoyStick();
  const deadzone = props.profile.getRightStickDeadzone().getValue();
  const curveName = getCurveName(stick.getProfileId());
  const isDefault = Number(stick.getProfileId()) === JoystickProfileId.DEFAULT;
  
  // Only show modifier if not default (default is not adjustable)
  let curveDisplay = curveName;
  if (!isDefault) {
    const curveIndex = getCurrentCurveIndex(stick);
    const modifierVal = curveIndex - 5;
    const modifierStr = modifierVal > 0 ? `(+${modifierVal})` : `(${modifierVal})`;
    curveDisplay = `${curveName} ${modifierStr}`;
  }

  return {
    curve: curveDisplay,
    deadzone: `${byteToPercent(deadzone)}%`
  };
});

const leftTriggerInfo = computed(() => {
  const min = byteToPercent(props.profile.getLeftTrigger().getMin());
  const max = byteToPercent(props.profile.getLeftTrigger().getMax());
  return {
    range: `${min} - ${max}`
  };
});

const rightTriggerInfo = computed(() => {
  const min = byteToPercent(props.profile.getRightTrigger().getMin());
  const max = byteToPercent(props.profile.getRightTrigger().getMax());
  return {
    range: `${min} - ${max}`
  };
});

const getRemappedLabel = (index: number) => {
  const buttons = props.profile.getButtonMapping().getButtons();
  const assigned = buttons[index];
  if (assigned === index) return null;
  if (Button[assigned]) return Button[assigned];
  return null;
}

const leftRemaps = computed(() => {
    const list: { src: string; dest: string }[] = [];
    // Define Left side indices
    const leftIndices = [
        ButtonIndex.L1, ButtonIndex.L2, ButtonIndex.L3, 
        ButtonIndex.UP, ButtonIndex.DOWN, ButtonIndex.LEFT, ButtonIndex.RIGHT,
        ButtonIndex.PADDLE_LEFT 
    ];
    
    leftIndices.forEach(idx => {
        const label = getRemappedLabel(idx);
        if(label) {
            // Get original name. Convert ButtonIndex enum name to string
            let originalName = ButtonIndex[idx].replace('PADDLE_', 'P.').replace('_', ' '); 
            list.push({ src: originalName, dest: label });
        }
    });
    return list;
});

const rightRemaps = computed(() => {
    const list: { src: string; dest: string }[] = [];
    const rightIndices = [
        ButtonIndex.R1, ButtonIndex.R2, ButtonIndex.R3,
        ButtonIndex.TRIANGLE, ButtonIndex.CIRCLE, ButtonIndex.CROSS, ButtonIndex.SQUARE,
        ButtonIndex.PADDLE_RIGHT
    ];

    rightIndices.forEach(idx => {
        const label = getRemappedLabel(idx);
        if(label) {
             let originalName = ButtonIndex[idx].replace('PADDLE_', 'P.').replace('_', ' ');
             list.push({ src: originalName, dest: label });
        }
    });
    return list;
});

</script>
<template>
  <section class="controller-container" id="controller" @click="e => scanSelected(e)">

    <!-- Top Left: Left Trigger -->
    <div class="info-card top-left">
      <div class="card-header">
        <span class="component-icon trigger-icon"></span>
        <span class="component-name">L2 Trigger</span>
      </div>
      <div class="info-row">
        <span class="info-label">Input Range</span>
        <span class="info-value">{{ leftTriggerInfo.range }}</span>
      </div>
    </div>

    <!-- Top Right: Right Trigger -->
    <div class="info-card top-right">
      <div class="card-header">
        <span class="component-name">R2 Trigger</span>
        <span class="component-icon trigger-icon"></span>
      </div>
      <div class="info-row">
        <span class="info-label">Input Range</span>
        <span class="info-value">{{ rightTriggerInfo.range }}</span>
      </div>
    </div>

    <!-- Middle Left: Left Remaps -->
    <div class="info-card middle-left" v-if="leftRemaps.length > 0">
      <div class="card-header">
         <span class="component-name">Assignments (L)</span>
      </div>
      <div class="info-row" v-for="map in leftRemaps" :key="map.src">
        <span class="info-label">{{ map.src }}</span>
        <span class="info-value arrow">→</span>
        <span class="info-value">{{ map.dest }}</span>
      </div>
    </div>

    <!-- Middle Right: Right Remaps -->
    <div class="info-card middle-right" v-if="rightRemaps.length > 0">
      <div class="card-header">
         <span class="component-name">Assignments (R)</span>
      </div>
      <div class="info-row" v-for="map in rightRemaps" :key="map.src">
        <span class="info-label">{{ map.src }}</span>
        <span class="info-value arrow">→</span>
        <span class="info-value">{{ map.dest }}</span>
      </div>
    </div>

    <!-- Bottom Left: Left Stick -->
    <div class="info-card bottom-left">
      <div class="card-header">
         <span class="component-icon stick-icon"></span>
         <span class="component-name">Left Stick</span>
      </div>
      <div class="info-row">
        <span class="info-label">Curve</span>
        <div class="info-value box-icon">
          <span v-if="getCurveName(profile.getLeftJoyStick().getProfileId()) !== 'Default'" class="curve-icon"></span>
          {{ leftStickInfo.curve }}
        </div>
      </div>
      <div class="info-row">
        <span class="info-label">Deadzone</span>
        <span class="info-value">{{ leftStickInfo.deadzone }}</span>
      </div>
    </div>

    <!-- Bottom Right: Right Stick -->
    <div class="info-card bottom-right">
      <div class="card-header">
         <span class="component-name">Right Stick</span>
         <span class="component-icon stick-icon"></span>
      </div>
      <div class="info-row">
        <span class="info-label">Curve</span>
        <div class="info-value box-icon">
           <span v-if="getCurveName(profile.getRightJoyStick().getProfileId()) !== 'Default'" class="curve-icon"></span>
          {{ rightStickInfo.curve }}
        </div>
      </div>
      <div class="info-row">
        <span class="info-label">Deadzone</span>
        <span class="info-value">{{ rightStickInfo.deadzone }}</span>
      </div>
    </div>


    <section class="controller-front">
      <span style="left: 386px; top: 180px" :data-original="Button.CIRCLE" class="interactable circle-button" id="circle">
      </span>
      <span style="left: 332px; top: 180px" :data-original="Button.SQUARE" class="interactable circle-button" id="square">
      </span>
      <span style="left: 359px; top: 207px" :data-original="Button.CROSS" class="interactable circle-button" id="cross">
      </span>
      <span style="left: 359px; top: 155px" :data-original="Button.TRIANGLE" class="interactable circle-button" id="triangle">
      </span>

      <span style="left: 109px; top: 182px;" :data-original="Button.LEFT" class="interactable dpad-button" id="dpad_left">
      </span>
      <span style="left: 126.5px; top: 199px; rotate: 270deg" :data-original="Button.DOWN" class="interactable dpad-button" id="dpad_bottom">
      </span>
      <span style="left: 144px; top: 182px; rotate: 180deg" :data-original="Button.RIGHT" class="interactable dpad-button" id="dpad_right">
      </span>
      <span style="left: 126.5px; top: 166px; rotate: 90deg" :data-original="Button.UP" class="interactable dpad-button" id="dpad_top">
      </span>

      <span style="left: 173px; top: 218px" :data-original="Button.L3" class="interactable circle-joystick" id="left_joystick">
      </span>
      <span style="left: 292px; top: 218px" :data-original="Button.R3" class="interactable circle-joystick" id="right_joystick">
      </span>

      <span style="left: 112px; top: 115px" :data-original="Button.L1" class="interactable left_1" id="left_1">
      </span>
      <span style="left: 348px; top: 115px" :data-original="Button.R1" class="interactable right_1" id="right_1">
      </span>

      <span style="left: 104px; top: 64px" :data-original="Button.L2" class="interactable left_2" id="left_2">
      </span>
      <span style="left: 356px; top: 64px" :data-original="Button.R2" class="interactable right_2" id="right_2">
      </span>

        <!-- L2 Label Button -->
       <span class="button-label l2-label">L2</span>
       <!-- R2 Label Button -->
       <span class="button-label r2-label">R2</span>
        <!-- L1 Label Button -->
       <span class="button-label l1-label">L1</span>
       <!-- R1 Label Button -->
       <span class="button-label r1-label">R1</span>

      <!-- Paddle Buttons -->
      <span style="left: 180px; top: 310px; rotate: 10deg" :data-original="ButtonIndex.PADDLE_LEFT" class="interactable paddle_left" id="paddle_left">
      </span>
      <span style="left: 315px; top: 310px; rotate: -10deg" :data-original="ButtonIndex.PADDLE_RIGHT" class="interactable paddle_right" id="paddle_right">
      </span>

      <section id="select-popup" ref="select_popup" class="select-popup">
        <template v-if="selectedButtonOriginalValue !== undefined">
          <button class="select-popup-close" id="select-popup-close">x</button>
          <p>Button: <span class="button-identifier-original">{{ ButtonIndex[selectedButtonOriginalValue] }}</span></p>
          <label for="assignment">Assigned:</label>
          <select id="assignment" @change="(e: any) => updateButton(e)">
            <option v-for="button in buttonLabels"
                    :value="Button[button as any]"
                    :selected="selectedButtonAssignedValue === Button[button as any]">
              {{ button }}
            </option>
            <option v-if="Number(selectedButtonOriginalValue) === 14 || Number(selectedButtonOriginalValue) === 15"
                    :value="Number(selectedButtonOriginalValue)"
                    :selected="selectedButtonAssignedValue === selectedButtonOriginalValue">
              {{ ButtonIndex[selectedButtonOriginalValue] }}
            </option>
          </select>
        </template>
      </section>
    </section>


  </section>
</template>
<style scoped>
.controller-container {
  position: relative;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  height: auto; /* Allow growth */
  padding-bottom: 50px;
}

.controller-front {
  width: 512px;
  height: 512px;
  max-width: 80%;
  display: block;
  margin: 0 auto;
  background-image: url("../../assets/edge-front.png");
  background-size: cover;
  position: relative;
  filter: brightness(0.95);
  z-index: 10;
}



/* --- Info Cards --- */
.info-card {
    position: absolute;
    width: 200px;
    padding: 14px;
    background: rgba(22, 26, 33, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--border-radius-md);
    backdrop-filter: blur(12px);
    z-index: 20;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
    color: white;
    transition: all var(--transition-base);
}

.info-card:hover {
    transform: translateY(-3px);
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.component-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #f0f0f0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.info-row:last-child {
    margin-bottom: 0;
}

.info-label {
    font-size: 0.8rem;
    color: #aaaaaa;
}

.info-value {
    font-size: 0.95rem;
    font-weight: 500;
    color: white;
}


/* --- Positioning --- */

/* Left Side */
.top-left {
    top: 60px;
    left: 0;
}

.bottom-left {
    top: 400px; /* Aligned with sticks on front view */
    left: 0;
}

/* Right Side */
.top-right {
    top: 60px;
    right: 0;
    text-align: right; /* Content alignment */
}
/* Reverse row order for right-aligned cards to keep icon on outside if desired? 
   No, flex-direction row-reverse is cleaner if we want symmetry. */
.top-right .card-header,
.bottom-right .card-header {
    flex-direction: row-reverse;
}

.bottom-right {
    top: 400px; /* Aligned with sticks on front view */
    right: 0;
    text-align: right;
}

/* Middle Cards for Assignments */
.middle-left {
    top: 220px;
    left: 0;
}
.middle-left .info-row {
    justify-content: flex-start;
    gap: 8px;
}

.middle-right {
    top: 220px;
    right: 0;
    text-align: right;
}
.middle-right .card-header {
    flex-direction: row-reverse;
}
.middle-right .info-row {
    justify-content: flex-end;
    gap: 8px;
}

.arrow {
  color: #fff;
  font-weight: bold;
}

.button-label {
    position: absolute;
    color: #aaa;
    background-color: #111;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: bold;
    border: 1px solid #333;
    z-index: 15;
}
.l2-label { top: 40px; left: 120px; }
.r2-label { top: 40px; left: 370px; }
.l1-label { top: 90px; left: 100px; }
.r1-label { top: 90px; left: 390px; }


/* Existing Interactive Elements */
.circle-button {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  display: block;
  position: absolute;
}

.circle-joystick {
  width: 47px;
  height: 47px;
  border-radius: 50%;
  display: block;
  position: absolute;
}

.select-popup {
  position: absolute;
  min-width: 240px;
  padding: 20px 24px;
  background: rgba(22, 26, 33, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  display: none;
  color: var(--text-primary);
  animation: popupFadeIn var(--transition-smooth) ease-out;
}

@keyframes popupFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.select-popup p {
  margin: 0 0 16px 0;
  color: var(--text-secondary);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.select-popup label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.select-popup select {
  width: 100%;
  background-color: var(--bg-input);
  border: 1px solid var(--border-secondary);
  border-radius: var(--border-radius-sm);
  color: var(--text-primary);
  padding: 10px 12px;
  font-size: 0.9rem;
  font-family: inherit;
  cursor: pointer;
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.select-popup select:hover {
  border-color: var(--text-muted);
}

.select-popup select:focus {
  outline: none;
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 2px var(--accent-blue-subtle);
}

.select-popup-close {
  position: absolute;
  right: 12px;
  top: 12px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-secondary);
  background: transparent;
  transition: all var(--transition-base);
}

.select-popup-close:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: var(--text-muted);
  color: var(--text-primary);
}

.dpad-button {
  width: 28px;
  height: 21px;
  display: block;
  position: absolute;
  clip-path: polygon(0% 0%, 63% 0%, 100% 50%, 63% 100%, 0% 100%);
  border-radius: 5px;
}

.left_1 {
  width: 52px;
  height: 26px;
  display: block;
  border-radius: 6px 6px 20px 20px;
  position: absolute;
  rotate: 350deg;
}

.right_1 {
  width: 52px;
  height: 26px;
  display: block;
  border-radius: 6px 6px 20px 20px;
  position: absolute;
  rotate: 10deg;
}

.left_2 {
  width: 52px;
  height: 46px;
  display: block;
  border-radius: 25px 25px 6px 6px;
  position: absolute;
  rotate: 350deg;
}

.right_2 {
  width: 52px;
  height: 46px;
  display: block;
  border-radius: 25px 25px 6px 6px;
  position: absolute;
  rotate: 10deg;
}

.create_button {
  width: 12px;
  height: 22px;
  display: block;
  position: absolute;
  border-radius: 6px;
  rotate: 350deg;
}

.options_button {
  width: 12px;
  height: 22px;
  display: block;
  position: absolute;
  border-radius: 6px;
  rotate: 10deg;
}

.trackpad {
  width: 150px;
  height: 72px;
  position: absolute;
  clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
  border-radius: 0 0 35px 35px;
}

.paddle_left {
  width: 17px;
  height: 42px;
  display: block;
  position: absolute;
  border-radius: 8px 8px 35px 8px;
  rotate: 350deg;
}

.paddle_right {
  width: 17px;
  height: 42px;
  display: block;
  position: absolute;
  border-radius: 8px 8px 8px 35px;
  rotate: 10deg;
}

.interactable {
  background-color: rgba(0, 112, 209, 0.6);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.interactable:hover {
  background-color: rgba(0, 112, 209, 0.9);
}


.button-identifier-original {
  color: var(--text-primary);
  font-weight: 600;
}


</style>