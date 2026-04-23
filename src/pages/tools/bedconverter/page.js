import { Canvas, loadImage } from "/js/libs/canvas.js"
import "/js/components/file-input.js"
import "/js/libs/FileSaver.js"
import "/js/libs/jszip.js"

const MATRIX = {
  raw:    (dx, dy, sw, sh, m) => [ 1, 0,  0,  1,  dx        * m,  dy        * m],
  hflip:  (dx, dy, sw, sh, m) => [-1, 0,  0,  1, (dx + sw)  * m,  dy        * m],
  vflip:  (dx, dy, sw, sh, m) => [ 1, 0,  0, -1,  dx        * m, (dy + sh)  * m],
  rot180: (dx, dy, sw, sh, m) => [-1, 0,  0, -1, (dx + sw)  * m, (dy + sh)  * m],
  rotCW:  (dx, dy, sw, sh, m) => [ 0, 1, -1,  0, (dx + sh)  * m,  dy        * m],
  rotCCW: (dx, dy, sw, sh, m) => [ 0,-1,  1,  0,  dx        * m, (dy + sw)  * m],
  transp: (dx, dy, sw, sh, m) => [ 0, 1,  1,  0,  dx        * m,  dy        * m],
  antitr: (dx, dy, sw, sh, m) => [ 0,-1, -1,  0, (dx + sh)  * m, (dy + sw)  * m]
}

const FACES = {
  "bed_down":       [["rot180", 28,  6, 16, 16,  0,  0]],
  "bed_head_up":    [["raw",     6,  6, 16, 16,  0,  0]],
  "bed_foot_up":    [["raw",     6, 28, 16, 16,  0,  0]],
  "bed_head_north": [
    ["rot180",  6,  0, 16,  6,  0,  7],
    ["raw",    53, 21,  3,  3,  0, 13],
    ["raw",    56, 21,  3,  3,  3, 13],
    ["raw",    59,  9,  3,  3, 10, 13],
    ["raw",    50,  9,  3,  3, 13, 13]
  ],
  "bed_foot_south": [
    ["vflip",  22, 22, 16,  6,  0,  7],
    ["raw",    53,  3,  3,  3,  0, 13],
    ["raw",    56,  3,  3,  3,  3, 13],
    ["raw",    59, 15,  3,  3, 10, 13],
    ["raw",    50, 15,  3,  3, 13, 13]
  ],
  "bed_head_east":  [
    ["rotCW",  22,  6,  6, 16,  0,  7],
    ["hflip",  56, 18,  3,  3,  7, 13],
    ["raw",    59, 21,  3,  3, 10, 13],
    ["raw",    50, 21,  3,  3, 13, 13]
  ],
  "bed_head_west":  [
    ["rotCCW",  0,  6,  6, 16,  0,  7],
    ["raw",    53,  9,  3,  3,  0, 13],
    ["raw",    56,  9,  3,  3,  3, 13],
    ["antitr", 56,  6,  3,  3,  6, 13]
  ],
  "bed_foot_east":  [
    ["rotCW",  22, 28,  6, 16,  0,  7],
    ["raw",    53, 15,  3,  3,  0, 13],
    ["raw",    56, 15,  3,  3,  3, 13],
    ["transp", 56, 12,  3,  3,  6, 13]
  ],
  "bed_foot_west":  [
    ["rotCCW",  0, 28,  6, 16,  0,  7],
    ["vflip",  56,  0,  3,  3,  7, 13],
    ["raw",    59,  3,  3,  3, 10, 13],
    ["raw",    50,  3,  3,  3, 13, 13]
  ]
}

function convertBed(image) {
  const m = image.width / 64
  const faces = []
  for (const [faceName, ops] of Object.entries(FACES)) {
    const canvas = new Canvas(16 * m, 16 * m, true, 1024)
    const ctx = canvas.getContext("2d")
    ctx.imageSmoothingEnabled = false
    for (const [tname, sx, sy, sw, sh, dx, dy] of ops) {
      const [a, b, c, d, e, f] = MATRIX[tname](dx, dy, sw, sh, m)
      ctx.save()
      ctx.setTransform(a, b, c, d, e, f)
      ctx.drawImage(image, sx * m, sy * m, sw * m, sh * m, 0, 0, sw * m, sh * m)
      ctx.restore()
    }
    faces.push({ name: faceName, canvas })
  }
  return faces
}

function stripExt(name) {
  return name.replace(/\.[^.]+$/, "")
}

function baseName(path) {
  return stripExt(path.split(/[\\/]/).pop())
}

async function blobFromCanvas(canvas) {
  return new Promise(fulfil => canvas.toBlob(fulfil))
}

export default class BedConverterPage extends Page {
  constructor() {
    super("tools/bedconverter", true, $ => {
      const downloadIcon = $("#download-icon").contents()
      const output = $("#output")

      $("file-input").on("change", async e => {
        output.empty()
        const files = e.currentTarget.files
        if (!files.length) return output.text("Please provide a PNG or ZIP file")
        const file = files[0]
        const isZip = /\.zip$/i.test(file.name) || file.type === "application/zip" || file.type === "application/x-zip-compressed"
        const isPng = /\.png$/i.test(file.name) || file.type === "image/png"

        if (!isZip && !isPng) return output.text("Please provide a PNG or ZIP file")

        output.append(E("div").text("Processing..."))

        const sources = []
        try {
          if (isZip) {
            const zip = await JSZip.loadAsync(file)
            const entries = Object.values(zip.files).filter(f => !f.dir && /\.png$/i.test(f.name))
            if (!entries.length) {
              output.empty()
              return output.text("The ZIP does not contain any PNG files.")
            }
            for (const entry of entries) {
              const blob = await entry.async("blob")
              const image = await loadImage(blob)
              sources.push({ name: baseName(entry.name), image })
            }
          } else {
            const image = await loadImage(file)
            sources.push({ name: baseName(file.name), image })
          }
        } catch (err) {
          output.empty()
          return output.text(`Failed to read input: ${err.message || err}`)
        }

        const results = []
        const errors = []
        for (const source of sources) {
          const { image, name } = source
          if (image.width !== image.height) {
            errors.push(`${name}.png — not square (${image.width}×${image.height})`)
            continue
          }
          if (Math.log2(image.width) % 1 !== 0 || image.width < 64) {
            errors.push(`${name}.png — must be a square power of 2, at least 64×64`)
            continue
          }
          results.push({ name, faces: convertBed(image) })
        }

        output.empty()

        if (errors.length) {
          const errorBox = E("div").addClass("errors").appendTo(output)
          errorBox.append(E("h2").text(`Skipped ${errors.length} invalid texture${errors.length === 1 ? "" : "s"}`))
          const list = E("ul").appendTo(errorBox)
          for (const err of errors) list.append(E("li").text(err))
        }

        if (!results.length) {
          if (!errors.length) output.text("No valid textures to convert.")
          return
        }

        const zipName = isZip ? `${stripExt(file.name)}_beds.zip` : `${results[0].name}_bed.zip`

        output.append(
          E("div").addClass("button-download download-all").append(
            downloadIcon.clone(true),
            E("span").text(`Download ${isZip ? "All " : ""}(ZIP)`)
          ).on("click", async () => {
            const out = new JSZip()
            for (const { name, faces } of results) {
              const folder = isZip ? `${name}_bed/` : ""
              for (const face of faces) {
                out.file(`${folder}${name}_${face.name}.png`, await blobFromCanvas(face.canvas))
              }
            }
            const content = await out.generateAsync({ type: "blob" })
            saveAs(content, zipName)
          })
        )

        for (const { name, faces } of results) {
          const group = E("div").addClass("bed-group").appendTo(output)
          group.append(E("h2").text(`${name}_bed`))
          const grid = E("div").addClass("bed-faces").appendTo(group)
          for (const face of faces) {
            const filename = `${name}_${face.name}.png`
            E("div").addClass("bed-face").append(
              E("h3").text(filename),
              face.canvas,
              E("div").addClass("button-download").append(
                downloadIcon.clone(true),
                E("span").text("Download")
              ).on("click", () => face.canvas.saveAs(filename))
            ).appendTo(grid)
          }
        }
      })
    })
    $("a").removeClass("selected")
  }

  static tag = "bedconverter-page"
  static title = "Bed Converter - Ewan Howell"
  static description = "Convert Minecraft bed entity textures to the 26.2 block format"
  static image = "minecraft/beds.webp"
  static colour = "#AE3535"
}
