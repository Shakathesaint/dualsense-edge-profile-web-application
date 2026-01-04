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
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-primary);
}

.profile-name {
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-name input {
  background-color: var(--bg-input);
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius-sm);
  color: var(--text-primary);
  padding: 8px 12px;
  font-size: 1rem;
}

.profile-name input:focus {
  outline: none;
  border-color: var(--border-focus);
}

/* Apply Existing Profile Dropdown */
.apply-existing-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.apply-existing-profile label {
  display: block;
  margin-bottom: 0;
  color: var(--text-secondary);
  font-size: 0.85rem;
  white-space: nowrap;
}

.apply-existing-profile select {
  min-width: 200px;
  background-color: var(--bg-input);
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius-sm);
  color: var(--text-primary);
  padding: 8px 12px;
  font-size: 0.9rem;
}

.apply-existing-profile select:focus {
  outline: none;
  border-color: var(--border-focus);
}

/* Save Button */
.save-btn {
  background-color: var(--accent-blue);
  color: var(--text-primary);
  border: none;
  border-radius: var(--border-radius-md);
  padding: 10px 24px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.save-btn:hover {
  background-color: var(--accent-blue-hover);
}

/* Tabs Section */
.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 24px;
  background-color: var(--bg-card);
  border-radius: var(--border-radius-md);
  padding: 4px;
}

.tab {
  flex: 1;
  padding: 12px 16px;
  cursor: pointer;
  color: var(--text-secondary);
  text-align: center;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: var(--border-radius-sm);
  transition: all 0.2s ease;
  border: none;
}

.tab:hover {
  color: var(--text-primary);
  background-color: var(--bg-card-hover);
}

.tab.active {
  background-color: var(--accent-blue);
  color: var(--text-primary);
  font-weight: 600;
}

/* Configuration Container */
.configuration-setting-container {
  background-color: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius-lg);
  padding: 24px;
}
</style>