export default class RendersPage extends Page {
  constructor() {
    super("renders", true, $ => {
      $(".renders").attr({
        "data-popupable-group": "renders",
        "data-popupable-zoomable": ""
      })
      $(".renders > div").each(function() {
        const img = $(this)
        const id = img.attr("id")
        img.css("background-image", `url(/assets/images/renders/${id}.webp)`).attr({
          "data-popupable": "",
          src: `/assets/images/renders/4k/${id}.webp`,
          "data-popupable-thumb": `/assets/images/renders/${id}.webp`
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