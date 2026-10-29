<script setup>
  import { computed } from "vue"
  import { iconIsFile } from "../lib/pluginRepo.js"

  const props = defineProps({ icon: String })

  const image = computed(() => /^https?:/.test(props.icon) || iconIsFile(props.icon))
</script>

<template>
  <span class="plugin-icon" :class="{ glyph: !image }">
    <img v-if="image" :src="icon" alt="">
    <i v-else class="material-symbols-outlined">{{ icon }}</i>
  </span>
</template>

<style lang="stylus" scoped>
  .plugin-icon
    display: flex
    align-items: center
    justify-content: center
    container-type: size
    user-select: none

    &.glyph
      background-color: var(--color-grey-dark)
      border-radius: calc(100% / 6)

  img
    width: 100%
    height: 100%
    object-fit: contain
    border-radius: calc(100% / 6)
    image-rendering: pixelated

  i
    font-size: calc(200cqw / 3)
    color: var(--color-text-white)
</style>
