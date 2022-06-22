import { Page } from "/js/pages.js"

class PackPage extends Page {
  constructor() {
    super("pack")
    $(".page-button").removeClass("selected")
    $('.page-button[href="/resourcepacks"]').addClass("selected")
  }
  async setData({pack}) {
    await this.ready
    let data
    try {
      data = await fetch(`/assets/json/packs/${pack}.json`).then(e => e.json())
    } catch {
      return
    }
    const $ = this.$
    $("#banner").css("background-image", `url("/assets/images/resourcepacks/${pack}/banner.webp")`)
    $("img#logo").attr("src", `/assets/images/resourcepacks/${pack}/logo.webp`)
  }
}

customElements.define("pack-page", PackPage)

export { PackPage }