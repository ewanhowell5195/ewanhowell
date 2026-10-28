<script setup>
  import { shallowRef, reactive, markRaw, nextTick } from "vue"
  import JSZip from "jszip"
  import { saveAs } from "file-saver"
  import Page from "../../components/Page.vue"
  import FileInput from "../../components/FileInput.vue"
  import Icon from "../../components/Icon.js"
  import { Canvas, loadImage } from "../../lib/canvas.js"
  import { site } from "../../lib/site.js"

  site.selected = null

  const message = shallowRef(null)
  const error = shallowRef(null)
  const tiles = shallowRef([])
  const generated = shallowRef(null)
  let nextId = 0

  const vDraw = {
    mounted: draw,
    updated(el, binding) {
      if (binding.value !== binding.oldValue) draw(el, binding)
    }
  }

  function draw(el, { value }) {
    el.width = value.width
    el.height = value.height
    el.getContext("2d").drawImage(value, 0, 0)
  }

  function reset() {
    message.value = null
    error.value = null
    tiles.value = []
    generated.value = null
  }

  async function onChange(fileList) {
    reset()
    const files = fileList.filter(e => e.type === "image/png")
    if (!files.length || !(files.length === 1 || files.length === 5)) return message.value = "Please provide either 1 PNG file, or 5 PNG files"
    const images = []
    if (files.length === 1) {
      const image = await loadImage(files[0])
      if (image.width !== image.height * 5) return error.value = { title: "Invalid compact CTM", html: "The provided image is an invalid compact CTM format." }
      for (let x = 0; x < 5; x++) {
        const canvas = new Canvas(image.height, image.height)
        canvas.getContext("2d").drawImage(image, -x * image.height, 0)
        images.push(canvas)
      }
    } else {
      for (let i = 0; i < files.length; i++) {
        const image = await loadImage(files[i])
        if (image.width !== image.height) return error.value = { title: "Invalid CTM tile", html: `CTM tiles must be square. Tile <strong>${i + 1}</strong> is <strong>${image.width}x${image.height}</strong>.` }
        if (images.length !== 0) if (image.width !== images[0].width || image.height !== images[0].height) return error.value = { title: "Invalid CTM tile", html: `Make sure all the tiles are the same size. Tile <strong>1</strong> is <strong>${images[0].width}x${images[0].height}</strong>, while tile <strong>${i}</strong> is <strong>${image.width}x${image.height}</strong>.` }
        const canvas = new Canvas(image.width, image.height)
        canvas.getContext("2d").drawImage(image, 0, 0)
        images.push(canvas)
      }
    }
    tiles.value = images.map(canvas => ({ id: nextId++, canvas }))
    generateCTM(true)
  }

  function move(from, to) {
    const arr = tiles.value.slice()
    arr.splice(to, 0, arr.splice(from, 1)[0])
    tiles.value = arr
    generateCTM()
  }

  async function generateCTM(animate) {
    const images = tiles.value.map(e => e.canvas)
    const img = new Canvas(images[0].width * 5, images[0].height)
    const ctx = img.getContext("2d")
    for (let i = 0; i < images.length; i++) {
      ctx.drawImage(images[i], i * images[i].width, 0)
    }
    const run = reactive({ id: nextId++, res: img.height, sizes: {}, done: {}, els: markRaw({}) })
    generated.value = run
    const multiplier = img.width / 80

    async function show(name, width, height) {
      run.sizes[name] = [Math.floor(width * multiplier), Math.floor(height * multiplier)]
      await nextTick()
      if (generated.value !== run) return
      const canvas = run.els[name]
      if (animate) canvas.scrollIntoView({
        block: "start",
        behavior: "smooth"
      })
      return canvas
    }

    const fullCanvas = await show("full", 192, 64)
    if (!fullCanvas) return
    const fullCtx = fullCanvas.getContext("2d")
    for (const [area, x, y] of fullMap) await paste(fullCtx, img, multiplier, area, x, y, animate)
    run.done.full = true
    const overlayCanvas = await show("overlay", 112, 48)
    if (!overlayCanvas) return
    const overlayCtx = overlayCanvas.getContext("2d")
    for (const [area, x, y] of overlayMap) await paste(overlayCtx, img, multiplier, area, x, y, animate)
    run.done.overlay = true
    const previewCanvas = await show("preview", 320, 176)
    if (!previewCanvas) return
    const previewCtx = previewCanvas.getContext("2d")
    const m = multiplier * 16
    for (const coord of previewCoords) {
      const [x, y, x2, y2] = coord.map(e => Math.floor(e * m))
      previewCtx.drawImage(fullCanvas, x, y, m, m, x2, y2, m, m)
      if (animate) await new Promise(fulfil => setTimeout(fulfil, 5))
    }
  }

  async function downloadCTM(img, res, tiles, type) {
    const width = Math.floor(img.width / res)
    const zip = new JSZip()
    const canvas = new Canvas(res, res)
    const ctx = canvas.getContext("2d")
    for (let h = 0; h < img.height; h += res) for (let w = 0; w < img.width; w += res) {
      const file = width * h / res + w / res
      if (file === tiles) break
      ctx.drawImage(img, w, h, res, res, 0, 0, res, res)
      zip.file(`${file}.png`, await new Promise(fulfil => canvas.toBlob(fulfil)))
      ctx.clearRect(0, 0, res, res)
    }
    zip.generateAsync({ type: "blob" }).then(content => {
      saveAs(content, `${type}_ctm.zip`)
    })
  }

  async function paste(ctx, img, multiplier, area, x, y, animate) {
    const [x2, y2, w, h] = coords[area].map(e => Math.floor(e * multiplier))
    ctx.drawImage(img, x2, y2, w, h, Math.floor(x * multiplier), Math.floor(y * multiplier), w, h)
    if (animate) await new Promise(fulfil => setTimeout(fulfil, 5))
  }

  const coords = {
    full: [0, 0, 16, 16],
    empty: [16, 0, 16, 16],
    emptyTop: [16, 0, 16, 8],
    emptyBottom: [16, 8, 16, 8],
    emptyLeft: [16, 0, 8, 16],
    emptyRight: [24, 0, 8, 16],
    emptyTopLeft: [16, 0, 8, 8],
    emptyTopRight: [24, 0, 8, 8],
    emptyBottomLeft: [16, 8, 8, 8],
    emptyBottomRight: [24, 8, 8, 8],
    leftRight: [32, 0, 16, 16],
    topBottom: [48, 0, 16, 16],
    corners: [64, 0, 16, 16],
    fullLeft: [0, 0, 8, 16],
    fullRight: [8, 0, 8, 16],
    fullTop: [0, 0, 16, 8],
    fullBottom: [0, 8, 16, 8],
    topBottomLeft: [48, 0, 8, 16],
    topBottomRight: [56, 0, 8, 16],
    leftRightTop: [32, 0, 16, 8],
    leftRightBottom: [32, 8, 16, 8],
    leftRightLeft: [32, 0, 8, 16],
    leftRightRight: [40, 0, 8, 16],
    topBottomTop: [48, 0, 16, 8],
    topBottomBottom: [48, 8, 16, 8],
    fullTopLeft: [0, 0, 8, 8],
    fullTopRight: [8, 0, 8, 8],
    fullBottomLeft: [0, 8, 8, 8],
    fullBottomRight: [8, 8, 8, 8],
    topBottomTopLeft: [48, 0, 8, 8],
    topBottomTopRight: [56, 0, 8, 8],
    topBottomBottomLeft: [48, 8, 8, 8],
    topBottomBottomRight: [56, 8, 8, 8],
    leftRightTopLeft: [32, 0, 8, 8],
    leftRightTopRight: [40, 0, 8, 8],
    leftRightBottomLeft: [32, 8, 8, 8],
    leftRightBottomRight: [40, 8, 8, 8],
    cornersTop: [64, 0, 16, 8],
    cornersBottom: [64, 8, 16, 8],
    cornersLeft: [64, 0, 8, 16],
    cornersRight: [72, 0, 8, 16],
    cornersTopLeft: [64, 0, 8, 8],
    cornersTopRight: [72, 0, 8, 8],
    cornersBottomLeft: [64, 8, 8, 8],
    cornersBottomRight: [72, 8, 8, 8],
    emptyTopLeft: [16, 0, 8, 8],
    emptyTopRight: [24, 0, 8, 8],
    emptyBottomLeft: [16, 8, 8, 8],
    emptyBottomRight: [24, 8, 8, 8],
    emptyLeft: [16, 0, 8, 16],
    emptyRight: [24, 0, 8, 16],
    emptyTop: [16, 0, 16, 8],
    emptyBottom: [16, 8, 16, 8]
  }

  const fullMap = [
    ["full", 0, 0],
    ["fullLeft", 16, 0],
    ["topBottomRight", 24, 0],
    ["topBottom", 32, 0],
    ["topBottomLeft", 48, 0],
    ["fullRight", 56, 0],
    ["fullTop", 0, 16],
    ["leftRightBottom", 0, 24],
    ["leftRight", 0, 32],
    ["leftRightTop", 0, 48],
    ["fullBottom", 0, 56],
    ["fullTopLeft", 16, 16],
    ["topBottomTopRight", 24, 16],
    ["topBottomTop", 32, 16],
    ["topBottomTopLeft", 48, 16],
    ["fullTopRight", 56, 16],
    ["leftRightBottomRight", 56, 24],
    ["leftRightRight", 56, 32],
    ["leftRightTopRight", 56, 48],
    ["fullBottomRight", 56, 56],
    ["topBottomBottomLeft", 48, 56],
    ["topBottomBottom", 32, 56],
    ["topBottomBottomRight", 24, 56],
    ["fullBottomLeft", 16, 56],
    ["leftRightTopLeft", 16, 48],
    ["leftRightLeft", 16, 32],
    ["leftRightBottomLeft", 16, 24],
    ["emptyBottomRight", 24, 24],
    ["emptyBottom", 32, 24],
    ["emptyBottomLeft", 48, 24],
    ["emptyLeft", 48, 32],
    ["emptyTopLeft", 48, 48],
    ["emptyTop", 32, 48],
    ["emptyTopRight", 24, 48],
    ["emptyRight", 24, 32],
    ["empty", 32, 32],
    ["fullTopLeft", 64, 0],
    ["topBottomTopRight", 72, 0],
    ["topBottomTopLeft", 80, 0],
    ["fullTopRight", 88, 0],
    ["leftRightBottomRight", 88, 8],
    ["leftRightTopRight", 88, 16],
    ["fullBottomRight", 88, 24],
    ["topBottomBottomLeft", 80, 24],
    ["topBottomBottomRight", 72, 24],
    ["fullBottomLeft", 64, 24],
    ["leftRightTopLeft", 64, 16],
    ["leftRightBottomLeft", 64, 8],
    ["cornersBottomRight", 72, 8],
    ["cornersBottomLeft", 80, 8],
    ["cornersTopLeft", 80, 16],
    ["cornersTopRight", 72, 16],
    ["leftRightLeft", 96, 0],
    ["cornersTopRight", 104, 0],
    ["topBottomTop", 112, 0],
    ["cornersBottomRight", 120, 8],
    ["leftRightRight", 120, 16],
    ["cornersBottomLeft", 112, 24],
    ["topBottomBottom", 96, 24],
    ["cornersTopLeft", 96, 16],
    ["cornersBottomRight", 104, 8],
    ["cornersBottomLeft", 112, 8],
    ["cornersTopLeft", 112, 16],
    ["cornersTopRight", 104, 16],
    ["cornersLeft", 128, 0],
    ["emptyTopRight", 136, 0],
    ["cornersTop", 144, 0],
    ["emptyBottomRight", 152, 8],
    ["cornersRight", 152, 16],
    ["emptyBottomLeft", 144, 24],
    ["cornersBottom", 128, 24],
    ["emptyTopLeft", 128, 16],
    ["cornersBottomRight", 136, 8],
    ["cornersBottomLeft", 144, 8],
    ["cornersTopLeft", 144, 16],
    ["cornersTopRight", 136, 16],
    ["emptyLeft", 160, 0],
    ["cornersRight", 168, 0],
    ["emptyTop", 176, 0],
    ["cornersBottom", 176, 8],
    ["emptyRight", 184, 16],
    ["cornersLeft", 176, 16],
    ["emptyBottom", 160, 24],
    ["cornersTop", 160, 16],
    ["leftRightLeft", 64, 32],
    ["cornersTopRight", 72, 32],
    ["topBottomTop", 80, 32],
    ["cornersBottomRight", 88, 40],
    ["leftRightRight", 88, 48],
    ["cornersBottomLeft", 80, 56],
    ["topBottomBottom", 64, 56],
    ["cornersTopLeft", 64, 48],
    ["emptyBottomRight", 72, 40],
    ["emptyBottomLeft", 80, 40],
    ["emptyTopLeft", 80, 48],
    ["emptyTopRight", 72, 48],
    ["leftRightLeft", 96, 32],
    ["emptyTopRight", 104, 32],
    ["topBottomTop", 112, 32],
    ["emptyBottomRight", 120, 40],
    ["leftRightRight", 120, 48],
    ["emptyBottomLeft", 112, 56],
    ["topBottomBottom", 96, 56],
    ["emptyTopLeft", 96, 48],
    ["cornersBottomRight", 104, 40],
    ["cornersBottomLeft", 112, 40],
    ["cornersTopLeft", 112, 48],
    ["cornersTopRight", 104, 48],
    ["emptyTop", 128, 32],
    ["emptyTop", 144, 32],
    ["emptyBottomRight", 152, 40],
    ["emptyTopRight", 152, 48],
    ["emptyBottom", 144, 56],
    ["emptyBottom", 128, 56],
    ["emptyTopLeft", 128, 48],
    ["emptyBottomLeft", 128, 40],
    ["cornersBottomRight", 136, 40],
    ["cornersBottomLeft", 144, 40],
    ["cornersTopLeft", 144, 48],
    ["cornersTopRight", 136, 48],
    ["cornersTopLeft", 160, 32],
    ["emptyTopRight", 168, 32],
    ["cornersBottomRight", 168, 40],
    ["emptyBottomLeft", 160, 40],
    ["emptyTopLeft", 176, 32],
    ["cornersTopRight", 184, 32],
    ["emptyBottomRight", 184, 40],
    ["cornersBottomLeft", 176, 40],
    ["corners", 160, 48]
  ]

  const overlayMap = [
    ["emptyLeft", 0, 0],
    ["emptyTopRight", 8, 0],
    ["emptyTop", 16, 0],
    ["emptyTopLeft", 32, 0],
    ["emptyRight", 40, 0],
    ["emptyRight", 40, 16],
    ["emptyRight", 40, 32],
    ["emptyBottomLeft", 32, 40],
    ["emptyBottom", 16, 40],
    ["emptyBottomRight", 8, 40],
    ["emptyLeft", 0, 32],
    ["emptyLeft", 0, 16],
    ["cornersBottomRight", 8, 8],
    ["topBottomBottom", 16, 8],
    ["cornersBottomLeft", 32, 8],
    ["leftRightLeft", 32, 16],
    ["cornersTopLeft", 32, 32],
    ["topBottomTop", 16, 32],
    ["cornersTopRight", 8, 32],
    ["leftRightRight", 8, 16],
    ["full", 16, 16],
    ["topBottomBottomLeft", 48, 8],
    ["fullBottomRight", 56, 8],
    ["leftRightTopRight", 56, 0],
    ["leftRightTopLeft", 64, 0],
    ["fullBottomLeft", 64, 8],
    ["topBottomBottomRight", 72, 8],
    ["topBottomTopRight", 72, 16],
    ["fullTopLeft", 64, 16],
    ["leftRightBottomLeft", 64, 24],
    ["leftRightBottomRight", 56, 24],
    ["fullTopRight", 56, 16],
    ["topBottomTopLeft", 48, 16],
    ["emptyTopLeft", 48, 0],
    ["emptyTopRight", 72, 0],
    ["emptyBottomRight", 72, 24],
    ["emptyBottomLeft", 48, 24],
    ["fullBottom", 80, 8],
    ["leftRightTop", 80, 0],
    ["fullLeft", 96, 0],
    ["topBottomRight", 104, 0],
    ["fullTop", 96, 16],
    ["leftRightBottom", 96, 24],
    ["fullRight", 88, 16],
    ["topBottomLeft", 80, 16]
  ]

  const previewCoords = [
    [0, 1, 2, 0],
    [0, 1, 6, 0],
    [1, 0, 1, 1],
    [9, 0, 2, 1],
    [3, 1, 3, 1],
    [1, 1, 5, 1],
    [9, 1, 6, 1],
    [2, 0, 7, 1],
    [2, 0, 8, 1],
    [2, 0, 9, 1],
    [5, 0, 10, 1],
    [1, 3, 2, 2],
    [5, 3, 3, 2],
    [6, 2, 5, 2],
    [3, 3, 6, 2],
    [4, 1, 10, 2],
    [7, 2, 11, 2],
    [5, 2, 12, 2],
    [2, 0, 13, 2],
    [2, 0, 14, 2],
    [7, 0, 15, 2],
    [3, 0, 16, 2],
    [0, 0, 18, 2],
    [4, 2, 3, 3],
    [2, 1, 4, 3],
    [7, 3, 5, 3],
    [1, 1, 7, 3],
    [2, 1, 8, 3],
    [3, 1, 9, 3],
    [1, 2, 11, 3],
    [3, 2, 12, 3],
    [0, 2, 15, 3],
    [0, 1, 0, 4],
    [4, 0, 2, 4],
    [4, 3, 3, 4],
    [11, 0, 4, 4],
    [6, 3, 5, 4],
    [7, 2, 6, 4],
    [9, 3, 7, 4],
    [2, 2, 8, 4],
    [8, 3, 9, 4],
    [2, 1, 10, 4],
    [10, 2, 11, 4],
    [3, 3, 12, 4],
    [1, 1, 14, 4],
    [10, 1, 15, 4],
    [3, 1, 16, 4],
    [0, 1, 18, 4],
    [6, 0, 0, 5],
    [2, 0, 1, 5],
    [7, 1, 2, 5],
    [0, 2, 4, 5],
    [1, 2, 6, 5],
    [2, 2, 7, 5],
    [2, 2, 8, 5],
    [2, 2, 9, 5],
    [2, 2, 10, 5],
    [3, 2, 11, 5],
    [1, 0, 13, 5],
    [11, 1, 14, 5],
    [2, 2, 15, 5],
    [10, 0, 16, 5],
    [2, 0, 17, 5],
    [10, 3, 18, 5],
    [3, 0, 19, 5],
    [0, 3, 0, 6],
    [4, 1, 2, 6],
    [7, 2, 3, 6],
    [10, 1, 4, 6],
    [5, 2, 5, 6],
    [4, 3, 6, 6],
    [9, 2, 7, 6],
    [2, 2, 8, 6],
    [8, 2, 9, 6],
    [2, 3, 10, 6],
    [11, 2, 11, 6],
    [3, 1, 12, 6],
    [1, 3, 14, 6],
    [11, 0, 15, 6],
    [3, 3, 16, 6],
    [0, 3, 18, 6],
    [6, 2, 3, 7],
    [2, 3, 4, 7],
    [5, 3, 5, 7],
    [1, 3, 7, 7],
    [2, 3, 8, 7],
    [3, 3, 9, 7],
    [1, 2, 11, 7],
    [3, 2, 12, 7],
    [0, 2, 15, 7],
    [1, 1, 2, 8],
    [7, 3, 3, 8],
    [4, 2, 5, 8],
    [3, 1, 6, 8],
    [4, 0, 10, 8],
    [4, 3, 11, 8],
    [6, 3, 12, 8],
    [2, 0, 13, 8],
    [2, 0, 14, 8],
    [6, 1, 15, 8],
    [3, 0, 16, 8],
    [0, 0, 18, 8],
    [1, 0, 1, 9],
    [8, 0, 2, 9],
    [3, 3, 3, 9],
    [1, 3, 5, 9],
    [8, 1, 6, 9],
    [2, 0, 7, 9],
    [2, 0, 8, 9],
    [2, 0, 9, 9],
    [5, 1, 10, 9],
    [0, 3, 2, 10],
    [0, 3, 6, 10]
  ]
</script>

<template>
  <Page>
    <div class="container">
      <h1>CTM Converter</h1>
      <p>This is a tool that allows you to convert <a href="https://github.com/sp614x/optifine/blob/master/OptiFineDoc/doc/ctm.properties#L192" target="_blank">compact CTM</a> to either <a href="https://github.com/sp614x/optifine/blob/master/OptiFineDoc/doc/ctm.properties#L181" target="_blank">full CTM</a>, or <a href="https://github.com/sp614x/optifine/blob/master/OptiFineDoc/doc/ctm.properties#L74" target="_blank">overlay CTM</a>.</p>
      <p>This is also available through some commands on Discord: <a href="https://wynem.com/commands/prefix/minecraft/resourcepacks/ctmconverter" target="_blank">ctmconverter</a>, <a href="https://wynem.com/commands/prefix/minecraft/resourcepacks/ctmpreviewer" target="_blank">ctmpreviewer</a>, and <a href="https://wynem.com/commands/prefix/minecraft/resourcepacks/ctmsplitter" target="_blank">ctmsplitter</a></p>
      <h3>CTM Compact Template:</h3>
      <img class="ctm-compact-template" data-popupable src="/assets/images/minecraft/compact.png">
      <p>Please provide either a CTM compact template, or the 5 individual CTM compact tiles.</p>
      <FileInput multiple limit="5" @change="onChange" />
      <div id="output">
        <template v-if="message">{{ message }}</template>
        <div v-else-if="error" id="error">
          <h2>{{ error.title }}</h2>
          <p v-html="error.html"></p>
        </div>
        <template v-else-if="tiles.length">
          <div>Reorder the tiles below to adjust the CTM output.</div>
          <div class="ctm-compact-tiles ctm">
            <div v-for="(tile, i) of tiles" :key="tile.id">
              <div class="tile-buttons">
                <Icon name="arrow_back_ios_new" @click="move(i, i - 1)" />
                <Icon name="arrow_forward_ios" @click="move(i, i + 1)" />
              </div>
              <canvas v-draw="tile.canvas"></canvas>
            </div>
          </div>
          <div v-if="generated" id="generated" :key="generated.id">
            <template v-if="generated.sizes.full">
              <div>
                <h2>Full CTM</h2>
                <div v-if="generated.done.full" class="button-download" @click="downloadCTM(generated.els.full, generated.res, 47, 'full')"><Icon name="download" /><span>Download</span></div>
              </div>
              <canvas :ref="el => el && (generated.els.full = el)" class="ctm-full-template ctm" :width="generated.sizes.full[0]" :height="generated.sizes.full[1]" data-popupable data-popupable-no-upscale></canvas>
            </template>
            <template v-if="generated.sizes.overlay">
              <div>
                <h2>Overlay CTM</h2>
                <div v-if="generated.done.overlay" class="button-download" @click="downloadCTM(generated.els.overlay, generated.res, 17, 'overlay')"><Icon name="download" /><span>Download</span></div>
              </div>
              <canvas :ref="el => el && (generated.els.overlay = el)" class="ctm-overlay-template ctm" :width="generated.sizes.overlay[0]" :height="generated.sizes.overlay[1]" data-popupable data-popupable-no-upscale></canvas>
            </template>
            <template v-if="generated.sizes.preview">
              <h2>CTM Preview</h2>
              <canvas :ref="el => el && (generated.els.preview = el)" class="ctm-preview-template ctm" :width="generated.sizes.preview[0]" :height="generated.sizes.preview[1]" data-popupable data-popupable-no-upscale></canvas>
            </template>
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
    padding: 40px 20px
    display: flex
    flex-direction: column
    gap: 20px

  #error, #generated
    display: flex
    flex-direction: column

  canvas, img
    image-rendering: pixelated

  .ctm-compact-tiles
    display: flex
    max-width: 640px

    > div
      position: relative

    canvas
      width: 128px
      display: block
      max-width: calc(20vw - 16px)

  .tile-buttons
    position: absolute
    top: 0
    left: 0
    right: 0
    bottom: 0
    display: flex
    justify-content: space-between
    align-items: center
    overflow: hidden
    user-select: none

    .icon
      color: white
      filter: drop-shadow(0 0 4px black)
      position: absolute
      transition: left .15s, right .15s, font-size .15s
      cursor: pointer
      font-size: 32px

      &:first-child
        left: -40px

      &:last-child
        right: -40px

      &:hover
        font-size: 48px

    &:hover > .icon
      &:first-child
        left: 0

      &:last-child
        right: 0

  .ctm-compact-tiles
    > div:first-child .icon:first-child
      display: none

    > div:last-child .icon:last-child
      display: none

  .ctm
    background-image: url("/assets/images/misc/transparent_dark.webp")
    box-shadow: var(--box-shadow)

  .ctm-compact-template
    max-width: 320px

  .ctm-full-template
    max-width: 768px

  .ctm-overlay-template
    max-width: 448px

  .ctm-preview-template
    max-width: var(--content-width)

  .button-download
    margin-bottom: 20px
</style>
