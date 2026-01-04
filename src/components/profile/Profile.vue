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
  padding: 12px 16px;
  cursor: pointer;
  align-items: center;
  transition: all var(--transition-base);
  border-left: 3px solid transparent;
  position: relative;
}

.item::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(0, 112, 209, 0.08) 0%, transparent 100%);
  opacity: 0;
  transition: opacity var(--transition-base);
  pointer-events: none;
}

.item:hover::before {
  opacity: 1;
}

.item:hover {
  border-left-color: var(--accent-blue-subtle);
}

p {
  margin: 0;
  padding: 0;
}

.label {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
}
</style>