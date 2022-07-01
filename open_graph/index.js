import { Canvas, loadImage } from "skia-canvas"
import sharp from "sharp"
import fs from "fs"

if (!String.prototype.toTitleCase) String.prototype.toTitleCase = function() {
  return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()})
}

const packs = JSON.parse(fs.readFileSync("../src/assets/json/resourcepacks.json", "utf-8")).packs

for (const [id, details] of Object.entries(packs)) {
  const packName = details.name ?? id.replace(/-/g, " ").toTitleCase()
  if (!fs.existsSync(`../src/assets/json/resourcepacks/${id}.json`)) continue
  const data = JSON.parse(fs.readFileSync(`../src/assets/json/resourcepacks/${id}.json`, "utf-8"))
  if (!fs.existsSync(`../src/resourcepacks/${id}`)) fs.mkdirSync(`../src/resourcepacks/${id}`)
  const bgSharp = sharp(fs.readFileSync(`../src/assets/images/resourcepacks/${id}/images/${details.image}.webp`)).resize(640, 360).blur(5)
  fs.writeFileSync(`../src/resourcepacks/${id}/index.pug`, `doctype html
html
  head
    title ${data.author ?? "Ewan Howell"} - ${packName}
    link(rel = "icon", type = "image/png", sizes = "16x16", href = "/assets/images/resourcepacks/${id}/pack.webp")
    link(rel = "icon", type = "image/png", sizes = "32x32", href = "/assets/images/resourcepacks/${id}/pack.webp")
    meta(property = "og:type", content = "website")
    meta(property = "og:title", content = "Ewan Howell - ${packName}")
    meta(property = "og:description", content = "${data.subtitle.replace(/\n/g, " ")}")
    meta(property = "og:image", content = \`https://\${self.domain}/assets/images/resourcepacks/${id}/cover.webp\`)
    meta(property = "twitter:image", content = \`https://\${self.domain}/assets/images/resourcepacks/${id}/cover.webp\`)
    meta(property = "twitter:card", content="summary_large_image")
    meta(name = "theme-color", content = "${`#${(await bgSharp.clone().resize(1, 1).raw().toBuffer()).toString("hex")}`.slice(0, 7)}")
    include /../includes/head.pug
  include /../includes/body.pug`)
  const bg = await bgSharp.png().toBuffer().then(s => loadImage(s))
  const logo = await sharp(fs.readFileSync(`../src/assets/images/resourcepacks/${id}/logo.webp`)).resize(576, 128, {
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
  fs.writeFileSync(`../src/assets/images/resourcepacks/${id}/cover.webp`, await sharp(await canvas.png).webp({nearLossless: true}).toBuffer())
  console.log(id)
}