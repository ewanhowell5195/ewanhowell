import { Canvas, loadImage } from "skia-canvas"
import drawText from "skia-canvas-draw-text"
import path from "node:path"
import sharp from "sharp"
import fs from "node:fs"
import routes from "../src/routes.js"
import { toTitleCase } from "../src/lib/titles.js"
import pluginExtras from "../src/plugins.json" with { type: "json" }
import { repo, slug, iconIsFile, isMine } from "../src/lib/pluginRepo.js"

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
    `<title>${escape(defaults.title)}</title>`,
    `<link rel="icon" sizes="16x16" href="/assets/images/${escape(defaults.icon16)}">`,
    `<link rel="icon" sizes="32x32" href="/assets/images/${escape(defaults.icon32)}">`,
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

const types = ["resourcepacks", "themes", "maps", "dungeonsmods", "dungeons2mods"]

for (const type of types) {
  const data = JSON.parse(fs.readFileSync(`public/assets/json/${type}.json`, "utf-8")).categories
  for (const category of data) {
    for (const entry of category.entries) {
      await generateEntry(type, entry.id, entry)
      console.log(`${type} images - ${entry.id}`)
    }
  }
}

await generatePlugins()

generateGuides()

console.log("Generated open graph")

async function generateEntry(type, id, entry) {
  const entryName = entry.name ?? toTitleCase(id, true, true)
  if (!fs.existsSync(`public/assets/json/${type}/${id}.json`)) return
  const data = JSON.parse(fs.readFileSync(`public/assets/json/${type}/${id}.json`, "utf-8"))
  if (!fs.existsSync(`public/assets/images/${type}/${id}/cover.jpg`)) await drawCover(type, id, entry, entryName)
  writePage(`${type}/${id}`, {
    title: `${entryName} - ${data.author ?? "Ewan Howell"}`,
    description: data.subtitle.replace(/\n/g, " "),
    image: `${type}/${id}/cover.jpg`,
    colour: await leftColour(`dist/assets/images/${type}/${id}/cover.jpg`),
    icon: `${type}/${id}/icon.webp`
  })
}

async function generatePlugins() {
  const all = await fetch(`${repo}/plugins.json`).then(r => r.json())
  const snapshot = {}
  for (const [id, plugin] of Object.entries(all)) {
    if (!isMine(plugin)) continue
    const name = slug(id)
    snapshot[id] = plugin
    const card = pluginExtras[id]?.card
    const dir = `public/assets/images/plugins/${name}`
    const page = {
      title: `${plugin.title} - ${plugin.author}`,
      description: plugin.description
    }
    if (card || fs.existsSync(`${dir}/cover.jpg`)) {
      if (!fs.existsSync(`${dir}/cover.jpg`)) await drawCover("plugins", name, { image: card, logoless: !fs.existsSync(`${dir}/logo.webp`) }, plugin.title)
      page.image = `plugins/${name}/cover.jpg`
      page.colour = await leftColour(`dist/assets/images/plugins/${name}/cover.jpg`)
    }
    if (fs.existsSync(`${dir}/icon.webp`)) page.icon = `plugins/${name}/icon.webp`
    else if (!page.image && iconIsFile(plugin.icon)) page.icon = await writePluginIcon(id, name, plugin.icon)
    writePage(`plugins/${name}`, page)
    console.log(`plugins images - ${name}`)
  }
  fs.writeFileSync("dist/assets/json/plugin-snapshot.json", JSON.stringify(snapshot))
}

async function writePluginIcon(id, name, icon) {
  const source = Buffer.from(await fetch(`${repo}/plugins/${id}/${icon}`).then(r => r.arrayBuffer()))
  fs.mkdirSync(`dist/assets/images/plugins/${name}`, { recursive: true })
  await sharp(source, { density: 384 }).resize(256, 256, { fit: "contain", background: "#0000", kernel: "nearest" }).png().toFile(`dist/assets/images/plugins/${name}/icon.png`)
  return `plugins/${name}/icon.png`
}

async function leftColour(file) {
  const image = sharp(file)
  const { width, height } = await image.metadata()
  const pixel = await image.extract({ left: 0, top: 0, width: Math.max(1, Math.round(width * 0.4)), height }).resize(1, 1).raw().toBuffer()
  return `#${pixel.toString("hex").slice(0, 6)}`
}

async function drawCover(type, id, entry, entryName) {
  let bgPath
  if (entry.image) bgPath = `public/assets/images/${type}/${id}/images/${entry.image}.webp`
  else bgPath = "public/assets/images/home/logo_3d.webp"
  const img = await loadImage(await sharp(bgPath).png().toBuffer())
  const canvas = new Canvas(640, 360)
  const ctx = canvas.getContext("2d")
  if (entry.plain) ctx.drawImage(img, 0, 0, 640, 360)
  else {
    ctx.filter = "blur(8px)"
    ctx.drawImage(img, -10, -10, 660, 380)
    ctx.filter = "none"
  }
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
