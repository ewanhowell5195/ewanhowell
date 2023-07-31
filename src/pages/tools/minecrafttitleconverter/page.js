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
        const aspect = img.width / img.height
        let w, h
        if (img.width > 1024 || img.height > 1024) {
          if (aspect > 1) {
            w = 1024
            h = Math.floor(1024 / aspect)
          } else {
            h = 1024
            w = Math.floor(1024 * aspect)
          }
        } else if (img.width < 64 || img.height < 64) {
          if (aspect > 1) {
            w = 64
            h = Math.floor(64 / aspect)
          } else {
            h = 64
            w = Math.floor(64 * aspect)
          }
        } else {
          w = img.width
          h = img.height
        }
        const canvas = new Canvas(w, h, true, 1024)
        const ctx = canvas.getContext("2d")
        if (img.width < 64 || img.height < 64) ctx.imageSmoothingEnabled = false
        ctx.drawImage(img, 0, 0, w, h)
        canvas.trim()
        const base = await loadImage("data:image/png;base64,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")
        let oldPreCanvas
        if (canvas.width / canvas.height < 137 / 22) {
          oldPreCanvas = new Canvas(Math.floor((canvas.height / 22) * 137), canvas.height)
          oldPreCanvas.getContext("2d").drawImage(canvas, Math.floor((oldPreCanvas.width - canvas.width) / 2), 0)
        } else if (canvas.width / canvas.height > 137 / 22) {
          oldPreCanvas = new Canvas(canvas.width, Math.floor((canvas.width / 137) * 22))
          oldPreCanvas.getContext("2d").drawImage(canvas, 0, Math.floor((oldPreCanvas.height - canvas.height) / 2))
        } else oldPreCanvas = canvas
        const oldCanvas = new Canvas(Math.floor((oldPreCanvas.width / 137) * 128), Math.floor((oldPreCanvas.width / 137) * 128), true, 1024)
        const oldCtx = oldCanvas.getContext("2d")
        oldCtx.imageSmoothingEnabled = false
        oldCtx.drawImage(base, 0, 0, oldCanvas.width, oldCanvas.height)
        const width = Math.floor((oldPreCanvas.width / 274) * 155)
        oldCtx.drawImage(oldPreCanvas, 0, 0, width, oldPreCanvas.height, 0, 0, width, oldPreCanvas.height)
        oldCtx.drawImage(oldPreCanvas, width, 0, oldPreCanvas.width - width, oldPreCanvas.height, 0, Math.floor(oldPreCanvas.height / 44 * 45), oldPreCanvas.width - width, oldPreCanvas.height)
        const downloadIcon = $("#download-icon").contents()
        output.append(
          E("h2").text("Input image"),
          canvas,
          E("div").attr("id", "generated").append(
            E("div").addClass("output-container").append(
              E("div").append(
                E("h2").text("minecraft.png"),
                E("p").text("This texture is used in 1.20 and newer versions."),
                E("div").addClass("button-download").append(
                  downloadIcon.clone(true),
                  E("span").text("Download")
                ).on("click", e => newCanvas.saveAs("minecraft.png"))
              ),
              E("div").addClass("canvas-container").append(newConvert(canvas))
            ),
            E("div").addClass("output-container").append(
              E("div").append(
                E("h2").text("minecraft.png"),
                E("p").text("This texture is used in 1.19 and older versions."),
                E("div").addClass("button-download").append(
                  downloadIcon.clone(true),
                  E("span").text("Download")
                ).on("click", e => oldCanvas.saveAs("minecraft.png"))
              ),
              E("div").addClass("canvas-container").append(oldCanvas)
            )
          )
        )
        if (img.width === img.height) {
          const m = img.width / 256
          const w = Math.floor(m * 155)
          const w2 = Math.floor(m * 119)
          const h = Math.floor(m * 44)
          const h2 = Math.floor(m * 45)
          const convertCanvas = new Canvas(w + w2, h, true, 1024)
          const ctx = convertCanvas.getContext("2d")
          ctx.drawImage(img, 0, 0, w, h, 0, 0, w, h)
          ctx.drawImage(img, 0, h2, w2, h, w, 0, w2, h)
          output.append(
            E("div").addClass("output-container").append(
              E("div").append(
                E("h2").text("minecraft.png"),
                E("p").text("The 1.19 format converted into the 1.20 format."),
                E("div").addClass("button-download").append(
                  downloadIcon.clone(true),
                  E("span").text("Download")
                ).on("click", e => oldCanvas.saveAs("minecraft.png"))
              ),
              E("div").addClass("canvas-container").append(newConvert(convertCanvas))
            )
          )
        }
      })
    })
    $("a").removeClass("selected")
  }

  static tag = "minecrafttitleconverter-page"
  static title = "Minecraft Title Converter - Ewan Howell"
  static description = "Convert any image into the Minecraft title texture format so you can use it in a resource pack"
  static image = "minecraft/minecrafttitle.webp"
  static colour = "#3B8426"
}

function newConvert(img) {
  const input = new Canvas(img.width, img.height)
  input.getContext("2d").drawImage(img, 0, 0)
  input.trim()
  const canvas = new Canvas(1024, 256, true)
  const ctx = canvas.getContext("2d")
  const scaleFactor = Math.min(1024 / input.width, 176 / input.height)
  const newWidth = input.width * scaleFactor
  const newHeight = input.height * scaleFactor
  const x = (1024 - newWidth) / 2
  const y = (176 - newHeight) / 2
  if (newWidth > input.width) ctx.imageSmoothingEnabled = false
  ctx.drawImage(input, x, y, newWidth, newHeight)
  return canvas
}