import { Page } from "/js/pages.js"

class HomePage extends Page {
  constructor() {
    super("home")
    $("a").removeClass("selected")
    $('[href="/"]').addClass("selected")
  }
  async setData(params) {
    if (Object.keys(params).length) setTimeout(() => {
      if (params.pack) openPage(new URL(`/resourcepacks/${params.pack}`, location.origin), true)
      else if (params.map) openPage(new URL(`/maps/${params.map}`, location.origin), true)
      else if (params.resourcepacks !== undefined || params.pack !== undefined) openPage(new URL("/resourcepacks", location.origin), true)
    }, 0)
  }
}

customElements.define("home-page", HomePage)

export { HomePage }