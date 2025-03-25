export function indexPageClass(type, title) {
  const IndexPage = class extends Page {
    constructor() {
      super(type, false, async $ => {
        await fetchJSON(type)
        const tabs = $("#tabs")
        const versionsElement = $("#versions")
        const month = new Date().getMonth() + 1
        if (window[type].versions) for (const category of window[type].categories) {
          category.entries.sort((a, b) => {
            const aHas = a.featured?.includes(month)
            const bHas = b.featured?.includes(month)
            if (aHas && !bHas) return -1
            else if (!aHas && bHas) return 1
            return window[type].versions.indexOf(a.versions[0]) - window[type].versions.indexOf(b.versions[0]);
          })
        }
        const versions = window[type].versions?.map(e => ({ id: e, categories: [] })) ?? []
        versions.unshift({ id: "all", categories: window[type].categories })
        if (window[type].versions) for (const category of window[type].categories) {
          category.featured = []
          for (const entry of category.entries) {
            if (entry.featured) {
              for (const month of entry.featured) {
                if (!category.featured.includes(month)) {
                  category.featured.push(month)
                }
              }
            }
            for (const version of entry.versions) {
              const versionData = versions.find(e => e.id === version)
              let categoryData = versionData.categories.find(e => e.name === category.name)
              if (!categoryData) {
                categoryData = { name: category.name, entries: [], featured: category.featured }
                versionData.categories.push(categoryData)
              }
              categoryData.entries.push(entry)
            }
          }
        }
        if (window[type].versions) for (const version of versions) {
          version.categories.sort((a, b) => {
            const aHas = a.featured.includes(month)
            const bHas = b.featured.includes(month)
            if (aHas && !bHas) return -1
            else if (!aHas && bHas) return 1
            return 0
          })
        }
        const arrowIcon = $("#arrow-icon").contents()
        for (const version of versions) {
          if (window[type].versions) tabs.append(E("a").attr("href", `/${type}/?version=${version.id}`).addClass("tab").text(version.id).on("click", evt => {
            evt.preventDefault()
            $(".version").removeClass("shown")
            $(`#${evt.target.innerHTML.replaceAll(".", "-")}`).addClass("shown")
            $(".selected").removeClass("selected")
            $(evt.target).addClass("selected")
            history.pushState({}, null, `/${type}/?version=${evt.target.innerHTML}`)
            sessionStorage.setItem(`${type}Version`, evt.target.innerHTML)
            if ($(".version.shown").find(".category").not(".hidden").length) {
              $("#no-results").removeClass("shown")
              this.addFeatured(versionDiv, $)
            } else $("#no-results").addClass("shown")
            const title = document.title.split(" - ")
            if (evt.target.innerHTML === "all") document.title = [title[0], title[title.length - 1]].join(" - ")
            else document.title = [title[0], evt.target.innerHTML, title[title.length - 1]].join(" - ")
            analytics()
          }))
          const versionDiv = E("div").addClass("version").attr("id", version.id.replaceAll(".", "-")).appendTo(versionsElement)
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
              const entryName = entry.name ?? entry.id.toTitleCase(true, true)
              const entryImages = E("div").addClass("entry-images").attr("id", entry.id)
              entryImages.append(E("div").addClass("entry-image").css("background-image", `url("/assets/images/${entry.image ? `${type}/${entry.id}/images/${entry.image}` : "/home/logo_3d"}.webp")`))
              if (entry.logoless) {
                const logo = E("div").addClass("logo").text(entryName).appendTo(entryImages)
                if (entry.fontsize) logo.css("font-size", `${entry.fontsize}rem`)
              } else entryImages.append(
                E("div").addClass("logo").css("background-image", `url("/assets/images/${type}/${entry.id}/logo.webp")`)
              )
              const entryDiv = E("a", {is: "f-a"}).attr({
                href: `/${type}/${entry.id}`,
                "data-id": entry.id
              }).addClass("entry").append(
                entryImages,
                E("div").addClass("entry-name").text(entryName)
              ).appendTo(categoryEntriesDiv)
              if (entry.optifine) entryImages.append(E("img").addClass("optifine").attr("src", "/assets/images/logo/optifine.webp"))
            }
          }
        }
        let searchTimeout
        $("#search input").on({
          keypress(e) {
            if (e.key === "Enter") e.currentTarget.blur()
          },
          input(e) {
            clearTimeout(searchTimeout)
            const text = e.currentTarget.value.toLowerCase().replace(/&/g, "and")
            if (text) $(".featured-entry").addClass("hidden")
            else $(".featured-entry").removeClass("hidden")
            const params = getURLParams() ?? {}
            params.search = text
            if (!params.search) delete params.search
            history.replaceState({}, null, `/${type}/${toURLParams(params)}`)
            const spaceless = text.replace(/\s/g, "")
            for (const e of $(".entry")) {
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
              if (!category.find(".entry").not(".hidden").length) category.addClass("hidden")
              else category.removeClass("hidden")
            }
            if ($(".version.shown").find(".category").not(".hidden").length) $("#no-results").removeClass("shown")
            else $("#no-results").addClass("shown")
            searchTimeout = setTimeout(() => {
              gtag("event", "search", { "search_term": text })
            }, 1000)
          }
        })
        window.addEventListener("resize", e => $(".category-header").css("top", `${$("#tabs").outerHeight()}px`))
        setTimeout(() => window.dispatchEvent(new Event("resize")), 0)
      })
      $("a").removeClass("selected")
      $(`[href="/${type}"]`).addClass("selected")
    }

    static tag = `${type}-page`
    static title = `${title} - Ewan Howell`

    async setData({ version, search }) {
      await this.ready
      if (!window[type].versions) version = "all"
      else if (!version) {
        version = sessionStorage.getItem(`${type}Version`)
        if (!version) version = "all"
      }
      const tab = this.$(".tab").filter(function() {
        return $(this).text().trim() === version
      })
      if (window[type].versions && !tab.length) version = window[type].versions[0]
      this.$(`#${version.replaceAll(".", "-")}`).addClass("shown")
      this.addFeatured(this.$(".version.shown"), this.$)
      this.$(".tab").filter(function() {
        return $(this).text().trim() === version
      }).addClass("selected")
      sessionStorage.setItem(`${type}Version`, version)
      if (search) {
        this.$("#search input").val(search)
        setTimeout(() => this.$("#search input").trigger("input"), 0)
      }
      if (!window[type].versions) version = undefined
      this.newState = `/${type}/${toURLParams({ version, search })}`
      if (version && version !== "all") {
        const title = document.title.split(" - ")
        document.title = [title[0], version, title[1]].join(" - ")
      }
    }

    onOpened() {
      history.replaceState({}, null, this.newState)
    }

    async addFeatured(versionDiv, $) {
      if (!versionDiv.find(".featured-entry").length) {
        const entries = versionDiv.find(".entry")
        if (entries.length > 5) {
          const d = new Date(Date.now())
          const featured = this.$(entries[(d.getUTCFullYear() * 764900 + d.getUTCMonth() * 51470 + d.getUTCDate() * 311) % entries.length])
          const entry = E("div").addClass("featured-entry").append(
            E("div").addClass("featured-title").text(`Featured ${title.slice(0, -1)}`),
            E("a", { is: "f-a" }).addClass("featured").attr("href", featured.attr("href")).append(
              E("div").addClass("entry-images featured-images").append(
                E("div").addClass("entry-image").css("background-image", featured.find(".entry-image").css("background-image")),
                E("div").addClass("logo featured-logo").css("background-image", featured.find(".logo").css("background-image")).text(featured.find(".logo").text())
              ),
              E("div").addClass("featured-details").append(
                E("div").addClass("featured-category").text(featured.parent().prev().text()),
                E("div").addClass("featured-name").text(featured.find(".entry-name").text()),
                E("div").addClass("featured-description").html(await fetch(`/assets/json/${type}/${featured.attr("data-id")}.json`).then(e => e.json()).then(e => e.description))
              )
            )
          ).prependTo(versionDiv)
          if ($("#search input").val()) entry.addClass("hidden")
        }
      }
    }
  }

  return IndexPage
}