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
    const $ = this.$
    $("#banner-background").css("background-image", data.banner ? `url("/assets/images/resourcepacks/${pack}/banner.webp")` : `url("/assets/images/resourcepacks/${pack}/images/${data.images[0]}.webp")`)
    $("img#logo").attr("src", `/assets/images/resourcepacks/${pack}/logo.webp`)
    if (resourcepacks.packs[pack].optifine) {
      $("#optifine").removeClass("hidden")
      if (resourcepacks.packs[pack].optifine === 1) $("#optional").removeClass("hidden")
      else $("#required").removeClass("hidden")
    }
    $("#title").text(data.name ?? pack.replace(/-/g, " ").toTitleCase())
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
        const popup = E("div").addClass("popup-container").append(
          E("div").addClass("popup-image-container").append(
            E("img").addClass("popup-image").attr("src", `/assets/images/resourcepacks/${pack}/images/${image}.webp`).css({
              "max-width": "calc(90vw)",
              "max-height": "calc(90vh)"
            }),
            $("#close-icon").contents().clone(true).addClass("popup-image-close").on("click", e => popup.remove())
          )
        ).on("click", e => {
          if (e.target.classList[0] === "popup-container") popup.remove()
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
    const main = $("#main")
    const mirrors = $("#mirrors")
    for (const link of data.downloads) {
      main.append(E("a").attr({
        href: link.link,
        target: "_blank"
      }).append(
        $("#download-icon").contents().clone(true),
        E("span").text(link.text)
      ))
      if (link.mirror) mirrors.append(E("a").addClass("mirror").attr({
        href: link.mirror,
        target: "_blank"
      }).append(
        $("#mirror-icon").contents().clone(true),
        E("span").text(link.text)
      ))
    }
  }
}

customElements.define("pack-page", PackPage)

export { PackPage }