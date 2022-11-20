import { popupImage } from "/js/popupImage.js"

export default class RendersPage extends Page {
  constructor() {
    super("renders", true, $ => {
      $(".renders > div").each(function() {
        const img = $(this)
        img.css("background-image", `url(/assets/images/renders/${img.attr("id")}.webp)`).on("click", e => {
          popupImage(`/assets/images/renders/4k/${img.attr("id")}.webp`)
        })
      })
    })
    $("a").removeClass("selected")
    $('[href="/renders"]').addClass("selected")
  }

  static tag = "renders-page"
  static title = "Renders - Ewan Howell"
  static description = "View all of Ewan Howell's Blender renders"
  static image = "renders/4k/glados.webp"
  static colour = "#222033"
}