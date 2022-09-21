import { entryPageClass } from "/js/entry.js"

const pluginPage = entryPageClass("plugin", "plugins")

customElements.define("plugin-page", pluginPage)

export { pluginPage }