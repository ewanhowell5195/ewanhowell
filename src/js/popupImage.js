export function popupImage(url, width = "initial") {
  if (url instanceof HTMLCanvasElement) url = url.toDataURL()
  const popup = E("div").addClass("popup").append(
    E("div").addClass("popup-container").append(
      E("img").addClass("popup-image").attr("src", url).css("width", width),
      E("img").attr("src", "/../assets/images/svg/close.svg").addClass("popup-image-close").on("click", e => {
        popup.remove()
      })
    )
  ).on("click", e => {
    if (e.target.classList[0] === "popup") {
      popup.remove()
    }
  }).appendTo(document.body)
}