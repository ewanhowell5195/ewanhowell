import { Canvas, loadImage } from "/js/libs/canvas.js"
import "/js/components/file-input.js"

export default class ChestConverterPage extends Page {
  constructor() {
    super("tools/chestconverter", true, $ => {
      const arrowLeft = $("#arrow-left").contents()
      const arrowRight = $("#arrow-right").contents()
      const output = $("#output")
      $("file-input").on("change", async e => {
        output.empty()
        const files = e.currentTarget.files.filter(e => e.type === "image/png")
        if (!files.length) return output.text("Please provide up to 2 PNG files")
        const images = []
        for (let i = 0; i < files.length; i++) {
          const image = await loadImage(files[i])
          if (files.length === 1) {
            if (!(image.width === image.height || image.width === image.height * 2)) return output.text("bruh")
          } else {
            if (image.width !== image.height) return output.text("Both double chest textures must be square.")
            if (i === 1 && image.width !== images[0].width) return output.text("Both double chest textures must be the same size.")
          }
          if (Math.log2(image.width) % 1 !== 0 || Math.log2(image.height) % 1 !== 0) return output.text(`Chest textures must be a power of 2 in size.`)
          const canvas = new Canvas(image.width, image.height, true, 1024)
          canvas.getContext("2d").drawImage(image, 0, 0)
          images.push(canvas)
        }
        output.append(E("h2").text(`Input image${images.length === 1 ? "" : "s"}`))
        if (images.length === 1) {
          const tiles = E("div").addClass("chest-textures").appendTo(output)
          tiles.append(E("div").append(images[0]))
        } else {
          output.append(E("div").text("Reorder the textures below to put the left chest texture on the left side."))
          const tiles = E("div").addClass("chest-textures double").appendTo(output)
          for (const image of images) {
            const chest = E("div").append(
              E("div").addClass("chest-buttons").append(
                arrowLeft.clone(true).on("click", e => {
                  chest.insertBefore(chest.prev())
                  convertChests($)
                }),
                arrowRight.clone(true).on("click", e => {
                  chest.insertAfter(chest.next())
                  convertChests($)
                })
              ),
              image
            ).appendTo(tiles)
          }
        }
        output.append(E("div").attr("id", "generated"))
        convertChests($)
      })
    })
    $("a").removeClass("selected")
  }

  static tag = "chestconverter-page"
  static title = "Chest Converter - Ewan Howell"
  static description = "ferwhuofwegioufw"
}

const drawFlipped = (ctx, m, img, x, y, w, h, x2, y2) => ctx.drawImage(img, Math.floor(x * m), Math.floor(y * m), Math.floor(w * m), Math.floor(h * m), Math.floor(x2 * m), Math.floor(ctx.canvas.height - (y2 + h) * m), Math.floor(w * m), Math.floor(h * m))
const drawRotated = (ctx, m, img, x, y, w, h, x2, y2) => ctx.drawImage(img, Math.floor(x * m), Math.floor(y * m), Math.floor(w * m), Math.floor(h * m), Math.floor(ctx.canvas.width - (x2 + w) * m), Math.floor(ctx.canvas.height - (y2 + h) * m), Math.floor(w * m), Math.floor(h * m))
const torad = deg => deg * Math.PI / 180

async function convertChests($) {
  const downloadIcon = $("#download-icon").contents()
  const images = $(".chest-textures > div > canvas")
  const output = $("#generated").empty()
  if (images.length === 1) {
    if (images[0].width === images[0].height) {
      const m = images[0].width / 64
      const canvas = new Canvas(images[0].width, images[0].height, true, 1024)
      const ctx = canvas.getContext("2d")
      ctx.save()
      ctx.scale(1, -1)
      ctx.translate(0, -canvas.height)
      drawFlipped(ctx, m, images[0], 14, 0, 14, 14, 28, 0)
      drawFlipped(ctx, m, images[0], 28, 0, 14, 14, 14, 0)
      drawFlipped(ctx, m, images[0], 14, 19, 14, 14, 28, 19)
      drawFlipped(ctx, m, images[0], 28, 19, 14, 14, 14, 19)
      drawFlipped(ctx, m, images[0], 1, 0, 2, 1, 3, 0)
      drawFlipped(ctx, m, images[0], 3, 0, 2, 1, 1, 0)
      ctx.restore()
      ctx.rotate(torad(180))
      ctx.translate(-canvas.width, -canvas.height)
      drawRotated(ctx, m, images[0], 14, 14, 42, 5, 14, 14)
      drawRotated(ctx, m, images[0], 0, 14, 14, 5, 0, 14)
      drawRotated(ctx, m, images[0], 14, 33, 42, 10, 14, 33)
      drawRotated(ctx, m, images[0], 0, 33, 14, 10, 0, 33)
      drawRotated(ctx, m, images[0], 1, 1, 5, 4, 1, 1)
      drawRotated(ctx, m, images[0], 0, 1, 1, 4, 0, 1)
      output.append(
        E("div").addClass("output-container").append(
          E("div").append(
            E("h2").text("normal.png"),
            E("p").html("The single chest texture."),
            E("p").text("This is in the opposite format to whatever the input format was."),
            E("div").addClass("button-download").append(
              downloadIcon.clone(true),
              E("span").text("Download")
            ).on("click", e => canvas.saveAs("normal.png"))
          ),
          canvas
        )
      )
    } else {
      const m = images[0].width / 128
      const canvasLeft = new Canvas(images[0].height, images[0].height, true, 1024)
      const left = canvasLeft.getContext("2d")
      left.save()
      left.scale(1, -1)
      left.translate(0, -canvasLeft.height)
      drawFlipped(left, m, images[0], 59, 0, 15, 14, 14, 0)
      drawFlipped(left, m, images[0], 29, 0, 15, 14, 29, 0)
      drawFlipped(left, m, images[0], 59, 19, 15, 14, 14, 19)
      drawFlipped(left, m, images[0], 29, 19, 15, 14, 29, 19)
      drawFlipped(left, m, images[0], 4, 0, 1, 1, 1, 0)
      drawFlipped(left, m, images[0], 2, 0, 1, 1, 2, 0)
      left.restore()
      left.rotate(torad(180))
      left.translate(-canvasLeft.width, -canvasLeft.height)
      drawRotated(left, m, images[0], 29, 14, 44, 5, 14, 14)
      drawRotated(left, m, images[0], 29, 33, 44, 10, 14, 33)
      drawRotated(left, m, images[0], 2, 1, 3, 4, 1, 1)
      const canvasRight = new Canvas(images[0].height, images[0].height, true, 1024)
      const right = canvasRight.getContext("2d")
      right.save()
      right.scale(1, -1)
      right.translate(0, -canvasRight.height)
      drawFlipped(right, m, images[0], 44, 0, 15, 14, 14, 0)
      drawFlipped(right, m, images[0], 14, 0, 15, 14, 29, 0)
      drawFlipped(right, m, images[0], 44, 19, 15, 14, 14, 19)
      drawFlipped(right, m, images[0], 14, 19, 15, 14, 29, 19)
      drawFlipped(right, m, images[0], 3, 0, 1, 1, 1, 0)
      drawFlipped(right, m, images[0], 1, 0, 1, 1, 2, 0)
      right.restore()
      right.rotate(torad(180))
      right.translate(-canvasRight.width, -canvasRight.height)
      drawRotated(right, m, images[0], 0, 14, 14, 5, 0, 14)
      drawRotated(right, m, images[0], 73, 14, 15, 5, 14, 14)
      drawRotated(right, m, images[0], 14, 14, 15, 5, 43, 14)
      drawRotated(right, m, images[0], 0, 33, 14, 10, 0, 33)
      drawRotated(right, m, images[0], 73, 33, 15, 10, 14, 33)
      drawRotated(right, m, images[0], 14, 33, 15, 10, 43, 33)
      drawRotated(right, m, images[0], 0, 1, 1, 4, 0, 1)
      drawRotated(right, m, images[0], 5, 1, 1, 4, 1, 1)
      drawRotated(right, m, images[0], 1, 1, 1, 4, 3, 1)
      output.append(
        E("div").addClass("output-container").append(
          E("div").append(
            E("h2").text("normal_left.png"),
            E("p").text("The left side of the large chest texture for 1.15 and above."),
            E("div").addClass("button-download").append(
              downloadIcon.clone(true),
              E("span").text("Download")
            ).on("click", e => canvasLeft.saveAs("normal_left.png"))
          ),
          canvasLeft
        ),
        E("div").addClass("output-container").append(
          E("div").append(
            E("h2").text("normal_right.png"),
            E("p").text("The right side of the large chest texture for 1.15 and above."),
            E("div").addClass("button-download").append(
              downloadIcon.clone(true),
              E("span").text("Download")
            ).on("click", e => canvasRight.saveAs("normal_right.png"))
          ),
          canvasRight
        )
      )
    }
  } else {
    const m = images[0].width / 64
    const canvas = new Canvas(images[0].width * 2, images[0].height, true, 1024).addClass("large")
    const ctx = canvas.getContext("2d")
    ctx.save()
    ctx.scale(1, -1)
    ctx.translate(0, -canvas.height)
    drawFlipped(ctx, m, images[0], 14, 0, 15, 14, 59, 0)
    drawFlipped(ctx, m, images[1], 14, 0, 15, 14, 44, 0)
    drawFlipped(ctx, m, images[0], 29, 0, 15, 14, 29, 0)
    drawFlipped(ctx, m, images[1], 29, 0, 15, 14, 14, 0)
    drawFlipped(ctx, m, images[0], 14, 19, 15, 14, 59, 19)
    drawFlipped(ctx, m, images[1], 14, 19, 15, 14, 44, 19)
    drawFlipped(ctx, m, images[0], 29, 19, 15, 14, 29, 19)
    drawFlipped(ctx, m, images[1], 29, 19, 15, 14, 14, 19)
    drawFlipped(ctx, m, images[0], 1, 0, 1, 1, 4, 0)
    drawFlipped(ctx, m, images[1], 1, 0, 1, 1, 3, 0)
    drawFlipped(ctx, m, images[0], 2, 0, 1, 1, 2, 0)
    drawFlipped(ctx, m, images[1], 2, 0, 1, 1, 1, 0)
    ctx.restore()
    ctx.rotate(torad(180))
    ctx.translate(-canvas.width, -canvas.height)
    drawRotated(ctx, m, images[0], 14, 14, 44, 5, 29, 14)
    drawRotated(ctx, m, images[1], 0, 14, 14, 5, 0, 14)
    drawRotated(ctx, m, images[1], 14, 14, 15, 5, 73, 14)
    drawRotated(ctx, m, images[1], 43, 14, 15, 5, 14, 14)
    drawRotated(ctx, m, images[0], 14, 33, 44, 10, 29, 33)
    drawRotated(ctx, m, images[1], 0, 33, 14, 10, 0, 33)
    drawRotated(ctx, m, images[1], 14, 33, 15, 10, 73, 33)
    drawRotated(ctx, m, images[1], 43, 33, 15, 10, 14, 33)
    drawRotated(ctx, m, images[0], 1, 1, 3, 4, 2, 1)
    drawRotated(ctx, m, images[1], 0, 1, 1, 4, 0, 1)
    drawRotated(ctx, m, images[1], 1, 1, 1, 4, 5, 1)
    drawRotated(ctx, m, images[1], 3, 1, 1, 4, 1, 1)
    output.append(
      E("div").addClass("output-container").append(
        E("div").append(
          E("h2").text("normal_large.png"),
          E("p").text("The large chest texture for 1.14 and below."),
          E("div").addClass("button-download").append(
            downloadIcon.clone(true),
            E("span").text("Download")
          ).on("click", e => canvas.saveAs("normal_large.png"))
        ),
        canvas
      )
    )
  }
}