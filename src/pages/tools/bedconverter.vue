<script setup>
  import { shallowRef } from "vue"
  import JSZip from "jszip"
  import { saveAs } from "file-saver"
  import Page from "../../components/Page.vue"
  import FileInput from "../../components/FileInput.vue"
  import Icon from "../../components/Icon.js"
  import { Canvas, loadImage } from "../../lib/canvas.js"
  import { site } from "../../lib/site.js"

  site.selected = null

  const MATRIX = {
    raw:    (dx, dy, sw, sh, m) => [ 1, 0,  0,  1,  dx        * m,  dy        * m],
    hflip:  (dx, dy, sw, sh, m) => [-1, 0,  0,  1, (dx + sw)  * m,  dy        * m],
    vflip:  (dx, dy, sw, sh, m) => [ 1, 0,  0, -1,  dx        * m, (dy + sh)  * m],
    rot180: (dx, dy, sw, sh, m) => [-1, 0,  0, -1, (dx + sw)  * m, (dy + sh)  * m],
    rotCW:  (dx, dy, sw, sh, m) => [ 0, 1, -1,  0, (dx + sh)  * m,  dy        * m],
    rotCCW: (dx, dy, sw, sh, m) => [ 0,-1,  1,  0,  dx        * m, (dy + sw)  * m],
    transp: (dx, dy, sw, sh, m) => [ 0, 1,  1,  0,  dx        * m,  dy        * m],
    antitr: (dx, dy, sw, sh, m) => [ 0,-1, -1,  0, (dx + sh)  * m, (dy + sw)  * m]
  }

  const FACES = {
    "bed_down":       [["rot180", 28,  6, 16, 16,  0,  0]],
    "bed_head_up":    [["raw",     6,  6, 16, 16,  0,  0]],
    "bed_foot_up":    [["raw",     6, 28, 16, 16,  0,  0]],
    "bed_head_north": [
      ["rot180",  6,  0, 16,  6,  0,  7],
      ["raw",    53, 21,  3,  3,  0, 13],
      ["raw",    56, 21,  3,  3,  3, 13],
      ["raw",    59,  9,  3,  3, 10, 13],
      ["raw",    50,  9,  3,  3, 13, 13]
    ],
    "bed_foot_south": [
      ["vflip",  22, 22, 16,  6,  0,  7],
      ["raw",    53,  3,  3,  3,  0, 13],
      ["raw",    56,  3,  3,  3,  3, 13],
      ["raw",    59, 15,  3,  3, 10, 13],
      ["raw",    50, 15,  3,  3, 13, 13]
    ],
    "bed_head_east":  [
      ["rotCW",  22,  6,  6, 16,  0,  7],
      ["hflip",  56, 18,  3,  3,  7, 13],
      ["raw",    59, 21,  3,  3, 10, 13],
      ["raw",    50, 21,  3,  3, 13, 13]
    ],
    "bed_head_west":  [
      ["rotCCW",  0,  6,  6, 16,  0,  7],
      ["raw",    53,  9,  3,  3,  0, 13],
      ["raw",    56,  9,  3,  3,  3, 13],
      ["antitr", 56,  6,  3,  3,  6, 13]
    ],
    "bed_foot_east":  [
      ["rotCW",  22, 28,  6, 16,  0,  7],
      ["raw",    53, 15,  3,  3,  0, 13],
      ["raw",    56, 15,  3,  3,  3, 13],
      ["transp", 56, 12,  3,  3,  6, 13]
    ],
    "bed_foot_west":  [
      ["rotCCW",  0, 28,  6, 16,  0,  7],
      ["vflip",  56,  0,  3,  3,  7, 13],
      ["raw",    59,  3,  3,  3, 10, 13],
      ["raw",    50,  3,  3,  3, 13, 13]
    ]
  }

  const processing = shallowRef(false)
  const message = shallowRef(null)
  const errors = shallowRef([])
  const results = shallowRef([])
  const download = shallowRef(null)
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

  function convertBed(image) {
    const m = image.width / 64
    const faces = []
    for (const [faceName, ops] of Object.entries(FACES)) {
      const canvas = new Canvas(16 * m, 16 * m, true, 1024)
      const ctx = canvas.getContext("2d")
      ctx.imageSmoothingEnabled = false
      for (const [tname, sx, sy, sw, sh, dx, dy] of ops) {
        const [a, b, c, d, e, f] = MATRIX[tname](dx, dy, sw, sh, m)
        ctx.save()
        ctx.setTransform(a, b, c, d, e, f)
        ctx.drawImage(image, sx * m, sy * m, sw * m, sh * m, 0, 0, sw * m, sh * m)
        ctx.restore()
      }
      faces.push({ name: faceName, canvas })
    }
    return faces
  }

  function stripExt(name) {
    return name.replace(/\.[^.]+$/, "")
  }

  function baseName(path) {
    return stripExt(path.split(/[\\/]/).pop())
  }

  async function blobFromCanvas(canvas) {
    return new Promise(fulfil => canvas.toBlob(fulfil))
  }

  function showMessage(text) {
    processing.value = false
    message.value = text
    errors.value = []
    results.value = []
  }

  async function onChange(files) {
    showMessage(null)
    if (!files.length) return showMessage("Please provide a PNG or ZIP file")
    const file = files[0]
    const isZip = /\.zip$/i.test(file.name) || file.type === "application/zip" || file.type === "application/x-zip-compressed"
    const isPng = /\.png$/i.test(file.name) || file.type === "image/png"

    if (!isZip && !isPng) return showMessage("Please provide a PNG or ZIP file")

    processing.value = true

    const sources = []
    try {
      if (isZip) {
        const zip = await JSZip.loadAsync(file)
        const entries = Object.values(zip.files).filter(f => !f.dir && /\.png$/i.test(f.name))
        if (!entries.length) return showMessage("The ZIP does not contain any PNG files.")
        for (const entry of entries) {
          const blob = await entry.async("blob")
          const image = await loadImage(blob)
          sources.push({ name: baseName(entry.name), image })
        }
      } else {
        const image = await loadImage(file)
        sources.push({ name: baseName(file.name), image })
      }
    } catch (err) {
      return showMessage(`Failed to read input: ${err.message || err}`)
    }

    const converted = []
    const skipped = []
    for (const source of sources) {
      const { image, name } = source
      if (image.width !== image.height) {
        skipped.push(`${name}.png — not square (${image.width}×${image.height})`)
        continue
      }
      if (Math.log2(image.width) % 1 !== 0 || image.width < 64) {
        skipped.push(`${name}.png — must be a square power of 2, at least 64×64`)
        continue
      }
      converted.push({ id: nextId++, name, faces: convertBed(image) })
    }

    showMessage(null)

    if (!converted.length && !skipped.length) return showMessage("No valid textures to convert.")

    if (converted.length) download.value = { isZip, name: isZip ? `${stripExt(file.name)}_beds.zip` : `${converted[0].name}_bed.zip` }
    errors.value = skipped
    results.value = converted
  }

  async function downloadAll() {
    const { isZip, name: zipName } = download.value
    const out = new JSZip()
    for (const { name, faces } of results.value) {
      const folder = isZip ? `${name}_bed/` : ""
      for (const face of faces) {
        out.file(`${folder}${name}_${face.name}.png`, await blobFromCanvas(face.canvas))
      }
    }
    const content = await out.generateAsync({ type: "blob" })
    saveAs(content, zipName)
  }
</script>

<template>
  <Page>
    <div class="container">
      <h1>Bed Converter</h1>
      <p>This is a tool that allows you to convert a Minecraft bed entity texture into the 26.2 block format, splitting it into the individual face textures.</p>
      <p>This is also available as a <a href="https://wynem.com/commands/prefix/minecraft/resourcepacks/bedconverter" target="_blank">command on Discord</a>.</p>
      <br>
      <p>Please provide either a bed entity texture (PNG), or a ZIP containing multiple bed textures. Textures must be square, a power of 2 in size, and at least 64×64.</p>
      <p>When providing a ZIP, each texture's outputs will be grouped into a folder named <strong>&lt;filename&gt;_bed</strong><span>.</span></p>
      <FileInput accept=".png,.zip,image/png,application/zip" @change="onChange" />
      <div id="output">
        <div v-if="processing">Processing...</div>
        <template v-else-if="message">{{ message }}</template>
        <template v-else>
          <div v-if="errors.length" class="errors">
            <h2>Skipped {{ errors.length }} invalid texture{{ errors.length === 1 ? "" : "s" }}</h2>
            <ul>
              <li v-for="err of errors">{{ err }}</li>
            </ul>
          </div>
          <template v-if="results.length">
            <div class="button-download download-all" @click="downloadAll"><Icon name="download" /><span>Download {{ download.isZip ? "All " : "" }}(ZIP)</span></div>
            <div v-for="result of results" :key="result.id" class="bed-group">
              <h2>{{ result.name }}_bed</h2>
              <div class="bed-faces">
                <div v-for="face of result.faces" class="bed-face">
                  <h3>{{ result.name }}_{{ face.name }}.png</h3>
                  <canvas v-draw="face.canvas" data-popupable data-popupable-no-upscale></canvas>
                  <div class="button-download" @click="face.canvas.saveAs(`${result.name}_${face.name}.png`)"><Icon name="download" /><span>Download</span></div>
                </div>
              </div>
            </div>
          </template>
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
    padding: 20px 0 40px
    display: flex
    flex-direction: column
    gap: 20px
    align-items: flex-start

  canvas
    image-rendering: pixelated

  .bed-faces
    display: grid
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))
    gap: 20px
    width: 100%

  .bed-face
    display: flex
    flex-direction: column
    gap: 8px
    background-color: var(--color-grey)
    padding: 12px
    box-shadow: var(--box-shadow)

    h3
      margin: 0
      font-size: 1rem
      word-break: break-all

    canvas
      background-image: url("/assets/images/misc/transparent_dark.webp")
      width: 100%
      height: auto
      max-width: 256px
      align-self: center

  .download-all
    align-self: flex-start

  .bed-group
    display: flex
    flex-direction: column
    gap: 12px
    width: 100%

    h2
      margin: 0
      word-break: break-all

  .errors
    background-color: var(--color-grey)
    padding: 12px 16px
    box-shadow: var(--box-shadow)
    width: 100%

    h2
      margin: 0 0 8px
      font-size: 1.1rem

    ul
      margin: 0
      padding-left: 20px
</style>
