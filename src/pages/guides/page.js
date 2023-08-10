export default class extends Page {
  constructor() {
    super("guides", true, async $ => {
      await fetchJSON("guides")
      const section = $("#guides")
      for (const guide of guides) {
        E("a", { is: "f-a" }).attr("href", `/guides/${guide.id}`).addClass("guide").append(
          E("div").addClass("details").append(
            E("h2").text(guide.name ?? guide.id.toTitleCase(true)),
            E("p").text(guide.description)
          ),
          E("div").addClass("images").append(
            E("img").addClass("image").attr("src", `/assets/images/guides/${guide.id}/thumbnail.webp`),
            guide.optifine ? E("img").addClass("optifine").attr("src", "/assets/images/logo/optifine.webp") : undefined
          )
        ).appendTo(section)
      }
    })
    $("a").removeClass("selected")
    $('[href="/guides"]').addClass("selected")
  }

  static tag = "guides-page"
  static title = "Guides - Ewan Howell"
  static description = "Guides to help you create resource packs"
}