import { Canvas, loadImage } from "skia-canvas"
import drawText from "skia-canvas-draw-text"
import sharp from "sharp"
import fs from "node:fs"
import routes from "../src/routes.js"
import { toTitleCase } from "../src/lib/titles.js"
import pluginExtras from "../src/plugins.json" with { type: "json" }
import { repo, slug, iconIsFile, isMine } from "../src/lib/pluginRepo.js"

export const origin = "https://ewanhowell.com"
const metaBlock = /<title>[\s\S]*?<meta name="theme-color"[^>]*>/
const types = ["resourcepacks", "themes", "maps", "dungeonsmods", "dungeons2mods"]

function escape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"))
}

export function renderPage(template, meta, base = origin) {
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
    `<meta property="og:image" content="${base}/assets/images/${escape(defaults.image)}">`,
    `<meta property="twitter:image" content="${base}/assets/images/${escape(defaults.image)}">`
  ]
  if ("image" in meta) tags.push(`<meta property="twitter:card" content="summary_large_image">`)
  tags.push(`<meta name="theme-color" content="${escape(defaults.colour)}">`)
  return template.replace(metaBlock, tags.join("\n    "))
}

let plugins
export function loadPlugins() {
  plugins ??= fetch(`${repo}/plugins.json`).then(r => r.json()).then(all => Object.fromEntries(Object.entries(all).filter(([, plugin]) => isMine(plugin))))
  plugins.catch(() => plugins = null)
  return plugins
}

export async function listPages() {
  const paths = routes.filter(route => route.meta?.description).map(route => route.path)
  for (const type of types) {
    for (const category of readJSON(`public/assets/json/${type}.json`).categories) {
      for (const entry of category.entries) paths.push(`/${type}/${entry.id}`)
    }
  }
  for (const id of Object.keys(await loadPlugins())) paths.push(`/plugins/${slug(id)}`)
  for (const guide of readJSON("public/assets/json/guides.json")) paths.push(`/guides/${guide.id}`)
  return paths
}

export async function resolvePage(pathname) {
  pathname = pathname.replace(/(.)\/$/, "$1")
  const route = routes.find(route => route.path === pathname && route.meta?.description)
  if (route) return { meta: route.meta, assets: {} }
  const [, type, id] = pathname.match(/^\/([^/]+)\/([^/.]+)$/) ?? []
  if (types.includes(type)) return entryPage(type, id)
  if (type === "plugins") return pluginPage(id)
  if (type === "guides") return guidePage(id)
  return null
}

async function entryPage(type, id) {
  const entry = readJSON(`public/assets/json/${type}.json`).categories.flatMap(category => category.entries).find(entry => entry.id === id)
  if (!entry || !fs.existsSync(`public/assets/json/${type}/${id}.json`)) return null
  const data = readJSON(`public/assets/json/${type}/${id}.json`)
  const entryName = entry.name ?? toTitleCase(id, true, true)
  const assets = {}
  const cover = await coverFile(type, id, entry, entryName, assets)
  return {
    meta: {
      title: `${entryName} - ${data.author ?? "Ewan Howell"}`,
      description: data.subtitle.replace(/\n/g, " "),
      image: `${type}/${id}/cover.jpg`,
      colour: await leftColour(cover),
      icon: `${type}/${id}/icon.webp`
    },
    assets
  }
}

async function pluginPage(name) {
  const found = Object.entries(await loadPlugins()).find(([id]) => slug(id) === name)
  if (!found) return null
  const [id, plugin] = found
  const card = pluginExtras[id]?.card
  const dir = `public/assets/images/plugins/${name}`
  const assets = {}
  const meta = {
    title: `${plugin.title} - ${plugin.author}`,
    description: plugin.description
  }
  if (card || fs.existsSync(`${dir}/cover.jpg`)) {
    const cover = await coverFile("plugins", name, { image: card, logoless: !fs.existsSync(`${dir}/logo.webp`) }, plugin.title, assets)
    meta.image = `plugins/${name}/cover.jpg`
    meta.colour = await leftColour(cover)
  }
  if (fs.existsSync(`${dir}/icon.webp`)) meta.icon = `plugins/${name}/icon.webp`
  else if (!meta.image && iconIsFile(plugin.icon)) {
    meta.icon = `plugins/${name}/icon.png`
    assets[meta.icon] = await pluginIcon(id, plugin.icon)
  }
  return { meta, assets }
}

function guidePage(id) {
  const data = readJSON("public/assets/json/guides.json").find(guide => guide.id === id)
  if (!data) return null
  return {
    meta: {
      title: `${data.name ?? toTitleCase(data.id, true)} - Guides - Ewan Howell`,
      description: data.description,
      image: `guides/${data.id}/thumbnail.webp`
    },
    assets: {}
  }
}

async function coverFile(type, id, entry, entryName, assets) {
  const file = `public/assets/images/${type}/${id}/cover.jpg`
  if (fs.existsSync(file)) return file
  return assets[`${type}/${id}/cover.jpg`] = await drawCover(type, id, entry, entryName)
}

async function pluginIcon(id, icon) {
  const source = Buffer.from(await fetch(`${repo}/plugins/${id}/${icon}`).then(r => r.arrayBuffer()))
  return sharp(source, { density: 384 }).resize(256, 256, { fit: "contain", background: "#0000", kernel: "nearest" }).png().toBuffer()
}

async function leftColour(input) {
  const image = sharp(input)
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
  return canvas.toBuffer("jpg")
}
