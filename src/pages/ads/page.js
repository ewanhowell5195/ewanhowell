export default class extends Page {
  constructor() {
    super("ads", true)
    $("a").removeClass("selected")
  }

  static tag = "ads-page"

  async setData({ url }) {
    await this.ready
    if (!url) return setTimeout(() => openPage(new URL(location.origin), true), 1000)
    const countdown = this.$("#countdown")
    let i = 5
    const interval = setInterval(() => {
      if (i === 0) {
        clearInterval(interval)
        countdown.text("")
        countdown.append(E("a").addClass("button").attr({ href: url }).append(
          this.$("#skip-icon").contents().clone(),
          E("span").text("Skip...")
        ))
        return
      }
      countdown.text(`Please wait ${i} seconds...`)
      i--
    }, 1000)
  }
}