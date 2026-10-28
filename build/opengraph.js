import { Canvas, loadImage } from "skia-canvas"
import drawText from "skia-canvas-draw-text"
import path from "node:path"
import sharp from "sharp"
import fs from "node:fs"
import routes from "../src/routes.js"
import { toTitleCase } from "../src/lib/titles.js"

const domain = "ewanhowell.com"
const template = fs.readFileSync("dist/index.html", "utf-8")
const metaBlock = /<title>[\s\S]*?<meta name="theme-color"[^>]*>/

function escape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function renderPage(meta) {
  const defaults = Object.assign({
    title: "Ewan Howell",
    description: "Home to all of Ewan Howell's projects. From Minecraft resource packs, to Blockbench plugins, to Discord bots, everything is here!",
    colour: "#AE3535",
    image: "logo/logo.webp",
    icon16: "logo/logo_16.webp",
    icon32: "logo/logo_32.webp"
  }, meta)

  if ("icon" in meta) {
    defaults.icon16 = meta.icon
    defaults.icon32 = meta.icon
    if (!("image" in meta)) {
      defaults.image = meta.icon
    }
  }

  const tags = [
    `<title>${escape(meta.title ?? "")}</title>`,
    `<link rel="icon" type="image/webp" sizes="16x16" href="/assets/images/logo/${escape(defaults.icon16)}">`,
    `<link rel="icon" type="image/webp" sizes="32x32" href="/assets/images/logo/${escape(defaults.icon32)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${escape(defaults.title)}">`,
    `<meta property="og:description" content="${escape(defaults.description)}">`,
    `<meta property="og:image" content="https://${domain}/assets/images/${escape(defaults.image)}">`,
    `<meta property="twitter:image" content="https://${domain}/assets/images/${escape(defaults.image)}">`
  ]
  if ("image" in meta) tags.push(`<meta property="twitter:card" content="summary_large_image">`)
  tags.push(`<meta name="theme-color" content="${escape(defaults.colour)}">`)
  return template.replace(metaBlock, tags.join("\n    "))
}

function writePage(dir, meta) {
  fs.mkdirSync(path.join("dist", dir), { recursive: true })
  fs.writeFileSync(path.join("dist", dir, "index.html"), renderPage(meta), "utf-8")
}

console.log("Generating open graph...")

for (const route of routes) {
  if (route.meta?.description) writePage(route.path.slice(1), route.meta)
}

const types = ["resourcepacks", "plugins", "themes", "maps", "dungeonsmods", "dungeons2mods"]

for (const type of types) {
  const data = JSON.parse(fs.readFileSync(`public/assets/json/${type}.json`, "utf-8")).categories
  for (const category of data) {
    for (const entry of category.entries) {
      await generateEntry(type, entry.id, entry)
      console.log(`${type} images - ${entry.id}`)
    }
  }
}

generateGuides()

console.log("Generated open graph")

async function generateEntry(type, id, entry) {
  const entryName = entry.name ?? toTitleCase(id, true, true)
  if (!fs.existsSync(`public/assets/json/${type}/${id}.json`)) return
  const data = JSON.parse(fs.readFileSync(`public/assets/json/${type}/${id}.json`, "utf-8"))
  let bgPath
  if (entry.image) bgPath = `public/assets/images/${type}/${id}/images/${entry.image}.webp`
  else bgPath = "public/assets/images/home/logo_3d.webp"
  const bgSharp = sharp(bgPath)
  const img = await loadImage(await bgSharp.png().toBuffer())
  const canvas = new Canvas(640, 360)
  const ctx = canvas.getContext("2d")
  if (entry.plain) ctx.drawImage(img, 0, 0, 640, 360)
  else {
    ctx.filter = "blur(8px)"
    ctx.drawImage(img, -10, -10, 660, 380)
    ctx.filter = "none"
  }
  writePage(`${type}/${id}`, {
    title: `${entryName} - ${data.author ?? "Ewan Howell"}`,
    description: data.subtitle.replace(/\n/g, " "),
    image: `${type}/${id}/cover.jpg`,
    colour: `#${(await bgSharp.resize(1, 1).raw().toBuffer()).toString("hex").slice(0, 6)}`,
    icon: `${type}/${id}/icon.webp`
  })

  if (entry.plain) {}
  else if (entry.logoless) {
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
    const logo = await loadImage(await sharp(`public/assets/images/${type}/${id}/logo.webp`).png().toBuffer())
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
  await canvas.saveAs(`dist/assets/images/${type}/${id}/cover.jpg`)
}

function generateGuides() {
  const guides = JSON.parse(fs.readFileSync("public/assets/json/guides.json", "utf-8"))
  for (const data of guides) {
    writePage(`guides/${data.id}`, {
      title: `${data.name ?? toTitleCase(data.id, true)} - Guides - Ewan Howell`,
      description: data.description,
      image: `guides/${data.id}/thumbnail.webp`
    })
  }
}
