import { h } from "vue"

const files = import.meta.glob("../icons/*.svg", { query: "?raw", import: "default", eager: true })

const icons = {}
for (const [file, svg] of Object.entries(files)) {
  const name = file.match(/([^/]+)\.svg$/)[1]
  const attrs = {}
  for (const m of svg.match(/^<svg([^>]*)>/)[1].matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[m[1]] = m[2]
  icons[name] = { attrs, inner: svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "") }
}

export default function Icon(props) {
  const icon = icons[props.name]
  return h("svg", { ...icon.attrs, innerHTML: icon.inner })
}

Icon.props = ["name"]
