<script setup>
  import Page from "../components/Page.vue"
  import Link from "../components/Link.vue"
  import { site } from "../lib/site.js"

  site.selected = "/tools"

  const tools = [
    ["minecrafttitleconverter", "Minecraft Title Converter", "A tool that allows you to convert any image into the Minecraft title texture format so you can use it in a resource pack.", "minecraft/minecrafttitle.webp"],
    ["ctmconverter", "CTM Converter", "A tool that allows you to convert compact CTM to either full CTM, or overlay CTM.", "minecraft/ctm.webp", true],
    ["mojangconverter", "Mojang Converter", "A tool that allows you to convert the Mojang Studios logo texture between the 1.15 and 1.16 formats.", "minecraft/mojangstudios.webp"],
    ["chestconverter", "Chest Converter", "A tool that allows you to convert the chest textures between the 1.14 and 1.15 formats.", "minecraft/chests.webp"],
    ["bedconverter", "Bed Converter", "A tool that allows you to convert a bed entity texture into the 26.2 block format, splitting it into the individual face textures.", "minecraft/beds.webp"],
    ["mobblockvariants", "Mob Block Variants", "A tool that edits a block's blockstate so a chosen mob (snow golem, mooshroom, iron golem) always shows a variant of your choice, while keeping it rare on placed blocks.", "minecraft/mobblockvariants.webp"],
    ["placedblockvariants", "Placed Block Variants", "A tool that forces the blocks at chosen coordinates to render specific variants, so the same block type renders differently depending on where it is placed.", "minecraft/placedblockvariants.webp"],
    ["dungeons2skinconverter", "Custom Skin Converter for Minecraft Dungeons II", "A tool that converts a Minecraft Java skin or cape into the Minecraft Dungeons II layout for the Custom Skin Loader mod, with a live preview of the face.", "dungeons2/skinconverter.webp"],
    ["colormapgenerator", "Biome Colormap Generator", "A tool that generates Minecraft biome colormaps for any version, including OptiFine grid colormaps, biome ID lists, and a map of where each biome sits on the vanilla colormap.", "minecraft/biomecolormaps.webp"]
  ]
</script>

<template>
  <Page>
    <div class="container">
      <h1>Tools</h1>
      <div id="tools">
        <Link v-for="[id, name, description, image, spacer] of tools" class="tool" :to="`/tools/${id}`">
          <div class="details">
            <h2>{{ name }}</h2>
            <p>{{ description }}</p>
            <div v-if="spacer" class="spacer"></div>
          </div>
          <div class="image">
            <img :src="`/assets/images/${image}`">
          </div>
        </Link>
      </div>
    </div>
  </Page>
</template>

<style lang="stylus" scoped>
  .container
    max-width: calc(var(--content-width) + 40px)
    margin: 0 auto
    padding: 0 20px
    display: flex
    flex-direction: column
  
  h1
    margin: 0
    padding: 22px 0

  h2
    margin: 0

  #tools
    display: flex
    flex-direction: column
    gap: 20px
    padding-bottom: 20px

  .tool
    background-color: var(--color-grey)
    padding: 20px
    display: flex
    gap: 20px
    justify-content: space-between
    box-shadow: var(--box-shadow)
    color: var(--color-text-white)
    text-decoration: none
    transition: background-color .15s

    &:hover
      background-color: var(--color-grey-light)

  .details
    display: flex
    flex-direction: column
    flex: 1

  .spacer
    flex: 1

  .image
    display: flex

  img
    max-height: 224px
    max-width: 100%
    box-shadow: var(--box-shadow)
  
  @media only screen and (max-width: 768px)
    .tool
      flex-direction: column
      align-items: center
    
    .details
      width: 100%
    
    img
      margin: auto
</style>
