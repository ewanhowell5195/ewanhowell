<script setup>
  import { watch, nextTick } from "vue"
  import { analytics } from "../lib/utils.js"

  const props = defineProps({
    loading: Boolean,
    progress: Object
  })

  watch(() => props.loading, loading => {
    if (!loading) nextTick(analytics)
  }, { immediate: true })
</script>

<template>
  <div class="page" :class="{ loading }">
    <div class="progress-bar" :style="progress?.style"></div>
    <div class="page-body"><slot></slot></div>
  </div>
</template>
