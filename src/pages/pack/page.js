import { entryPageClass } from "/js/entry.js"

const packPage = entryPageClass("pack", "resourcepacks")

customElements.define("pack-page", packPage)

export { packPage }