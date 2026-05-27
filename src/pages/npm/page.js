export default class NPMPage extends Page {
  constructor() {
    super("npm")
    $("a").removeClass("selected")
    $('[href="/npm"]').addClass("selected")
  }

  static tag = "npm-page"
  static title = "NPM Modules - Ewan Howell"
  static description = "NPM modules published by Ewan Howell"
}
