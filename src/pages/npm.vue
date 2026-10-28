<script setup>
import Page from "../components/Page.vue"
import { site } from "../lib/site.js"

site.selected = "/npm"

const groups = [
  ["Web", [
    ["https://popupable.ewanhowell.com", "popupable", "A lightweight, zero-dependency lightbox library using modern JavaScript and CSS, with support for galleries, zoom, and pinch gestures."],
    ["https://easy-tooltips.ewanhowell.com", "easy-tooltips", "A lightweight, zero-dependency tooltip library using modern JavaScript and CSS, with data-attribute configuration and keyboard support."],
    ["https://fluid-marquee.ewanhowell.com", "fluid-marquee", "A lightweight, zero-dependency marquee/scrolling content library using modern JavaScript and CSS."]
  ]],
  ["Node", [
    ["https://www.npmjs.com/package/block-model-renderer", "block-model-renderer", "Minecraft block and item model rendering for Node.js, supporting textures, animations, and custom display settings."],
    ["https://www.npmjs.com/package/headless-three", "headless-three", "Headless Three.js rendering for Node.js, made simple. Render 3D scenes server-side with WebGL."],
    ["https://www.npmjs.com/package/headless-three-gltf", "headless-three-gltf", "A GLTFLoader for headless-three, adding support for loading GLTF and GLB models in a headless Three.js environment."],
    ["https://www.npmjs.com/package/skia-canvas-draw-text", "skia-canvas-draw-text", "A function to make drawing text easier with skia-canvas, supporting wrapping, alignment, gravity, and shadows."],
    ["https://www.npmjs.com/package/simple-gtts", "simple-gtts", "A simple Google text-to-speech wrapper for Node.js for generating spoken audio from text."]
  ]],
  ["Universal", [
    ["https://www.npmjs.com/package/easyjsontools", "easyjsontools", "Tools for working with JSON objects, including utilities for cleaning and ensuring JSON structure."],
    ["https://www.npmjs.com/package/emoji-info", "emoji-info", "A library to get detailed information about emojis, including names, categories, and metadata."]
  ]]
]
</script>

<template>
  <Page>
    <div class="container">
      <h1>NPM Modules</h1>
      <template v-for="[heading, modules] of groups">
        <h2 class="group-heading">{{ heading }}</h2>
        <div class="modules">
          <a v-for="[href, name, description] of modules" class="module" :href="href" target="_blank">
            <h2>{{ name }}</h2>
            <p>{{ description }}</p>
          </a>
        </div>
      </template>
    </div>
  </Page>
</template>

<style lang="stylus" scoped>
.container
  max-width: var(--content-width)
  margin: 0 auto
  padding: 0 20px
  display: flex
  flex-direction: column

h1
  margin: 0
  padding: 22px 0

.group-heading
  margin: 0
  padding: 10px 0 16px

.module h2
  margin: 0
  font-family: monospace, monospace
  word-break: break-word

.modules
  display: grid
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))
  gap: 20px
  padding-bottom: 20px

.module
  background-color: var(--color-grey)
  padding: 20px
  display: flex
  flex-direction: column
  gap: 10px
  box-shadow: var(--box-shadow)
  color: var(--color-text-white)
  text-decoration: none
  transition: background-color .15s

  &:hover
    background-color: var(--color-grey-light)

p
  margin: 0

</style>
