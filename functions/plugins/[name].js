import { repo, slug, iconIsFile, isMine } from "../../src/lib/pluginRepo.js"

export async function onRequestGet({ request, env, params }) {
  const url = new URL(request.url)
  const snapshot = await env.ASSETS.fetch(new URL("/assets/json/plugin-snapshot.json", url)).then(r => r.json())
  if (Object.keys(snapshot).some(id => slug(id) === params.name)) return env.ASSETS.fetch(request)

  const all = await fetch(`${repo}/plugins.json`, { cf: { cacheTtl: 300, cacheEverything: true } }).then(r => r.ok ? r.json() : null).catch(() => null)
  const found = all && Object.entries(all).find(([id, plugin]) => slug(id) === params.name && isMine(plugin))
  if (!found) return env.ASSETS.fetch(request)

  const [id, plugin] = found
  const title = `${plugin.title} - ${plugin.author}`
  const icon = iconIsFile(plugin.icon) && !plugin.icon.endsWith(".svg") ? `${repo}/plugins/${id}/${plugin.icon}` : null
  const content = value => ({ element: e => e.setAttribute("content", value) })

  let rewriter = new HTMLRewriter()
    .on("title", { element: e => e.setInnerContent(title) })
    .on('meta[property="og:title"]', content(title))
    .on('meta[property="og:description"]', content(plugin.description))
  if (icon) {
    rewriter = rewriter
      .on('meta[property="og:image"]', content(icon))
      .on('meta[property="twitter:image"]', content(icon))
      .on('link[rel="icon"]', { element: e => e.setAttribute("href", icon).removeAttribute("type") })
  }
  return rewriter.transform(await env.ASSETS.fetch(new URL("/", url)))
}
