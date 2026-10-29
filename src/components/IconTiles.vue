<script setup>
  defineProps({
    icon: String,
    rows: Number,
    columns: Number
  })
</script>

<template>
  <div class="icon-tiles" :style="{ '--tile': `url(&quot;${icon}&quot;)` }">
    <div v-for="row of rows" class="tile-row">
      <div v-for="tile of columns" class="tile"></div>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
  .icon-tiles
    position: absolute
    inset: -50%
    display: flex
    flex-direction: column
    justify-content: center
    align-items: center
    gap: 4px
    transform: rotate(15deg)
    opacity: .25
    pointer-events: none

  .tile-row
    display: flex
    gap: 4px
    flex-shrink: 0

    &:nth-child(even)
      translate: 26px

  .tile
    width: 48px
    height: 48px
    flex-shrink: 0
    background-image: var(--tile)
    background-size: contain
    image-rendering: pixelated
</style>
