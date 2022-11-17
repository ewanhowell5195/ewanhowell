import { popupImage } from "/js/popupImage.js"
import { Page } from "/js/libs/pages.js"

export function entryPageClass(page, type) {
  return class extends Page {
    constructor() {
      super(page, false)
      $("a").removeClass("selected")
      $(`[href="/${type}"]`).addClass("selected")
    }
    async setData(args) {
      await this.ready
      let data
      try {
        data = await fetch(`/assets/json/${type}/${args[page]}.json`).then(e => e.json())
      } catch {
        return
      }
      const entryName = window[type].entries[args[page]].name ?? args[page].replace(/-/g, " ").toTitleCase()
      jQuery('link[rel="icon"][sizes="16x16"]').attr("href", `/assets/images/${type}/${args[page]}/icon.webp`)
      jQuery('link[rel="icon"][sizes="32x32"]').attr("href", `/assets/images/${type}/${args[page]}/icon.webp`)
      jQuery("title").text(`${entryName} - ${data.author ?? "Ewan Howell"}`)
      const $ = this.$
      const linkIcon = $("#link-icon").contents()
      const localIcon = $("#local-icon").contents()
      const closeIcon = $("#close-icon").contents()
      const downloadIcon = $("#download-icon").contents()
      $("#banner-background").css("background-image", `url("/assets/images/${window[type].entries[args[page]].image ? `${type}/${args[page]}/images/${window[type].entries[args[page]].image}` : "/home/logo_3d"}.webp")`)
      if (window[type].entries[args[page]].logoless) $("#banner-content").prepend(
        E("div").attr("id", "logo").text(entryName)
      )
      else $("#banner-content").prepend(
       E("img").attr({
          id: "logo",
          src: `/assets/images/${type}/${args[page]}/logo.webp`
       })
      )
      $("#back-button").attr("href",`/${type}`)
      if (window[type].entries[args[page]].optifine) {
        $("#optifine").removeClass("hidden")
        if (window[type].entries[args[page]].optifine === 1) $("#optional").removeClass("hidden")
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
                E("div").attr("id", "popup-optifine-text").html(`OptiFine is a mod that adds a lot of extra resource pack related features to Minecraft.\n\nSome resource packs may be enhanced by OptiFine, or completely rely on it to function correctly.\n<h3>${entryName} OptiFine requirement: </h3>${window[type].entries[args[page]].optifine === 1 ? "Optional" : "Required"}${data.optifine ? `\n<h3>${entryName} specific information:</h3>${data.optifine}` : ""}`),
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
      $("#title").text(entryName)
      $("#subtitle").text(data.subtitle)
      $("#description").html(data.description)
      const images = $("#image-container")
      const imageRow = $("#thumbnail-row")
      let offset = 0
      if (data.video) {
        offset++
        images.prepend(
          E("div").addClass("video-container showcase-image").attr("id", "image-0").append(
            E("iframe").attr({
              "src": `https://www.youtube.com/embed/${data.video}?rel=0`,
              frameborder: 0,
              allow: "picture-in-picture",
              allowfullscreen: true,
              width: "100%",
              height: "100%"
            })
          )
        )
        imageRow.append(E("div").attr("id", "thumbnail-0").addClass("thumbnail-image").css("background-image", `url("https://img.youtube.com/vi/${data.video.split("?")[0]}/maxresdefault.jpg")`).on("click", e => {
          img = 0
          showImage()
        }))
      }
      if (data.images) {
        for (const [i, image] of data.images.entries()) {
          images.prepend(E("img").attr({
            id: `image-${i + offset}`,
            src: `/assets/images/${type}/${args[page]}/images/${image}.webp`
          }).addClass("showcase-image").on("click", e => {
            popupImage(`/assets/images/${type}/${args[page]}/images/${image}.webp`)
          }))
          imageRow.append(E("div").attr("id", `thumbnail-${i + offset}`).addClass("thumbnail-image").css("background-image", `url("/assets/images/${type}/${args[page]}/images/${image}.webp")`).on("click", e => {
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
        if (data.images.length === 1) imageRow.addClass("hidden")
      }
      $("#entry-links-tabs div").on("click", e => {
        $("#entry-links-tabs .selected").removeClass("selected")
        $(e.target).addClass("selected")
        $("#downloads .selected").removeClass("selected")
        $(`#${e.target.getAttribute("id").match(/.+(?=-)/)}`).addClass("selected")
      })
      if (data.downloads) {
        $("#downloads").removeClass("hidden")
        const main = $("#main")
        const mirrors = $("#mirrors")
        for (const link of data.downloads) {
          main.append(E("a").addClass("download-button").attr({
            href: link.link,
            target: "_blank"
          }).append(
            downloadIcon.clone(true),
            E("span").text(link.text)
          ))
          if (link.mirror) mirrors.append(E("a").addClass("download-button mirror").attr({
            href: link.mirror,
            target: "_blank"
          }).append(
            linkIcon.clone(true),
            E("span").text(link.text)
          ))
        }
      } else {
        $("#entry-links-tabs").css("display", "none")
        $("#entry-links-contents").css("height", "calc(100% - 60px)")
        $("#links>h3").text("Links")
      }
      if (data.links) {
        const links = $("#links").removeClass("hidden").find("div")
        for (const link of data.links) {
          if (link.type === "entry") links.append(E("a", {is: "f-a"}).attr("href", `/${type}/${link.name}`).append(
            localIcon.clone(true),
            E("span").text(link.text)
          ))
          else {
            const linkElement = E("a").attr({
              href: link.link,
              target: "_blank"
            }).appendTo(links)
            if (link.icon) linkElement.append(E("img").attr("src", `../assets/images/svg/${link.icon}.svg`))
            else linkElement.append(linkIcon.clone(true))
            linkElement.append( E("span").text(link.text))
          }
        }
      }
      const categoryName = window[type].versions.map(e => e.categories.find(e => e.entries.includes(args[page]))).find(e => e?.name)?.name
      if (categoryName) $("#category-name").text(categoryName)
    }
  }
}