<script setup>
  import { ref, reactive, shallowReactive, nextTick, onMounted, useTemplateRef } from "vue"
  import { saveAs } from "file-saver"
  import Page from "../../components/Page.vue"
  import FileInput from "../../components/FileInput.vue"
  import Icon from "../../components/Icon.js"
  import { site } from "../../lib/site.js"
  import { EYES, MOUTHS, MAX_SKIN_SIZE, EYE_DESIGNS, MOUTH_DESIGNS, MRES_CHANNELS, MRES_SUFFIX, blank, drawImage, downscale, expandLegacy, isSlim, wideToSlim, hasOuterLayer, toDungeons, capeScale, toDungeonsCape, drawFace, drawPortrait, drawTexture, faceTone, suggestEyes, overlaps, suggestMouth, createViewer, loadViewerData, readImage, download, defaultMres, guessMres, splitMres, channelFrom, resample, interleave, encodePng, readExact, drawDesign, remembered, remember, fileToDataUrl } from "./dungeons2skinconverter.js"

  site.selected = null

  const CHANNEL_HINTS = ["Red channel. White reflects light tinted by the skin's colour, like gold or iron. Black is a non-metal like cloth or skin, and grey is in between. How shiny it is comes from Roughness.", "Green channel. White is matte, black is shiny, and grey is in between.", "Blue channel. White glows fully, black does not glow, and grey glows dimly.", "Alpha channel. White lets light soften through, which is used on skin. Grey gives a weaker effect."]
  const ARMS = [1, 2, 3, 4].map(n => ({ id: n, label: `Column ${n}` }))
  const LAYER = [{ id: true, label: "Merge", note: "Onto the base layer, so it shows in game" }, { id: false, label: "Leave separate", note: "Only shows with the Second Skin Layer mod" }]

  const loading = ref(true)
  const tab = ref("converter")
  const error = ref("")
  const mresError = ref("")
  const showSkin = ref(false)
  const showCape = ref(false)
  const built = ref(false)
  const layers = ref(false)
  const eyesNote = ref("")
  const mouthNote = ref("")
  const mresMode = ref("guess")
  const mresNote = ref("Showing the default MRES texture. Upload a skin or an MRES texture to start from that instead.")
  const channelDefault = reactive([true, true, true, true])

  const state = shallowReactive({ source: null, wide: false, layer: false, arms: 2, merge: true, eyes: "none", mouth: "none", skinName: "converted_skin", capeName: "converted_cape" })
  const mres = { data: defaultMres(), name: "Skin" }
  const canvases = { eyes: [], mouth: [], arms: [], merge: [], channels: [] }

  const faceCanvas = useTemplateRef("face")
  const portraitCanvas = useTemplateRef("portrait")
  const textureCanvas = useTemplateRef("texture")
  const capeTextureCanvas = useTemplateRef("capeTexture")
  const viewerElement = useTemplateRef("viewerContainer")
  const capeViewerElement = useTemplateRef("capeViewerContainer")

  let viewer = null
  let capeViewer = null

  function rememberSkin(values) {
    remember({ skin: Object.assign(remembered().skin || {}, values) })
  }

  function baseName(file) {
    return file.name.toLowerCase().endsWith(".png") ? file.name.slice(0, -4) : file.name
  }

  async function viewers() {
    await loadViewerData()
    if (!viewer) viewer = createViewer(viewerElement.value)
    if (!capeViewer) capeViewer = createViewer(capeViewerElement.value, { yaw: 0.45 + Math.PI, capeOnly: true })
  }

  function prepared(source = state.source) {
    return state.wide ? wideToSlim(source, state.arms) : source
  }

  function convert(eyes, mouth, source = state.source) {
    const features = [EYES.find(e => e.id === eyes), MOUTHS.find(m => m.id === mouth)].filter(f => f.pieces)
    return toDungeons(prepared(source), state.merge, features)
  }

  function drawArm(canvas, column) {
    const slim = wideToSlim(state.preview, column)
    const arms = blank(8, 22, slim.scale)
    for (const [x, y, dx] of [[44, 16, 0], [44, 32, 0], [36, 48, 5], [52, 48, 5]]) {
      drawImage(slim, x, y, 3, 4, arms, dx, 0)
      drawImage(slim, x, y + 4, 3, 12, arms, dx, 5)
      drawImage(slim, x + 3, y, 3, 4, arms, dx, 18)
    }
    canvas.width = arms.width
    canvas.height = arms.height
    drawTexture(canvas, arms)
  }

  function choices(key, options, suggestion, blocked = null) {
    return options.map(option => {
      const disabled = blocked ? overlaps(option, blocked.with) : false
      return { option, className: option.id === state[key] ? "choice selected" : disabled ? "choice disabled" : "choice", detected: option.id === suggestion, note: disabled ? blocked.note : option.note, disabled }
    })
  }

  const eyeChoices = () => choices("eyes", EYES, state.eyeSuggestion, { with: MOUTHS.find(m => m.id === state.mouth), note: "Overlaps the chosen mouth" })
  const mouthChoices = () => choices("mouth", MOUTHS, state.mouthSuggestion, { with: EYES.find(e => e.id === state.eyes), note: "Overlaps the chosen eyes" })

  function choose(key, card) {
    if (card.disabled) return
    state[key] = card.option.id
    refresh()
  }

  function drawChoices(key, options, render) {
    for (const [index, option] of options.entries()) {
      const canvas = canvases[key][index]
      canvas.width = 64
      canvas.height = 64
      render(canvas, option)
    }
  }

  async function refresh() {
    const eyes = EYES.find(e => e.id === state.eyes)
    const mouth = MOUTHS.find(m => m.id === state.mouth)
    if (overlaps(eyes, mouth)) state.mouth = "none"
    const result = convert(state.eyes, state.mouth)
    drawFace(faceCanvas.value, result)
    drawPortrait(portraitCanvas.value, result)
    drawTexture(textureCanvas.value, result)
    if (state.shownMerge !== state.merge) {
      layers.value = !state.merge
      state.shownMerge = state.merge
    }
    if (viewer) {
      viewer.setSkin(result)
      viewer.setLayers(layers.value)
    }
    rememberSkin({ settings: { arms: state.arms, merge: state.merge, eyes: state.eyes, mouth: state.mouth, layers: layers.value } })
    built.value = true
    await nextTick()
    const eyesDrawn = convert("none", state.mouth, state.preview)
    const mouthDrawn = convert(state.eyes, "none", state.preview)
    drawChoices("eyes", EYES, (canvas, option) => option.id === "none" ? drawFace(canvas, eyesDrawn, false) : drawDesign(canvas, EYE_DESIGNS[option.id], null))
    drawChoices("mouth", MOUTHS, (canvas, option) => option.id === "none" ? drawFace(canvas, mouthDrawn, false) : drawDesign(canvas, null, MOUTH_DESIGNS[option.id]))
    if (state.wide) drawChoices("arms", ARMS, (canvas, option) => drawArm(canvas, option.id))
    const flat = prepared(state.preview)
    if (state.layer) drawChoices("merge", LAYER, (canvas, option) => drawTexture(canvas, toDungeons(flat, option.id, [])))
  }

  async function load(file, settings, restoring) {
    error.value = ""
    showSkin.value = false
    showCape.value = false
    let img
    try {
      img = await readImage(file)
    } catch {
      error.value = `${file.name} could not be opened as an image.`
      return
    }
    const scale = capeScale(img)
    if (scale) {
      state.cape = toDungeonsCape(img, scale)
      state.capeName = baseName(file)
      drawTexture(capeTextureCanvas.value, state.cape)
      if (!restoring) remember({ cape: { image: await fileToDataUrl(file), name: file.name }, showing: "cape" })
      showCape.value = true
      await viewers()
      capeViewer.setCape(state.cape)
      return
    }
    if (img.width % 64 || img.width > MAX_SKIN_SIZE || (img.height !== img.width && img.height * 2 !== img.width)) {
      error.value = `${file.name} is ${img.width}×${img.height}. Skins need to be 64×64 or the old 64×32, or a multiple of that size up to ${MAX_SKIN_SIZE}×${MAX_SKIN_SIZE}.`
      return
    }
    if (!restoring) remember({ skin: { image: await fileToDataUrl(file), name: file.name }, showing: "skin" })
    state.skinName = baseName(file)
    img.scale = img.width / 64
    state.source = img.height < img.width ? expandLegacy(img) : img
    state.preview = downscale(state.source, 4)
    state.wide = !isSlim(state.source)
    state.arms = settings?.arms ?? 2
    const slim = prepared()
    state.layer = hasOuterLayer(slim)
    state.merge = settings?.merge ?? true
    const tone = faceTone(slim)
    state.eyeSuggestion = tone ? suggestEyes(slim, tone) : null
    state.mouthSuggestion = tone ? suggestMouth(slim, tone, EYES.find(e => e.id === state.eyeSuggestion)) : null
    state.eyes = settings?.eyes ?? (state.eyeSuggestion || "none")
    state.mouth = settings?.mouth ?? (state.mouthSuggestion || "none")
    eyesNote.value = state.eyeSuggestion ? "The shape was detected automatically. Check the preview, and pick a different one if it is wrong." : "The eyes could not be detected automatically, so they are kept as drawn. Pick a shape if your skin uses a compatible one."
    mouthNote.value = state.mouthSuggestion ? "The shape was detected automatically. Check the preview, and pick a different one if it is wrong." : "The mouth could not be detected automatically, so it is kept as drawn. Pick a shape if your skin uses a compatible one."
    if (settings && settings.layers !== undefined) {
      layers.value = settings.layers
      state.shownMerge = state.merge
    } else {
      state.shownMerge = null
    }
    showSkin.value = true
    await viewers()
    refresh()
  }

  function layersChange() {
    if (viewer) viewer.setLayers(layers.value)
    rememberSkin({ settings: Object.assign(remembered().skin?.settings || {}, { layers: layers.value }) })
  }

  function drawMres() {
    const { width, height, channels } = mres.data
    const defaults = defaultMres(width, height).channels
    for (const [index, channel] of channels.entries()) {
      const canvas = canvases.channels[index]
      canvas.width = width
      canvas.height = height
      canvas.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(interleave([channel, channel, channel, new Uint8Array(channel.length).fill(255)])), width, height), 0, 0)
      channelDefault[index] = channel.every((value, p) => value === defaults[index][p])
    }
  }

  function mresName(file) {
    return baseName(file).replace(MRES_SUFFIX, "")
  }

  async function loadMres(file) {
    mresError.value = ""
    let img
    try {
      img = await readExact(file)
    } catch {
      mresError.value = `${file.name} could not be opened as an image.`
      return
    }
    if (mresMode.value === "guess") {
      if (img.width % 64 || img.width > MAX_SKIN_SIZE || img.height !== img.width) {
        mresError.value = `${file.name} is ${img.width}×${img.height}. Guessing needs a Dungeons II skin, 64×64 or a multiple of that size up to ${MAX_SKIN_SIZE}×${MAX_SKIN_SIZE}.`
        return
      }
      img.scale = img.width / 64
      mres.data = guessMres(img)
      mresNote.value = `Guessed from ${file.name}. Check it over, and fix anything it got wrong.`
    } else {
      mres.data = splitMres(img)
      mresNote.value = `Split from ${file.name}.`
    }
    mres.name = mresName(file)
    drawMres()
  }

  async function replaceChannel(index, file) {
    let img
    try {
      img = await readExact(file)
    } catch {
      return `${file.name} could not be opened as an image.`
    }
    const { width, height } = mres.data
    if (img.width * height !== img.height * width) return `${file.name} is ${img.width}×${img.height}, which does not match the ${width}×${height} MRES texture.`
    const size = img.width > width ? [img.width, img.height] : [width, height]
    mres.data.channels = mres.data.channels.map(channel => resample(channel, width, height, ...size))
    mres.data.channels[index] = resample(channelFrom(img), img.width, img.height, ...size)
    mres.data.width = size[0]
    mres.data.height = size[1]
  }

  async function replace(index, file) {
    mresError.value = await replaceChannel(index, file) || ""
    drawMres()
  }

  function channelDrop(index, e) {
    if (e.dataTransfer.files[0]) replace(index, e.dataTransfer.files[0])
  }

  function channelInput(index, e) {
    if (e.target.files[0]) replace(index, e.target.files[0])
    e.target.value = ""
  }

  function channelReset(index) {
    mres.data.channels[index] = defaultMres(mres.data.width, mres.data.height).channels[index]
    drawMres()
  }

  async function channelSave(index) {
    saveAs(await encodePng(mres.data.width, mres.data.height, mres.data.channels[index], 0), `${mres.name}_${MRES_CHANNELS[index]}.png`)
  }

  async function mresSave() {
    saveAs(await encodePng(mres.data.width, mres.data.height, interleave(mres.data.channels), 6), `${mres.name}_MRES.png`)
  }

  function mresInput(files) {
    if (files[0] && tab.value === "mres") loadMres(files[0])
  }

  function skinInput(files) {
    if (files[0] && tab.value === "converter") load(files[0])
  }

  function skinSave() {
    download(convert(state.eyes, state.mouth), state.skinName)
  }

  function capeSave() {
    download(state.cape, state.capeName)
  }

  onMounted(async () => {
    drawMres()
    const memory = remembered()
    const last = memory[memory.showing]
    if (last) {
      const blob = await fetch(last.image).then(r => r.blob())
      load(new File([blob], last.name, { type: "image/png" }), last.settings, true)
    }
    loading.value = false
  })
</script>

<template>
  <Page :loading="loading">
    <div class="container">
      <h1>Custom Skin Converter for Minecraft Dungeons II</h1>
      <p>This is a tool that converts a Minecraft Java skin or cape into the Minecraft Dungeons II layout, ready for the Custom Skin Loader mod.</p>
      <div class="panel mods">
        <h2>Mods</h2>
        <div class="mod-list">
          <div class="mod">
            <h3>Custom Skin Loader</h3>
            <p class="hint">Required. Loads your converted skins and capes in game.</p>
            <a class="button-download mod-download" href="https://www.nexusmods.com/minecraftdungeons2/mods/9" target="_blank"><Icon name="download" /><span>Download</span></a>
          </div>
          <div class="mod">
            <h3>Second Skin Layer</h3>
            <p class="hint">Optional. Shows a skin's outer layer on the body, arms and legs, which Dungeons II leaves out.</p>
            <a class="button-download mod-download" href="https://www.nexusmods.com/minecraftdungeons2/mods/10" target="_blank"><Icon name="download" /><span>Download</span></a>
          </div>
        </div>
      </div>
      <div class="tabs">
        <div class="tab" :class="{ active: tab === 'converter' }" data-tab="converter" @click="tab = 'converter'">Skin converter</div>
        <div class="tab" :class="{ active: tab === 'mres' }" data-tab="mres" @click="tab = 'mres'">MRES helper</div>
      </div>
      <div id="converter-tab" :class="{ hidden: tab !== 'converter' }">
        <p>Please provide a Minecraft Java skin or cape.</p>
        <FileInput id="skin-input" accept=".png,image/png" @change="skinInput" />
        <div id="error">{{ error }}</div>
        <div id="skin" class="workspace" :class="{ hidden: !showSkin }">
          <div class="column">
            <div class="previews">
              <div class="panel">
                <h2>3D preview</h2>
                <p class="hint mouse">Drag to rotate, right drag to pan, and scroll to zoom.</p>
                <p class="hint touch">Drag to rotate, and use two fingers to pan and zoom.</p>
                <div id="viewer" ref="viewerContainer" class="viewer"></div>
                <label class="toggle">
                  <input id="layers" v-model="layers" type="checkbox" @change="layersChange">
                  <span>Show with the Second Skin Layer mod</span>
                </label>
              </div>
              <div class="panel">
                <h2>Face</h2>
                <p class="hint">How the face looks in Dungeons II. Your character uses the eye and mouth pieces, and the hero list and party portraits show the face as drawn.</p>
                <div class="faces">
                  <div class="face">
                    <canvas id="face" ref="face" class="preview-face" width="8" height="8"></canvas>
                    <span>In game</span>
                  </div>
                  <div class="face">
                    <canvas id="portrait" ref="portrait" class="preview-face" width="8" height="8"></canvas>
                    <span>Portraits</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="panel converted">
              <h2>Converted skin</h2>
              <canvas id="texture" ref="texture" class="preview-texture" width="256" height="256"></canvas>
            </div>
            <div class="panel download">
              <h2>Download</h2>
              <p class="hint">Rename the file to match the skin you want to replace, then put it in the mod's skins folder. The mod's default skins show the names to use.</p>
              <div class="save">
                <div id="skin-save" class="button-download" @click="skinSave"><Icon name="download" /><span>Download</span></div>
              </div>
            </div>
          </div>
          <div class="column">
            <div class="pair">
              <div id="arms-panel" class="panel" :class="{ hidden: !state.wide }">
                <h2>Arms</h2>
                <p class="hint">This skin has wide (Steve style) arms, which are 4 pixels wide. Dungeons II arms are 3 pixels wide, so one column of pixels is removed from each arm. Column 2 works for most skins.</p>
                <div id="arms" class="choices small">
                  <template v-if="built && state.wide">
                    <div v-for="(card, index) in choices('arms', ARMS, null)" :key="card.option.id" :class="card.className" @click="choose('arms', card)">
                      <span v-if="card.detected" class="badge">Detected</span>
                      <canvas :ref="el => canvases.arms[index] = el" width="64" height="64"></canvas>
                      <span>{{ card.option.label }}</span>
                      <small v-if="card.note">{{ card.note }}</small>
                    </div>
                  </template>
                </div>
              </div>
              <div id="layer-panel" class="panel" :class="{ hidden: !state.layer }">
                <h2>Outer layer</h2>
                <p class="hint">This skin has an outer layer on its body, arms or legs. Dungeons II only has an outer layer for the hat, and the <a href="https://www.nexusmods.com/minecraftdungeons2/mods/10" target="_blank">Second Skin Layer</a> mod adds the rest.</p>
                <div id="layer" class="choices">
                  <template v-if="built && state.layer">
                    <div v-for="(card, index) in choices('merge', LAYER, null)" :key="String(card.option.id)" :class="card.className" @click="choose('merge', card)">
                      <span v-if="card.detected" class="badge">Detected</span>
                      <canvas :ref="el => canvases.merge[index] = el" width="64" height="64"></canvas>
                      <span>{{ card.option.label }}</span>
                      <small v-if="card.note">{{ card.note }}</small>
                    </div>
                  </template>
                </div>
              </div>
            </div>
            <div class="panel">
              <h2>Eyes</h2>
              <p class="hint">Dungeons II skins have a blank face, with the eyes and mouth as separate pieces that blink, look around and talk. Pick the shape your skin's eyes use to turn them into those pieces, or keep the face as drawn. The eyes need to be 2 pixels wide, 1 pixel in from each side of the face. The pupil can be on either side, and is moved to the inside.</p>
              <p id="eyes-note" class="note">{{ eyesNote }}</p>
              <div id="eyes" class="choices">
                <template v-if="built">
                  <div v-for="(card, index) in eyeChoices()" :key="card.option.id" :class="card.className" @click="choose('eyes', card)">
                    <span v-if="card.detected" class="badge">Detected</span>
                    <canvas :ref="el => canvases.eyes[index] = el" width="64" height="64"></canvas>
                    <span>{{ card.option.label }}</span>
                    <small v-if="card.note">{{ card.note }}</small>
                  </div>
                </template>
              </div>
            </div>
            <div class="panel">
              <h2>Mouth</h2>
              <p class="hint">The mouth needs to be in the middle of the face.</p>
              <p id="mouth-note" class="note">{{ mouthNote }}</p>
              <div id="mouth" class="choices">
                <template v-if="built">
                  <div v-for="(card, index) in mouthChoices()" :key="card.option.id" :class="card.className" @click="choose('mouth', card)">
                    <span v-if="card.detected" class="badge">Detected</span>
                    <canvas :ref="el => canvases.mouth[index] = el" width="64" height="64"></canvas>
                    <span>{{ card.option.label }}</span>
                    <small v-if="card.note">{{ card.note }}</small>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
        <div id="cape" class="workspace" :class="{ hidden: !showCape }">
          <div class="column">
            <div class="panel">
              <h2>3D preview</h2>
              <p class="hint mouse">Drag to rotate, right drag to pan, and scroll to zoom.</p>
              <p class="hint touch">Drag to rotate, and use two fingers to pan and zoom.</p>
              <div id="cape-viewer" ref="capeViewerContainer" class="viewer"></div>
            </div>
            <div class="panel">
              <h2>Converted cape</h2>
              <canvas id="cape-texture" ref="capeTexture" class="preview-texture" width="256" height="128"></canvas>
            </div>
          </div>
          <div class="column">
            <div class="panel">
              <h2>Download</h2>
              <p class="hint">Rename the file to match the cape you want to replace, then put it in the mod's capes folder. The mod's default capes show the names to use.</p>
              <div class="save">
                <div id="cape-save" class="button-download" @click="capeSave"><Icon name="download" /><span>Download</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="mres-tab" :class="{ hidden: tab !== 'mres' }">
        <p>Every Dungeons II skin and cape also has an MRES texture, which controls how its surface reacts to light. Each of its colour channels is a greyscale map with a different job, where grey gives anything in between the black and white extremes. This tool splits an MRES texture into those channels so they are easy to edit, and puts them back together.</p>
        <div class="modes">
          <label class="mode">
            <input v-model="mresMode" type="radio" name="mres-mode" value="guess">
            <div>
              <span>Guess from a skin</span>
              <p class="hint">Makes a starting MRES texture from your Dungeons II skin, with subsurface on the pixels matching the face's skin tone.</p>
            </div>
          </label>
          <label class="mode">
            <input v-model="mresMode" type="radio" name="mres-mode" value="split">
            <div>
              <span>Split an MRES texture</span>
              <p class="hint">Splits an MRES texture you already have into its channels.</p>
            </div>
          </label>
        </div>
        <FileInput id="mres-input" accept=".png,image/png" @change="mresInput" />
        <div id="mres-error">{{ mresError }}</div>
        <div id="mres" class="workspace">
          <div class="column">
            <div class="panel">
              <h2>MRES texture</h2>
              <p id="mres-note" class="note">{{ mresNote }}</p>
              <p class="hint">Download a channel, edit it in any image editor, then put it back with Replace or by dropping it onto the channel.</p>
              <p class="hint">Name the MRES texture &lt;Name&gt;_MRES.png and put it next to &lt;Name&gt;.png in the mod's skins or capes folder.</p>
              <div class="save">
                <div id="mres-save" class="button-download" @click="mresSave"><Icon name="download" /><span>Download MRES</span></div>
              </div>
            </div>
          </div>
          <div class="column">
            <div class="channels">
              <div v-for="(channel, index) in MRES_CHANNELS" :key="channel" class="panel channel" :data-channel="index" @dragover.prevent @drop.prevent="e => channelDrop(index, e)">
                <h2>{{ channel }}</h2>
                <p class="hint">{{ CHANNEL_HINTS[index] }}</p>
                <canvas :id="`channel-${index}`" :ref="el => canvases.channels[index] = el"></canvas>
                <div class="channel-buttons">
                  <div class="button-download channel-save" @click="channelSave(index)"><Icon name="download" /><span>Download</span></div>
                  <label class="button">
                    <img src="/assets/images/svg/upload.svg">
                    <span>Replace</span>
                    <input class="channel-input hidden" type="file" accept=".png,image/png" @change="e => channelInput(index, e)">
                  </label>
                  <div class="button channel-reset" :class="{ hidden: channelDefault[index] }" @click="channelReset(index)">
                    <span>Reset</span>
                  </div>
                </div>
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
    margin: 0 0 4px
    font-size: 1.2rem

  p
    white-space: pre-wrap

  a
    color: var(--color-link-blue)

  :deep(.hidden)
    display: none !important

  #error, #mres-error
    color: var(--color-red-light)
    padding-top: 12px
    white-space: pre-wrap

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

  .modes
    display: flex
    flex-direction: column
    gap: 12px
    margin-bottom: 16px

  .mode
    display: flex
    align-items: flex-start
    gap: 10px
    cursor: pointer
    user-select: none

    input
      accent-color: var(--color-download)
      width: 18px
      height: 18px
      margin: 2px 0 0

    span
      font-size: 1.1rem
      font-weight: 700

    p
      margin: 2px 0 0

  .channels
    display: grid
    grid-template-columns: repeat(2, minmax(0, 1fr))
    gap: 20px

  .channel
    display: flex
    flex-direction: column

    .hint
      flex: 1

    canvas
      width: 100%

  .channel-buttons
    display: flex
    flex-wrap: wrap
    gap: 10px
    margin-top: 10px

    > *
      flex: 1

  @media only screen and (max-width: 1024px)
    #mres
      grid-template-columns: minmax(0, 1fr)

      .save
        align-items: flex-start

  .workspace
    display: grid
    grid-template-columns: minmax(0, 340px) minmax(0, 1fr)
    gap: 20px
    padding-top: 20px

  .column, .previews
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

  .touch
    display: none

  @media (hover: none) and (pointer: coarse)
    .mouse
      display: none

    .touch
      display: block

  .note
    font-size: .9rem
    color: var(--color-text-optifine)

    &:empty
      display: none

  :deep(canvas)
    image-rendering: pixelated
    background-image: url("/assets/images/misc/transparent_dark.webp")
    display: block
    max-width: 100%

  .preview-face
    width: 100%
    aspect-ratio: 1

  .faces
    display: grid
    grid-template-columns: repeat(2, minmax(0, 1fr))
    gap: 10px

  .face
    display: flex
    flex-direction: column
    gap: 4px
    font-size: .85rem
    text-align: center

  .viewer
    position: relative
    width: 100%
    aspect-ratio: 1
    background-image: url("/assets/images/misc/transparent_dark.webp")
    cursor: grab
    touch-action: none
    user-select: none

    &:active
      cursor: grabbing

    :deep(canvas)
      background: none
      width: 100% !important
      height: 100% !important

    :deep(.reset)
      position: absolute
      top: 8px
      right: 8px
      font: inherit
      font-size: .85rem
      color: var(--color-text-white)
      background-color: var(--color-grey-light)
      border: none
      padding: 6px 10px
      box-shadow: var(--box-shadow)
      cursor: pointer
      user-select: none
      transition: background-color .15s

      &:hover
        background-color: var(--color-grey-lighter)

  .toggle
    display: flex
    align-items: center
    gap: 8px
    margin-top: 10px
    font-size: .9rem
    cursor: pointer
    user-select: none

    input
      accent-color: var(--color-download)
      margin: 0

  .preview-texture
    width: 100%

  .choices
    display: grid
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr))
    gap: 10px

    &.small
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr))

  .choice
    position: relative
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

    &.disabled
      opacity: .4
      cursor: not-allowed

      &:hover
        background-color: var(--color-grey-light)

    canvas
      width: 100%
      aspect-ratio: 1

    small
      opacity: .7

  #arms
    grid-template-columns: repeat(auto-fill, minmax(78px, 1fr))

    span
      white-space: nowrap

    canvas
      width: 56px
      height: 154px
      aspect-ratio: auto
      align-self: center

  .pair
    display: flex
    flex-wrap: wrap
    gap: 20px

    > .panel
      flex: 1 1 280px

    &:not(:has(> .panel:not(.hidden)))
      display: none

  .badge
    position: absolute
    top: 12px
    left: 12px
    right: 12px
    background-color: var(--color-download)
    padding: 2px 6px
    font-size: .75rem
    font-weight: 700
    text-align: center
    box-shadow: var(--box-shadow)

  .mods
    margin-bottom: 4px

  .mod-list
    display: grid
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))
    gap: 12px
    margin-top: 8px

  .mod
    display: flex
    flex-direction: column
    gap: 6px
    padding: 12px
    background-color: var(--color-grey-light)

    h3
      margin: 0
      font-size: 1.05rem

    p
      margin: 0
      flex: 1

    .button-download
      align-self: flex-start

  .save
    display: flex
    flex-direction: column
    gap: 10px
    align-items: stretch

  @media only screen and (max-width: 768px)
    .workspace
      grid-template-columns: minmax(0, 1fr)

    #skin
      display: flex
      flex-direction: column

      .column
        display: contents

    .previews
      position: sticky
      top: var(--header-height)
      z-index: 2
      display: grid
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)
      align-items: start
      gap: 10px
      margin: -10px -20px 0
      padding: 10px 20px
      background-color: var(--color-grey-darker)

      .panel
        padding: 8px
        display: flex
        flex-direction: column

      h2, .hint
        display: none

      .toggle
        margin-top: 6px
        font-size: .75rem

      .faces
        gap: 6px

      .face
        font-size: .75rem

    .converted
      order: 1

    .download
      order: 2

    .choices
      grid-template-columns: repeat(3, minmax(0, 1fr))
      gap: 8px

    .choice
      padding: 6px
      gap: 4px
      font-size: .8rem

    #layer
      grid-template-columns: repeat(2, minmax(0, 1fr))

    .channels
      grid-template-columns: minmax(0, 1fr)

    #arms
      grid-template-columns: repeat(4, minmax(0, 1fr))

      canvas
        width: 100%
        height: auto
        aspect-ratio: 8 / 22

    .badge
      top: 8px
      left: 8px
      right: 8px
      padding: 2px 4px
      font-size: .65rem
</style>
