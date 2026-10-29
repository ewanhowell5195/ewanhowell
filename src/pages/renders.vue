<script setup>
  import Page from "../components/Page.vue"
  import { site } from "../lib/site.js"

  site.selected = "/renders"

  const renders = ["aerial_faith_plate", "bb-8", "claptrap", "claw", "combine_turret", "companion_cube", "cyclone", "dog", "ewan", "glados", "loader", "manhack", "panel", "pickup_truck", "room", "room_new", "runner", "sabre_turret", "snowplough", "space_core", "storage_cube", "storage_cube_active", "striderchan", "tank", "turret", "wall-e", "warden", "wheatley", "wheatley_evil_glados", "worm", "wynem", "wynem2", "x-wing"]
</script>

<template>
  <Page>
    <div class="container">
      <h1>Renders</h1>
      <div class="renders" data-popupable-group="renders" data-popupable-zoomable>
        <div v-for="id of renders" :id="id" :style="{ backgroundImage: `url(/assets/images/renders/${id}.webp)` }" data-popupable :src="`/assets/images/renders/4k/${id}.webp`" :data-popupable-thumb="`/assets/images/renders/${id}.webp`"></div>
      </div>
    </div>
  </Page>
</template>

<style lang="stylus" scoped>
  .container
    max-width: calc(var(--content-width) + 40px)
    margin: 0 auto
    padding: 0 20px
  
  h1
    margin: 0
    padding: 22px 0
  
  .renders
    display: grid
    grid-template-columns: repeat(auto-fill, minmax(256px, 1fr))
    justify-content: space-around
    gap: 10px
    padding-bottom: 20px
    
    > div
      min-width: 256px
      height: 128px
      background-position: 50% 50%
      background-size: cover
      cursor: pointer
      box-shadow: var(--box-shadow)
</style>
