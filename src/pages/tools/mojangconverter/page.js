import { Canvas, loadImage } from "../../../js/libs/canvas.js"
import "../../../js/components/file-input.js"

export default class MojangConverterPage extends Page {
  constructor() {
    super("tools/mojangconverter", true, $ => {
      const output = $("#output")
      $("file-input").on("change", async e => {
        output.empty()
        const file = e.currentTarget.files.filter(e => e.type === "image/png")[0]
        if (!file) return output.text("Please provide a PNG file")
        const image = await loadImage(file)
        const img = new Canvas(image.width, image.height)
        img.getContext("2d").drawImage(image, 0, 0)
        const size = Math.max(img.width, img.height)
        const canvas = new Canvas(size, size, true, 1024)
        canvas.getContext("2d").drawImage(img, -img.width / 2 + size / 2, -img.height / 2 + size / 2)
        canvas.trim()
        output.append(
          E("h2").text("Input image"),
          canvas,
          E("p").text("Only one of the following outputs will be correct, depending on if the input image was in the 1.15 or 1.14 format.")
        )
        const oldCanvas = new Canvas(img.width * 2, Math.floor(img.width / 2))
        const oldCanvasCtx = oldCanvas.getContext("2d")
        oldCanvasCtx.drawImage(img, 0, 0, img.width, Math.floor(img.width / 2), 0, 0, img.width, Math.floor(img.width / 2))
        oldCanvasCtx.drawImage(img, 0, Math.floor(img.width / 2), img.width, Math.floor(img.width / 2), img.width, 0, img.width, Math.floor(img.width / 2))
        oldCanvas.trim()
        const oldCanvasOutput = new Canvas(oldCanvas.width, oldCanvas.width, true, 1024)
        oldCanvasOutput.getContext("2d").drawImage(oldCanvas, 0, Math.floor((oldCanvas.width - oldCanvas.height) / 2))
        img.trim()
        let newCanvas
        if (img.width < img.height * 4) {
          newCanvas = new Canvas(img.height * 4 + 8, img.height + 2)
          newCanvas.getContext("2d").drawImage(img, Math.floor((img.height * 4 - img.width) / 2) + 4, 1)
        } else if (img.width > img.height * 4) {
          newCanvas = new Canvas(img.width + 8, Math.floor(img.width / 4) + 2)
          newCanvas.getContext("2d").drawImage(img, 4, Math.floor((newCanvas.height - img.height) / 2))
        } else {
          newCanvas = new Canvas(img.width + 8, img.height + 4)
          newCanvas.getContext("2d").drawImage(img, 4, 1)
        }
        const newCanvasOutput = new Canvas(Math.floor(newCanvas.width / 2), Math.floor(newCanvas.width / 2), true, 1024)
        const newCanvasOutputCtx = newCanvasOutput.getContext("2d")
        newCanvasOutputCtx.drawImage(newCanvas, 0, 0)
        newCanvasOutputCtx.drawImage(newCanvas, Math.floor(-newCanvas.width / 2), Math.floor(newCanvas.width / 4))
        const downloadIcon = $("#download-icon").contents()
        output.append(
          E("div").attr("id", "generated").append(
            E("div").addClass("output-container").append(
              E("div").append(
                E("h2").text("mojangstudios.png"),
                E("p").text("This texture is used in 1.16 and newer versions."),
                E("div").addClass("button-download").append(
                  downloadIcon.clone(true),
                  E("span").text("Download")
                ).on("click", e => newCanvasOutput.saveAs("mojangstudios.png"))
              ),
              newCanvasOutput
            ),
            E("div").addClass("output-container").append(
              E("div").append(
                E("h2").text("mojang.png"),
                E("p").text("This texture is used in 1.15 and older versions."),
                E("div").addClass("button-download").append(
                  downloadIcon.clone(true),
                  E("span").text("Download")
                ).on("click", e => oldCanvasOutput.saveAs("mojang.png"))
              ),
              oldCanvasOutput
            )
          )
        )
      })
    })
    $("a").removeClass("selected")
  }

  static tag = "mojangconverter-page"
  static title = "Mojang Converter - Ewan Howell"
  static description = "Convert the Mojang Studios logo texture between the 1.15 and 1.16 formats"
  static image = "minecraft/mojangstudios.webp"
  static colour = "#E12837"
}