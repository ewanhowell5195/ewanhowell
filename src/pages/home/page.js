import { Page } from "/js/pages.js"

class HomePage extends Page {
  constructor() {
    super("home")
    $("a").removeClass("selected")
    $('[href="/"]').addClass("selected")
  }
  async setData(params) {
    setTimeout(() => {
      if (params.pack) openPage(new URL(`/resourcepacks/${params.pack}`, location.origin))
      else if (params.resourcepacks !== undefined || params.pack !== undefined) openPage(new URL("/resourcepacks", location.origin))
      else location.href = `https://old.ewanhowell.com/?${Object.entries(params).map(e => `${e[0]}=${e[1]}`).join("&")}`
    }, 0)
  }
}

customElements.define("home-page", HomePage)

export { HomePage }