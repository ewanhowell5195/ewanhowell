export default class extends Page {
  constructor() {
    super("ads", true)
    $("a").removeClass("selected")
  }

  static tag = "ads-page"
}