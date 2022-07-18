import { Page } from "/js/pages.js"

class ColoursPage extends Page {
  constructor() {
    super("colours")
  }
  async setData({hex}) {
    await this.ready
    if (!hex) {
      hex = "f00-0f0-00f"
      history.replaceState({}, null, `/colours/?hex=${hex}`)
    }
    const container = this.$(".color-container")
    for (const col of hex.split("-")) {
      container.append(E("div").addClass("colour").css("background-color", `#${col}`))
    }
  }
}

customElements.define("colours-page", ColoursPage)

export { ColoursPage }