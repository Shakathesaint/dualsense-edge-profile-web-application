<script setup lang="ts">
import Profile from "./Profile.vue";

import ProfileModel from "../../model/Profile";
import LocalIndexDB from "../../model/LocalIndexDB";
import {assembleBlankProfile, generateId, getProfileButtonSelector} from "../../helper/profileTools";
import {downloadProfileAsJSON, jsonToProfile, ExportedProfile} from "../../helper/profileSerializer";
import {inject, ref} from "vue";
import type {Ref} from "vue";
import Joystick from "../../model/Joystick";
import Trigger from "../../model/Trigger";
import ButtonMapping from "../../model/ButtonMapping";
import {PS5_JOYSTICK_CURVE} from "../../helper/bytesToProfile";
import {ProfileButtonSelector} from "../../enum/ProfileButtonSelector";

defineProps({
  profiles: Array<ProfileModel>,
});

const savedProfiles: Ref<Array<ProfileModel>> = ref([]);

const emit = defineEmits(['selected-profile', 'delete-profile']);

const db: LocalIndexDB = inject('db') as LocalIndexDB;
const hidController = inject('HIDController') as Ref<HIDDevice>;
const getProfiles = inject('getProfiles') as Function;

db.getAll().then((profiles: Array<ProfileModel>) => savedProfiles.value = profiles.map((profileEntry: any) => {

  const joystickLeft = new Joystick(PS5_JOYSTICK_CURVE[profileEntry.leftJoystick.profileId].getProfileId(), profileEntry.leftJoystick.adjustments, PS5_JOYSTICK_CURVE[profileEntry.leftJoystick.profileId].getModifier());
  const joystickRight = new Joystick(PS5_JOYSTICK_CURVE[profileEntry.rightJoystick.profileId].getProfileId(), profileEntry.rightJoystick.adjustments, PS5_JOYSTICK_CURVE[profileEntry.rightJoystick.profileId].getModifier());

  joystickLeft.setCurveValues(profileEntry.leftJoystick.curveValues);
  joystickRight.setCurveValues(profileEntry.rightJoystick.curveValues);

  return new ProfileModel(
      profileEntry.id,
      profileEntry.label,
      joystickLeft,
      joystickRight,
      new Trigger(profileEntry.leftTrigger.min, profileEntry.leftTrigger.max),
      new Trigger(profileEntry.rightTrigger.min, profileEntry.rightTrigger.max),
      new ButtonMapping(profileEntry.buttonMapping.buttons)
  )
}));

const deleteProfileConfirm = (profile: ProfileModel) => {
  if (confirm(`Delete "${profile.getLabel()}"?`)) {
    db.delete(profile.getId());
    emit('selected-profile', null);
    savedProfiles.value = savedProfiles.value.filter((foundProfile: ProfileModel) => foundProfile.getId() !== profile.getId());
  }
}

const clearProfileFromControllerMemory = async (profile: ProfileModel, position: number) => {

  if (confirm(`Are you sure you want to clear ${profile.getLabel()} from the controller memory?`) &&
      hidController.value) {
    const bytes = new Uint8Array(64);
    bytes[1] = 1 + position;
    await hidController.value?.sendFeatureReport(0x68, bytes.slice(1, bytes.length));
    getProfiles();
  }
}

const createNewProfile = () => {
  let name = prompt("New profile name");
  if (name) {
    const profile = assembleBlankProfile(name);
    db.store(profile);
    savedProfiles.value.push(profile);
    emit('selected-profile', profile);
  }
}

const fileInput = ref<HTMLInputElement | null>(null);

const saveProfileLocally = (profile: ProfileModel) => {
  const leftProfileId = profile.getLeftJoyStick().getProfileId();
  const rightProfileId = profile.getRightJoyStick().getProfileId();

  const joystickLeft = new Joystick(
    leftProfileId,
    PS5_JOYSTICK_CURVE[leftProfileId].getAdjustments(),
    profile.getLeftJoyStick().getModifier()
  );
  joystickLeft.setCurveValues([...profile.getLeftJoyStick().getCurveValues()]);

  const joystickRight = new Joystick(
    rightProfileId,
    PS5_JOYSTICK_CURVE[rightProfileId].getAdjustments(),
    profile.getRightJoyStick().getModifier()
  );
  joystickRight.setCurveValues([...profile.getRightJoyStick().getCurveValues()]);

  const newProfile = new ProfileModel(
    generateId(),
    profile.getLabel(),
    joystickLeft,
    joystickRight,
    new Trigger(profile.getLeftTrigger().getMin(), profile.getLeftTrigger().getMax()),
    new Trigger(profile.getRightTrigger().getMin(), profile.getRightTrigger().getMax()),
    new ButtonMapping([...profile.getButtonMapping().getButtons()]),
    ProfileButtonSelector.UNASSIGNED
  );

  db.store(newProfile);
  savedProfiles.value.push(newProfile);
  emit('selected-profile', newProfile, true);
};

const exportProfile = (profile: ProfileModel) => {
  downloadProfileAsJSON(profile);
};

const triggerImport = () => {
  fileInput.value?.click();
};

const handleFileImport = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  try {
    const text = await file.text();
    const data: ExportedProfile = JSON.parse(text);
    const profile = jsonToProfile(data);

    db.store(profile);
    savedProfiles.value.push(profile);
    emit('selected-profile', profile, true);

    alert(`Profile "${profile.getLabel()}" imported successfully!`);
  } catch (error) {
    if (error instanceof SyntaxError) {
      alert("Invalid file format: not a valid JSON file");
    } else if (error instanceof Error) {
      alert(`Import failed: ${error.message}`);
    } else {
      alert("Import failed: unknown error");
    }
  }

  target.value = '';
};

</script>

<template>
  <section class="overview">
    <!-- Controller Info Section -->
    <section class="controller-info">
      <div class="controller-image-container">
        <img src="../../assets/edge-front.png" alt="DualSense Edge" class="controller-image" />
      </div>
      <h2 class="controller-name">DualSense Edge Wireless Controller</h2>
      <p class="controller-status">Connected via USB</p>
    </section>

    <!-- Profiles Container -->
    <section class="profiles-container">
      <!-- Controller Profiles Section -->
      <div class="section-header">
        <h3 class="section-title">Controller Profiles</h3>
      </div>
      <section class="profiles" v-if="profiles">
        <Profile @selected-profile="(selectedProfile) => $emit('selected-profile', selectedProfile)"
                 v-for="(profile, i) in profiles"
                 :profile="profile">
          <div class="profile-right">
            <span class="button-combination">
              <span class="fn-button">FN</span>
              <span class="plus-sign">+</span>
              <img class="action-button" :src="getProfileButtonSelector((profile as ProfileModel).getProfileButtonSelector())" alt="button">
            </span>
            <div class="profile-actions">
              <button class="action-button-text" @click="$event.stopPropagation(); saveProfileLocally(profile as ProfileModel)">
                Save locally
              </button>
              <button class="action-button-text" @click="$event.stopPropagation(); exportProfile(profile as ProfileModel)">
                Export
              </button>
              <button class="clear-button" @click="$event.stopPropagation(); clearProfileFromControllerMemory(profile as ProfileModel, i)">
                Clear
              </button>
            </div>
          </div>
        </Profile>
      </section>

      <!-- Saved Profiles Section -->
      <div class="section-header" v-if="savedProfiles.length">
        <h3 class="section-title">Saved Profiles</h3>
      </div>
      <section class="profiles saved" v-if="savedProfiles.length">
        <Profile @selected-profile="(selectedProfile) => $emit('selected-profile', selectedProfile, true)"
                 v-for="profile in savedProfiles"
                 :profile="profile">
          <div class="profile-actions-saved">
            <button class="action-button-text" @click="$event.stopPropagation(); exportProfile(profile)">Export</button>
            <button class="profile-delete-button" @click="$event.stopPropagation(); deleteProfileConfirm(profile)">Delete</button>
          </div>
        </Profile>
      </section>
    </section>

    <!-- Bottom Action Buttons -->
    <section class="create-new-profile">
      <button @click="createNewProfile()">
        + Create new profile
      </button>
      <button @click="triggerImport()">
        Import profile
      </button>
      <input
        ref="fileInput"
        type="file"
        accept=".json"
        style="display: none"
        @change="handleFileImport"
      />
    </section>
  </section>
</template>

<style scoped>
.overview {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-primary);
}

/* Controller Info Section */
.controller-info {
  padding: 24px 20px;
  text-align: center;
  border-bottom: 1px solid var(--border-secondary);
}

.controller-image-container {
  margin-bottom: 16px;
}

.controller-image {
  max-width: 180px;
  height: auto;
  filter: brightness(0.95) contrast(1.05);
}

.controller-name {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.controller-status {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin: 0;
}

/* Profiles Container */
.profiles-container {
  flex: 1;
  overflow-y: auto;
}

/* Section Headers */
.section-header {
  padding: 16px 20px 8px 20px;
}

.section-title {
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

/* Profiles List */
.profiles {
  padding: 0;
}

.saved {
  border-top: 1px solid var(--border-secondary);
  margin-top: 8px;
  padding-top: 8px;
}

/* Profile Right Section */
.profile-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

/* Button Combination Styling */
.button-combination {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}

.fn-button {
  background-color: var(--bg-card);
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 6px;
  border-radius: 4px;
  border: 1px solid var(--border-primary);
}

.plus-sign {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.action-button {
  width: 20px;
  height: 20px;
  filter: invert(1) brightness(0.85);
}

/* Profile Actions */
.profile-actions {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  margin-top: 4px;
  align-items: center;
}

.profile-actions-saved {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: nowrap;
}

.action-button-text {
  all: unset;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-button-text:hover {
  background-color: var(--bg-card-hover);
  color: var(--text-primary);
}

.clear-button {
  all: unset;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.clear-button:hover {
  background-color: var(--bg-card-hover);
  color: var(--text-primary);
}

.profile-delete-button {
  all: unset;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--accent-red);
  border: 1px solid var(--accent-red);
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.profile-delete-button:hover {
  background-color: rgba(248, 81, 73, 0.1);
}

/* Bottom Action Buttons */
.create-new-profile {
  display: flex;
  border-top: 1px solid var(--border-primary);
}

.create-new-profile button {
  flex: 1;
  cursor: pointer;
  height: 48px;
  border: none;
  background-color: var(--bg-card);
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
}

.create-new-profile button:first-child {
  border-right: 1px solid var(--border-primary);
}

.create-new-profile button:hover {
  background-color: var(--bg-card-hover);
}
</style>