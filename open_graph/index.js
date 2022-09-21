import { Canvas, loadImage } from "skia-canvas"
import sharp from "sharp"
import fs from "fs"

if (!String.prototype.toTitleCase) String.prototype.toTitleCase = function() {
  return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()})
}

const types = ["resourcepacks", "maps", "plugins"]

for (const type of types) {
  const entries = JSON.parse(fs.readFileSync(`../src/assets/json/${type}.json`, "utf-8")).entries

  for (const [id, details] of Object.entries(entries)) {
    const entryName = details.name ?? id.replace(/-/g, " ").toTitleCase()
    if (!fs.existsSync(`../src/assets/json/${type}/${id}.json`)) continue
    const data = JSON.parse(fs.readFileSync(`../src/assets/json/${type}/${id}.json`, "utf-8"))
    if (!fs.existsSync(`../src/${type}/${id}`)) fs.mkdirSync(`../src/${type}/${id}`)
    const bgSharp = sharp(fs.readFileSync(`../src/assets/images/${type}/${id}/images/${details.image}.webp`)).resize(640, 360).blur(5)
    fs.writeFileSync(`../src/${type}/${id}/index.pug`, `doctype html
html
  head
    title ${entryName} - ${data.author ?? "Ewan Howell"}
    link(rel = "icon", type = "image/png", sizes = "16x16", href = "/assets/images/${type}/${id}/icon.webp")
    link(rel = "icon", type = "image/png", sizes = "32x32", href = "/assets/images/${type}/${id}/icon.webp")
    meta(property = "og:type", content = "website")
    meta(property = "og:title", content = "${entryName} - ${data.author ?? "Ewan Howell"}")
    meta(property = "og:description", content = "${data.subtitle.replace(/\n/g, " ")}")
    meta(property = "og:image", content = \`https://\${self.domain}/assets/images/${type}/${id}/cover.webp\`)
    meta(property = "twitter:image", content = \`https://\${self.domain}/assets/images/${type}/${id}/cover.webp\`)
    meta(property = "twitter:card", content="summary_large_image")
    meta(name = "theme-color", content = "${`#${(await bgSharp.clone().resize(1, 1).raw().toBuffer()).toString("hex")}`.slice(0, 7)}")
    include /../includes/head.pug
  include /../includes/body.pug`)
    const bg = await bgSharp.png().toBuffer().then(s => loadImage(s))
    const logo = await sharp(fs.readFileSync(`../src/assets/images/${type}/${id}/logo.webp`)).resize(576, 192, {
      background: "#00000000",
      fit: "contain"
    }).png().toBuffer().then(s => loadImage(s))
    const canvas = new Canvas(bg.width, bg.height)
    const ctx = canvas.getContext("2d")
    ctx.drawImage(bg, 0, 0, bg.width, bg.height)
    ctx.shadowColor = "rgba(0,0,0,0.75)"
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 10
    ctx.drawImage(logo, bg.width / 2 - logo.width / 2, bg.height / 2 - logo.height / 2)
    fs.writeFileSync(`../src/assets/images/${type}/${id}/cover.webp`, await sharp(await canvas.png).webp({nearLossless: true}).toBuffer())
    console.log(id)
  }
}