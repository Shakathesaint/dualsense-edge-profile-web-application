<script setup lang="ts">
import Profile from "../../model/Profile";

defineProps({
  profile: {
    type: Profile,
    required: true,
  }
});
defineEmits([
  'selected-profile'
]);

</script>
<template>
  <section class="item" @click="$emit('selected-profile', profile)">
    <p class="label">{{ profile.getLabel() }}</p>
    <div>
      <slot/>
    </div>
  </section>
</template>

<style scoped>
.item {
  display: flex;
  justify-content: space-between;
  padding: 12px 20px;
  cursor: pointer;
  align-items: center;
  transition: background-color 0.15s ease;
  border-left: 3px solid transparent;
}

.item:hover {
  background-color: var(--bg-card);
}

p {
  margin: 0;
  padding: 0;
}

.label {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.95rem;
}
</style>