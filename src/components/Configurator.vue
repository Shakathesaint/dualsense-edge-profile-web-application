<script setup lang="ts">
import Profile from "../model/Profile";
import {Ref, ref, watch} from "vue";
import Assignment from "./Configuration/Assignment.vue";
import StickSensitivity from "./Configuration/StickSensitivity.vue";
import TriggerDeadzone from "./Configuration/TriggerDeadzone.vue";
import StickDeadzone from "./Configuration/StickDeadzone.vue";
import LocalIndexDB from "../model/LocalIndexDB";
import {inject} from "vue";
import {useToast} from "../composables/useToast";

const props = defineProps({
  selectedProfile: Profile,
  isSavedProfile: Boolean
});

const emits = defineEmits([
  'save'
]);

const db: LocalIndexDB = inject('db') as LocalIndexDB;
const { success } = useToast();
let selectedTabIndex = ref(0);
let foundSavedProfiles: Ref<Array<any>> = ref([]);

const isActive = (i: number) => {
  return {active: selectedTabIndex.value === i};
}

const changeTabIndex = (i: number) => {
  selectedTabIndex.value = i;
}

let copyProfile = ref();

const applyExistingProfile = (e: any) => {
  db.get(e.target.value).then((foundProfile: any) => {
    copyProfile.value.setLabel(foundProfile.label);
    copyProfile.value.getLeftJoyStick().setProfileId(foundProfile.leftJoystick.profileId);
    copyProfile.value.getLeftJoyStick().setAdjustments(foundProfile.leftJoystick.adjustments);
    copyProfile.value.getLeftJoyStick().setCurveValues(foundProfile.leftJoystick.curveValues);
    copyProfile.value.getRightJoyStick().setProfileId(foundProfile.rightJoystick.profileId);
    copyProfile.value.getRightJoyStick().setAdjustments(foundProfile.rightJoystick.adjustments);
    copyProfile.value.getRightJoyStick().setCurveValues(foundProfile.rightJoystick.curveValues);
    copyProfile.value.getLeftTrigger().setMin(foundProfile.leftTrigger.min);
    copyProfile.value.getLeftTrigger().setMax(foundProfile.leftTrigger.max);
    copyProfile.value.getRightTrigger().setMin(foundProfile.rightTrigger.min);
    copyProfile.value.getRightTrigger().setMax(foundProfile.rightTrigger.max);
    if (foundProfile.leftStickDeadzone) {
      copyProfile.value.getLeftStickDeadzone().setValue(foundProfile.leftStickDeadzone.value);
    }
    if (foundProfile.rightStickDeadzone) {
      copyProfile.value.getRightStickDeadzone().setValue(foundProfile.rightStickDeadzone.value);
    }
    copyProfile.value.getButtonMapping().setButtons(foundProfile.buttonMapping.buttons);
  });
}

const save = () => {
  if (props.isSavedProfile) {
    db.update(copyProfile.value);
    success(`Profile "${copyProfile.value.getLabel()}" saved`);
    return;
  }
  return emits('save', copyProfile.value);
}

watch(props, data => {
  if (!props.isSavedProfile) {
    db.getAll().then((data: Array<Profile>) => {
      foundSavedProfiles.value = data;
    });
  }
  copyProfile.value = data.selectedProfile;
});
</script>
<template>
  <section v-if="copyProfile" class="configurator">
    <section class="configurator-top-header">
      <section>
        <h1 class="profile-name">Profile: <input :value="copyProfile.getLabel()"
                                                 @change="(e: any) => copyProfile.setLabel(e.target.value)"
                                                 type="text"></h1>
      </section>
      <section v-if="!props.isSavedProfile && foundSavedProfiles.length" class="apply-existing-profile">
        <label for="select-saved-profile">Apply existing profile</label>
        <select id="select-saved-profile" @change="applyExistingProfile">
          <option>Unselected</option>
          <option v-for="foundSavedProfile in foundSavedProfiles" :value="foundSavedProfile.id">
            {{ foundSavedProfile.label }}
          </option>
        </select>
      </section>
      <section>
        <button class="save-btn" @click="save()">Save</button>
      </section>
    </section>
    <section class="tabs">
      <span @click="changeTabIndex(0)" :class="isActive(0)" class="tab">Button Assignments</span>
      <span @click="changeTabIndex(1)" :class="isActive(1)" class="tab">Stick Sensitivity</span>
      <span @click="changeTabIndex(2)" :class="isActive(2)" class="tab">Trigger Deadzone</span>
      <span @click="changeTabIndex(3)" :class="isActive(3)" class="tab">Stick Deadzone</span>
      <span @click="changeTabIndex(4)" :class="isActive(4)" class="tab">Other</span>
    </section>
    <section class="configuration-setting-container">
      <Assignment
          v-if="isActive(0).active"
          :profile="copyProfile"
      />
      <StickSensitivity
          v-if="isActive(1).active"
          :left-joystick="copyProfile.getLeftJoyStick()"
          :right-joystick="copyProfile.getRightJoyStick()"
      />
      <TriggerDeadzone
          v-if="isActive(2).active"
          :right-trigger="copyProfile.getRightTrigger()"
          :left-trigger="copyProfile.getLeftTrigger()"
      />
      <StickDeadzone
          v-if="isActive(3).active"
          :left-stick-deadzone="copyProfile.getLeftStickDeadzone()"
          :right-stick-deadzone="copyProfile.getRightStickDeadzone()"
      />
    </section>
  </section>
</template>

<style scoped>
.configurator {
  padding: 24px 32px;
  background-color: var(--bg-primary);
  min-height: 100vh;
  box-sizing: border-box;
}

/* Top Header Section */
.configurator-top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-secondary);
}

.profile-name {
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-name input {
  background-color: transparent;
  border: none;
  border-bottom: 1px solid var(--border-secondary);
  border-radius: 0;
  color: var(--text-primary);
  padding: 6px 0;
  font-size: 1.1rem;
  font-weight: 600;
  transition: border-color var(--transition-base);
}

.profile-name input:focus {
  outline: none;
  border-bottom-color: var(--accent-blue);
}

.profile-name input:hover:not(:focus) {
  border-bottom-color: var(--text-muted);
}

/* Apply Existing Profile Dropdown */
.apply-existing-profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.apply-existing-profile label {
  display: block;
  margin-bottom: 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.apply-existing-profile select {
  min-width: 180px;
  background-color: var(--bg-input);
  border: 1px solid var(--border-secondary);
  border-radius: var(--border-radius-sm);
  color: var(--text-primary);
  padding: 8px 12px;
  font-size: 0.85rem;
  transition: border-color var(--transition-base);
}

.apply-existing-profile select:focus {
  outline: none;
  border-color: var(--accent-blue);
}

/* Save Button with Glow */
.save-btn {
  background-color: var(--accent-blue);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  padding: 10px 28px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all var(--transition-smooth);
  box-shadow: 0 0 0 0 var(--accent-blue-glow);
}

.save-btn:hover {
  background-color: var(--accent-blue-hover);
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}

.save-btn:active {
  transform: translateY(0);
}

/* Tabs Section - Underline Style */
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border-secondary);
  background: transparent;
  padding: 0;
}

.tab {
  padding: 12px 20px;
  cursor: pointer;
  color: var(--text-secondary);
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all var(--transition-base);
  border: none;
  background: transparent;
  position: relative;
  flex: none;
}

.tab::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--accent-blue);
  transform: scaleX(0);
  transition: transform var(--transition-smooth);
}

.tab:hover {
  color: var(--text-primary);
}

.tab.active {
  color: var(--accent-blue);
}

.tab.active::after {
  transform: scaleX(1);
}

/* Configuration Container */
.configuration-setting-container {
  background-color: var(--bg-card);
  border: 1px solid var(--border-secondary);
  border-radius: var(--border-radius-lg);
  padding: 28px;
}
</style>