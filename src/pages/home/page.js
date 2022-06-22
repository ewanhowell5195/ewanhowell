import { Page } from "/js/pages.js"

class HomePage extends Page {
  constructor() {
    super("home")
    $(".page-button").removeClass("selected")
    $('.page-button[href="/"]').addClass("selected")
  }
}

customElements.define("home-page", HomePage)

export { HomePage }