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
