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

    await Promise.all(types.map(generateType))

    console.log("Generated open graph")
  }
}

globalThis.navigator = {}
globalThis.customElements = { define() {} }

globalThis.HTMLElement = globalThis.HTMLCanvasElement = globalThis.Page = class {
  constructor() {}
}

globalThis.getFiles = async function*(dir) {
  const dirents = await fs.promises.readdir(dir, {withFileTypes: true})
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name)
    if (dirent.isDirectory()) {
      yield* getFiles(res)
    } else {
      yield res
    }
  }
}

String.prototype.toTitleCase = function() {
  return this.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.substring(1).toLowerCase()).trim()
}

const types = ["resourcepacks", "maps", "plugins", "dungeonsmods"]

async function generateType(type) {
  const entries = JSON.parse(fs.readFileSync(`src/assets/json/${type}.json`, "utf-8")).entries
  return Promise.all(Object.entries(entries).map(e => generateEntry(type, entries, e)))
}

async function generateEntry(type, entries, [id, details]) {
  const entryName = details.name ?? id.replace(/-/g, " ").toTitleCase()
  if (!fs.existsSync(`src/assets/json/${type}/${id}.json`)) return
  const data = JSON.parse(fs.readFileSync(`src/assets/json/${type}/${id}.json`, "utf-8"))
  fs.mkdirSync(`dist/${type}/${id}`, { recursive: true })
  let bgPath
  if (details.image) bgPath = `src/assets/images/${type}/${id}/images/${details.image}.webp`
  else bgPath = "src/assets/images/home/logo_3d.webp"
  const bgSharp = sharp(fs.readFileSync(bgPath)).resize(640, 360)
  if (!details.logoless) bgSharp.blur(5)

  await fs.promises.writeFile(`dist/${type}/${id}/index.html`, processPug(`extends /../includes/main.pug

block meta
  -
    meta = {
      title: "${entryName} - ${data.author ?? "Ewan Howell"}",
      description: "${data.subtitle.replace(/\n/g, " ")}",
      image: "${type}/${id}/cover.webp",
      colour: "#${(await bgSharp.clone().resize(1, 1).raw().toBuffer()).toString("hex").slice(0, 6)}",
      icon: "${type}/${id}/icon.webp"
    }`), "utf-8")

  if (!details.logoless) {
    const logoSharp = sharp(await sharp(`src/assets/images/${type}/${id}/logo.webp`).resize(576, 192, {
      background: "#00000000",
      fit: "contain"
    }).toBuffer())
    const logoMeta = await logoSharp.clone().metadata()

    bgSharp.composite([
      {
        input: await sharp(await logoSharp.clone().extend(20).blur(10).extractChannel("alpha").negate().toBuffer()).modulate({
          lightness: 8
        }).toBuffer(),
        top: 170 - logoMeta.height / 2,
        left: 300 - logoMeta.width / 2,
        blend: "multiply"
      },
      {
        input: await logoSharp.toBuffer(),
        top: 180 - logoMeta.height / 2,
        left: 320 - logoMeta.width / 2
      }
    ])
  }
  fs.mkdirSync(`dist/assets/images/${type}/${id}`, { recursive: true })
  await bgSharp.webp({nearLossless: true}).toFile(`dist/assets/images/${type}/${id}/cover.webp`)
}