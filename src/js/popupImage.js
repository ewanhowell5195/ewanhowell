export function popupImage() {
  const root = document.querySelector(".page").shadowRoot
  root.addEventListener("click", e => {
    if (e.target.classList.contains("popupable")) {
      let img
      let element = e.target
      const popup = E("div").addClass("popup").append(
        E("div").addClass("popup-container").append(
          img = E("img").addClass("popup-image"),
          E("img").attr("src", "/../assets/images/svg/close.svg").addClass("popup-image-close").on("click", e => {
            popup.remove()
          }),
          E("img").attr("src", "/../assets/images/svg/arrow_left.svg").addClass("popup-image-prev").on("click", e => {
            const all = Array.from(root.querySelectorAll(".popupable"))
            element = all[all.indexOf(element) - 1]
            loadImage(root, img, element)
          }),
          E("img").attr("src", "/../assets/images/svg/arrow_right.svg").addClass("popup-image-next").on("click", e => {
            const all = Array.from(root.querySelectorAll(".popupable"))
            element = all[all.indexOf(element) + 1]
            loadImage(root, img, element)
          })
        )
      ).on("click", e => {
        if (e.target.classList[0] === "popup") {
          popup.remove()
        }
      }).appendTo(document.body)
      loadImage(root, img, element)
    }
  })
}

function loadImage(root, img, element) {
  let url
  if (element instanceof HTMLCanvasElement) url = element.toDataURL()
  else url = element.getAttribute("src")
  let width = element.getAttribute("scale")
  if (!width) width = "initial"
  img.attr("src", url).css("width", width)
  const all = Array.from(root.querySelectorAll(".popupable"))
  const index = all.indexOf(element)
  if (index === 0) img.parent().find(".popup-image-prev").addClass("hidden")
  else img.parent().find(".popup-image-prev").removeClass("hidden")
  if (index + 1 === all.length) img.parent().find(".popup-image-next").addClass("hidden")
  else img.parent().find(".popup-image-next").removeClass("hidden")
}