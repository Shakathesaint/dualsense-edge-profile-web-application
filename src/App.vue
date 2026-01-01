<script setup lang="ts">
import ProfileOverview from "./components/profile/ProfileOverview.vue";
import Configurator from "./components/Configurator.vue";
import {provide, Ref, ref} from "vue";
import {bytesArrayToProfile, profileToBytes, validateProfileReports} from "./helper/bytesToProfile";
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
    profileCollector.forEach((profileReports: Uint8Array[], profileIndex: number) => {
      if (!profileReports.length) {
        return;
      }
      const validationError = validateProfileReports(profileReports, profileIndex);
      if (validationError) {
        showError(validationError);
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
    for (const bytes of bytesArray) {
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
      <h3 class="connect-controller-header">DualSense Edge controller not detected!</h3>
      <p class="connect-controller-text">Please (re)connect your controller.</p>
      <button class="connect-controller-button" @click="getDevice">Connect controller</button>
    </section>
  </section>
  <section v-else class="container">
    <ProfileOverview @selected-profile="setSelectedProfile"
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
  border-radius: var(--border-radius-lg);
  padding: 40px 48px;
  text-align: center;
  max-width: 400px;
  box-shadow: var(--shadow-lg);
}

.connect-controller-header {
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.connect-controller-text {
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.connect-controller-button {
  background-color: var(--accent-blue);
  color: var(--text-primary);
  border: none;
  border-radius: var(--border-radius-md);
  padding: 12px 32px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.connect-controller-button:hover {
  background-color: var(--accent-blue-hover);
}
</style>
