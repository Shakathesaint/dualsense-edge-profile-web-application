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

const db = new LocalIndexDB('ds-edge-profiles');
provide('db', db);

const { success } = useToast();

let edgeHIDController: Ref<HIDDevice | undefined> = ref();
provide('HIDController', edgeHIDController);

let profiles = ref();
let selectedProfile = ref();
let hasSelectedSavedProfile = ref(false);

const FILTERS = {
  vendorId: 0x054C, // Sony Interactive Entertainment
  productId: 0x0DF2 // DualSense Edge Wireless Controller
};

const getProfiles = async () => {
  if (edgeHIDController.value) {
    let profileCollector: Array<Array<Array<number>>> = [[]];
    let cIndex = 0;
    for (let i = 112; i < 124; i++) {
      if (cIndex % 3 === 0 && cIndex !== 0) {
        profileCollector.push([]);
      }
      let data: DataView = await edgeHIDController.value.receiveFeatureReport(i);
      profileCollector[profileCollector.length - 1].push(Array.from(new Uint8Array(data.buffer)));
      cIndex++;
    }
    let foundProfiles: Array<Profile> = [];
    profileCollector.forEach((profile: number[][]) => {
      foundProfiles.push(bytesArrayToProfile(profile));
    });
    profiles.value = foundProfiles;
  }
}
// Used for refreshing profiles called by child component(s)
provide('getProfiles', getProfiles);

const getDevice = () => {
  navigator.hid!.requestDevice({filters: [FILTERS]}).then(devices => {
    const controller = devices[0];

    controller.open().then(() => {
      edgeHIDController.value = controller;
      getProfiles();
    });
  });
}

navigator.hid!.addEventListener("connect", ({device}) => {
  if (device.productId === FILTERS.productId && device.vendorId === FILTERS.vendorId) {
    device.open().then(() => {
      edgeHIDController.value = device;
      getProfiles();
    });
  }
});

navigator.hid!.addEventListener("disconnect", ({device}) => {
  if (device.productId === FILTERS.productId && device.vendorId === FILTERS.vendorId) {
    edgeHIDController.value = undefined;
    selectedProfile.value = null;
    profiles.value = null;
  }
});

navigator.hid!.getDevices().then(devices => {
  if (devices.length) {
    devices.forEach(device => {
      if (device.productId === FILTERS.productId && device.vendorId === FILTERS.vendorId) {
        device.open().then(() => {
          edgeHIDController.value = device;
          getProfiles();
        });
      }
    });
  }
});

const setSelectedProfile = (setSelectedProfile: Profile, isSavedProfile: boolean = false) => {
  hasSelectedSavedProfile.value = isSavedProfile;
  selectedProfile.value = setSelectedProfile;
}

const saveProfile = (newProfile: Profile) => {
  if (edgeHIDController.value) {
    let bytesArray = profileToBytes(newProfile);

    //TODO make it possible to function using bluetooth instead of relying on USB protocol
    bytesArray.map(async bytes => {
      let ident = bytes[0];

      bytes.set(arrayCRC32LeBLE(new Uint8Array([0xA3, ...bytes])), bytes.length - 4);

      await edgeHIDController.value?.sendFeatureReport(ident, bytes.slice(1, bytes.length));
    });
    success(`Profile "${newProfile.getLabel()}" is set to controller`);
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
