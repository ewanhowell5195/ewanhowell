export default class HomePage extends Page {
  constructor() {
    super("home")
    $("a").removeClass("selected")
    $('[href="/"]').addClass("selected")
  }

  static tag = "home-page"

  async setData(params) {
    if (Object.keys(params).length) {
      if (params.pack) this.redirect = `/resourcepacks/${params.pack}`
      else if ("resourcepacks" in params || "pack" in params) this.redirect = "/resourcepacks"
      else if (params.map) this.redirect = `/maps/${params.map}`
      else if ("maps" in params || "map" in params) this.redirect = "/maps"
      else if (params.dungeon) this.redirect = `/dungeonsmods/${params.dungeon}`
      else if ("dungeons" in params || "dungeon" in params) this.redirect = "/dungeonsmods"
      else if ("renders" in params) this.redirect = "/renders"
    }
  }

  onOpened() {
    if (this.redirect) openPage(new URL(this.redirect, location.origin), "replace")
  }
}