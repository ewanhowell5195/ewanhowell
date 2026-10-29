import path from "node:path"
import fs from "node:fs"
import { renderPage, loadPlugins, listPages, resolvePage } from "./meta.js"

const template = fs.readFileSync("dist/index.html", "utf-8")

console.log("Generating open graph...")

for (const page of await listPages()) {
  const resolved = await resolvePage(page)
  if (!resolved) continue
  for (const [file, data] of Object.entries(resolved.assets)) {
    fs.mkdirSync(path.dirname(`dist/assets/images/${file}`), { recursive: true })
    fs.writeFileSync(`dist/assets/images/${file}`, data)
  }
  fs.mkdirSync(path.join("dist", page), { recursive: true })
  fs.writeFileSync(path.join("dist", page, "index.html"), renderPage(template, resolved.meta), "utf-8")
  console.log(page)
}

fs.writeFileSync("dist/assets/json/plugin-snapshot.json", JSON.stringify(await loadPlugins()))

console.log("Generated open graph")
