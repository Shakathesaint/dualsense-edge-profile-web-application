<script setup lang="ts">
import ProfileOverview from "./components/profile/ProfileOverview.vue";
import Configurator from "./components/Configurator.vue";
import {provide, Ref, ref} from "vue";
import {bytesArrayToProfile, profileToBytes} from "./helper/bytesToProfile";
import Profile from "./model/Profile";
import {arrayCRC32LeBLE} from "./helper/CRC32";
import LocalIndexDB from "./model/LocalIndexDB";
import ToastContainer from "./components/ui/ToastContainer.vue";
import {useToast} from "./composables/useToast";
import {parseHIDError} from "./helper/errors";
import {
  DUALSENSE_EDGE_FILTER,
  REPORT_ID,
  CRC32_REPORT_PREFIX,
} from "./constants/hid";

const db = new LocalIndexDB('ds-edge-profiles');
provide('db', db);

const { success, error: showError } = useToast();

let edgeHIDController: Ref<HIDDevice | undefined> = ref();
provide('HIDController', edgeHIDController);

let profiles = ref();
let selectedProfile = ref();
let hasSelectedSavedProfile = ref(false);

const getProfiles = async () => {
  if (!edgeHIDController.value) return;

  try {
    let profileCollector: Array<Array<Uint8Array>> = [[]];
    let cIndex = 0;

    for (let i = REPORT_ID.PROFILE_START; i < REPORT_ID.PROFILE_END; i++) {
      if (cIndex % REPORT_ID.REPORTS_PER_PROFILE === 0 && cIndex !== 0) {
        profileCollector.push([]);
      }
      const data: DataView = await edgeHIDController.value.receiveFeatureReport(i);
      const reportBytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      profileCollector[profileCollector.length - 1].push(reportBytes);
      cIndex++;
    }

    const foundProfiles: Array<Profile> = [];
    profileCollector.forEach((profileReports: Uint8Array[]) => {
      if (!profileReports.length) {
        return;
      }
      const profileData = profileReports.map(report => Array.from(report));
      foundProfiles.push(bytesArrayToProfile(profileData));
    });
    profiles.value = foundProfiles;
  } catch (err) {
    const hidError = parseHIDError(err);
    showError(hidError.message);
  }
}
// Used for refreshing profiles called by child component(s)
provide('getProfiles', getProfiles);

const getDevice = async () => {
  try {
    const devices = await navigator.hid!.requestDevice({filters: [DUALSENSE_EDGE_FILTER]});

    if (devices.length === 0) {
      // User cancelled the dialog - not an error
      return;
    }

    const controller = devices[0];

    try {
      await controller.open();
      edgeHIDController.value = controller;
      await getProfiles();
    } catch (openErr) {
      const hidError = parseHIDError(openErr);
      showError(hidError.message);
    }
  } catch (err) {
    // User cancelled the device picker - not an error, just ignore
    if (err instanceof DOMException && err.name === 'NotAllowedError') {
      return;
    }
    const hidError = parseHIDError(err);
    showError(hidError.message);
  }
}

navigator.hid!.addEventListener("connect", async ({device}) => {
  if (device.productId === DUALSENSE_EDGE_FILTER.productId &&
      device.vendorId === DUALSENSE_EDGE_FILTER.vendorId) {
    try {
      await device.open();
      edgeHIDController.value = device;
      await getProfiles();
    } catch (err) {
      const hidError = parseHIDError(err);
      showError(hidError.message);
    }
  }
});

navigator.hid!.addEventListener("disconnect", ({device}) => {
  if (device.productId === DUALSENSE_EDGE_FILTER.productId &&
      device.vendorId === DUALSENSE_EDGE_FILTER.vendorId) {
    edgeHIDController.value = undefined;
    selectedProfile.value = null;
    profiles.value = null;
  }
});

// Check for already-connected devices on page load
navigator.hid!.getDevices().then(async devices => {
  for (const device of devices) {
    if (device.productId === DUALSENSE_EDGE_FILTER.productId &&
        device.vendorId === DUALSENSE_EDGE_FILTER.vendorId) {
      try {
        await device.open();
        edgeHIDController.value = device;
        await getProfiles();
        break; // Only connect to the first matching device
      } catch (err) {
        const hidError = parseHIDError(err);
        showError(hidError.message);
      }
    }
  }
}).catch(err => {
  const hidError = parseHIDError(err);
  showError(hidError.message);
});

const setSelectedProfile = (setSelectedProfile: Profile, isSavedProfile: boolean = false) => {
  hasSelectedSavedProfile.value = isSavedProfile;
  selectedProfile.value = setSelectedProfile;
}


const saveProfile = async (newProfile: Profile) => {
  if (!edgeHIDController.value) return;

  try {
    const bytesArray = profileToBytes(newProfile);

    // Send all feature reports sequentially
    for (let bufIdx = 0; bufIdx < bytesArray.length; bufIdx++) {
      const bytes = bytesArray[bufIdx];
      const ident = bytes[0];
      bytes.set(arrayCRC32LeBLE(new Uint8Array([CRC32_REPORT_PREFIX, ...bytes])), bytes.length - 4);
      await edgeHIDController.value.sendFeatureReport(ident, bytes.slice(1, bytes.length));
    }

    success(`Profile "${newProfile.getLabel()}" is set to controller`);
  } catch (err) {
    const hidError = parseHIDError(err);
    showError(`Failed to save profile: ${hidError.message}`);
  }
}

</script>

<template>
  <ToastContainer />
  <section v-if="!edgeHIDController" class="connect-controller-container">
    <section class="connect-controller-content">
      <div class="connect-controller-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 11H8M18 11H16M17 8V14M7 8V10M10 15C10 15 11 16 12 16C13 16 14 15 14 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 10C2 7.17157 2 5.75736 2.87868 4.87868C3.75736 4 5.17157 4 8 4H16C18.8284 4 20.2426 4 21.1213 4.87868C22 5.75736 22 7.17157 22 10V14C22 16.8284 22 18.2426 21.1213 19.1213C20.2426 20 18.8284 20 16 20H8C5.17157 20 3.75736 20 2.87868 19.1213C2 18.2426 2 16.8284 2 14V10Z" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </div>
      <h2 class="connect-controller-header">Controller Not Detected</h2>
      <p class="connect-controller-text">Connect your DualSense Edge controller via USB to get started.</p>
      <button class="connect-controller-button" @click="getDevice">
        <span>Connect Controller</span>
      </button>
    </section>
  </section>
  <section v-else class="container">
    <ProfileOverview @selected-profile="setSelectedProfile"
                     @save-to-controller="saveProfile"
                     :profiles="profiles"
                     class="profile-overview"/>
    <Configurator @save="saveProfile"
                  :is-saved-profile="hasSelectedSavedProfile"
                  :selected-profile="selectedProfile"
                  class="configurator"/>
  </section>
</template>

<style scoped>
.container {
  width: 100%;
  display: flex;
  min-height: 100vh;
}

.profile-overview {
  width: var(--sidebar-width);
  flex-shrink: 0;
}

.configurator {
  flex: 1;
  background-color: var(--bg-primary);
}

.connect-controller-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-primary);
  width: 100%;
}

.connect-controller-content {
  background-color: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius-xl);
  padding: 48px 56px;
  text-align: center;
  max-width: 440px;
  box-shadow: var(--shadow-lg);
}

.connect-controller-icon {
  margin-bottom: 24px;
}

.connect-controller-icon svg {
  width: 72px;
  height: 72px;
  color: var(--accent-blue);
  animation: iconPulse 2.5s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% { 
    opacity: 0.7;
    transform: scale(1);
  }
  50% { 
    opacity: 1;
    transform: scale(1.05);
  }
}

.connect-controller-header {
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 12px 0;
  letter-spacing: -0.02em;
}

.connect-controller-text {
  color: var(--text-secondary);
  margin: 0 0 28px 0;
  line-height: 1.5;
  font-size: 0.95rem;
}

.connect-controller-button {
  background-color: var(--accent-blue);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  padding: 14px 36px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all var(--transition-smooth);
  box-shadow: 0 0 0 0 var(--accent-blue-glow);
}

.connect-controller-button:hover {
  background-color: var(--accent-blue-hover);
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}

.connect-controller-button:active {
  transform: translateY(0);
}
</style>
