import { h } from "vue"

const brands = new Set(["youtube", "twitter", "github", "reddit", "instagram", "discord"])

export default function Icon(props) {
  if (brands.has(props.name)) return h("i", { class: `icon fa-brands fa-${props.name}` })
  return h("i", { class: "icon material-symbols-outlined" }, props.name)
}

Icon.props = ["name"]
