<script setup>
import { ref, shallowRef, reactive, computed, watch, nextTick, onMounted } from "vue"
import { saveAs } from "file-saver"
import Page from "../../components/Page.vue"
import FileInput from "../../components/FileInput.vue"
import Icon from "../../components/Icon.js"
import { Canvas, loadImage } from "../../lib/canvas.js"
import { site } from "../../lib/site.js"

site.selected = null

const API = "https://minecraft-biome-colors.ewanh.workers.dev"

const CHANNELS = {
  grass:      { tex: "grass",      color: "grassColor",      fixed: "grassColorFixed",      file: "grass",       label: "Grass" },
  foliage:    { tex: "foliage",    color: "foliageColor",    fixed: "foliageColorFixed",    file: "foliage",     label: "Foliage" },
  dryFoliage: { tex: "dryFoliage", color: "dryFoliageColor", fixed: "dryFoliageColorFixed", file: "dry_foliage", label: "Dry Foliage" }
}

const BLOCKS = {
  grass: "grass_block short_grass grass tall_grass fern large_fern potted_fern sugar_cane",
  foliage: "oak_leaves jungle_leaves acacia_leaves dark_oak_leaves mangrove_leaves vines",
  dryFoliage: "leaf_litter"
}

const TABS = [
  ["vanilla", "Vanilla Generator"],
  ["grid", "Grid Generator"],
  ["converter", "Grid Converter"]
]

const clamp01 = v => Math.max(0, Math.min(1, v))
const hexToPacked = h => parseInt(h.slice(1), 16)
const packedToCss = c => "#" + c.toString(16).padStart(6, "0")

// game-accurate colormap coordinates: the game stores temperature/downfall as
// float32 and clamps them as floats before the double-precision uv maths
const fr = Math.fround
function triangleCoords(temp, downfall) {
  const t = clamp01(fr(temp))
  const d = clamp01(fr(downfall)) * t
  return [Math.floor((1 - t) * 255), Math.floor((1 - d) * 255)]
}

function samplePacked(data, temp, downfall) {
  const [x, y] = triangleCoords(temp, downfall)
  const i = (y * 256 + x) * 4
  return (data[i] << 16) | (data[i + 1] << 8) | data[i + 2]
}

const altitudeTemp = (temp, worldY) => worldY > 80 ? fr(fr(temp) - fr(fr(fr(worldY - 80) * fr(0.05)) / 40)) : temp

function biomeColumn(biome, channel, texData, minY, height, mode) {
  if (biome[channel.fixed] || mode === "flat") {
    return new Uint32Array(height).fill(hexToPacked(biome[channel.color]))
  }
  const darkForest = channel.tex === "grass" && biome.grassColorModifier === "dark_forest"
  const column = new Uint32Array(height)
  for (let r = 0; r < height; r++) {
    let colour = samplePacked(texData, altitudeTemp(biome.temperature, minY + r), biome.downfall)
    if (darkForest) colour = ((colour & 0xfefefe) + 0x28340a) >> 1
    column[r] = colour
  }
  return column
}

function trianglePoint(biome) {
  return triangleCoords(biome.temperature, biome.downfall)
}

function fitPixels(element, width, height, { pad = 0, maxHeight = Infinity } = {}) {
  const container = element.parentElement
  let lastAvailable
  const observer = new ResizeObserver(() => requestAnimationFrame(() => {
    if (!element.isConnected) return
    const style = getComputedStyle(container)
    const available = container.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
    if (available === lastAvailable) return
    lastAvailable = available
    const dpr = devicePixelRatio
    const fit = Math.min(available / width, maxHeight / height) * dpr
    const scale = fit >= 1 ? Math.floor(fit) : fit
    element.style.width = `${(width + pad * 2) * scale / dpr}px`
    if (pad) element.style.margin = `0 auto ${-pad * scale / dpr}px`
  }))
  observer.observe(container)
  return observer
}

function saveText(name, text) {
  saveAs(new Blob([text], { type: "text/plain" }), name)
}

function saveCanvas(canvas, name) {
  canvas.toBlob(blob => saveAs(blob, name), "image/png", 1)
}

// 3x3 square marker with a white centre pixel
function drawDot(ctx, group, off = 0, outer = "#000", inner = "#fff") {
  ctx.fillStyle = outer
  ctx.fillRect(group.x - 1 + off, group.y - 1 + off, 3, 3)
  ctx.fillStyle = inner
  ctx.fillRect(group.x + off, group.y + off, 1, 1)
}

// the game only ever samples the lower left half (downfall <= temperature)
function clearUnused(ctx, off = 0) {
  for (let y = 0; y < 255; y++) ctx.clearRect(off + y + 1, off + y, 255 - y, 1)
}

function gridImage(columns, height) {
  const img = new ImageData(256, height)
  for (let x = 0; x < 256; x++) {
    const column = columns[x]
    for (let y = 0; y < height; y++) {
      const i = (y * 256 + x) * 4
      const colour = column[y]
      img.data[i] = colour >> 16 & 255
      img.data[i + 1] = colour >> 8 & 255
      img.data[i + 2] = colour & 255
      img.data[i + 3] = 255
    }
  }
  return img
}

function gridNames(doc) {
  const names = new Array(256).fill(null)
  for (const biome of doc.biomes) names[biome.numericId] = biome.id
  return names
}

const coverage = (height, minY) => `256×${height}, covers Y ${minY} to ${minY + height - 1}${minY < 0 ? ` (needs yOffset=${minY})` : ""}`

const vPaint = {
  mounted: paint,
  updated(el, binding) {
    if (binding.value !== binding.oldValue) paint(el, binding)
  }
}

function paint(el, { value }) {
  if (value instanceof ImageData) {
    el.getContext("2d", { willReadFrequently: true }).putImageData(value, 0, 0)
  } else {
    const ctx = el.getContext("2d")
    ctx.clearRect(0, 0, el.width, el.height)
    ctx.drawImage(value, 0, 0)
  }
}

const vFit = {
  mounted(el, { value }) {
    el._fit = { height: value.height, observer: fitPixels(el, value.width, value.height, value) }
  },
  updated(el, { value }) {
    if (value.height === el._fit.height) return
    el._fit.observer.disconnect()
    el._fit = { height: value.height, observer: fitPixels(el, value.width, value.height, value) }
  },
  unmounted(el) {
    el._fit.observer.disconnect()
  }
}

function useGridTip(view) {
  const blank = () => ({ visible: false, hex: "", name: "", meta: "", style: {} })
  const tip = reactive(blank())
  const el = ref()

  watch(view, () => Object.assign(tip, blank()))

  function move(e, view) {
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(255, Math.floor((e.clientX - rect.left) / rect.width * 256)))
    const y = Math.max(0, Math.min(canvas.height - 1, Math.floor((e.clientY - rect.top) / rect.height * canvas.height)))
    const [r, g, b] = canvas.getContext("2d", { willReadFrequently: true }).getImageData(x, y, 1, 1).data
    tip.hex = packedToCss(r << 16 | g << 8 | b)
    tip.name = view.names[x] ?? "unused (plains)"
    tip.meta = `Y ${view.minY + y}, column ${x}`
    tip.visible = true
    const left = e.clientX - rect.left + 16
    const top = e.clientY - rect.top + 16
    const clientX = e.clientX
    nextTick(() => {
      const width = el.value.offsetWidth
      const flip = clientX + 16 + width > document.documentElement.clientWidth - 8
      tip.style = { left: `${flip ? left - 32 - width : left}px`, top: `${top}px` }
    })
  }

  function leave() {
    tip.visible = false
  }

  return { tip, el, move, leave }
}

const loading = ref(true)
const status = ref("")
const versions = shallowRef([])
const tab = ref("vanilla")
const version = ref(null)
const channel = ref("grass")
const mode = ref("flat")
const size = ref("full")
const entry = shallowRef(null)
const convertVersion = ref(null)
const convertHasImage = ref(false)
const convertOutput = shallowRef(null)
const gridCanvas = ref()
const convertCanvas = ref()
const cache = new Map()
let convertEntry = null
let convertImgData = null

async function loadVersion(version) {
  if (cache.has(version)) return cache.get(version)
  const res = await fetch(`${API}/colormap/${version}`)
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Request failed (${res.status})`)
  const doc = await res.json()
  const textures = {}
  await Promise.all(Object.entries(doc.textures).map(async ([key, hash]) => {
    const tex = await fetch(`${API}/texture/${hash}`)
    if (!tex.ok) throw new Error(`Failed to load ${key} texture`)
    const bitmap = await createImageBitmap(await tex.blob())
    const canvas = new Canvas(256, 256)
    const ctx = canvas.getContext("2d")
    ctx.drawImage(bitmap, 0, 0)
    textures[key] = { bitmap, data: ctx.getImageData(0, 0, 256, 256).data }
  }))
  const loaded = { doc, textures }
  cache.set(version, loaded)
  return loaded
}

const doc = computed(() => entry.value?.doc)

const channelChoices = computed(() => {
  if (!entry.value) return []
  const { textures } = entry.value
  return Object.entries(CHANNELS).filter(([key, channel]) => textures[channel.tex]).map(([key, channel]) => {
    const canvas = new Canvas(256, 256)
    const ctx = canvas.getContext("2d")
    ctx.drawImage(textures[channel.tex].bitmap, 0, 0)
    clearUnused(ctx)
    return { key, label: channel.label, canvas }
  })
})

const grid = computed(() => {
  if (!entry.value) return null
  const { doc, textures } = entry.value
  const ch = CHANNELS[channel.value]
  const texData = textures[ch.tex].data
  const square = size.value === "square" || doc.worldMinY === 0 && doc.worldMaxY === 256
  const minY = square ? 0 : doc.worldMinY
  const height = square ? 256 : doc.worldMaxY - doc.worldMinY

  const plains = doc.biomes.find(b => b.id === "plains") ?? doc.biomes[0]
  const fill = biomeColumn(plains, ch, texData, minY, height, mode.value)
  const columns = new Array(256).fill(fill)
  for (const biome of doc.biomes) {
    columns[biome.numericId] = biomeColumn(biome, ch, texData, minY, height, mode.value)
  }

  return {
    image: gridImage(columns, height),
    height,
    minY,
    names: gridNames(doc),
    info: coverage(height, minY),
    properties: [
      `# ${ch.file}.properties`,
      "format=grid",
      `blocks=${BLOCKS[channel.value]}`,
      `source=./${ch.file}.png`
    ].concat(minY < 0 ? [`yOffset=${minY}`] : []).join("\n")
  }
})

function buildGroups(ch) {
  const texData = entry.value.textures[ch.tex].data
  const heldColour = packedToCss(samplePacked(texData, 0.5, 1))
  const groups = new Map()
  const fixed = []
  for (const biome of entry.value.doc.biomes) {
    if (biome[ch.fixed]) {
      fixed.push(biome)
      continue
    }
    const [x, y] = trianglePoint(biome)
    const key = `${x},${y}`
    if (!groups.has(key)) groups.set(key, { x, y, biomes: [] })
    groups.get(key).biomes.push(biome)
  }
  // held and dropped blocks always sample the centre of the colormap
  const heldKey = "127,127"
  if (!groups.has(heldKey)) groups.set(heldKey, { x: 127, y: 127, biomes: [] })
  Object.assign(groups.get(heldKey), { held: true, heldColour })
  return { groups, fixed, heldColour }
}

const TRIANGLE_PAD = 8
const TRIANGLE_SIZE = 256 + TRIANGLE_PAD * 2

const triangle = computed(() => {
  if (!entry.value) return null
  const ch = CHANNELS[channel.value]
  const { groups, fixed, heldColour } = buildGroups(ch)

  const base = new Canvas(TRIANGLE_SIZE, TRIANGLE_SIZE)
  const bctx = base.getContext("2d")
  bctx.drawImage(entry.value.textures[ch.tex].bitmap, TRIANGLE_PAD, TRIANGLE_PAD)
  clearUnused(bctx, TRIANGLE_PAD)
  for (const group of groups.values()) drawDot(bctx, group, TRIANGLE_PAD)

  const modified = ch.tex === "grass" ? entry.value.doc.biomes.filter(b => !b[ch.fixed] && b.grassColorModifier === "dark_forest") : []
  const chips = fixed.concat(modified).map(biome => ({
    id: biome.id,
    colour: biome[ch.color],
    text: modified.includes(biome) ? `${biome[ch.color]}, colormap darkened with #28340a` : biome[ch.color]
  }))

  return { channel: ch, base, groups, heldColour, chips }
})

const triangleTip = reactive({ visible: false, groups: [], meta: "" })
let hovered = null

watch(triangle, () => hovered = null)

function setHovered(canvas, group) {
  if (group === hovered) return
  hovered = group
  const ctx = canvas.getContext("2d")
  ctx.clearRect(0, 0, TRIANGLE_SIZE, TRIANGLE_SIZE)
  ctx.drawImage(triangle.value.base, 0, 0)
  if (group) drawDot(ctx, group, TRIANGLE_PAD, "#fff", "#000")
}

function triangleMove(e) {
  const { channel: ch, groups, heldColour } = triangle.value
  const canvas = e.currentTarget
  const rect = canvas.getBoundingClientRect()
  const mx = (e.clientX - rect.left) / rect.width * TRIANGLE_SIZE - TRIANGLE_PAD
  const my = (e.clientY - rect.top) / rect.height * TRIANGLE_SIZE - TRIANGLE_PAD
  let nearest, nearestDist = 36
  for (const group of groups.values()) {
    const dist = (group.x + .5 - mx) ** 2 + (group.y + .5 - my) ** 2
    if (dist < nearestDist) {
      nearest = group
      nearestDist = dist
    }
  }
  setHovered(canvas, nearest)
  if (!nearest) {
    triangleTip.visible = false
    return
  }
  const byColour = new Map()
  if (nearest.held) byColour.set(heldColour.toLowerCase(), ["held and dropped blocks"])
  for (const biome of nearest.biomes) {
    const hex = biome[ch.color].toLowerCase()
    if (!byColour.has(hex)) byColour.set(hex, [])
    byColour.get(hex).push(ch.tex === "grass" && biome.grassColorModifier === "dark_forest" ? `${biome.id} (colormap darkened with #28340a)` : biome.id)
  }
  const first = nearest.biomes[0]
  triangleTip.groups = Array.from(byColour, ([hex, names]) => ({ hex, names }))
  triangleTip.meta = `${first ? `temperature ${first.temperature}, downfall ${first.downfall}` : "temperature 0.5, downfall 1"}\npixel ${nearest.x}, ${nearest.y}`
  triangleTip.visible = true
}

function triangleLeave(e) {
  setHovered(e.currentTarget, null)
  triangleTip.visible = false
}

const table = computed(() => {
  if (!doc.value) return null
  const hasDry = !!doc.value.textures.dryFoliage
  const colours = ["grassColor", "foliageColor"].concat(hasDry ? ["dryFoliageColor"] : [], ["waterColor", "skyColor"])
  return {
    headers: ["ID", "Biome", "Temperature", "Downfall", "Grass", "Foliage"].concat(hasDry ? ["Dry Foliage"] : [], ["Water", "Sky"]),
    rows: doc.value.biomes.map(biome => ({ cells: [biome.numericId, biome.id, biome.temperature, biome.downfall], colours: colours.map(key => biome[key]) }))
  }
})

const gridTip = useGridTip(grid)
const convertTip = useGridTip(convertOutput)

function renderConvert() {
  convertOutput.value = null
  convertHasImage.value = !!convertImgData
  if (!convertImgData || !convertEntry || !entry.value) return
  const tgtDoc = entry.value.doc
  const srcDoc = convertEntry.doc
  const ch = CHANNELS[channel.value]
  const texData = entry.value.textures[ch.tex].data

  const { width: srcW, height: srcH, data: srcData } = convertImgData
  const srcFullHeight = srcDoc.worldMaxY - srcDoc.worldMinY
  const srcIsFull = srcH === srcFullHeight && srcDoc.worldMinY < 0
  // output matches the input: full height stays full height (when the
  // target supports it), anything else stays square
  const full = srcIsFull && tgtDoc.worldMinY < 0
  const minY = full ? tgtDoc.worldMinY : 0
  const height = full ? tgtDoc.worldMaxY - tgtDoc.worldMinY : 256
  // OptiFine clamps out of range rows, and wraps columns on narrow images
  const srcRowFor = worldY => Math.min(srcH - 1, Math.max(0, srcIsFull ? worldY - srcDoc.worldMinY : worldY))

  const srcIds = new Map(srcDoc.biomes.map(b => [b.id, b.numericId]))
  const tgtIds = new Set(tgtDoc.biomes.map(b => b.id))

  const generated = []
  const columns = new Array(256).fill(null)
  for (const biome of tgtDoc.biomes) {
    if (srcIds.has(biome.id)) {
      columns[biome.numericId] = { copy: srcIds.get(biome.id) % srcW }
    } else {
      columns[biome.numericId] = { synth: biomeColumn(biome, ch, texData, minY, height, "flat") }
      generated.push(biome.id)
    }
  }
  const plains = tgtDoc.biomes.find(b => b.id === "plains") ?? tgtDoc.biomes[0]
  const fill = srcIds.has(plains.id) ? { copy: srcIds.get(plains.id) % srcW } : { synth: biomeColumn(plains, ch, texData, minY, height, "flat") }
  for (let x = 0; x < 256; x++) if (!columns[x]) columns[x] = fill

  const img = new ImageData(256, height)
  for (let y = 0; y < height; y++) {
    const sy = srcRowFor(minY + y)
    for (let x = 0; x < 256; x++) {
      const column = columns[x]
      const i = (y * 256 + x) * 4
      if (column.copy !== undefined) {
        const j = (sy * srcW + column.copy) * 4
        img.data[i] = srcData[j]
        img.data[i + 1] = srcData[j + 1]
        img.data[i + 2] = srcData[j + 2]
        img.data[i + 3] = srcData[j + 3]
      } else {
        const colour = column.synth[y]
        img.data[i] = colour >> 16 & 255
        img.data[i + 1] = colour >> 8 & 255
        img.data[i + 2] = colour & 255
        img.data[i + 3] = 255
      }
    }
  }

  const dropped = srcDoc.biomes.filter(b => !tgtIds.has(b.id)).map(b => b.id)
  convertOutput.value = {
    image: img,
    height,
    minY,
    names: gridNames(tgtDoc),
    info: coverage(height, minY),
    generated: generated.length ? `Generated from vanilla (not in ${convertVersion.value}): ${generated.join(", ")}` : "",
    dropped: dropped.length ? `Dropped (not in ${version.value}): ${dropped.join(", ")}` : "",
    file: ch.file
  }
}

function render() {
  if (!entry.value.doc.textures.dryFoliage && channel.value === "dryFoliage") channel.value = "grass"
  renderConvert()
}

async function selectVersion(v) {
  version.value = v
  status.value = `Loading ${v}...`
  let loaded
  try {
    loaded = await loadVersion(v)
  } catch (err) {
    status.value = `Failed to load ${v}: ${err.message}`
    return
  }
  if (version.value !== v) return
  status.value = ""
  entry.value = loaded
  render()
}

async function selectFrom(v) {
  convertVersion.value = v
  convertEntry = null
  try {
    convertEntry = await loadVersion(v)
  } catch (err) {
    convertOutput.value = { error: `Failed to load ${v}: ${err.message}` }
    return
  }
  if (convertVersion.value !== v) return
  renderConvert()
}

function selectChannel(key) {
  if (key === channel.value) return
  channel.value = key
  if (entry.value) render()
}

async function onFile(files) {
  const file = files?.[0]
  if (!file) return
  try {
    const image = await loadImage(file)
    const canvas = new Canvas(image.width, image.height)
    const ctx = canvas.getContext("2d")
    ctx.drawImage(image, 0, 0)
    convertImgData = ctx.getImageData(0, 0, image.width, image.height)
  } catch (err) {
    convertImgData = null
    convertOutput.value = { error: `Failed to read image: ${err.message || err}` }
    return
  }
  if (convertEntry) renderConvert()
  else selectFrom(convertVersion.value)
}

function downloadGrid() {
  if (gridCanvas.value) saveCanvas(gridCanvas.value, `${CHANNELS[channel.value].file}_grid_${version.value}.png`)
}

function downloadIds() {
  if (!entry.value) return
  saveText(`biome_ids_${version.value}.txt`, entry.value.doc.biomes.map(b => `${b.numericId}=${b.id}`).join("\n"))
}

function downloadTexture() {
  if (!entry.value) return
  const ch = CHANNELS[channel.value]
  const { groups } = buildGroups(ch)
  const canvas = new Canvas(256, 256)
  const ctx = canvas.getContext("2d")
  ctx.drawImage(entry.value.textures[ch.tex].bitmap, 0, 0)
  clearUnused(ctx)
  for (const group of groups.values()) drawDot(ctx, group)
  canvas.saveAs(`${ch.file}_map_${version.value}.png`)
}

function downloadConvert() {
  saveCanvas(convertCanvas.value, `${convertOutput.value.file}_grid_${version.value}.png`)
}

async function init() {
  status.value = "Loading versions..."
  let list
  try {
    const res = await fetch(`${API}/versions`)
    if (!res.ok) throw new Error(`Request failed (${res.status})`)
    list = await res.json()
  } catch (err) {
    status.value = `Failed to load version list: ${err.message}`
    return
  }

  const floor = list.versions.findIndex(v => v.id === "1.16.2")
  if (floor !== -1) list.versions = list.versions.slice(0, floor + 1)

  versions.value = list.versions
  const latest = typeof list.latest === "string" ? list.latest : list.latest?.release
  const initial = list.versions.some(v => v.id === latest) ? latest : (list.versions.find(v => !v.snapshot) ?? list.versions[0]).id
  // default the converter source to the previous release
  convertVersion.value = list.versions.find(v => !v.snapshot && v.id !== initial)?.id ?? initial
  selectVersion(initial)
}

onMounted(() => init().finally(() => loading.value = false))
</script>

<template>
  <Page :loading="loading">
    <div class="container">
      <h1>Biome Colormap Generator</h1>
      <p>This is a tool that generates Minecraft biome colormaps for any version from 1.16.2 onwards, using biome data read from each version's game files. It maps where each biome sits on the vanilla colormap, makes OptiFine grid colormaps and biome ID lists, and converts grid colormaps between versions.</p>
      <div class="tabs" id="page-tabs">
        <div v-for="[key, label] of TABS" class="tab" :class="{ active: tab === key }" :data-tab="key" @click="tab = key">{{ label }}</div>
      </div>
      <div id="status" v-text="status"></div>
      <div id="generator-tab" :class="{ hidden: tab === 'converter' || !entry }" :data-view="tab">
        <div class="workspace" id="generator">
          <div class="column">
            <div class="panel">
              <h2>Version</h2>
              <select id="version" :value="version" @change="selectVersion($event.target.value)">
                <option v-for="v of versions" :value="v.id">{{ v.id }}</option>
              </select>
            </div>
            <div class="panel">
              <h2>Colormap</h2>
              <div class="choices channel-choices">
                <div v-for="choice of channelChoices" :key="choice.key" class="choice" :class="{ selected: choice.key === channel }" :data-channel="choice.key" @click="selectChannel(choice.key)">
                  <canvas width="256" height="256" v-paint="choice.canvas"></canvas>
                  <span>{{ choice.label }}</span>
                </div>
              </div>
            </div>
            <div class="panel grid-only">
              <h2>Grid mode</h2>
              <div class="choices text-choices" id="modes">
                <div class="choice" :class="{ selected: mode === 'flat' }" data-mode="flat" @click="mode = 'flat'">
                  <span>Flat</span>
                  <small>One colour per biome at every height, like vanilla</small>
                </div>
                <div class="choice" :class="{ selected: mode === 'altitude' }" data-mode="altitude" @click="mode = 'altitude'">
                  <span>Altitude</span>
                  <small>Colours shift as it gets colder above Y=80</small>
                </div>
              </div>
              <div class="size-wrap" :class="{ hidden: !doc || doc.worldMinY === 0 && doc.worldMaxY === 256 }">
                <h2 class="sub">Grid size</h2>
                <div class="choices text-choices" id="sizes">
                  <div class="choice" :class="{ selected: size === 'full' }" data-size="full" @click="size = 'full'">
                    <span>Full height</span>
                    <small id="size-full-note" v-text="doc ? `Y ${doc.worldMinY} to ${doc.worldMaxY - 1}, needs a yOffset` : ''"></small>
                  </div>
                  <div class="choice" :class="{ selected: size === 'square' }" data-size="square" @click="size = 'square'">
                    <span>Square</span>
                    <small>Y 0 to 255, the classic 256×256</small>
                  </div>
                </div>
              </div>
            </div>
            <div class="panel download">
              <h2>Download</h2>
              <div class="save">
                <div class="button-download grid-only" id="download-grid" @click="downloadGrid">
                  <Icon name="download" />
                  <span>Grid colormap</span>
                </div>
                <div class="button-download grid-only" id="download-ids" @click="downloadIds">
                  <Icon name="download" />
                  <span>Biome ID list</span>
                </div>
                <div class="button-download vanilla-only" id="download-texture" @click="downloadTexture">
                  <Icon name="download" />
                  <span>Colormap map</span>
                </div>
              </div>
            </div>
          </div>
          <div class="column">
            <div class="panel vanilla-only">
              <h2>Vanilla colormap</h2>
              <p class="hint">Each biome samples one pixel, picked by its temperature and downfall, and uses that colour at every height. Hover a marker to see its biomes. The centre marker is the colour of held and dropped blocks.</p>
              <div class="triangle-wrap" id="triangle-wrap" v-fit="{ width: 256, height: 256, pad: 8, maxHeight: 512 }">
                <canvas v-if="triangle" :width="TRIANGLE_SIZE" :height="TRIANGLE_SIZE" v-paint="triangle.base" @mousemove="triangleMove" @mouseleave="triangleLeave"></canvas>
                <div id="triangle-tooltip" :class="{ hidden: !triangleTip.visible }">
                  <div v-for="group of triangleTip.groups" class="tooltip-group">
                    <div class="tooltip-biome">
                      <span class="swatch" :style="{ backgroundColor: group.hex }"></span>
                      <span class="tooltip-hex">{{ group.hex }}</span>
                      <span class="tooltip-count">{{ group.names.length === 1 ? "" : `${group.names.length} biomes` }}</span>
                    </div>
                    <div class="tooltip-names">
                      <div v-for="name of group.names">{{ name }}</div>
                    </div>
                  </div>
                  <div v-if="triangleTip.groups.length" class="tooltip-meta">{{ triangleTip.meta }}</div>
                </div>
              </div>
            </div>
            <div class="panel grid-only">
              <h2>OptiFine grid</h2>
              <p class="hint">Each column is a biome by numeric ID, and each row is a world Y level, starting at the bottom of the world. Unused columns use plains as a neutral default for mod biomes. Hover the grid to see the biome and Y level.</p>
              <div id="grid-holder">
                <div v-if="grid" class="grid-wrap" v-fit="{ width: 256, height: grid.height, maxHeight: 768 }">
                  <canvas ref="gridCanvas" width="256" :height="grid.height" v-paint="grid.image" @mousemove="gridTip.move($event, grid)" @mouseleave="gridTip.leave"></canvas>
                  <div :ref="gridTip.el" class="tooltip grid-tooltip" :class="{ hidden: !gridTip.tip.visible }" :style="gridTip.tip.style">
                    <template v-if="gridTip.tip.hex">
                      <div class="tooltip-biome">
                        <span class="swatch" :style="{ backgroundColor: gridTip.tip.hex }"></span>
                        <span>{{ gridTip.tip.name }}</span>
                        <span class="tooltip-hex">{{ gridTip.tip.hex }}</span>
                      </div>
                      <div class="tooltip-meta">{{ gridTip.tip.meta }}</div>
                    </template>
                  </div>
                </div>
              </div>
              <p class="note" id="grid-info" v-text="grid?.info ?? ''"></p>
            </div>
            <div class="panel vanilla-only" id="fixed-wrap" :class="{ hidden: triangle && !triangle.chips.length }">
              <h2>Hardcoded colours</h2>
              <p class="hint">These biomes ignore the colormap and always use the same colour, or change the colour they read from it.</p>
              <div id="fixed-biomes">
                <div v-for="chip of triangle?.chips" class="fixed-chip">
                  <span class="swatch swatch-large" :style="{ backgroundColor: chip.colour }"></span>
                  <div class="fixed-chip-text">
                    <span>{{ chip.id }}</span>
                    <span class="fixed-chip-hex">{{ chip.text }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="panel grid-only setup">
              <h2>Resource pack setup</h2>
              <p class="hint">Vanilla <code>grass.png</code> and <code>foliage.png</code> only use the vanilla format, so a grid colormap needs OptiFine. Save the grid in <code>assets/minecraft/optifine/colormap/blocks/</code> with this properties file next to it.</p>
              <pre id="properties-example" v-text="grid?.properties ?? ''"></pre>
            </div>
          </div>
        </div>
        <div class="panel biome-data">
          <h2>Biome data</h2>
          <p class="hint">Every biome in this version. Numeric IDs are the column positions in the grid colormap.</p>
          <div class="table-wrap">
            <table id="biome-table">
              <template v-if="table">
                <tr>
                  <th v-for="header of table.headers">{{ header }}</th>
                </tr>
                <tr v-for="row of table.rows">
                  <td v-for="cell of row.cells">{{ cell }}</td>
                  <td v-for="colour of row.colours">
                    <div class="colour-cell">
                      <span class="swatch" :style="{ backgroundColor: colour }"></span>
                      <span>{{ colour }}</span>
                    </div>
                  </td>
                </tr>
              </template>
            </table>
          </div>
        </div>
      </div>
      <div id="converter-tab" :class="{ hidden: tab !== 'converter' || !entry }">
        <p>Converts an OptiFine grid colormap from one version to another. Every biome column moves to its numeric ID in the target version, and biomes the source version doesn't have get their vanilla column generated.</p>
        <div class="workspace">
          <div class="column">
            <div class="panel">
              <h2>Versions</h2>
              <div class="convert-versions">
                <label>
                  <span class="hint">From</span>
                  <select id="convert-from" :value="convertVersion" @change="selectFrom($event.target.value)">
                    <option v-for="v of versions" :value="v.id">{{ v.id }}</option>
                  </select>
                </label>
                <label>
                  <span class="hint">To</span>
                  <select id="convert-to" :value="version" @change="selectVersion($event.target.value)">
                    <option v-for="v of versions" :value="v.id">{{ v.id }}</option>
                  </select>
                </label>
              </div>
            </div>
            <div class="panel">
              <h2>Colormap</h2>
              <p class="hint">Used to generate the columns for new biomes.</p>
              <div class="choices channel-choices">
                <div v-for="choice of channelChoices" :key="choice.key" class="choice" :class="{ selected: choice.key === channel }" :data-channel="choice.key" @click="selectChannel(choice.key)">
                  <canvas width="256" height="256" v-paint="choice.canvas"></canvas>
                  <span>{{ choice.label }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="column">
            <div class="panel">
              <h2>Grid colormap</h2>
              <p class="hint">The grid PNG made for the version you are converting from.</p>
              <FileInput accept=".png,image/png" @change="onFile" />
            </div>
            <div class="panel" id="convert-result">
              <h2>Converted grid</h2>
              <p class="hint" id="convert-empty" :class="{ hidden: convertHasImage }">Provide a grid colormap to convert it.</p>
              <div id="convert-output">
                <p v-if="convertOutput?.error">{{ convertOutput.error }}</p>
                <template v-else-if="convertOutput">
                  <p class="hint">{{ convertOutput.info }}</p>
                  <p v-if="convertOutput.generated" class="note">{{ convertOutput.generated }}</p>
                  <p v-if="convertOutput.dropped" class="note">{{ convertOutput.dropped }}</p>
                  <div class="grid-wrap" v-fit="{ width: 256, height: convertOutput.height, maxHeight: 768 }">
                    <canvas ref="convertCanvas" width="256" :height="convertOutput.height" v-paint="convertOutput.image" @mousemove="convertTip.move($event, convertOutput)" @mouseleave="convertTip.leave"></canvas>
                    <div :ref="convertTip.el" class="tooltip grid-tooltip" :class="{ hidden: !convertTip.tip.visible }" :style="convertTip.tip.style">
                      <template v-if="convertTip.tip.hex">
                        <div class="tooltip-biome">
                          <span class="swatch" :style="{ backgroundColor: convertTip.tip.hex }"></span>
                          <span>{{ convertTip.tip.name }}</span>
                          <span class="tooltip-hex">{{ convertTip.tip.hex }}</span>
                        </div>
                        <div class="tooltip-meta">{{ convertTip.tip.meta }}</div>
                      </template>
                    </div>
                  </div>
                  <div class="button-download" @click="downloadConvert">
                    <Icon name="download" />
                    <span>Download</span>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
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
  padding: 0 20px 40px
  display: flex
  flex-direction: column

h1
  margin: 0
  padding: 22px 0 0

h2
  margin: 0 0 8px
  font-size: 1.2rem

  &.sub
    margin-top: 16px

p
  white-space: pre-wrap

a
  color: var(--color-link-blue)

code
  font-family: monospace
  background-color: var(--color-grey-dark)
  padding: 1px 5px

.hidden
  display: none !important

#status
  margin-top: 20px
  font-weight: 700

  &:empty
    display: none

.tabs
  display: flex
  gap: 10px
  margin-top: 16px

.tab
  background-color: var(--color-grey-dark)
  cursor: pointer
  border-top: 2px solid transparent
  transition: background-color .15s, border-top .15s
  user-select: none
  padding: 10px 15px

  &.active
    background-color: var(--color-grey)
    border-top: 2px solid var(--color-red-light)

#converter-tab > p
  margin: 16px 0 0

.workspace
  display: grid
  grid-template-columns: minmax(0, 300px) minmax(0, 1fr)
  gap: 20px
  padding-top: 20px

.column
  display: flex
  flex-direction: column
  gap: 20px
  min-width: 0

.panel
  background-color: var(--color-grey)
  padding: 16px
  box-shadow: var(--box-shadow)

  p
    margin: 0 0 8px

.hint
  opacity: .75
  font-size: .9rem

.note
  font-size: .9rem
  color: var(--color-text-optifine)

  &:empty
    display: none

#generator-tab[data-view="vanilla"] .grid-only, #generator-tab[data-view="grid"] .vanilla-only
  display: none

select
  box-sizing: border-box
  width: 100%
  background-color: var(--color-grey-light)
  color: var(--color-text-white)
  border: none
  padding: 10px 12px
  font: inherit
  font-weight: 700
  cursor: pointer

  &:focus
    outline: 2px solid var(--color-download)

.convert-versions
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 10px

  label
    display: flex
    flex-direction: column
    gap: 4px

.choices
  display: grid
  grid-template-columns: repeat(auto-fill, minmax(76px, 1fr))
  gap: 10px

  &.text-choices
    grid-template-columns: repeat(2, minmax(0, 1fr))

.choice
  display: flex
  flex-direction: column
  gap: 6px
  padding: 8px
  background-color: var(--color-grey-light)
  outline: 2px solid transparent
  cursor: pointer
  user-select: none
  font-size: .9rem
  transition: background-color .15s

  &:hover
    background-color: var(--color-grey-lighter)

  &.selected
    outline-color: var(--color-download)

  span
    font-weight: 700

  small
    opacity: .7
    font-size: .8rem

  canvas
    width: 100%
    aspect-ratio: 1
    background-image: url("/assets/images/misc/transparent_dark.webp")

.save
  display: flex
  flex-direction: column
  gap: 10px

  .button-download
    justify-content: flex-start

.triangle-wrap
  position: relative
  font-size: 0

  // transparency checkerboard, inset to match the 8px padding baked into the canvas (8/272)
  &::before
    content: ""
    position: absolute
    inset: 2.9412%
    background: url("/assets/images/misc/transparent_dark.webp")

  canvas
    position: relative
    display: block
    image-rendering: pixelated
    width: 100%
    height: auto
    cursor: crosshair

#triangle-tooltip
  position: absolute
  top: 12%
  right: 6%
  background-color: var(--color-grey-dark)
  box-shadow: var(--box-shadow)
  padding: 8px 12px
  pointer-events: none
  z-index: 10
  width: 260px
  max-width: 70%
  box-sizing: border-box
  font-size: .85rem

  .tooltip-group + .tooltip-group
    margin-top: 8px

  .tooltip-group .tooltip-hex
    margin-left: 0
    padding-left: 0
    opacity: 1

  .tooltip-count
    margin-left: auto
    opacity: .7
    font-size: .8rem

  .tooltip-names
    margin-top: 2px
    opacity: .85
    font-size: .8rem
    overflow-wrap: anywhere

#triangle-tooltip, .grid-tooltip
  .tooltip-biome
    display: flex
    align-items: center
    gap: 6px
    white-space: nowrap

  .tooltip-hex
    opacity: .7
    font-family: monospace
    font-size: .8rem
    margin-left: auto
    padding-left: 12px

  .tooltip-meta
    opacity: .7
    margin-top: 4px
    white-space: pre-line

.grid-wrap
  position: relative
  margin: 0 auto
  align-self: center

  canvas
    display: block
    image-rendering: pixelated
    width: 100%
    height: auto
    cursor: crosshair

.grid-tooltip
  position: absolute
  background-color: var(--color-grey-dark)
  box-shadow: var(--box-shadow)
  padding: 8px 12px
  pointer-events: none
  z-index: 10
  font-size: .85rem
  white-space: nowrap

#grid-info
  margin: 10px 0 0

#convert-output
  display: flex
  flex-direction: column
  gap: 10px

  p
    margin: 0

  .button-download
    align-self: flex-start

#fixed-biomes
  display: grid
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))
  gap: 8px

.fixed-chip
  display: flex
  align-items: center
  gap: 10px
  background-color: var(--color-grey-light)
  padding: 8px 10px
  font-size: .9rem
  min-width: 0

.fixed-chip-text
  display: flex
  flex-direction: column
  min-width: 0
  overflow-wrap: anywhere

.fixed-chip-hex
  opacity: .7
  font-size: .8rem
  font-family: monospace

.swatch
  display: inline-block
  width: 14px
  height: 14px
  flex-shrink: 0
  border: 1px solid #000

.swatch-large
  width: 28px
  height: 28px

.setup pre
  background-color: var(--color-grey-dark)
  padding: 10px 14px
  overflow-x: auto
  font-family: monospace
  font-size: .85rem
  margin: 0

.biome-data
  margin-top: 20px

.table-wrap
  overflow-x: auto

#biome-table
  border-collapse: collapse
  width: 100%
  font-size: .9rem

  th, td
    text-align: left
    padding: 6px 12px
    white-space: nowrap

  th
    background-color: var(--color-grey-dark)
    position: sticky
    top: 0
    z-index: 1

  tr:nth-child(even) td
    background-color: rgba(0, 0, 0, .15)

  .colour-cell
    display: flex
    align-items: center
    gap: 6px

@media only screen and (max-width: 768px)
  .workspace
    grid-template-columns: minmax(0, 1fr)

  #generator
    display: flex
    flex-direction: column

    .column
      display: contents

  .download
    order: 1

  #fixed-wrap, .setup
    order: 2
</style>
