<script>
  import { Canvas } from "../lib/canvas.js"

  const GITHUB_BASE = "https://raw.githubusercontent.com/ewanhowell5195/MinecraftTitleGenerator/main"
  const W = 8192
  const H = 1200

  const fontConfigs = {
    "minecraft-ten": {
      height: 44,
      depth: 22,
      default: "cracked",
      border: 266,
      ends: [
        [0, 22, 62, 84],
        [86, 108, 148, 170],
        [172, 194, 242, 264]
      ]
    },
    "minecraft-five-bold": {
      height: 36,
      depth: 16,
      default: "gradient",
      border: 212,
      ends: [
        [0, 16, 48, 64],
        [66, 82, 114, 130],
        [132, 148, 194, 210]
      ]
    }
  }

  const fontData = {}
  let THREE

  function torad(deg) {
    return deg * Math.PI / 180
  }

  function formatTitleText(text) {
    return text.replace(/A/g, "\u{1F633}").replace(/(\s|^)'/g, "$1\u{1F629}").replace(/(\s|^)"/g, "$1\u{1F629}\u{1F629}").replace(/"/g, "‘‘").toLowerCase().trim()
  }

  async function loadThree() {
    if (THREE) return
    THREE = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js")
  }

  function idToName(id) {
    return id.replace(/(^|_)(\w)/g, (m, s, c) => (s ? " " : "") + c.toUpperCase())
  }

  async function loadFontData() {
    const promises = []
    for (const fontName of Object.keys(fontConfigs)) {
      if (fontData[fontName]) continue
      fontData[fontName] = Object.assign({}, fontConfigs[fontName], { characters: null, textures: {} })
      promises.push(
        fetch(`${GITHUB_BASE}/fonts/${fontName}/characters.json`).then(r => r.json()).then(chars => {
          fontData[fontName].characters = chars
        }),
        fetch(`${GITHUB_BASE}/fonts/${fontName}/textures.json`).then(r => r.json()).then(data => {
          for (const id in data.textures) {
            fontData[fontName].textures[id] = {
              id,
              name: data.textures[id].name ?? idToName(id),
              url: `${GITHUB_BASE}/fonts/${fontName}/textures/${id}.png`
            }
            if (data.textures[id].variants) {
              for (const variant in data.textures[id].variants) {
                fontData[fontName].textures[variant] = {
                  id: variant,
                  name: data.textures[id].variants[variant].name ?? idToName(variant),
                  url: `${GITHUB_BASE}/fonts/${fontName}/textures/${variant}.png`
                }
              }
            }
          }
          fontData[fontName].textures["default"] = fontData[fontName].textures[fontData[fontName].default]
        })
      )
    }
    await Promise.all(promises)
  }

  function loadTexture(url) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader()
      loader.load(url, resolve, undefined, reject)
    })
  }

  async function addTitleText(scene, str, args) {
    const font = fontData[args.font]
    const textureName = font.textures[args.texture] ? args.texture : Object.keys(font.textures)[1] ?? Object.keys(font.textures)[0]
    const textureInfo = font.textures[textureName]

    const texture = await loadTexture(textureInfo.url)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.NearestFilter
    texture.flipY = true

    if (args.type === "bottom") {
      const canvas = document.createElement("canvas")
      const img = texture.image
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      ctx.drawImage(img, 0, 0)
      ctx.globalCompositeOperation = "source-atop"
      const m = canvas.width / 1000
      const height = font.ends[font.ends.length - 1][3]
      const border = ctx.getImageData(0, font.border * m, 1, 1).data
      const gradient = ctx.createLinearGradient(0, 0, 0, height * m)
      for (const stop of font.ends) {
        gradient.addColorStop(stop[0] / height, `rgb(${border[0]},${border[1]},${border[2]})`)
        gradient.addColorStop(stop[1] / height, `rgb(${border[0]},${border[1]},${border[2]}, 0)`)
        gradient.addColorStop(stop[2] / height, `rgb(${border[0]},${border[1]},${border[2]}, 0)`)
        gradient.addColorStop(stop[3] / height, `rgb(${border[0]},${border[1]},${border[2]})`)
      }
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, height * m)
      texture.image = canvas
      texture.needsUpdate = true
    }

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.5
    })

    let width = 0
    const cubes = []
    const group = new THREE.Group()

    for (const char of str) {
      if (char === " ") {
        width += 8
        continue
      }
      if (!font.characters[char]) continue
      let min = Infinity
      let max = -Infinity
      const character = new THREE.Group()

      for (const cubeData of font.characters[char]) {
        const cube = JSON.parse(JSON.stringify(cubeData))
        if (cube.faces && !(typeof Object.values(cube.faces)[0] === "object" && "uv" in Object.values(cube.faces)[0])) {
          for (const [direction, uv] of Object.entries(cube.faces)) {
            cube.faces[direction] = { uv }
          }
        }

        min = Math.min(min, cube.from[0], cube.to[0])
        max = Math.max(max, cube.from[0], cube.to[0])

        if (args.type === "bottom") {
          if (cube.to[2] > cube.from[2]) {
            cube.to[2] += 20
          } else {
            cube.from[2] += 20
          }
        }

        const geometry = new THREE.BoxGeometry(cube.to[0] - cube.from[0], cube.to[1] - cube.from[1], cube.to[2] - cube.from[2])
        const mesh = new THREE.Mesh(geometry, material)

        mesh.position.fromArray([(cube.from[0] + cube.to[0]) / 2, (cube.from[1] + cube.to[1]) / 2, (cube.from[2] + cube.to[2]) / 2])

        const indexes = {
          north: 40,
          east: 0,
          south: 32,
          west: 8,
          up: 16,
          down: 24
        }

        for (const key of Object.keys(indexes)) {
          const face = cube.faces[key]
          const i = indexes[key]
          if (face) {
            const uv = face.uv ?? face
            const uvCoords = [
              [uv[0] / 16, 1 - (uv[1] / 16)],
              [uv[2] / 16, 1 - (uv[1] / 16)],
              [uv[0] / 16, 1 - (uv[3] / 16)],
              [uv[2] / 16, 1 - (uv[3] / 16)]
            ]
            mesh.geometry.attributes.uv.array.set(uvCoords[0], i + 0)
            mesh.geometry.attributes.uv.array.set(uvCoords[1], i + 2)
            mesh.geometry.attributes.uv.array.set(uvCoords[2], i + 4)
            mesh.geometry.attributes.uv.array.set(uvCoords[3], i + 6)
          } else {
            mesh.geometry.attributes.uv.array.set([1, 1], i + 0)
            mesh.geometry.attributes.uv.array.set([1, 1], i + 2)
            mesh.geometry.attributes.uv.array.set([1, 1], i + 4)
            mesh.geometry.attributes.uv.array.set([1, 1], i + 6)
          }
        }
        character.add(mesh)
        cubes.push(mesh)
      }

      for (const cube of character.children) {
        cube.position.x -= width + max
      }
      group.add(character)
      width += max - min
    }

    for (const cube of cubes) {
      cube.position.x += width / 2
    }

    if (args.type === "bottom") {
      group.scale.setX(0.75)
      group.scale.setY(1.6)
      group.scale.setZ(0.75)
      group.rotation.fromArray([torad(-90), 0, 0])
      group.position.z += font.height + 49
      group.position.y -= 25 - font.depth
    } else if (args.type === "small") {
      group.scale.setX(0.35)
      group.scale.setY(0.35)
      group.scale.setZ(0.35)
      group.position.y -= font.height * 0.35
    }

    scene.add(group)
  }

  function makeTitleScene() {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(18, W / H, 1, 1000)
    camera.position.set(0, -170, -320)
    camera.lookAt(new THREE.Vector3(0, 0, 0))
    camera.up.set(0, 1, 0)
    camera.updateProjectionMatrix()
    return [scene, camera]
  }

  function renderTitleScene(scene, camera) {
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: true
    })
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)
    renderer.render(scene, camera)

    const srcCanvas = renderer.domElement
    const halfW = Math.floor(W / 2)
    const halfH = Math.floor(H / 2)
    const canvas = new Canvas(halfW, halfH)
    const ctx = canvas.getContext("2d")
    ctx.drawImage(srcCanvas, 0, 0, halfW, halfH)
    canvas.trim()

    renderer.dispose()
    return canvas
  }

  function textureOptions(fontName, defaultTexture) {
    const font = fontData[fontName]
    if (!font) return { options: [], selected: "" }
    const keys = Object.keys(font.textures).filter(k => k !== "default")
    const options = Object.entries(font.textures).filter(([id]) => id !== "default").map(([id, tex]) => ({ id, name: tex.name }))
    return { options, selected: defaultTexture ?? keys[1] ?? keys[0] }
  }
</script>

<script setup>
  import { ref, shallowRef, onBeforeUnmount } from "vue"
  import Page from "../components/Page.vue"
  import Link from "../components/Link.vue"
  import Icon from "../components/Icon.js"
  import { site } from "../lib/site.js"

  site.selected = null

  const loading = ref(true)
  const loadingText = ref("Loading fonts and textures...")
  const topText = ref("Minecraft")
  const bottomText = ref("Title Generator")
  const smallText = ref("")
  const topTexture = ref("")
  const bottomTexture = ref("")
  const smallTexture = ref("")
  const topOptions = shallowRef([])
  const bottomOptions = shallowRef([])
  const smallOptions = shallowRef([])
  const currentCanvas = shallowRef(null)

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

  let debounceTimer
  let rendering = false
  let pendingRender = false

  async function render() {
    if (rendering) {
      pendingRender = true
      return
    }

    const top = topText.value.trim()
    const bottom = bottomText.value.trim()
    const small = smallText.value.trim()

    if (!top && !bottom && !small) {
      currentCanvas.value = null
      return
    }

    rendering = true

    try {
      const [scene, camera] = makeTitleScene()

      if (top) {
        await addTitleText(scene, formatTitleText(top), {
          font: "minecraft-ten",
          texture: topTexture.value
        })
      }
      if (bottom) {
        const tex = bottomTexture.value
        await addTitleText(scene, formatTitleText(bottom), {
          type: "bottom",
          font: "minecraft-ten",
          texture: tex && tex !== "default" ? tex : (fontData["minecraft-ten"].textures.gradient ? "gradient" : "default")
        })
      }
      if (small) {
        await addTitleText(scene, formatTitleText(small), {
          type: "small",
          font: "minecraft-five-bold",
          texture: smallTexture.value
        })
      }

      currentCanvas.value = renderTitleScene(scene, camera)
    } catch (err) {
      console.error(err)
    }

    rendering = false
    if (pendingRender) {
      pendingRender = false
      render()
    }
  }

  function scheduleRender() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(render, 300)
  }

  function setOptions(options, model, fontName, defaultTexture) {
    const result = textureOptions(fontName, defaultTexture)
    options.value = result.options
    model.value = result.selected
  }

  async function init() {
    try {
      await Promise.all([loadThree(), loadFontData()])
    } catch (err) {
      loadingText.value = "Failed to load resources. Please refresh the page."
      loading.value = false
      return
    }

    loadingText.value = ""

    setOptions(topOptions, topTexture, "minecraft-ten")
    setOptions(bottomOptions, bottomTexture, "minecraft-ten", "gradient")
    setOptions(smallOptions, smallTexture, "minecraft-five-bold")

    loading.value = false

    render()
  }

  init()

  onBeforeUnmount(() => clearTimeout(debounceTimer))
</script>

<template>
  <Page :loading="loading">
    <div class="container">
      <h1>Minecraft Title Generator</h1>
      <p>The Minecraft Title Generator is a<Link to="/plugins/minecraft-title-generator">Blockbench plugin</Link> that allows you to create Minecraft-styled title models that you can render in high quality. It supports custom textures, multiple fonts, and full 3D rendering.</p>
      <p>For quick and simple titles, you can use the generator below.</p>
      <h2>Quick Generator</h2>
      <p>Enter your text below to generate a Minecraft-styled title image.</p>
      <div class="inputs">
        <div class="input-group">
          <label for="top-text">Top Text</label>
          <div class="input-row">
            <input id="top-text" type="text" maxlength="24" v-model="topText" @input="scheduleRender">
            <select id="top-texture" v-model="topTexture" @change="render">
              <option v-for="tex of topOptions" :value="tex.id">{{ tex.name }}</option>
            </select>
          </div>
        </div>
        <div class="input-group">
          <label for="bottom-text">Bottom Text</label>
          <div class="input-row">
            <input id="bottom-text" type="text" maxlength="34" v-model="bottomText" @input="scheduleRender">
            <select id="bottom-texture" v-model="bottomTexture" @change="render">
              <option v-for="tex of bottomOptions" :value="tex.id">{{ tex.name }}</option>
            </select>
          </div>
        </div>
        <div class="input-group">
          <label for="small-text">Small Text</label>
          <div class="input-row">
            <input id="small-text" type="text" maxlength="60" v-model="smallText" @input="scheduleRender">
            <select id="small-texture" v-model="smallTexture" @change="render">
              <option v-for="tex of smallOptions" :value="tex.id">{{ tex.name }}</option>
            </select>
          </div>
        </div>
      </div>
      <div id="loading">{{ loadingText }}</div>
      <div id="output">
        <template v-if="currentCanvas">
          <canvas v-canvas="currentCanvas"></canvas>
          <div class="output-actions">
            <div class="button-download" @click="currentCanvas.saveAs('minecraft_title.png')"><Icon name="download" /><span>Download</span></div>
          </div>
        </template>
      </div>
    </div>
  </Page>
</template>

<style lang="stylus" scoped>
  @import "../styles/buttons.styl"

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

  h2
    margin-top: 32px

  p
    white-space: pre-wrap

  a
    color: var(--color-link-blue)

  .inputs
    display: flex
    flex-direction: column
    gap: 16px
    padding: 16px 0

  .input-group
    display: flex
    flex-direction: column
    gap: 4px

    label
      font-weight: 700
      font-size: 14px
      color: var(--color-text-grey)

  .input-row
    display: flex
    gap: 8px

    input
      flex: 1
      padding: 8px 12px
      background-color: var(--color-grey-lighter)
      border: none
      color: white
      font-size: 16px
      font-family: inherit

      &::placeholder
        color: var(--color-text-grey)

    select
      padding: 8px 12px
      background-color: var(--color-grey-lighter)
      border: none
      color: white
      font-size: 14px
      font-family: inherit
      cursor: pointer
      min-width: 140px

  #loading
    padding: 16px 0
    color: var(--color-text-grey)
    font-style: italic

  #output
    padding: 20px 0 40px

    canvas
      background-image: url("/assets/images/misc/transparent_dark.webp")
      box-shadow: var(--box-shadow)
      max-width: calc(100vw - 80px)
      image-rendering: auto

    .output-actions
      display: flex
      gap: 8px
      padding-top: 16px
</style>
