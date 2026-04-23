import { Canvas } from "/js/libs/canvas.js"

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
  return text.replace(/A/g, "\u{1F633}").replace(/(\s|^)'/g, "$1\u{1F629}").replace(/(\s|^)"/g, "$1\u{1F629}\u{1F629}").replace(/"/g, "\u2018\u2018").toLowerCase().trim()
}

async function loadThree() {
  if (THREE) return
  const module = await import("https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js")
  THREE = module
}

async function loadFontData() {
  const promises = []
  for (const fontName of Object.keys(fontConfigs)) {
    if (fontData[fontName]) continue
    fontData[fontName] = { ...fontConfigs[fontName], characters: null, textures: {} }
    promises.push(
      fetch(`${GITHUB_BASE}/fonts/${fontName}/characters.json`).then(r => r.json()).then(chars => {
        fontData[fontName].characters = chars
      }),
      fetch(`${GITHUB_BASE}/fonts/${fontName}/textures.json`).then(r => r.json()).then(data => {
        for (const id in data.textures) {
          fontData[fontName].textures[id] = {
            id,
            name: data.textures[id].name ?? id.replace(/(^|_)(\w)/g, (m, s, c) => (s ? " " : "") + c.toUpperCase()),
            url: `${GITHUB_BASE}/fonts/${fontName}/textures/${id}.png`
          }
          if (data.textures[id].variants) {
            for (const variant in data.textures[id].variants) {
              fontData[fontName].textures[variant] = {
                id: variant,
                name: data.textures[id].variants[variant].name ?? variant.replace(/(^|_)(\w)/g, (m, s, c) => (s ? " " : "") + c.toUpperCase()),
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

    for (let cubeData of font.characters[char]) {
      const cube = JSON.parse(JSON.stringify(cubeData))
      if (!cube.faces || typeof Object.values(cube.faces)[0] === "object" && "uv" in Object.values(cube.faces)[0]) {
        // already parsed format
      } else {
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

      const geometry = new THREE.BoxGeometry(
        cube.to[0] - cube.from[0],
        cube.to[1] - cube.from[1],
        cube.to[2] - cube.from[2]
      )
      const mesh = new THREE.Mesh(geometry, material)

      mesh.position.fromArray([
        (cube.from[0] + cube.to[0]) / 2,
        (cube.from[1] + cube.to[1]) / 2,
        (cube.from[2] + cube.to[2]) / 2
      ])

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

function populateTextureSelect(selectEl, fontName, defaultTexture) {
  selectEl.empty()
  const font = fontData[fontName]
  if (!font) return
  const keys = Object.keys(font.textures).filter(k => k !== "default")
  const defaultKey = defaultTexture ?? keys[1] ?? keys[0]
  const seen = new Set()
  for (const [id, tex] of Object.entries(font.textures)) {
    if (id === "default" || seen.has(id)) continue
    seen.add(id)
    const option = E("option").attr("value", id).text(tex.name)
    if (id === defaultKey) option.attr("selected", true)
    selectEl.append(option)
  }
}

export default class MinecraftTitleGeneratorPage extends Page {
  constructor() {
    super("minecraft-title-generator", true, async $ => {
      const output = $("#output")
      const loading = $("#loading")
      const topText = $("#top-text")
      const bottomText = $("#bottom-text")
      const smallText = $("#small-text")
      const topTexture = $("#top-texture")
      const bottomTexture = $("#bottom-texture")
      const smallTexture = $("#small-texture")

      loading.text("Loading fonts and textures...")

      try {
        await Promise.all([loadThree(), loadFontData()])
      } catch (err) {
        loading.text("Failed to load resources. Please refresh the page.")
        return
      }

      loading.text("")

      populateTextureSelect(topTexture, "minecraft-ten")
      populateTextureSelect(bottomTexture, "minecraft-ten", "gradient")
      populateTextureSelect(smallTexture, "minecraft-five-bold")

      let debounceTimer
      let rendering = false
      let pendingRender = false
      let currentCanvas = null

      async function render() {
        if (rendering) {
          pendingRender = true
          return
        }

        const top = topText.val().trim()
        const bottom = bottomText.val().trim()
        const small = smallText.val().trim()

        if (!top && !bottom && !small) {
          output.empty()
          currentCanvas = null
          return
        }

        rendering = true

        try {
          const [scene, camera] = makeTitleScene()

          if (top) {
            await addTitleText(scene, formatTitleText(top), {
              font: "minecraft-ten",
              texture: topTexture.val()
            })
          }
          if (bottom) {
            const tex = bottomTexture.val()
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
              texture: smallTexture.val()
            })
          }

          currentCanvas = renderTitleScene(scene, camera)
          const downloadIcon = $("#download-icon").contents()

          output.empty().append(
            currentCanvas,
            E("div").addClass("output-actions").append(
              E("div").addClass("button-download").append(
                downloadIcon.clone(true),
                E("span").text("Download")
              ).on("click", () => currentCanvas.saveAs("minecraft_title.png"))
            )
          )
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

      topText.on("input", scheduleRender)
      bottomText.on("input", scheduleRender)
      smallText.on("input", scheduleRender)
      topTexture.on("change", render)
      bottomTexture.on("change", render)
      smallTexture.on("change", render)

      render()
    })
    $("a").removeClass("selected")
  }

  static tag = "minecraft-title-generator-page"
  static title = "Minecraft Title Generator - Ewan Howell"
  static description = "Generate Minecraft-styled title logos with custom text and textures"
  static image = "plugins/minecraft-title-generator/images/logo.webp"
  static colour = "#3B8426"
}