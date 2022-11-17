export default class HomePage extends Page {
  constructor() {
    super("home")
    $("a").removeClass("selected")
    $('[href="/"]').addClass("selected")
  }

  static tag = "home-page"

  async setData(params) {
    if (Object.keys(params).length) setTimeout(() => {
      if (params.pack) openPage(new URL(`/resourcepacks/${params.pack}`, location.origin), "replace")
      else if (params.resourcepacks !== undefined || params.pack !== undefined) openPage(new URL("/resourcepacks", location.origin), "replace")
      else if (params.map) openPage(new URL(`/maps/${params.map}`, location.origin), "replace")
      else if (params.maps !== undefined || params.map !== undefined) openPage(new URL("/maps", location.origin), "replace")
      else if (params.dungeon) openPage(new URL(`/dungeonsmods/${params.dungeon}`, location.origin), "replace")
      else if (params.dungeons !== undefined || params.dungeon !== undefined) openPage(new URL("/dungeonsmods", location.origin), "replace")
      else if (params.renders !== undefined) openPage(new URL("/renders", location.origin), "replace")
    }, 0)
  }
}

customElements.define(HomePage.tag, HomePage)