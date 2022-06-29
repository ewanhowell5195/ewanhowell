import { Page } from "/js/pages.js"

class PackPage extends Page {
  constructor() {
    super("pack")
    $(".page-button").removeClass("selected")
    $('.page-button[href="/resourcepacks"]').addClass("selected")
  }
  async setData({pack}) {
    await this.ready
    let data
    try {
      data = await fetch(`/assets/json/packs/${pack}.json`).then(e => e.json())
    } catch {
      return
    }
    const packName = data.name ?? pack.replace(/-/g, " ").toTitleCase()
    jQuery('link[rel="icon"][sizes="16x16"]').attr("href", `/assets/images/resourcepacks/${pack}/pack.webp`)
    jQuery('link[rel="icon"][sizes="32x32"]').attr("href", `/assets/images/resourcepacks/${pack}/pack.webp`)
    jQuery("title").text(packName)
    const $ = this.$
    const linkIcon = $("#link-icon").contents()
    const localIcon = $("#local-icon").contents()
    const closeIcon = $("#close-icon").contents()
    const downloadIcon = $("#download-icon").contents()
    $("#banner-background").css("background-image", `url("/assets/images/resourcepacks/${pack}/images/${resourcepacks.packs[pack].image}.webp")`)
    $("img#logo").attr("src", `/assets/images/resourcepacks/${pack}/logo.webp`)
    if (resourcepacks.packs[pack].optifine) {
      $("#optifine").removeClass("hidden")
      if (resourcepacks.packs[pack].optifine === 1) $("#optional").removeClass("hidden")
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
              E("div").attr("id", "popup-optifine-text").html(`OptiFine is a mod that adds a lot of extra resource pack related features to Minecraft.\n\nSome resource packs may be enhanced by OptiFine, or completely rely on it to function correctly.\n<h3>${packName} OptiFine requirement: </h3>${resourcepacks.packs[pack].optifine === 1 ? "Optional" : "Required"}${data.optifine ? `\n<h3>${packName} specific information:</h3>${data.optifine}` : ""}`),
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
        ).on("click", e => {
          if (e.target.classList[0] === "popup") popup.remove()
        }).appendTo(document.body)
      })
    }
    $("#title").text(packName)
    $("#subtitle").text(data.subtitle)
    $("#description").text(data.description)
    const images = $("#image-container")
    const imageRow = $("#thumbnail-row")
    let offset = 0
    if (data.video) {
      offset++
      images.prepend(E("iframe").addClass("showcase-image").attr({
        id: "image-0",
        "src": `https://www.youtube.com/embed/${data.video}?rel=0`,
        frameborder: 0,
        allow: "picture-in-picture",
        allowfullscreen: true
      }))
      imageRow.append(E("div").attr("id", "thumbnail-0").addClass("thumbnail-image").css("background-image", `url("https://img.youtube.com/vi/${data.video}/maxresdefault.jpg")`).on("click", e => {
        img = 0
        showImage()
      }))
    }
    for (const [i, image] of data.images.entries()) {
      images.prepend(E("img").attr({
        id: `image-${i + offset}`,
        src: `/assets/images/resourcepacks/${pack}/images/${image}.webp`
      }).addClass("showcase-image").on("click", e => {
        const popup = E("div").addClass("popup").append(
          E("div").addClass("popup-container").append(
            E("img").addClass("popup-image").attr("src", `/assets/images/resourcepacks/${pack}/images/${image}.webp`).css({
              "max-width": "calc(90vw)",
              "max-height": "calc(90vh)"
            }),
            closeIcon.clone(true).addClass("popup-image-close").on("click", e => popup.remove())
          )
        ).on("click", e => {
          if (e.target.classList[0] === "popup") popup.remove()
        }).appendTo(document.body)
      }))
      imageRow.append(E("div").attr("id", `thumbnail-${i + offset}`).addClass("thumbnail-image").css("background-image", `url("/assets/images/resourcepacks/${pack}/images/${image}.webp")`).on("click", e => {
        img = i + offset
        showImage()
      }))
    }
    let img = 0
    const prev = $("#prev").on("click", e => {
      if (prev.hasClass("disabled")) return
      img--
      showImage()
    })
    const next = $("#next").on("click", e => {
      if (next.hasClass("disabled")) return
      img++
      showImage()
    })
    function showImage() {
      $(".showcase-image").removeClass("shown")
      $(`#image-${img}`).addClass("shown")
      $(".thumbnail-image").removeClass("selected")
      $(`#thumbnail-${img}`).addClass("selected")
      if (!img) prev.addClass("disabled")
      else prev.removeClass("disabled")
      if (img === data.images.length - 1 + offset) next.addClass("disabled")
      else next.removeClass("disabled")
    }
    showImage()
    $("#pack-links-tabs div").on("click", e => {
      $("#pack-links-tabs .selected").removeClass("selected")
      $(e.target).addClass("selected")
      $("#downloads .selected").removeClass("selected")
      $(`#${e.target.getAttribute("id").match(/.+(?=-)/)}`).addClass("selected")
    })
    if (data.downloads) {
      $("#downloads").removeClass("hidden")
      const main = $("#main")
      const mirrors = $("#mirrors")
      for (const link of data.downloads) {
        main.append(E("a").attr({
          href: link.link,
          target: "_blank"
        }).append(
          downloadIcon.clone(true),
          E("span").text(link.text)
        ))
        if (link.mirror) mirrors.append(E("a").addClass("mirror").attr({
          href: link.mirror,
          target: "_blank"
        }).append(
          linkIcon.clone(true),
          E("span").text(link.text)
        ))
      }
    }
    if (data.links) {
      const links = $("#links").removeClass("hidden")
      for (const link of data.links) {
        if (link.type === "pack") links.append(E("a", {is: "f-a"}).attr("href", `/resourcepacks/${link.name}`).append(
          localIcon.clone(true),
          E("span").text(link.text)
        ))
        else links.append(E("a").attr({
          href: link.link,
          target: "_blank"
        }).append(
          linkIcon.clone(true),
          E("span").text(link.text)
        ))
      }
    }
    const categoryName = resourcepacks.versions.map(e => e.categories.find(e => e.packs.includes(pack))).find(e => e?.name)?.name
    if (categoryName) $("#category-name").text(categoryName)
  }
}

customElements.define("pack-page", PackPage)

export { PackPage }