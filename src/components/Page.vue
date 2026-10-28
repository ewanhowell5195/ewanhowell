<script setup>
defineProps({
  loading: Boolean,
  progress: Object
})
</script>

<template>
  <div class="page" :class="{ loading }">
    <div class="progress-bar" :style="progress?.style"></div>
    <div class="page-body"><slot></slot></div>
  </div>
</template>
