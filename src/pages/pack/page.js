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
    for (const [i, image] of data.images.entries()) {
      images.prepend(E("img").attr({
        id: `image-${i}`,
        src: `/assets/images/resourcepacks/${pack}/images/${image}.webp`
      }).addClass("showcase-image").on("click", () => {
        const popup = E("div").addClass("popup-container").append(
          E("div").addClass("popup-image-container").append(
            E("img").addClass("popup-image").attr("src", `/assets/images/resourcepacks/${pack}/images/${image}.webp`).css({
              "max-width": "calc(90vw)",
              "max-height": "calc(90vh)"
            }),
            $("#close-icon").contents().clone(true).addClass("popup-image-close").on("click", () => popup.remove())
          )
        ).on("click", evt => {
          if (evt.target.classList[0] === "popup-container") popup.remove()
        }).appendTo(document.body)
      }))
      imageRow.append(E("div").attr("id", `thumbnail-${i}`).addClass("thumbnail-image").css("background-image", `url("/assets/images/resourcepacks/${pack}/images/${image}.webp")`).on("click", () => {
        img = i
        showImage()
      }))
    }
    let img = 0
    const prev = $("#prev").on("click", () => {
      if (prev.hasClass("disabled")) return
      img--
      showImage()
    })
    const next = $("#next").on("click", () => {
      if (next.hasClass("disabled")) return
      img++
      showImage()
    })
    function showImage() {
      $(".showcase-image").removeClass("shown")
      $(`#image-${img}`).addClass("shown")
      $(".thumbnail-image").removeClass("selected")
      $(`#thumbnail-${img}`).addClass("selected")
      if (img === 0) prev.addClass("disabled")
      else prev.removeClass("disabled")
      if (img === data.images.length - 1) next.addClass("disabled")
      else next.removeClass("disabled")
    }
    showImage()
  }
}

customElements.define("pack-page", PackPage)

export { PackPage }