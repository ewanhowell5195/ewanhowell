import { entryPageClass } from "/js/entry.js"

const mapPage = entryPageClass("map", "maps")

customElements.define("map-page", mapPage)

export { mapPage }