export default class extends Page {
  #resizePage

  constructor() {
    super("guide", true, async $ => {
      await fetchJSON("guides")
      const section = $("#guides")
    })
    $("a").removeClass("selected")
    $('[href="/guides"]').addClass("selected")
  }

  static tag = "guide-page"

  async setData(args) {
    await this.ready
    const check = await fetchJSON(`guides/${args.name}`)
    if (!check) return false
    await fetchJSON("guides")
    const $ = this.$
    const guide = window[`guides/${args.name}`]
    const guideData = guides.find(e => e.id === args.name)
    const title = guideData.name ?? args.name.toTitleCase(true)
    jQuery('link[rel="icon"][sizes="16x16"]').attr("href", "/assets/images/guides/icon.webp")
    jQuery('link[rel="icon"][sizes="32x32"]').attr("href", "/assets/images/guides/icon.webp")
    jQuery("title").text(`${title} - Guides - Ewan Howell`)
    const linkIcon = $("#link-icon").contents()
    const localIcon = $("#local-icon").contents()
    const closeIcon = $("#close-icon").contents()
    const downloadIcon = $("#download-icon").contents()
    $("#title").text(title)
    $("#subtitle").text(guideData.description)
    $("header").css("background-image", `url(/assets/images/guides/${args.name}/thumbnail.webp)`)
    if (guideData.optifine) {
      $("#optifine").removeClass("hidden")
      if (guide.optifine === 1) $("#optional").removeClass("hidden")
      else $("#required").removeClass("hidden")
      $("#optifine-info").on("click", e => {
        const popup = E("div").addClass("popup").append(
          E("div").addClass("popup-container").append(
            E("div").addClass("popup-optifine").append(
              E("div").attr("id", "popup-optifine-banner").append(
                E("img").attr("src", "/assets/images/logo/optifine.webp"),
                E("div").text("OptiFine"),
                E("div").addClass("spacer"),
                E("div").attr("id", "popup-optifine-close").append(
                  closeIcon.clone()
                ).on("click", e => popup.remove())
              ),
              E("div").attr("id", "popup-optifine-content").append(
                E("div").attr("id", "popup-optifine-text").html(`OptiFine is a mod that adds a lot of extra resource pack related features to Minecraft.\n\n<b>${title}</b> requires OptiFine installed to function in a resource pack.`),
                E("div").attr("id", "popup-optifine-download").append(E("div").append(
                  E("a").attr({
                    href: "https://optifine.net/downloads",
                    target: "_blank"
                  }).append(
                    downloadIcon.clone(),
                    E("span").text("Download OptiFine")
                  )
                ))
              )
            )
          )
        ).on("click", e => {
          if (e.target.classList[0] === "popup") popup.remove()
        }).appendTo(document.body)
      })
    }
    const sidebar = $("#sidebar")
    if (guide.links.examples) {
      const links = E("div").addClass("sidebar-links")
      sidebar.append(E("div").addClass("sidebar-subtitle").text("Example Resource Packs"), links)
      for (const pack of guide.links.examples) {
        links.append(E("a", { is: "f-a" }).addClass("button link-example").attr("href", `/resourcepacks/${pack}`).append(
          localIcon.clone(),
          E("span").text(pack.toTitleCase(true))
        ))
      }
    }
    if (guide.links.documentation) {
      const links = E("div").addClass("sidebar-links")
      sidebar.append(E("div").addClass("sidebar-subtitle").text("Documentation"), links)
      for (const doc of guide.links.documentation) {
        links.append(E("a").addClass("button").attr({
          href: doc.link,
          target: "_blank"
        }).append(
          linkIcon.clone(),
          E("span").text(doc.text)
        ))
      }
    }
    if (guide.links.video) {
      sidebar.append(
        E("div").addClass("sidebar-subtitle").text("Tutorial Video"),
        E("div").addClass("sidebar-links").append(
          E("a").addClass("button").attr({
            href: `https://youtu.be/${guide.links.video}`,
            target: "_blank"
          }).append(
            $("#youtube-icon").contents().clone(),
            E("span").text("Tutorial")
          )
        )
      )
    }
    if (guide.links.other) {
      const links = E("div").addClass("sidebar-links")
      sidebar.append(E("div").addClass("sidebar-subtitle").text("Other Links"), links)
      for (const doc of guide.links.other) {
        links.append(E("a").addClass("button").attr({
          href: doc.link,
          target: "_blank"
        }).append(
          linkIcon.clone(),
          E("span").text(doc.text)
        ))
      }
    }

    addBlocks($, $("#content"), guide.content, args.name, {
      view: args.searchParams.view?.split(",") ?? []
    })
    if (scrollTo) setTimeout(() => scrollTo[0].scrollIntoView({
      behavior: "smooth"
    }), 100)

    const mobileLinksContainer = $("#mobile-links")
    $("#mobile-links-content").append(sidebar.children(":not(:first-child)").clone())
    $("#mobile-links-header").on("click", e => {
      mobileLinksContainer.toggleClass("collapsed")
      this.#resizePage()
    })

    this.#resizePage = () => {
      const e = this.shadowBody[0].querySelector("#mobile-links-content")
      e.style.maxHeight = `${e.scrollHeight}px`
    }
    window.addEventListener("resize", this.#resizePage)
  }

  onClosed() {
    window.removeEventListener("resize", this.#resizePage)
    scrollTo = null
  }
}

let scrollTo
function addBlocks($, element, blocks, guide, args) {
  const section = E("div").addClass("section")
  const copyIcon = $("#copy-icon").contents()
  for (const [b, block] of blocks.entries()) {
    const blockPath = (args.blockPath ?? []).concat(b)
    if (typeof block === "string") {
      E("div").addClass("text").html(parseString(block, true)).appendTo(section)
    } else if (block.type === "heading") {
      copyHandler(E("div").addClass("heading").html(block.text).appendTo(section), blockPath)
    } else if (block.type === "tablelist") {
      const table = E("table").addClass("tablelist").appendTo(section)
      for (const row of block.rows) {
        const tr = E("tr").appendTo(table)
        for (const [i, cell] of row.entries()) tr.append(E("td").html(parseString(cell)))
      }
    } else if (block.type === "image") {
      E("img").addClass("popupable").attr({
        src: `/assets/images/guides/${block.source ?? guide}/${block.name}.webp`,
        height: block.height ?? 256
      }).css("max-height", `${block.height ?? 256}px`).appendTo(section)
    } else if (block.type === "tabs") {
      let tabs, sections
      E("div").addClass(`tab-container${args.depth === 1 ? " light" : ""}`).append(
        tabs = E("div").addClass("tabs"),
        sections = E("div").addClass("tab-sections sections")
      ).appendTo(section)
      for (const [i, sect] of block.tabs.entries()) {
        const tab = E("div").attr("data-tab", i).addClass("section-tab tab").append(sect.name).on("click", e => {
          sections.children().removeClass("selected")
          tabs.children().removeClass("active")
          sections.children(`[data-tab="${$(e.currentTarget).addClass("active").attr("data-tab")}"]`).addClass("selected")
          history.replaceState({}, null, `${location.pathname}?view=${blockPath.concat(i).join()}`)
        }).appendTo(tabs)
        const section2 = E("div").attr("data-tab", i).addClass("tab-section")
        const tabPath = blockPath.concat(i)
        addBlocks($, section2, sect.content, guide, {
          depth: (args.depth ?? 0) + 1,
          blockPath: tabPath,
          view: args.view
        })
        sections.append(section2)
        if (tabPath.every((val, index) => val == args.view[index])) {
          tab.addClass("active")
          section2.addClass("selected")
          if (tabPath.length === args.view.length) scrollTo = tab
        }
      }
      if (!tabs.find(".active").length) {
        tabs.children().first().addClass("active")
        sections.children().first().addClass("selected")
      }
    } else if (block.type === "step") {
      copyHandler(E("div").addClass("step").html(block.text).attr("data-step", `${block.step}.`).appendTo(section), blockPath)
    } else if (block.type === "codeblock") {
      let copy, timeout
      E("div").addClass(`codeblock${args.depth ? ` light${args.depth}` : ""}`).append(
        E("div").addClass("codeblock-banner").append(
          E("div").addClass("codeblock-name").text(block.name),
          E("div").addClass("codeblock-copy").append(
            copyIcon.clone(),
            copy = E("div").text("Copy")
          ).on("click", e => {
            clearTimeout(timeout)
            navigator.clipboard.writeText(block.text)
            copy.text("Copied!")
            timeout = setTimeout(() => copy.text("Copy"), 2000)
          })
        ),
        E("div").addClass("codeblock-content").text(block.text)
      ).appendTo(section)
    }
    if (!scrollTo) if (blockPath.length === args.view.length && blockPath.every((val, index) => val == args.view[index])) scrollTo = section.children().last()
  }
  element.append(section)
}

function copyHandler(element, path) {
  let timeout
  element.on("click", e => {
    clearTimeout(timeout)
    navigator.clipboard.writeText(`${location.href.split("?")[0]}?view=${path.join()}`)
    element.addClass("copied")
    timeout = setTimeout(() => element.removeClass("copied"), 2000)
  })
}

function parseString(str, depth) {
  return str.replace(/\*\*((?:[^`]|\n)+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*((?:[^`]|\n)+?)\*/g, "<i>$1</i>")
            .replace(/`((?:.|\n)+?)`/g, `<code${depth === 1 ? ' class="light"' : ""}>$1</code>`)
            .replace(/\[([^\[\]]+?)\]\((.+?)\)/g, (m, s, l) => {
              if (l.startsWith("/")) return `<a is="f-a" href="${l}">${s}</a>`
              return `<a href="${l}" target="_blank">${s}</a>`
            })
}