import { Canvas, loadImage } from "skia-canvas"
import drawText from "skia-canvas-draw-text"
import path from "node:path"
import sharp from "sharp"
import fs from "node:fs"

export default {
  async build(config, { processPug }) {
    globalThis.processPug = processPug

    console.log("Generating open graph...")

    for await (const f of getFiles("src/pages")) if (f.endsWith(".js")) {
      const PageClass = (await import("./" + path.relative(".", f))).default
      if (PageClass.description) {
        const dir = path.relative("src/pages", path.dirname(f))
        fs.mkdirSync(path.join("dist", dir), { recursive: true })
        fs.writeFileSync(path.join("dist", dir, "index.html"), processPug(`extends /../includes/main.pug

block meta
  -
    meta = {
      title: "${PageClass.title}",
      description: "${PageClass.description}",
      ${PageClass.image ? `image: "${PageClass.image}",` : ""}
      ${PageClass.colour ? `colour: "${PageClass.colour}",` : ""}
      ${PageClass.icon ? `icon: "${PageClass.icon}"` : ""}
    }`))
      }
    }

    for (const type of types) {
      await generateType(type)
    }
    
    generateGuides()

    console.log("Generated open graph")
  }
}

globalThis.getFiles = async function*(dir) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true })
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name)
    if (dirent.isDirectory()) {
      yield* getFiles(res)
    } else {
      yield res
    }
  }
}

globalThis.navigator = {}
globalThis.customElements = { define() {} }

globalThis.HTMLElement = globalThis.HTMLCanvasElement = globalThis.Page = class {}

String.prototype.toTitleCase = function(c, n) {
  let t
  if (c) t = this.replace(/\s/g, "").replace(n ? /([A-Z])/g : /([A-Z0-9])/g, " $1").replace(/[_-]/g, " ")
  else t = this
  return t.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).trim()
}

const types = ["resourcepacks", "maps", "plugins", "dungeonsmods"]

async function generateType(type) {
  const data = JSON.parse(fs.readFileSync(`src/assets/json/${type}.json`, "utf-8")).entries
  const entries = Array.from(Object.entries(data).entries())
  for (const [i, [id, entry]] of entries) {
    await generateEntry(type, id, entry)
    console.log(`${type} images: ${i + 1} / ${entries.length} - ${id}`)
  }
}

async function generateEntry(type, id, entry) {
  const entryName = entry.name ?? id.toTitleCase(true, true)
  if (!fs.existsSync(`src/assets/json/${type}/${id}.json`)) return
  const data = JSON.parse(fs.readFileSync(`src/assets/json/${type}/${id}.json`, "utf-8"))
  fs.mkdirSync(`dist/${type}/${id}`, { recursive: true })
  let bgPath
  if (entry.image) bgPath = `src/assets/images/${type}/${id}/images/${entry.image}.webp`
  else bgPath = "src/assets/images/home/logo_3d.webp"
  const bgSharp = sharp(bgPath)
  const img = await loadImage(await bgSharp.png().toBuffer())
  const canvas = new Canvas(640, 360)
  const ctx = canvas.getContext("2d")
  ctx.filter = "blur(8px)"
  ctx.drawImage(img, -10, -10, 660, 380)
  ctx.filter = "none"
  fs.writeFileSync(`dist/${type}/${id}/index.html`, processPug(`extends /../includes/main.pug

block meta
  -
    meta = {
      title: "${entryName} - ${data.author ?? "Ewan Howell"}",
      description: "${data.subtitle.replace(/\n/g, " ")}",
      image: "${type}/${id}/cover.jpg",
      colour: "#${(await bgSharp.resize(1, 1).raw().toBuffer()).toString("hex").slice(0, 6)}",
      icon: "${type}/${id}/icon.webp"
    }`), "utf-8")

  if (entry.logoless) {
    await drawText(entryName, {
      ctx,
      fontSize: 100,
      fontFamily: "Arial",
      location: [320, 180],
      width: 540,
      height: 260,
      colour: "#fff",
      bold: true,
      align: "center",
      wrap: true,
      gravity: "c",
      shadowColour: "#000d",
      shadowOffset: [0, 15],
      shadowBlur: 20
    })
  } else {
    const logo = await loadImage(await sharp(`src/assets/images/${type}/${id}/logo.webp`).png().toBuffer())
    const aspect = logo.width / logo.height
    const target = 540 / 260
    let width, height
    if (aspect > target) {
      width = 540
      height = 540 / aspect
    } else {
      height = 260
      width = 260 * aspect
    }
    ctx.shadowColor = "#000d"
    ctx.shadowOffsetY = 15
    ctx.shadowBlur = 20
    ctx.drawImage(logo, 640 / 2 - width / 2, 360 / 2 - height / 2, width, height)
  }
  fs.mkdirSync(`dist/assets/images/${type}/${id}`, { recursive: true })
  canvas.saveAs(`dist/assets/images/${type}/${id}/cover.jpg`)
}

function generateGuides() {
  const guides = JSON.parse(fs.readFileSync("src/assets/json/guides.json", "utf-8"))
  for (const data of guides) {
    const guide = JSON.parse(fs.readFileSync(`src/assets/json/guides/${data.id}.json`, "utf-8"))
    fs.mkdirSync(`dist/guides/${data.id}`, { recursive: true })
    fs.writeFileSync(`dist/guides/${data.id}/index.html`, processPug(`extends /../includes/main.pug

block meta
  -
    meta = {
      title: "${data.name ?? data.id.toTitleCase(true)} - Guides - Ewan Howell",
      description: "${data.description}",
      image: "guides/${data.id}/thumbnail.webp"
    }`), "utf-8")
  }
}