import { Canvas, loadImage } from "/js/libs/canvas.js"
import "/js/components/file-input.js"

export default class MinecraftTitleConverterPage extends Page {
  constructor() {
    super("tools/minecrafttitleconverter", true, $ => {
      const output = $("#output")
      $("file-input").on("change", async e => {
        output.empty()
        const file = e.currentTarget.files.filter(e => e.type === "image/png")[0]
        if (!file) return output.text("Please provide a PNG file")
        const img = await loadImage(file)
        const canvas = new Canvas(img.width, img.height, true, 1024)
        canvas.getContext("2d").drawImage(img, 0, 0)
        canvas.trim()
        output.append(
          E("h2").text("Input image"),
          canvas
        )
        const base = await loadImage("data:image/png;base64,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")
        let convertedCanvas
        if (canvas.width / canvas.height < 137 / 22) {
          convertedCanvas = new Canvas(Math.floor((canvas.height / 22) * 137), canvas.height)
          convertedCanvas.getContext("2d").drawImage(canvas, Math.floor((convertedCanvas.width - canvas.width) / 2), 0)
        } else if (canvas.width / canvas.height > 137 / 22) {
          convertedCanvas = new Canvas(canvas.width, Math.floor((canvas.width / 137) * 22))
          convertedCanvas.getContext("2d").drawImage(canvas, 0, Math.floor((convertedCanvas.height - canvas.height) / 2))
        } else convertedCanvas = canvas
        const outCanvas = new Canvas(Math.floor((convertedCanvas.width / 137) * 128), Math.floor((convertedCanvas.width / 137) * 128), true, 1024)
        const ctx = outCanvas.getContext("2d")
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(base, 0, 0, outCanvas.width, outCanvas.height)
        const width = Math.floor((convertedCanvas.width / 274) * 155)
        ctx.drawImage(convertedCanvas, 0, 0, width, convertedCanvas.height, 0, 0, width, convertedCanvas.height)
        ctx.drawImage(convertedCanvas, width, 0, convertedCanvas.width - width, convertedCanvas.height, 0, Math.floor(convertedCanvas.height / 44 * 45), convertedCanvas.width - width, convertedCanvas.height)
        output.append(
          E("div").addClass("output-container").append(
            E("div").append(
              E("h2").text("minecraft.png"),
              E("p").text("Your converted Minecraft title texture"),
              E("div").addClass("button-download").append(
                $("#download-icon").contents().clone(true),
                E("span").text("Download")
              ).on("click", e => outCanvas.saveAs("minecraft.png"))
            ),
            outCanvas
          )
        )
      })
    })
    $("a").removeClass("selected")
    $('[href="/minecrafttitleconverter"]').addClass("selected")
  }

  static tag = "minecrafttitleconverter-page"
  static title = "Minecraft Title Converter - Ewan Howell"
}

customElements.define(MinecraftTitleConverterPage.tag, MinecraftTitleConverterPage)