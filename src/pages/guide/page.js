export default class extends Page {
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
                  closeIcon.clone(true)
                ).on("click", e => popup.remove())
              ),
              E("div").attr("id", "popup-optifine-content").append(
                E("div").attr("id", "popup-optifine-text").html(`OptiFine is a mod that adds a lot of extra resource pack related features to Minecraft.\n\n<b>${title}</b> requires OptiFine installed to function in a resource pack.`),
                E("div").attr("id", "popup-optifine-download").append(E("div").append(
                  E("a").attr({
                    href: "https://optifine.net/downloads",
                    target: "_blank"
                  }).append(
                    downloadIcon.clone(true),
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
          localIcon.clone(true),
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
          linkIcon.clone(true),
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
            $("#youtube-icon").contents().clone(true),
            E("span").text("Tutorial")
          )
        )
      )
    }
    addBlocks($, $("#content"), guide.content, args.name)
  }
}

function addBlocks($, element, blocks, guide, args) {
  const section = E("div").addClass("section")
  const copyIcon = $("#copy-icon").contents()
  for (const block of blocks) {
    if (typeof block === "string") {
      E("div").addClass("text").html(parseString(block, true)).appendTo(section)
    } else if (block.type === "heading") {
      E("div").addClass("heading").html(block.text).appendTo(section)
    } else if (block.type === "tablelist") {
      const table = E("table").addClass("tablelist").appendTo(section)
      for (const row of block.rows) {
        const tr = E("tr").appendTo(table)
        for (const [i, cell] of row.entries()) tr.append(E("td").html(parseString(cell)))
      }
    } else if (block.type === "image") {
      E("img").addClass("popupable").attr("src", `/assets/images/guides/${guide}/${block.name}.webp`).css("max-height", `${block.height ?? 256}px`).appendTo(section)
    } else if (block.type === "tabs") {
      let tabs, sections
      E("div").addClass(`tab-container${args?.depth === 1 ? " light" : ""}`).append(
        tabs = E("div").addClass("tabs"),
        sections = E("div").addClass("tab-sections sections")
      ).appendTo(section)
      for (const [i, sect] of block.tabs.entries()) {
        tabs.append(
          E("div").attr("data-tab", i).addClass("section-tab tab").append(sect.name)
        )
        const section2 = E("div").attr("data-tab", i).addClass("tab-section")
        addBlocks($, section2, sect.content, guide, { depth: (args?.depth ?? 0) + 1 })
        sections.append(section2)
      }
      sections.children().first().addClass("selected")
      tabs.children().on("click", e => {
        sections.children().removeClass("selected")
        tabs.children().removeClass("active")
        sections.children(`[data-tab="${$(e.currentTarget).addClass("active").attr("data-tab")}"]`).addClass("selected")
      }).first().addClass("active")
    } else if (block.type === "step") {
      E("div").addClass("step").html(block.text).attr("data-step", `${block.step}.`).appendTo(section)
    } else if (block.type === "codeblock") {
      let copy, timeout
      E("div").addClass(`codeblock${args?.depth ? ` light${args.depth}` : ""}`).append(
        E("div").addClass("codeblock-banner").append(
          E("div").addClass("codeblock-name").text(block.name),
          E("div").addClass("codeblock-copy").append(
            copyIcon.clone(true),
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
  }
  element.append(section)
}

function parseString(str, depth) {
  return str.replace(/`((?:.|\n)+?)`/g, `<code${depth === 1 ? ' class="light"' : ""}>$1</code>`)
            .replace(/\[(.+?)\]\((.+?)\)/g, `<a href="$2" target="_blank">$1</a>`)
            .replace(/\*\*((?:.|\n)+?)\*\*/g, "<strong>$1</strong>")
}