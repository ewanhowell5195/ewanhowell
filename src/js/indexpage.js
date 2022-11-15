import { Page } from "/js/libs/pages.js"

export function indexPageClass(type, title) {
  return class extends Page {
    constructor() {
      super(type, false, async $ => {
        jQuery("title").text(`${title} - Ewan Howell`)
        await fetchEntries(type)
        const tabs = $("#tabs")
        const versions = $("#versions")
        const allEntries = {
          id: "all",
          categories: window[type].versions.reduce((a, e) => {
            for (const category of e.categories) {
              let c = a.find(e => e.name === category.name)
              if (c) category.entries.forEach(e => c.entries.add(e))
              else {
                c = {
                  name: category.name,
                  entries: new Set(category.entries)
                }
                a.push(c)
              }
            }
            return a
          }, []).map(e => ({name: e.name, entries: Array.from(e.entries)}))
        }
        const arrowIcon = $("#arrow-icon").contents()
        for (const version of [allEntries, ...window[type].versions]) {
          if (window[type].versions.length > 1) tabs.append(E("a").attr("href", `/${type}/?version=${version.id}`).addClass("tab").text(version.id).on("click", evt => {
            evt.preventDefault()
            $(".version").removeClass("shown")
            $(`#${evt.target.innerHTML.replace(".", "-")}`).addClass("shown")
            $(".selected").removeClass("selected")
            $(evt.target).addClass("selected")
            history.pushState({}, null, `/${type}/?version=${evt.target.innerHTML}`)
            sessionStorage.setItem(`${type}Version`, evt.target.innerHTML)
            if ($(".version.shown").find(".category").not(".hidden").length) $("#no-results").removeClass("shown")
            else $("#no-results").addClass("shown")
          }))
          const versionDiv = E("div").addClass("version").attr("id", version.id.replace(".", "-")).appendTo(versions)
          for (const category of version.categories) {
            const categoryEntriesDiv = E("div").addClass(`entries category-${category.name.replace(/ /g, "-")}`).appendTo(
              E("div").addClass("category").attr("id", category.name).append(
                E("div").addClass("category-header").append(
                  E("h1").text(category.name),
                  arrowIcon.clone(true).addClass(`arrow-${category.name.replace(/ /g, "-")}`).on("click", e => {
                    const arrow = $(e.currentTarget)
                    if (arrow.hasClass("collapsed")) {
                      $(`.arrow-${category.name.replace(/ /g, "-")}`).removeClass("collapsed")
                      $(`.category-${category.name.replace(/ /g, "-")}`).removeClass("collapsed")
                    } else {
                      $(`.arrow-${category.name.replace(/ /g, "-")}`).addClass("collapsed")
                      $(`.category-${category.name.replace(/ /g, "-")}`).addClass("collapsed")
                    }
                  })
                )
              ).appendTo(versionDiv)
            )
            for (const entry of category.entries) {
              const entryName = window[type].entries[entry].name ?? entry.replace(/-/g, " ").toTitleCase()
              const entryImages = E("div").addClass("entry-images").attr("id", entry)
              entryImages.append(E("div").addClass("entry-image").css("background-image", `url("/assets/images/${window[type].entries[entry].image ? `${type}/${entry}/images/${window[type].entries[entry].image}` : "/home/logo_3d"}.webp")`))
              if (window[type].entries[entry].logoless) entryImages.append(
                E("div").addClass("logo").text(entryName)
              )
              else entryImages.append(
                E("div").addClass("logo").css("background-image", `url("/assets/images/${type}/${entry}/logo.webp")`)
              )
              const entryDiv = E("a", {is: "f-a"}).attr("href", `/${type}/${entry}`).addClass("entry-container").append(
                entryImages,
                E("div").addClass("entry-name").text(entryName)
              ).appendTo(categoryEntriesDiv)
              if (window[type].entries[entry].optifine) entryImages.append(E("img").addClass("optifine").attr("src", "/assets/images/logo/optifine.webp"))
            }
          }
        }
        $("#search input").on({
          keypress(e) {
            if (e.key === "Enter") e.currentTarget.blur()
          },
          input(e) {
            const text = e.currentTarget.value.toLowerCase().replace(/&/g, "and")
            const params = getURLParams() ?? {}
            params.search = text
            if (!params.search) delete params.search
            history.replaceState({}, null, `/${type}/${toURLParams(params)}`)
            const spaceless = text.replace(/\s/g, "")
            for (const e of $(".entry-container")) {
              const entry = $(e)
              const category = entry.parent().parent().attr("id").toLowerCase()
              const id = entry.find(".entry-images").attr("id").toLowerCase()
              const name = entry.find(".entry-name").text().toLowerCase().replace(/&/g, "and")
              const simple = name.replace(/[^a-zA-Z0-9]/g, "")
              if (category.includes(text) || id.includes(text) || name.includes(text) || simple.includes(spaceless)) entry.removeClass("hidden")
              else entry.addClass("hidden")
            }
            for (const e of $(".category")) {
              const category = $(e)
              if (!category.find(".entry-container").not(".hidden").length) category.addClass("hidden")
              else category.removeClass("hidden")
            }
            if ($(".version.shown").find(".category").not(".hidden").length) $("#no-results").removeClass("shown")
            else $("#no-results").addClass("shown")
          }
        })
        window.addEventListener("resize", e => $(".category-header").css("top", `${$("#tabs").outerHeight()}px`))
        setTimeout(() => window.dispatchEvent(new Event("resize")), 0)
      })
      $("a").removeClass("selected")
      $(`[href="/${type}"]`).addClass("selected")
    }
    async setData({version, search}) {
      await this.ready
      if (window[type].versions.length === 1) version = "all"
      else if (!version) {
        version = sessionStorage.getItem(`${type}Version`)
        if (!version) version = "all"
      }
      const tab = this.$(`.tab:contains("${version}")`)
      if (!tab.length) version = window[type].versions[0].id
      this.$(`#${version.replace(".", "-")}`).addClass("shown")
      this.$(`.tab:contains("${version}")`).addClass("selected")
      sessionStorage.setItem(`${type}Version`, version)
      if (search) {
        this.$("#search input").val(search)
        setTimeout(() => this.$("#search input").trigger("input"), 0)
      }
      if (window[type].versions.length === 1) version = undefined
      history.replaceState({}, null, `/${type}/${toURLParams({version, search})}`)
    }
  }
}