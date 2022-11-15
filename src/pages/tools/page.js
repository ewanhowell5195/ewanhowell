import { Page } from "/js/libs/pages.js"

class ToolsPage extends Page {
  constructor() {
    super("tools", true, $ => jQuery("title").text("Tools - Ewan Howell"))
    $("a").removeClass("selected")
    $('[href="/tools"]').addClass("selected")
  }
}

customElements.define("tools-page", ToolsPage)

export { ToolsPage }