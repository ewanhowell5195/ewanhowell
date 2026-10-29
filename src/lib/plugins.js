import { marked } from "marked"
import extras from "../plugins.json"
import { repo, slug, iconIsFile, isMine } from "./pluginRepo.js"

const stats = "https://cors.ewanhowell.com/https://blckbn.ch/api/stats/plugins"

function fetchJSON(url) {
  return fetch(url).then(r => r.ok ? r.json() : Promise.reject(new Error(`${url}: ${r.status}`)))
}

function fetchStats(weeks) {
  return fetchJSON(`${stats}?weeks=${weeks}`).catch(err => {
    console.warn("Plugin stats unavailable", err)
    return null
  })
}

let plugins
export function loadPlugins() {
  plugins ??= Promise.all([
    fetchJSON(`${repo}/plugins.json`).catch(() => fetchJSON("/assets/json/plugin-snapshot.json")),
    fetchStats(1),
    fetchStats(5),
    fetchStats(1000)
  ]).then(([all, thisWeek, fiveWeeks, total]) => Object.entries(all).filter(([, p]) => isMine(p)).map(([id, p]) => Object.assign({}, p, extras[id], {
    id,
    slug: slug(id),
    icon: iconIsFile(p.icon) ? `${repo}/plugins/${id}/${p.icon}` : p.icon,
    weekly: thisWeek && fiveWeeks ? Math.round(((fiveWeeks[id] ?? 0) - (thisWeek[id] ?? 0)) / 4) : null,
    total: total ? total[id] ?? 0 : null
  })))
  plugins.catch(() => plugins = null)
  return plugins
}

export async function loadAbout(id) {
  const r = await fetch(`${repo}/plugins/${id}/about.md`).catch(() => null)
  if (!r?.ok) return { html: null, links: [], video: null }
  const template = document.createElement("template")
  template.innerHTML = marked.parse((await r.text()).replace(/\bmaterial-icons\b/g, "material-symbols-outlined"))
  const list = template.content.querySelector("#about-markdown-links")
  const links = Array.from(list?.querySelectorAll("a") ?? []).filter(a => !["ewanhowell.com", "discord.ewanhowell.com"].includes(new URL(a.href).hostname)).map(a => {
    const icon = a.querySelector("i")
    icon?.remove()
    return { href: a.href, text: a.textContent.trim(), iconClass: icon?.className, iconText: icon?.textContent }
  })
  list?.remove()
  const videoLink = links.find(link => youtubeId(link.href))
  return { html: template.innerHTML, links: links.filter(link => link !== videoLink), video: videoLink && youtubeId(videoLink.href) }
}

function youtubeId(href) {
  return href.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)?.[1]
}

export async function loadChangelog(id) {
  const r = await fetch(`${repo}/plugins/${id}/changelog.json`).catch(() => null)
  if (!r?.ok) return []
  return Object.values(await r.json()).reverse().map(change => Object.assign(change, { categories: change.categories.map(c => Object.assign(c, { list: c.list.map(item => marked.parseInline(item.replace(/^-\s*/, ""))) })) }))
}

export function formatCount(n) {
  if (n >= 1e6) return `${+(n / 1e6).toFixed(1)}M`
  if (n >= 1e4) return `${Math.round(n / 1e3)}k`
  if (n >= 1e3) return `${+(n / 1e3).toFixed(1)}k`
  return String(n)
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}
