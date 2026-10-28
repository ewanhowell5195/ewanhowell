<script setup>
defineOptions({ inheritAttrs: false })
defineProps({ to: String })
</script>

<template>
  <RouterLink :to="to" custom v-slot="{ href, navigate }">
    <a v-bind="$attrs" :href="href" @click="navigate"><slot></slot></a>
  </RouterLink>
</template>
