export default class ToolsPage extends Page {
  constructor() {
    super("tools")
    $("a").removeClass("selected")
    $('[href="/tools"]').addClass("selected")
  }

  static tag = "tools-page"
  static title = "Tools - Ewan Howell"
  static description = "Tools to help you create resource packs"
}