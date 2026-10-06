import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import path from "node:path"
import fs from "node:fs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const MANAGER = "E:/Programming/Javascript/Projects/NexusModsManager"
const GAME = "minecraft-dungeons-ii"
const NEXUS_GAME = "minecraftdungeons2"
const TYPE = "dungeons2mods"
const INDEX = path.join(ROOT, `src/assets/json/${TYPE}.json`)
const JSON_DIR = path.join(ROOT, `src/assets/json/${TYPE}`)
const IMAGE_DIR = path.join(ROOT, `src/assets/images/${TYPE}`)
const MAX_WIDTH = 1920
const FIRST_CATEGORIES = ["Skins", "Gameplay"]
const LAST_CATEGORIES = ["Utilities"]

let sharp

function categoryRank(name) {
  if (FIRST_CATEGORIES.includes(name)) return FIRST_CATEGORIES.indexOf(name) - FIRST_CATEGORIES.length
  if (LAST_CATEGORIES.includes(name)) return LAST_CATEGORIES.indexOf(name) + 1
  return 0
}

function slug(name) {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function link(url, label, slugs) {
  const match = url.replace(/&amp;/g, "&").match(new RegExp(`^https?://(?:www\\.)?nexusmods\\.com/${NEXUS_GAME}/mods/(\\d+)/?$`))
  const local = match && slugs.get(Number(match[1]))
  if (local) return `<a href="/${TYPE}/${local}">${label}</a>`
  return `<a href="${url}" target="_blank">${label}</a>`
}

function bbcodeToHtml(bbcode, name, summary, slugs) {
  let text = escapeHtml(bbcode.replace(/\r\n/g, "\n").trim())
  for (const lead of [`[size=5][b]${escapeHtml(name)}[/b][/size]`, escapeHtml(summary ?? "")]) {
    if (lead && text.startsWith(lead)) text = text.slice(lead.length).trimStart()
  }
  text = text
    .replace(/\[size=\d+\]\[b\](.*?)\[\/b\]\[\/size\]/g, "<h2>$1</h2>")
    .replace(/\[size=[^\]]*\]|\[\/size\]/g, "")
    .replace(/\[b\]/g, "<b>").replace(/\[\/b\]/g, "</b>")
    .replace(/\[i\]/g, "<i>").replace(/\[\/i\]/g, "</i>")
    .replace(/\[u\]/g, "<u>").replace(/\[\/u\]/g, "</u>")
    .replace(/\[s\]/g, "<s>").replace(/\[\/s\]/g, "</s>")
    .replace(/\[font=Courier New\](.*?)\[\/font\]/g, "<code>$1</code>")
    .replace(/\[font=[^\]]*\]|\[\/font\]/g, "")
    .replace(/\[color=[^\]]*\]|\[\/color\]/g, "")
    .replace(/\[center\]|\[\/center\]/g, "")
    .replace(/\[url=([^\]]+)\](.*?)\[\/url\]/g, (all, url, label) => link(url, label, slugs))
    .replace(/\[url\](.*?)\[\/url\]/g, (all, url) => link(url, url, slugs))
    .replace(/\[list=1\]/g, "<ol>").replace(/\[list\]/g, "<ul>")
    .replace(/\[\*\]/g, "</li><li>").replace(/\[\/\*\]/g, "")
    .replace(/\[\/list\]/g, "</li></list>")
  const closes = []
  text = text.replace(/<(ul|ol)>|<\/list>/g, tag => {
    if (tag === "</list>") return `</${closes.pop() ?? "ul"}>`
    closes.push(tag.slice(1, 3))
    return tag
  })
  text = text
    .replace(/\s*(<\/?(?:ul|ol|li)>)\s*/g, "$1")
    .replace(/<(ul|ol)><\/li>/g, "<$1>")
  return paragraphs(text)
}

function paragraphs(html) {
  const out = []
  let pending = ""
  let depth = 0
  function flush() {
    for (const paragraph of pending.split(/\n{2,}/)) {
      if (paragraph.trim()) out.push(`<p>${paragraph.trim()}</p>`)
    }
    pending = ""
  }
  for (const part of html.split(/(<\/?(?:ul|ol)>|<h2>.*?<\/h2>)/)) {
    if (!part) continue
    const open = /^<(ul|ol)>$/.test(part)
    const block = open || part.startsWith("<h2>") || /^<\/(ul|ol)>$/.test(part)
    if (!depth && block) flush()
    if (depth || block) out.push(part)
    else pending += part
    if (open) depth++
    else if (/^<\/(ul|ol)>$/.test(part)) depth--
  }
  flush()
  return out.join("")
}

function youtubeId(video) {
  const text = typeof video === "string" ? video : video.url ?? video.id ?? ""
  const match = text.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/)
  return match ? match[1] : /^[\w-]{11}$/.test(text) ? text : null
}

async function api(apiKey, route) {
  const response = await fetch(`https://api.nexusmods.com/v1/${route}`, { headers: { apikey: apiKey } })
  if (!response.ok) throw new Error(`Nexus API ${route} returned ${response.status}`)
  return response.json()
}

async function writeImage(source, target, transform) {
  const stat = await fs.promises.stat(source)
  try {
    if ((await fs.promises.stat(target)).mtimeMs >= stat.mtimeMs) return
  } catch {}
  await fs.promises.mkdir(path.dirname(target), { recursive: true })
  await transform(sharp(source)).webp({ quality: 85 }).toFile(target)
}

async function writeJson(file, data) {
  const text = JSON.stringify(data, null, 2)
  try {
    if (await fs.promises.readFile(file, "utf-8") === text) return
  } catch {}
  await fs.promises.mkdir(path.dirname(file), { recursive: true })
  await fs.promises.writeFile(file, text)
}

async function removeStale(dir, keep) {
  let names
  try {
    names = await fs.promises.readdir(dir)
  } catch {
    return
  }
  for (const name of names) {
    if (!keep.has(name)) await fs.promises.rm(path.join(dir, name), { recursive: true, force: true })
  }
}

async function removeFiles(id) {
  await fs.promises.rm(path.join(JSON_DIR, `${id}.json`), { force: true })
  await fs.promises.rm(path.join(IMAGE_DIR, id), { recursive: true, force: true })
}

async function readIndex() {
  try {
    return JSON.parse(await fs.promises.readFile(INDEX, "utf-8"))
  } catch {
    return { categories: [] }
  }
}

async function writeMod(project, projectPath, slugs) {
  const id = slugs.get(project.mod.id)
  const media = project.media ?? {}
  const images = media.images ?? []
  const thumbnail = images.find(e => e.thumbnail) ?? images[0]
  const imageNames = []
  for (const image of images) {
    const name = path.parse(image.file).name
    imageNames.push(name)
    await writeImage(path.join(projectPath, image.file), path.join(IMAGE_DIR, id, "images", `${name}.webp`), img => img.resize({ width: MAX_WIDTH, withoutEnlargement: true }))
  }
  if (thumbnail) await writeImage(path.join(projectPath, thumbnail.file), path.join(IMAGE_DIR, id, "icon.webp"), img => img.resize(256, 256, { fit: "cover" }))
  await removeStale(path.join(IMAGE_DIR, id, "images"), new Set(imageNames.map(e => `${e}.webp`)))

  const descriptionFile = path.join(projectPath, "description.bbcode")
  const description = fs.existsSync(descriptionFile) ? await fs.promises.readFile(descriptionFile, "utf-8") : ""
  const data = {
    subtitle: project.summary,
    description: bbcodeToHtml(description, project.name, project.summary, slugs),
    images: imageNames,
    downloads: [{ text: "Download", link: `https://www.nexusmods.com/${NEXUS_GAME}/mods/${project.mod.id}` }]
  }
  const video = (media.videos ?? []).map(youtubeId).find(e => e)
  if (video) data.video = video
  const requirements = (project.requirements?.nexus ?? []).filter(e => slugs.has(e.mod))
  if (requirements.length) data.links = requirements.map(e => ({ type: "entry", name: slugs.get(e.mod), text: e.name }))
  await writeJson(path.join(JSON_DIR, `${id}.json`), data)

  const entry = { id, name: project.name, nexus: project.mod.id }
  if (thumbnail) entry.image = path.parse(thumbnail.file).name
  entry.plain = true
  return entry
}

function git(...args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }).trim()
}

function publish(message) {
  const paths = [INDEX, JSON_DIR, IMAGE_DIR].map(e => path.relative(ROOT, e))
  git("add", "-A", "--", ...paths)
  if (!git("diff", "--cached", "--name-only", "--", ...paths)) return
  git("commit", "-q", "-m", message, "--", ...paths)
  git("pull", "-q", "--rebase", "--autostash")
  git("push", "-q")
  console.log("Pushed the website")
}

export default async function updateMod({ game, project, projectPath, apiKey, sharp: managerSharp, push = true }) {
  if (game !== GAME || !project?.mod?.id) return
  sharp ??= managerSharp ?? (await import("sharp")).default
  const index = await readIndex()
  const old = []
  for (const category of index.categories) {
    for (const entry of category.entries.filter(e => e.nexus === project.mod.id)) old.push(entry.id)
    category.entries = category.entries.filter(e => e.nexus !== project.mod.id)
  }
  index.categories = index.categories.filter(e => e.entries.length)

  const live = await api(apiKey, `games/${NEXUS_GAME}/mods/${project.mod.id}.json`)
  const shown = live.status === "published" && live.available
  const id = slug(project.name)
  if (shown) {
    const slugs = new Map(index.categories.flatMap(e => e.entries).map(e => [e.nexus, e.id]))
    slugs.set(project.mod.id, id)
    const entry = await writeMod(project, path.resolve(projectPath), slugs)
    const game = await api(apiKey, `games/${NEXUS_GAME}.json`)
    const categoryName = game.categories.find(e => e.category_id === live.category_id)?.name ?? project.category?.name ?? "Mods"
    let category = index.categories.find(e => e.name === categoryName)
    if (!category) index.categories.push(category = { name: categoryName, entries: [] })
    category.entries.push(entry)
    category.entries.sort((a, b) => a.nexus - b.nexus)
  }
  index.categories.sort((a, b) => categoryRank(a.name) - categoryRank(b.name) || a.entries[0].nexus - b.entries[0].nexus)
  for (const oldId of old) if (!shown || oldId !== id) await removeFiles(oldId)
  await writeJson(INDEX, index)
  console.log(shown ? `Updated ${project.name} on ewanhowell.com` : `${project.name} is not published, so it is not on ewanhowell.com`)
  if (push) publish(`dungeons ii mods: ${shown ? "update" : "remove"} ${project.name.toLowerCase()}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { apiKey } = JSON.parse(await fs.promises.readFile(path.join(MANAGER, "auth.json"), "utf-8"))
  const projects = path.join(MANAGER, "projects", GAME)
  for (let pass = 0; pass < 2; pass++) {
    for (const dir of await fs.promises.readdir(projects)) {
      const file = path.join(projects, dir, "project.json")
      if (!fs.existsSync(file)) continue
      await updateMod({ game: GAME, project: JSON.parse(await fs.promises.readFile(file, "utf-8")), projectPath: path.join(projects, dir), apiKey, push: false })
    }
  }
  publish("dungeons ii mods: resync")
}
