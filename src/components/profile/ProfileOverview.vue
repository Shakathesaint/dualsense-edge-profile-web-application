<script setup lang="ts">
import Profile from "./Profile.vue";

import ProfileModel from "../../model/Profile";
import LocalIndexDB from "../../model/LocalIndexDB";
import {assembleBlankProfile, generateId, getProfileButtonSelector} from "../../helper/profileTools";
import {
  downloadProfileAsJSON,
  jsonToProfile,
  ExportedProfile,
  downloadProfilesAsZip,
  importProfilesFromZip,
  ImportResult
} from "../../helper/profileSerializer";
import {createShareableLink, copyToClipboard} from "../../helper/cloudShare";
import {inject, ref} from "vue";
import type {Ref} from "vue";
import Joystick from "../../model/Joystick";
import Trigger from "../../model/Trigger";
import ButtonMapping from "../../model/ButtonMapping";
import {PS5_JOYSTICK_CURVE} from "../../helper/bytesToProfile";
import {ProfileButtonSelector} from "../../enum/ProfileButtonSelector";
import { useToast } from "../../composables/useToast";
import Modal from "../ui/Modal.vue";

defineProps({
  profiles: Array<ProfileModel>,
});

const savedProfiles: Ref<Array<ProfileModel>> = ref([]);

const emit = defineEmits(['selected-profile', 'delete-profile']);

const db: LocalIndexDB = inject('db') as LocalIndexDB;
const hidController = inject('HIDController') as Ref<HIDDevice>;
const getProfiles = inject('getProfiles') as Function;
const { success, error, info } = useToast();

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

// Modal States
const showDeleteConfirm = ref(false);
const profileToDelete = ref<ProfileModel | null>(null);

const showClearConfirm = ref(false);
const profileToClear = ref<ProfileModel | null>(null);
const profileClearPosition = ref<number>(-1);

const showNewProfileModal = ref(false);
const newProfileName = ref("");

// Delete Profile
const deleteProfileConfirm = (profile: ProfileModel) => {
  profileToDelete.value = profile;
  showDeleteConfirm.value = true;
}

const confirmDelete = () => {
  if (profileToDelete.value) {
    const profile = profileToDelete.value;
    db.delete(profile.getId());
    emit('selected-profile', null);
    savedProfiles.value = savedProfiles.value.filter((foundProfile: ProfileModel) => foundProfile.getId() !== profile.getId());
    info(`Profile "${profile.getLabel()}" deleted`);
  }
  showDeleteConfirm.value = false;
  profileToDelete.value = null;
}

// Clear Memory
const clearProfileFromControllerMemory = (profile: ProfileModel, position: number) => {
  profileToClear.value = profile;
  profileClearPosition.value = position;
  showClearConfirm.value = true;
}

const confirmClear = async () => {
  if (profileToClear.value && hidController.value && profileClearPosition.value !== -1) {
    const bytes = new Uint8Array(64);
    bytes[1] = 1 + profileClearPosition.value;
    await hidController.value?.sendFeatureReport(0x68, bytes.slice(1, bytes.length));
    getProfiles();
    info(`Cleared "${profileToClear.value.getLabel()}" from controller memory`);
  }
  showClearConfirm.value = false;
  profileToClear.value = null;
  profileClearPosition.value = -1;
}

// New Profile
const createNewProfile = () => {
  newProfileName.value = "";
  showNewProfileModal.value = true;
}

const confirmCreateProfile = () => {
  if (newProfileName.value) {
    const profile = assembleBlankProfile(newProfileName.value);
    db.store(profile);
    savedProfiles.value.push(profile);
    emit('selected-profile', profile);
    success(`Profile "${newProfileName.value}" created`);
    showNewProfileModal.value = false;
    newProfileName.value = "";
  }
}

const fileInput = ref<HTMLInputElement | null>(null);

// Dialog states
const showShareConfirmDialog = ref(false);
const showShareResultDialog = ref(false);
const showImportSummaryDialog = ref(false);
const isExporting = ref(false);
const isCreatingLink = ref(false);

// Dialog data
const lastExportedBlob = ref<Blob | null>(null);
const shareResultUrl = ref("");
const shareResultError = ref("");
const importSummary = ref<ImportResult | null>(null);

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

  const isZipFile = file.name.toLowerCase().endsWith('.zip') ||
                    file.type === 'application/zip' ||
                    file.type === 'application/x-zip-compressed';

  try {
    if (isZipFile) {
      await handleBulkImport(file);
    } else {
      const text = await file.text();
      const data: ExportedProfile = JSON.parse(text);
      const profile = jsonToProfile(data);

      db.store(profile);
      savedProfiles.value.push(profile);
      emit('selected-profile', profile, true);

      success(`Profile "${profile.getLabel()}" imported successfully!`);
    }
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      error("Invalid file format: not a valid JSON file");
    } else if (err instanceof Error) {
      error(`Import failed: ${err.message}`);
    } else {
      error("Import failed: unknown error");
    }
  }

  target.value = '';
};

// Bulk export/import functions
const exportAllProfiles = async () => {
  if (savedProfiles.value.length === 0) {
    info("No saved profiles to export");
    return;
  }

  isExporting.value = true;

  try {
    const blob = await downloadProfilesAsZip(savedProfiles.value);
    lastExportedBlob.value = blob;
    showShareConfirmDialog.value = true;
  } catch (err: any) {
    const message = err instanceof Error ? err.message : "Unknown error";
    error(`Export failed: ${message}`);
  } finally {
    isExporting.value = false;
  }
};

const handleBulkImport = async (file: File) => {
  const existingNames = savedProfiles.value.map(p => p.getLabel());

  const result = await importProfilesFromZip(file, existingNames);
  importSummary.value = result;

  for (const profile of result.imported) {
    db.store(profile);
    savedProfiles.value.push(profile);
  }

  if (result.imported.length > 0) {
    emit('selected-profile', result.imported[0], true);
  }

  showImportSummaryDialog.value = true;
};

const confirmShareLink = async () => {
  showShareConfirmDialog.value = false;

  if (!lastExportedBlob.value) return;

  isCreatingLink.value = true;
  shareResultUrl.value = "";
  shareResultError.value = "";

  const date = new Date().toISOString().split("T")[0];
  const filename = `dualsense_profiles_backup_${date}.txt`;

  const result = await createShareableLink(lastExportedBlob.value, filename);

  isCreatingLink.value = false;

  if (result.success && result.url) {
    shareResultUrl.value = result.url;
  } else {
    shareResultError.value = result.error || "Unknown error";
  }

  showShareResultDialog.value = true;
};

const cancelShareLink = () => {
  showShareConfirmDialog.value = false;
  lastExportedBlob.value = null;
};

const closeShareResultDialog = () => {
  showShareResultDialog.value = false;
  shareResultUrl.value = "";
  shareResultError.value = "";
  lastExportedBlob.value = null;
};

const closeImportSummaryDialog = () => {
  showImportSummaryDialog.value = false;
  importSummary.value = null;
};

const copyShareUrl = async () => {
  if (shareResultUrl.value) {
    const result = await copyToClipboard(shareResultUrl.value);
    if (result) {
      success("Link copied to clipboard!");
    }
  }
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
        <button
          class="export-all-button"
          @click="exportAllProfiles()"
          :disabled="isExporting"
        >
          {{ isExporting ? 'Exporting...' : 'Export All' }}
        </button>
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
        accept=".json,.zip"
        style="display: none"
        @change="handleFileImport"
      />
    </section>

    <!-- Share Confirmation Dialog -->
    <div class="dialog-overlay" v-if="showShareConfirmDialog" @click.self="cancelShareLink">
      <div class="dialog">
        <h3 class="dialog-title">Backup Complete!</h3>
        <p class="dialog-message">
          {{ savedProfiles.length }} profile(s) exported successfully.
        </p>
        <p class="dialog-message">
          Do you want to create a shareable link for this backup?
        </p>
        <div class="dialog-actions">
          <button class="dialog-button secondary" @click="cancelShareLink">No, thanks</button>
          <button class="dialog-button primary" @click="confirmShareLink">Yes, create link</button>
        </div>
      </div>
    </div>

    <!-- Creating Link Loading Dialog -->
    <div class="dialog-overlay" v-if="isCreatingLink">
      <div class="dialog">
        <h3 class="dialog-title">Creating Link...</h3>
        <p class="dialog-message">Please wait while we upload your backup.</p>
        <div class="loading-spinner"></div>
      </div>
    </div>

    <!-- Share Result Dialog -->
    <div class="dialog-overlay" v-if="showShareResultDialog" @click.self="closeShareResultDialog">
      <div class="dialog">
        <template v-if="shareResultUrl">
          <h3 class="dialog-title success">Link Created!</h3>
          <div class="share-url-container">
            <input type="text" class="share-url-input" :value="shareResultUrl" readonly />
            <button class="copy-button" @click="copyShareUrl">Copy</button>
          </div>
          <p class="dialog-note">
            Note: This link expires in 72 hours. Anyone with the URL can download the file.
          </p>
        </template>
        <template v-else>
          <h3 class="dialog-title error">Link Creation Failed</h3>
          <p class="dialog-message error-message">{{ shareResultError }}</p>
        </template>
        <div class="dialog-actions">
          <button class="dialog-button primary" @click="closeShareResultDialog">Close</button>
        </div>
      </div>
    </div>

    <!-- Import Summary Dialog -->
    <div class="dialog-overlay" v-if="showImportSummaryDialog" @click.self="closeImportSummaryDialog">
      <div class="dialog">
        <h3 class="dialog-title">Import Complete</h3>
        <div class="import-summary" v-if="importSummary">
          <p class="summary-item success" v-if="importSummary.imported.length">
            {{ importSummary.imported.length }} profile(s) imported
          </p>
          <div v-if="importSummary.renamed.length" class="renamed-list">
            <p class="summary-label">Renamed profiles:</p>
            <ul>
              <li v-for="rename in importSummary.renamed" :key="rename.original">
                "{{ rename.original }}" → "{{ rename.newName }}"
              </li>
            </ul>
          </div>
          <div v-if="importSummary.errors.length" class="error-list">
            <p class="summary-label error">Errors:</p>
            <ul>
              <li v-for="error in importSummary.errors" :key="error">{{ error }}</li>
            </ul>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="dialog-button primary" @click="closeImportSummaryDialog">OK</button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <Modal
      title="Delete Profile"
      :is-open="showDeleteConfirm"
      confirm-text="Delete"
      type="danger"
      @close="showDeleteConfirm = false"
      @confirm="confirmDelete"
    >
      <p>Are you sure you want to delete profile "{{ profileToDelete?.getLabel() }}"?</p>
    </Modal>

    <Modal
      title="Clear Memory"
      :is-open="showClearConfirm"
      confirm-text="Clear"
      type="danger"
      @close="showClearConfirm = false"
      @confirm="confirmClear"
    >
      <p>Are you sure you want to clear "{{ profileToClear?.getLabel() }}" from the controller memory?</p>
    </Modal>

    <Modal
      title="Create New Profile"
      :is-open="showNewProfileModal"
      confirm-text="Create"
      @close="showNewProfileModal = false"
      @confirm="confirmCreateProfile"
    >
      <div class="form-group">
        <label for="profileName">Profile Name:</label>
        <input
          id="profileName"
          type="text"
          v-model="newProfileName"
          @keyup.enter="confirmCreateProfile"
          placeholder="Enter profile name"
          class="modal-input"
          autofocus
        />
      </div>
    </Modal>
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.export-all-button {
  all: unset;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--accent-blue);
  border: 1px solid var(--accent-blue);
  padding: 4px 10px;
  border-radius: var(--border-radius-sm);
  transition: all 0.2s ease;
}

.export-all-button:hover:not(:disabled) {
  background-color: rgba(0, 112, 209, 0.1);
}

.export-all-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

/* Dialog Overlay and Modal */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog {
  background-color: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius-md);
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.dialog-title {
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  text-align: center;
}

.dialog-title.success {
  color: #3fb950;
}

.dialog-title.error {
  color: var(--accent-red);
}

.dialog-message {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0 0 12px 0;
  text-align: center;
}

.dialog-message.error-message {
  color: var(--accent-red);
}

.dialog-note {
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin: 12px 0;
  text-align: center;
  font-style: italic;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.dialog-button {
  padding: 10px 20px;
  border-radius: var(--border-radius-sm);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.dialog-button.primary {
  background-color: var(--accent-blue);
  color: white;
}

.dialog-button.primary:hover {
  background-color: #0060b0;
}

.dialog-button.secondary {
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
}

.dialog-button.secondary:hover {
  background-color: var(--bg-card-hover);
  color: var(--text-primary);
}

/* Share URL Container */
.share-url-container {
  display: flex;
  gap: 8px;
  margin: 16px 0;
}

.share-url-input {
  flex: 1;
  padding: 10px 12px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius-sm);
  color: var(--text-primary);
  font-size: 0.85rem;
  font-family: monospace;
}

.copy-button {
  padding: 10px 16px;
  background-color: var(--accent-blue);
  color: white;
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.copy-button:hover {
  background-color: #0060b0;
}

/* Loading Spinner */
.loading-spinner {
  width: 32px;
  height: 32px;
  margin: 20px auto;
  border: 3px solid var(--border-primary);
  border-top-color: var(--accent-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Modal Input */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.modal-input {
  padding: 10px 12px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius-sm);
  color: var(--text-primary);
  font-size: 1rem;
}

.modal-input:focus {
  outline: none;
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 2px rgba(47, 129, 247, 0.2);
}

/* Import Summary */
.import-summary {
  margin: 16px 0;
}

.summary-item {
  margin: 8px 0;
  text-align: center;
}

.summary-item.success {
  color: #3fb950;
}

.summary-label {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin: 12px 0 4px 0;
}

.summary-label.error {
  color: var(--accent-red);
}

.renamed-list,
.error-list {
  margin: 8px 0;
}

.renamed-list ul,
.error-list ul {
  margin: 4px 0;
  padding-left: 20px;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.renamed-list li {
  color: #d29922;
}

.error-list li {
  color: var(--accent-red);
}
</style>