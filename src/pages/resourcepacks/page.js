import { Page } from "/js/pages.js"

class ResourcepacksPage extends Page {
  constructor() {
    super("resourcepacks", true, async $ => {
      jQuery("title").text("Ewan Howell - Resource Packs")
      await fetchResourcepacks()
      const tabs = $("#tabs")
      const versions = $("#versions")
      const allPacks = {
        id: "all",
        categories: resourcepacks.versions.reduce((a, e) => {
          for (const category of e.categories) {
            let c = a.find(e => e.name === category.name)
            if (c) {
              category.packs.forEach(e => c.packs.add(e))
            } else {
              c = {
                name: category.name,
                packs: new Set(category.packs)
              }
              a.push(c)
            }
          }
          return a
        }, []).map(e => ({name: e.name, packs: Array.from(e.packs)}))
      }
      for (const version of [allPacks, ...resourcepacks.versions]) {
        tabs.append(E("a").attr("href", `/resourcepacks/?version=${version.id}`).addClass("tab").text(version.id).on("click", evt => {
          evt.preventDefault()
          $(".version").removeClass("shown")
          $(`#${evt.target.innerHTML.replace(".", "-")}`).addClass("shown")
          $(".selected").removeClass("selected")
          $(evt.target).addClass("selected")
          history.pushState({}, null, `/resourcepacks/?version=${evt.target.innerHTML}`)
          sessionStorage.setItem("resourcepacksVersion", evt.target.innerHTML)
        }))
        const versionDiv = E("div").addClass("version hidden").attr("id", version.id.replace(".", "-")).appendTo(versions)
        for (const category of version.categories) {
          const categoryPacksDiv = E("div").addClass("packs").appendTo(
            E("div").addClass("category").attr("id", category.name).append(
              E("h1").text(category.name)
            ).appendTo(versionDiv)
          )
          for (const pack of category.packs) {
            const packImages = E("div").addClass("pack-images").attr("id", pack).append(
              E("div").addClass("pack-image").css("background-image", `url("/assets/images/resourcepacks/${pack}/images/${resourcepacks.packs[pack].image}.webp")`),
              E("div").addClass("logo").css("background-image", `url("/assets/images/resourcepacks/${pack}/logo.webp")`)
            )
            const packDiv = E("a", {is: "f-a"}).attr("href", `/resourcepacks/${pack}`).addClass("pack-container").append(
              packImages,
              E("div").addClass("pack-name").text(resourcepacks.packs[pack].name ?? pack.replace(/-/g, " ").toTitleCase())
            ).appendTo(categoryPacksDiv)
            if (resourcepacks.packs[pack].optifine) packImages.append(E("img").addClass("optifine").attr("src", "/assets/images/logo/optifine.webp"))
          }
        }
      }
    })
    $(".page-button").removeClass("selected")
    $('.page-button[href="/resourcepacks"]').addClass("selected")
  }
  async setData({version}) {
    await this.ready
    if (!version) {
      version = sessionStorage.getItem("resourcepacksVersion")
      if (!version) version = "all"
    }
    const tab = this.$(`.tab:contains("${version}")`)
    if (!tab.length) version = resourcepacks.versions[0].id
    this.$(`#${version.replace(".", "-")}`).addClass("shown")
    this.$(`.tab:contains("${version}")`).addClass("selected")
    sessionStorage.setItem("resourcepacksVersion", version)
    history.replaceState({}, null, `/resourcepacks/?version=${version}`)
  }
}

customElements.define("resourcepacks-page", ResourcepacksPage)

export { ResourcepacksPage }