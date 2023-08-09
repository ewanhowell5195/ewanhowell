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
    const title = guides.find(e => e.id === args.name).name ?? args.name.toTitleCase(true)
    jQuery("title").text(`${title} - Guides - Ewan Howell`)
    const linkIcon = $("#link-icon").contents()
    const localIcon = $("#local-icon").contents()
    $("#title").text(title)
    $("#subtitle").text(guides.find(e => e.id === args.name).description)
    $("header").css("background-image", `url(/assets/images/guides/${args.name}/thumbnail.webp)`)
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
  }
}

function addBlocks($, element, blocks, feature, args) {
  const section = E("div").addClass("section")
  for (const block of blocks) {
    if (typeof block === "string") {
      E("div").addClass("text").html(block).appendTo(section)
    } else if (block.type === "heading") {
      E("div").addClass("heading").html(block.text).appendTo(section)
    } else if (block.type === "tablelist") {
      const table = E("table").addClass("tablelist").appendTo(section)
      for (const row of block.rows) {
        const tr = E("tr").appendTo(table)
        for (const [i, cell] of row.entries()) tr.append(E("td").html(cell))
      }
    } else if (block.type === "image") {
      E("img").attr("src", `/assets/images/features/${feature}/${block.name}.webp`).css("max-height", `${block.height ?? 256}px`).appendTo(section)
    } else if (block.type === "embed") {
      makeEmbed($, section, block.data, args)
    } else if (block.type === "message") {
      makeMessage($, section, block.data, args)
    } else if (block.type === "modal") {
      makeModal($, section, block.data)
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
        addBlocks($, section2, sect.content, feature, { depth: 1 })
        sections.append(section2)
      }
      sections.children().first().addClass("selected")
      tabs.children().on("click", e => {
        sections.children().removeClass("selected")
        tabs.children().removeClass("active")
        sections.children(`[data-tab="${$(e.currentTarget).addClass("active").attr("data-tab")}"]`).addClass("selected")
      }).first().addClass("active")
    }
  }
  element.append(section)
}