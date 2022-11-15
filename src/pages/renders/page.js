import { popupImage } from "/js/popupImage.js"
import { Page } from "/js/libs/pages.js"

class RendersPage extends Page {
  constructor() {
    super("renders", true, $ => {
      jQuery("title").text("Renders - Ewan Howell")
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
}

customElements.define("renders-page", RendersPage)

export { RendersPage }