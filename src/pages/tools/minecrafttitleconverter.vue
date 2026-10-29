<script setup>
  import { shallowRef } from "vue"
  import Page from "../../components/Page.vue"
  import FileInput from "../../components/FileInput.vue"
  import Icon from "../../components/Icon.js"
  import { Canvas, loadImage } from "../../lib/canvas.js"
  import { site } from "../../lib/site.js"

  site.selected = null

  const base = "data:image/png;base64,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"

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

  function newConvert(img) {
    const input = new Canvas(img.width, img.height)
    input.getContext("2d").drawImage(img, 0, 0)
    input.trim()
    const canvas = new Canvas(1024, 256, true)
    const ctx = canvas.getContext("2d")
    const scaleFactor = Math.min(1024 / input.width, 176 / input.height)
    const newWidth = input.width * scaleFactor
    const newHeight = input.height * scaleFactor
    const x = (1024 - newWidth) / 2
    const y = (176 - newHeight) / 2
    if (newWidth > input.width) ctx.imageSmoothingEnabled = false
    ctx.drawImage(input, x, y, newWidth, newHeight)
    return canvas
  }

  async function convert(files) {
    error.value = false
    result.value = null
    const file = files.filter(e => e.type === "image/png")[0]
    if (!file) return error.value = true
    const img = await loadImage(file)
    const aspect = img.width / img.height
    let w, h
    if (img.width > 1024 || img.height > 1024) {
      if (aspect > 1) {
        w = 1024
        h = Math.floor(1024 / aspect)
      } else {
        h = 1024
        w = Math.floor(1024 * aspect)
      }
    } else {
      w = img.width
      h = img.height
    }
    const canvas = new Canvas(w, h, true, 1024)
    const ctx = canvas.getContext("2d")
    if (img.width < 64 || img.height < 64) ctx.imageSmoothingEnabled = false
    ctx.drawImage(img, 0, 0, w, h)
    canvas.trim()
    const baseImage = await loadImage(base)
    let oldPreCanvas
    if (canvas.width / canvas.height < 137 / 22) {
      oldPreCanvas = new Canvas(Math.floor((canvas.height / 22) * 137), canvas.height)
      oldPreCanvas.getContext("2d").drawImage(canvas, Math.floor((oldPreCanvas.width - canvas.width) / 2), 0)
    } else if (canvas.width / canvas.height > 137 / 22) {
      oldPreCanvas = new Canvas(canvas.width, Math.floor((canvas.width / 137) * 22))
      oldPreCanvas.getContext("2d").drawImage(canvas, 0, Math.floor((oldPreCanvas.height - canvas.height) / 2))
    } else oldPreCanvas = canvas
    const oldCanvas = new Canvas(Math.floor((oldPreCanvas.width / 137) * 128), Math.floor((oldPreCanvas.width / 137) * 128), true, 1024)
    const oldCtx = oldCanvas.getContext("2d")
    oldCtx.imageSmoothingEnabled = false
    oldCtx.drawImage(baseImage, 0, 0, oldCanvas.width, oldCanvas.height)
    const width = Math.floor((oldPreCanvas.width / 274) * 155)
    oldCtx.drawImage(oldPreCanvas, 0, 0, width, oldPreCanvas.height, 0, 0, width, oldPreCanvas.height)
    oldCtx.drawImage(oldPreCanvas, width, 0, oldPreCanvas.width - width, oldPreCanvas.height, 0, Math.floor(oldPreCanvas.height / 44 * 45), oldPreCanvas.width - width, oldPreCanvas.height)
    const newOutput = newConvert(canvas)
    let convertedOutput
    if (img.width === img.height) {
      const m = img.width / 256
      const w = Math.floor(m * 155)
      const w2 = Math.floor(m * 119)
      const h = Math.floor(m * 44)
      const h2 = Math.floor(m * 45)
      const convertCanvas = new Canvas(w + w2, h, true, 1024)
      const ctx = convertCanvas.getContext("2d")
      ctx.drawImage(img, 0, 0, w, h, 0, 0, w, h)
      ctx.drawImage(img, 0, h2, w2, h, w, 0, w2, h)
      convertedOutput = newConvert(convertCanvas)
    }
    result.value = { canvas, newOutput, oldCanvas, convertedOutput }
  }
</script>

<template>
  <Page>
    <div class="container">
      <h1>Minecraft Title Converter</h1>
      <p>This is a tool that allows you to convert any image into the Minecraft title texture format so you can use it in a resource pack.</p>
      <p>This is also available as a <a href="https://wynem.com/commands/prefix/minecraft/resourcepacks/minecrafttitleconverter" target="_blank">command on Discord</a>.</p>
      <br>
      <p>Optimal image sizes: Any multiple of <strong>274x44</strong>. Other image sizes should work though.</p>
      <p>Please provide the texture you would like to convert into a Minecraft title texture.</p>
      <FileInput @change="convert" />
      <div id="output">
        <template v-if="error">Please provide a PNG file</template>
        <template v-else-if="result">
          <h2>Input image</h2>
          <canvas v-canvas="result.canvas"></canvas>
          <div id="generated">
            <div class="output-container">
              <div>
                <h2>minecraft.png</h2>
                <p>This texture is used in 1.20 and newer versions.</p>
                <div class="button-download" @click="result.newOutput.saveAs('minecraft.png')"><Icon name="download" /><span>Download</span></div>
              </div>
              <div class="canvas-container"><canvas v-canvas="result.newOutput"></canvas></div>
            </div>
            <div class="output-container">
              <div>
                <h2>minecraft.png</h2>
                <p>This texture is used in 1.19 and older versions.</p>
                <div class="button-download" @click="result.oldCanvas.saveAs('minecraft.png')"><Icon name="download" /><span>Download</span></div>
              </div>
              <div class="canvas-container"><canvas v-canvas="result.oldCanvas"></canvas></div>
            </div>
          </div>
          <div v-if="result.convertedOutput" class="output-container">
            <div>
              <h2>minecraft.png</h2>
              <p>The 1.19 format converted into the 1.20 format.</p>
              <div class="button-download" @click="result.convertedOutput.saveAs('minecraft.png')"><Icon name="download" /><span>Download</span></div>
            </div>
            <div class="canvas-container"><canvas v-canvas="result.convertedOutput"></canvas></div>
          </div>
        </template>
      </div>
    </div>
  </Page>
</template>

<style lang="stylus" scoped>
  @import "../../styles/buttons.styl"

  .container
    max-width: calc(var(--content-width) + 40px)
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

  canvas
    image-rendering: pixelated
    background-image: url("/assets/images/misc/transparent_dark.webp")
    box-shadow: var(--box-shadow)
    width: 512px
    max-width: calc(100vw - 80px)

  .output-container
    width: 100%
    display: flex
    gap: 20px
    flex-wrap: wrap
    padding-top: 60px

  .canvas-container
    display: flex
    align-items: center
</style>
