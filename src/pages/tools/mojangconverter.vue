<script setup>
import { shallowRef } from "vue"
import Page from "../../components/Page.vue"
import FileInput from "../../components/FileInput.vue"
import Icon from "../../components/Icon.js"
import { Canvas, loadImage } from "../../lib/canvas.js"
import { site } from "../../lib/site.js"

site.selected = null

const error = shallowRef(false)
const result = shallowRef(null)

const vCanvas = {
  mounted(el, { value }) {
    mountCanvas(el, value)
  },
  updated(el, { value, oldValue }) {
    if (value === oldValue) return
    oldValue.replaceWith(el)
    mountCanvas(el, value)
  },
  beforeUnmount(el, { value }) {
    value.replaceWith(el)
  }
}

function mountCanvas(el, canvas) {
  for (const attr of el.attributes) canvas.setAttribute(attr.name, attr.value)
  el.replaceWith(canvas)
}

async function convert(files) {
  error.value = false
  result.value = null
  const file = files.filter(e => e.type === "image/png")[0]
  if (!file) return error.value = true
  const image = await loadImage(file)
  const img = new Canvas(image.width, image.height)
  img.getContext("2d").drawImage(image, 0, 0)
  const size = Math.max(img.width, img.height)
  const canvas = new Canvas(size, size, true, 1024)
  canvas.getContext("2d").drawImage(img, -img.width / 2 + size / 2, -img.height / 2 + size / 2)
  canvas.trim()
  let oldCanvasOutput
  if (img.width === img.height) {
    const oldCanvas = new Canvas(img.width * 2, Math.floor(img.width / 2))
    const oldCanvasCtx = oldCanvas.getContext("2d")
    oldCanvasCtx.drawImage(img, 0, 0, img.width, Math.floor(img.width / 2), 0, 0, img.width, Math.floor(img.width / 2))
    oldCanvasCtx.drawImage(img, 0, Math.floor(img.width / 2), img.width, Math.floor(img.width / 2), img.width, 0, img.width, Math.floor(img.width / 2))
    oldCanvas.trim()
    oldCanvasOutput = new Canvas(oldCanvas.width, oldCanvas.width, true, 1024)
    oldCanvasOutput.getContext("2d").drawImage(oldCanvas, 0, Math.floor((oldCanvas.width - oldCanvas.height) / 2))
  } else {
    img.trim()
    const size = Math.max(img.width, img.height)
    oldCanvasOutput = new Canvas(size, size, true, 1024)
    oldCanvasOutput.getContext("2d").drawImage(img, (oldCanvasOutput.width - img.width) / 2, (oldCanvasOutput.height - img.height) / 2)
  }
  img.trim()
  let newCanvas
  if (img.width < img.height * 4) {
    newCanvas = new Canvas(img.height * 4 + 8, img.height + 2)
    newCanvas.getContext("2d").drawImage(img, Math.floor((img.height * 4 - img.width) / 2) + 4, 1)
  } else if (img.width > img.height * 4) {
    newCanvas = new Canvas(img.width + 8, Math.floor(img.width / 4) + 2)
    newCanvas.getContext("2d").drawImage(img, 4, Math.floor((newCanvas.height - img.height) / 2))
  } else {
    newCanvas = new Canvas(img.width + 8, img.height + 4)
    newCanvas.getContext("2d").drawImage(img, 4, 1)
  }
  const newCanvasOutput = new Canvas(Math.floor(newCanvas.width / 2), Math.floor(newCanvas.width / 2), true, 1024)
  const newCanvasOutputCtx = newCanvasOutput.getContext("2d")
  newCanvasOutputCtx.drawImage(newCanvas, 0, 0)
  newCanvasOutputCtx.drawImage(newCanvas, Math.floor(-newCanvas.width / 2), Math.floor(newCanvas.width / 4))
  result.value = { canvas, newCanvasOutput, oldCanvasOutput }
}
</script>

<template>
  <Page>
    <div class="container">
      <h1>Mojang Converter</h1>
      <p>This is a tool that allows you to convert the Mojang Studios logo texture between the 1.15 and 1.16 formats.</p>
      <p>This can also be used to convert any image into a valid <strong>mojangstudios</strong> texture.</p>
      <p>This is also available as a <a href="https://wynem.com/commands/prefix/minecraft/resourcepacks/mojangconverter" target="_blank">command on Discord</a>.</p>
      <br>
      <p>Please provide your <strong>mojang.png</strong> or <strong>mojangstudios.png</strong> file.</p>
      <FileInput @change="convert" />
      <div id="output">
        <template v-if="error">Please provide a PNG file</template>
        <template v-else-if="result">
          <h2>Input image</h2>
          <canvas v-canvas="result.canvas"></canvas>
          <p>Only one of the following outputs will be correct, depending on if the input image was in the 1.15 or 1.14 format.</p>
          <div id="generated">
            <div class="output-container">
              <div>
                <h2>mojangstudios.png</h2>
                <p>This texture is used in 1.16 and newer versions.</p>
                <div class="button-download" @click="result.newCanvasOutput.saveAs('mojangstudios.png')"><Icon name="download" /><span>Download</span></div>
              </div>
              <canvas v-canvas="result.newCanvasOutput"></canvas>
            </div>
            <div class="output-container">
              <div>
                <h2>mojang.png</h2>
                <p>This texture is used in 1.15 and older versions.</p>
                <div class="button-download" @click="result.oldCanvasOutput.saveAs('mojang.png')"><Icon name="download" /><span>Download</span></div>
              </div>
              <canvas v-canvas="result.oldCanvasOutput"></canvas>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Page>
</template>

<style lang="stylus" scoped>
@import "../../styles/buttons.styl"

.container
  max-width: var(--content-width)
  margin: 0 auto
  min-height: calc(100% - var(--header-height))
  padding: 0 20px
  display: flex
  flex-direction: column

h1
  margin: 0
  padding: 22px 0 0

p
  white-space: pre-wrap

a
  color: var(--color-link-blue)

#output
  padding: 20px 20px 40px

#output, #generated
  display: flex
  gap: 20px
  align-items: flex-start
  flex-direction: column

canvas
  image-rendering: pixelated
  background-image: url("/assets/images/misc/transparent_dark.webp")
  box-shadow: var(--box-shadow)
  width: 512px
  max-width: calc(100vw - 80px)

.output-container
  width: 100%
  display: flex
  justify-content: space-between
  gap: 20px
  flex-wrap: wrap
</style>
