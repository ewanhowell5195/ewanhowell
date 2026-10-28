const rgxURLParams = /(?:^\?|&)([A-z0-9-]+)(?:=([^&]+)|(?=&)|$|=)/g

export function getURLParams(s) {
  let str = s
  if (!str) str = location.search
  if (str.length < 2) return null
  const params = {}
  let m
  while (m = rgxURLParams.exec(str)) {
    params[m[1]] = m[2] ? decodeURIComponent(m[2].replace(/\+/g, "%20")) : true
  }
  return params
}

export function toURLParams(o) {
  const arr = []
  for (const k in o) if (o.hasOwnProperty(k) && o[k] != null) {
    if (o[k] === true) {
      arr.push(`${arr.length == 0 ? "?" : "&"}${k}`)
    } else {
      const encodedVal = encodeURIComponent(o[k])
        .replace(/%3A/g, ":")
        .replace(/%3B/g, ";")
        .replace(/%20/g, "+")
        .replace(/%2C/g, ",")
        .replace(/%2F/g, "/")
        .replace(/%40/g, "@")
      arr.push(`${arr.length == 0 ? "?" : "&"}${k}=${encodedVal}`)
    }
  }
  return arr.join("")
}

const titleReplacements = {
  "U R L": "URL",
  "Id": "ID",
  "I D": "ID",
  "Uv": "UV",
  "3 D": "3D",
  "Dmca": "DMCA",
  "9minecraft": "9Minecraft"
}

const titlePattern = new RegExp(`\\b(${Object.keys(titleReplacements).join("|")})\\b`, "gi")

export function toTitleCase(s, c, n) {
  let t
  if (c) t = s.replace(/\s/g, "").replace(n ? /([A-Z])/g : /([A-Z0-9])/g, " $1").replace(/[_-]/g, " ")
  else t = s
  return t.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).trim().replace(titlePattern, (a, b) => titleReplacements[b])
}

export function entryName(entry) {
  return entry.name ?? toTitleCase(entry.id, true, true)
}

window.dataLayer = window.dataLayer || []
export function gtag() {
  dataLayer.push(arguments)
}
gtag("js", new Date())
gtag("config", "G-VSJF1VRJHW", {
  send_page_view: false,
  cookie_flags: "max-age=7200;SameSite=Strict"
})

let lastAnalytics = ""
export function analytics() {
  if (location.href === lastAnalytics) return
  gtag("event", "page_view", {
    page_title: document.title,
    page_path: location.pathname,
    page_location: location.href
  })
  lastAnalytics = location.href
}

const jsonCache = {}
export async function fetchJSON(name) {
  if (!(name in jsonCache)) try {
    jsonCache[name] = await fetch(`/assets/json/${name}.json`).then(e => e.json())
  } catch {
    return false
  }
  return jsonCache[name]
}

export function setFavicon(icon16, icon32 = icon16) {
  document.querySelector('link[rel="icon"][sizes="16x16"]').href = icon16
  document.querySelector('link[rel="icon"][sizes="32x32"]').href = icon32
}

export function setThemeColour(colour) {
  document.querySelector('meta[name="theme-color"]').content = colour
}
