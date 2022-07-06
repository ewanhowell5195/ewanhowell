import { Page } from "/js/pages.js"

class HomePage extends Page {
  constructor() {
    super("home")
    $("a").removeClass("selected")
    $('[href="/"]').addClass("selected")
  }
}

customElements.define("home-page", HomePage)

export { HomePage }