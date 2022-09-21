import { indexPageClass } from "/js/indexpage.js"

const PluginsPage = indexPageClass("plugins", "Plugins")

customElements.define("plugins-page", PluginsPage)

export { PluginsPage }