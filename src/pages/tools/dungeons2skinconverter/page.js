import "/js/components/file-input.js"
import "/js/libs/FileSaver.js"

const DATA = {"face":[{"U":[8.0029,12.0056],"V":[9.987,11.999],"u":[0.9993,-5.9974],"v":[0.994,-3.9276]},{"U":[12.0056,16.0084],"V":[9.987,11.999],"u":[-0.9993,17.9974],"v":[0.994,-3.9276]},{"U":[8.0029,12.0056],"V":[8.9863,10.9983],"u":[0.9993,22.0026],"v":[0.994,-8.9328]},{"U":[12.0056,16.0084],"V":[8.9863,10.9983],"u":[0.9993,22.0026],"v":[0.994,-8.9328]},{"U":[8.0029,12.0056],"V":[10.9878,12.9997],"u":[0.9993,22.0026],"v":[0.994,-8.9224]},{"U":[12.0056,16.0084],"V":[10.9878,12.9997],"u":[0.9993,22.0026],"v":[0.994,-8.9224]},{"U":[8.0029,12.0056],"V":[9.987,11.999],"u":[0.9993,22.0026],"v":[0.994,-5.9276]},{"U":[12.0056,16.0084],"V":[9.987,11.999],"u":[0.9993,22.0026],"v":[0.994,-5.9276]},{"U":[8.0029,12.0056],"V":[11.9885,14.0005],"u":[0.9993,48.0026],"v":[0.994,-11.9172]},{"U":[12.0056,16.0084],"V":[11.9885,14.0005],"u":[0.9993,48.0026],"v":[0.994,-11.9172]},{"U":[12.9859,13.9861],"V":[11.9994,12.9997],"u":[0.9998,-5.9827],"v":[0.9997,-6.9953]},{"U":[12.9859,13.9861],"V":[10.9987,12.9997],"u":[0.9998,12.0173],"v":[0.9995,-10.9928]},{"U":[12.9859,13.9861],"V":[13.0001,15.0012],"u":[0.9998,12.0173],"v":[0.9995,-10.9932]},{"U":[12.9859,13.9861],"V":[11.9994,14.0005],"u":[0.9998,12.0173],"v":[0.9995,-7.993]},{"U":[12.9859,13.9861],"V":[11.9994,12.9997],"u":[0.9998,12.0173],"v":[0.9997,-5.9953]},{"U":[12.9859,13.9861],"V":[13.0001,14.0005],"u":[0.9998,18.0173],"v":[0.9997,-6.9957]},{"U":[12.9859,13.9861],"V":[14.0009,15.0012],"u":[0.9998,18.0173],"v":[0.9997,-6.9961]},{"U":[10.0252,11.0254],"V":[11.9994,12.9997],"u":[0.9998,-4.0227],"v":[0.9997,-6.9953]},{"U":[10.0252,11.0254],"V":[10.9987,12.9997],"u":[0.9998,13.9773],"v":[0.9995,-10.9928]},{"U":[10.0252,11.0254],"V":[13.0001,15.0012],"u":[0.9998,13.9773],"v":[0.9995,-10.9932]},{"U":[10.0252,11.0254],"V":[11.9994,14.0005],"u":[0.9998,13.9773],"v":[0.9995,-7.993]},{"U":[10.0252,11.0254],"V":[11.9994,12.9997],"u":[0.9998,13.9773],"v":[0.9997,-5.9953]},{"U":[10.0252,11.0254],"V":[13.0001,14.0005],"u":[0.9998,19.9773],"v":[0.9997,-6.9957]},{"U":[10.0252,11.0254],"V":[14.0009,15.0012],"u":[0.9998,19.9773],"v":[0.9997,-6.9961]},{"U":[13.0059,15.0064],"V":[11.9994,12.9997],"u":[-0.9998,21.0027],"v":[0.9997,-5.9953]},{"U":[13.0059,15.0064],"V":[10.9987,12.9997],"u":[0.9998,14.9973],"v":[0.9995,-10.9928]},{"U":[13.0059,15.0064],"V":[13.0001,15.0012],"u":[0.9998,14.9973],"v":[0.9995,-10.9932]},{"U":[13.0059,15.0064],"V":[11.9994,14.0005],"u":[0.9998,14.9973],"v":[0.9995,-7.993]},{"U":[13.0059,15.0064],"V":[11.9994,12.9997],"u":[0.9998,14.9973],"v":[0.9997,-5.9953]},{"U":[13.0059,15.0064],"V":[13.0001,14.0005],"u":[0.9998,20.9973],"v":[0.9997,-6.9957]},{"U":[13.0059,15.0064],"V":[14.0009,15.0012],"u":[0.9998,20.9973],"v":[0.9997,-6.9961]},{"U":[9.0049,11.0054],"V":[11.9994,12.9997],"u":[0.9998,-3.0027],"v":[0.9997,-5.9953]},{"U":[9.0049,11.0054],"V":[10.9987,12.9997],"u":[0.9998,16.9973],"v":[0.9995,-10.9928]},{"U":[9.0049,11.0054],"V":[13.0001,15.0012],"u":[0.9998,16.9973],"v":[0.9995,-10.9932]},{"U":[9.0049,11.0054],"V":[11.9994,14.0005],"u":[0.9998,16.9973],"v":[0.9995,-7.993]},{"U":[9.0049,11.0054],"V":[11.9994,12.9997],"u":[0.9998,16.9973],"v":[0.9997,-5.9953]},{"U":[9.0049,11.0054],"V":[13.0001,14.0005],"u":[0.9998,22.9973],"v":[0.9997,-6.9957]},{"U":[9.0049,11.0054],"V":[14.0009,15.0012],"u":[0.9998,22.9973],"v":[0.9997,-6.9961]},{"U":[11.0054,13.0059],"V":[14.0801,15.0805],"u":[0.9998,-5.0027],"v":[0.9997,-7.0753]},{"U":[11.0054,13.0059],"V":[15.0808,16.0812],"u":[0.9998,12.9973],"v":[0.9997,-8.0756]},{"U":[10.0051,14.0061],"V":[14.0801,15.0805],"u":[0.9998,15.9973],"v":[0.9997,-7.0753]}]}

const OVERLAYS = [
  [16, 32, 24, 16, 16, 16],
  [40, 32, 16, 16, 40, 16],
  [0, 32, 16, 16, 0, 16],
  [0, 48, 16, 16, 16, 48],
  [48, 48, 16, 16, 32, 48]
]

const LEGACY_LIMBS = [
  [[4, 16, 4, 4], [20, 48]], [[8, 16, 4, 4], [24, 48]], [[8, 20, 4, 12], [16, 52]], [[4, 20, 4, 12], [20, 52]], [[0, 20, 4, 12], [24, 52]], [[12, 20, 4, 12], [28, 52]],
  [[44, 16, 4, 4], [36, 48]], [[48, 16, 4, 4], [40, 48]], [[48, 20, 4, 12], [32, 52]], [[44, 20, 4, 12], [36, 52]], [[40, 20, 4, 12], [40, 52]], [[52, 20, 4, 12], [44, 52]]
]

const LEGS = [
  { from: [24, 52, 4, 12], to: [0, 20], flipX: true },
  { from: [16, 52, 4, 12], to: [8, 20], flipX: true },
  { from: [20, 52, 4, 12], to: [4, 20], flipX: true },
  { from: [28, 52, 4, 12], to: [12, 20], flipX: true },
  { from: [24, 48, 4, 4], to: [4, 16], flipX: true, flipY: true },
  { from: [20, 48, 4, 4], to: [8, 16], flipX: true },
  { from: [8, 20, 4, 12], to: [16, 52], flipX: true },
  { from: [0, 20, 4, 12], to: [24, 52], flipX: true },
  { from: [12, 20, 4, 12], to: [28, 52], flipX: true },
  { from: [4, 20, 4, 12], to: [20, 52], flipX: true },
  { from: [8, 16, 4, 4], to: [20, 48], flipX: true, flipY: true },
  { from: [4, 16, 4, 4], to: [24, 48], flipY: true }
]

const MIRRORED_BACKS = [[24, 8, 8, 8], [56, 8, 8, 8]]
const FLIPPED_BOTTOMS = [[16, 0, 8, 8], [48, 0, 8, 8], [28, 16, 8, 4], [47, 16, 3, 4], [39, 48, 3, 4]]
const FACE_PIECE_AREAS = [[24, 0, 16, 8], [56, 0, 8, 8]]
const GROUP_DISTANCE = 40
const DIFFERENT = 60
const MASK_CLIP = 25.5
const MAX_SKIN_SIZE = 1024
const PUPIL_SCALE = 0.74
const PUPIL_PIVOT = 0.61

const EYE_COLUMNS = [[9, 10], [14, 13]]

function separateEyes(u, v, y, height) {
  const rows = Array.from({ length: height }, (_, j) => y + j)
  return {
    rows,
    v,
    eyes: [{ columns: EYE_COLUMNS[0], pupil: u, white: [u + 2, u + 3] }, { columns: EYE_COLUMNS[1], pupil: u + 1, white: [u + 4, u + 5] }],
    pieces: rows.flatMap((row, j) => [[u, v + j, 10, row], [u + 1, v + j, 13, row], [u + 2, v + j, 9, row], [u + 3, v + j, 9, row], [u + 4, v + j, 14, row], [u + 5, v + j, 14, row]]),
    drawn: [rows.flatMap(row => [[9, row], [10, row]]), rows.flatMap(row => [[13, row], [14, row]])]
  }
}

const EYES = [
  { id: "none", label: "Keep as drawn", note: "No eye pieces" },
  { id: "mirrored", label: "1 pixel, 5th row", note: "The game's own, with the eye whites and eyebrows mirrored", rows: [12], pieces: [[6, 6, 9, 12], [7, 6, 9, 12], [6, 5, 10, 12], [7, 5, 13, 12]], drawn: [[[9, 12], [10, 12]], [[13, 12], [14, 12]]] },
  Object.assign({ id: "row5", label: "1 pixel, 5th row", note: "Each eye separate" }, separateEyes(24, 6, 12, 1)),
  Object.assign({ id: "row6", label: "1 pixel, 6th row", note: "Each eye separate" }, separateEyes(30, 6, 13, 1)),
  Object.assign({ id: "row7", label: "1 pixel, 7th row", note: "Each eye separate" }, separateEyes(30, 7, 14, 1)),
  Object.assign({ id: "rows45", label: "2 pixels, 4th and 5th rows", note: "Each eye separate" }, separateEyes(24, 0, 11, 2)),
  Object.assign({ id: "rows56", label: "2 pixels, 5th and 6th rows", note: "Each eye separate" }, separateEyes(24, 4, 12, 2)),
  Object.assign({ id: "rows67", label: "2 pixels, 6th and 7th rows", note: "Each eye separate" }, separateEyes(24, 2, 13, 2))
]

const MOUTHS = [
  { id: "none", label: "Keep as drawn", note: "No mouth piece" },
  { id: "row7", label: "2 wide, 7th row", note: "The game's own", cells: [[11, 14], [12, 14]], pieces: [[6, 7, 11, 14], [7, 7, 12, 14]], drawn: [[[11, 14], [12, 14]]] },
  { id: "row8", label: "2 wide, 8th row", note: "Lowered", cells: [[11, 15], [12, 15]], pieces: [[24, 7, 11, 15], [25, 7, 12, 15]], drawn: [[[11, 15], [12, 15]]] },
  { id: "wide", label: "4 wide, 7th row", note: "Wide", cells: [[10, 14], [11, 14], [12, 14], [13, 14]], pieces: [[26, 7, 10, 14], [27, 7, 11, 14], [28, 7, 12, 14], [29, 7, 13, 14]], drawn: [[[10, 14], [11, 14], [12, 14], [13, 14]]] }
]

function blank(width, height, scale = 1) {
  return { width: width * scale, height: height * scale, scale, rgba: new Uint8ClampedArray(width * height * scale * scale * 4) }
}

function clone(img) {
  return { width: img.width, height: img.height, scale: img.scale, rgba: new Uint8ClampedArray(img.rgba) }
}

function clearRect(img, x, y, w, h) {
  const s = img.scale
  for (let j = 0; j < h * s; j++) img.rgba.fill(0, ((y * s + j) * img.width + x * s) * 4, ((y * s + j) * img.width + (x + w) * s) * 4)
}

function drawImage(src, sx, sy, w, h, dst, dx, dy, { flipX = false, flipY = false, replace = false } = {}) {
  const scale = src.scale
  sx *= scale
  sy *= scale
  w *= scale
  h *= scale
  dx *= scale
  dy *= scale
  for (let j = 0; j < h; j++) {
    const row = (sy + (flipY ? h - 1 - j : j)) * src.width
    if (replace && !flipX) {
      dst.rgba.set(src.rgba.subarray((row + sx) * 4, (row + sx + w) * 4), ((dy + j) * dst.width + dx) * 4)
      continue
    }
    for (let i = 0; i < w; i++) {
      const s = (row + sx + (flipX ? w - 1 - i : i)) * 4
      const d = ((dy + j) * dst.width + dx + i) * 4
      const a = src.rgba[s + 3] / 255
      if (replace || a === 1) {
        dst.rgba[d] = src.rgba[s]
        dst.rgba[d + 1] = src.rgba[s + 1]
        dst.rgba[d + 2] = src.rgba[s + 2]
        dst.rgba[d + 3] = src.rgba[s + 3]
        continue
      }
      if (a === 0) continue
      const b = dst.rgba[d + 3] / 255
      const out = a + b * (1 - a)
      for (let c = 0; c < 3; c++) dst.rgba[d + c] = Math.round((src.rgba[s + c] * a + dst.rgba[d + c] * b * (1 - a)) / out)
      dst.rgba[d + 3] = Math.round(out * 255)
    }
  }
}

function pixel(img, u, v) {
  const i = (Math.floor(v * img.scale) * img.width + Math.floor(u * img.scale)) * 4
  return Array.from(img.rgba.subarray(i, i + 4))
}

function texel(img, x, y) {
  return pixel(img, x + 0.5, y + 0.5)
}

function fillTexel(img, x, y, colour) {
  const s = img.scale
  for (let j = 0; j < s; j++) {
    for (let i = 0; i < s; i++) img.rgba.set(colour, ((y * s + j) * img.width + x * s + i) * 4)
  }
}

function downscale(img, scale) {
  if (img.scale <= scale) return img
  const out = blank(img.width / img.scale, img.height / img.scale, scale)
  for (let y = 0; y < out.height; y++) {
    const row = Math.floor((y + 0.5) * img.scale / scale) * img.width
    for (let x = 0; x < out.width; x++) {
      const s = (row + Math.floor((x + 0.5) * img.scale / scale)) * 4
      out.rgba.set(img.rgba.subarray(s, s + 4), (y * out.width + x) * 4)
    }
  }
  return out
}

function expandLegacy(img) {
  const out = blank(64, 64, img.scale)
  drawImage(img, 0, 0, 64, 32, out, 0, 0, { replace: true })
  for (const [[x, y, w, h], [dx, dy]] of LEGACY_LIMBS) drawImage(img, x, y, w, h, out, dx, dy, { flipX: true, replace: true })
  return out
}

function isSlim(img) {
  return texel(img, 50, 16)[3] === 0
}

function wideToSlim(img, column) {
  const canvas = clone(img)
  const c = column - 1
  for (const y of [16, 32]) {
    clearRect(canvas, 44 + c, y, 12 - c, 16)
    drawImage(img, 45 + c, y, 10 - c * 2, 16, canvas, 44 + c, y)
    drawImage(img, 56 - c, y + 4, c, 12, canvas, 54 - c, y + 4)
    clearRect(canvas, 47 + c, y, 4 - c, 4)
    drawImage(img, 49 + c, y, 3 - c, 4, canvas, 47 + c, y)
  }
  for (const x of [39, 55]) {
    clearRect(canvas, x - c, 48, 9 + c, 16)
    drawImage(img, x + 1 - c, 48, 4 + c * 2, 16, canvas, x - c, 48)
    drawImage(img, x + 6 + c, 52, 3 - c, 12, canvas, x + 4 + c, 52)
    clearRect(canvas, x + 3 - c, 48, 1 + c, 4)
    drawImage(img, x + 5 - c, 48, c, 4, canvas, x + 3 - c, 48)
  }
  return canvas
}

function colourDistance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

function heaviestColour(samples) {
  const groups = []
  for (const { colour, weight } of samples) {
    const group = groups.find(g => colourDistance(g.sum.map(c => c / g.weight), colour) < GROUP_DISTANCE)
    if (group) {
      group.sum = group.sum.map((c, k) => c + colour[k] * weight)
      group.weight += weight
    } else {
      groups.push({ sum: colour.map(c => c * weight), weight })
    }
  }
  if (!groups.length) return null
  const largest = groups.reduce((a, b) => b.weight > a.weight ? b : a)
  return largest.sum.map(c => c / largest.weight)
}

function luminance(colour) {
  return colour[0] * 0.299 + colour[1] * 0.587 + colour[2] * 0.114
}

function pupilCells(img, rows, columns) {
  const cells = rows.flatMap(y => columns.map(x => ({ x, y, colour: texel(img, x, y) })))
  const groups = []
  for (const cell of cells) {
    const group = groups.find(g => colourDistance(g[0].colour, cell.colour) < GROUP_DISTANCE)
    if (group) group.push(cell)
    else groups.push([cell])
  }
  if (groups.length === 1) return cells.filter(cell => cell.x === columns[1])
  if (groups.length === 2) {
    const [a, b] = groups
    if (a.length !== b.length) return a.length < b.length ? a : b
    return luminance(a[0].colour) < luminance(b[0].colour) ? a : b
  }
  const darkness = x => cells.filter(cell => cell.x === x).reduce((sum, cell) => sum + luminance(cell.colour), 0)
  const column = darkness(columns[0]) < darkness(columns[1]) ? columns[0] : columns[1]
  return cells.filter(cell => cell.x === column)
}

function eyePieces(img, feature) {
  return feature.eyes.flatMap(({ columns, pupil, white }) => {
    const pupils = pupilCells(img, feature.rows, columns)
    const isPupil = (x, y) => pupils.some(cell => cell.x === x && cell.y === y)
    function nearest(y, wanted) {
      const order = wanted ? [columns[1], columns[0]] : columns
      for (const row of feature.rows.slice().sort((a, b) => Math.abs(a - y) - Math.abs(b - y))) {
        const x = order.find(x => isPupil(x, row) === wanted)
        if (x !== undefined) return [x, row]
      }
      return [order[0], y]
    }
    return feature.rows.flatMap((y, j) => {
      const [px, py] = nearest(y, true)
      const [wx, wy] = nearest(y, false)
      return [[pupil, feature.v + j, px, py]].concat(white.map(u => [u, feature.v + j, wx, wy]))
    })
  })
}

function neighbourWeight(region, x, y) {
  let weight = 0
  for (const [rx, ry] of region) {
    if (rx === x && ry === y) return 0
    if (Math.abs(rx - x) <= 1 && Math.abs(ry - y) <= 1) weight = Math.max(weight, rx === x || ry === y ? 2 : 1)
  }
  return weight
}

function fillFromSurroundings(img, region) {
  const samples = []
  for (let y = Math.min(...region.map(([, ry]) => ry)); y < 16; y++) {
    for (let x = 8; x < 16; x++) {
      const weight = neighbourWeight(region, x, y)
      const colour = texel(img, x, y)
      if (weight && colour[3] > 0) samples.push({ colour: colour.slice(0, 3), weight })
    }
  }
  const colour = heaviestColour(samples)
  if (!colour) return
  const fill = colour.map(Math.round).concat([255])
  for (const [x, y] of region) fillTexel(img, x, y, fill)
}

function hasOuterLayer(img) {
  const s = img.scale
  for (const [x, y, w, h] of OVERLAYS) {
    for (let j = y * s; j < (y + h) * s; j++) {
      for (let i = x * s; i < (x + w) * s; i++) {
        if (img.rgba[(j * img.width + i) * 4 + 3] > 0) return true
      }
    }
  }
  return false
}

function toDungeons(vanilla, merge, features) {
  const flat = clone(vanilla)
  if (merge) {
    for (const [x, y, w, h, dx, dy] of OVERLAYS) {
      drawImage(vanilla, x, y, w, h, flat, dx, dy)
      clearRect(flat, x, y, w, h)
    }
  }
  const out = clone(flat)
  clearRect(out, 0, 16, 16, 16)
  clearRect(out, 16, 48, 16, 16)
  for (const { from: [x, y, w, h], to: [dx, dy], flipX, flipY } of LEGS) drawImage(flat, x, y, w, h, out, dx, dy, { flipX, flipY, replace: true })
  for (const [x, y, w, h] of MIRRORED_BACKS) drawImage(flat, x, y, w, h, out, x, y, { flipX: true, replace: true })
  for (const [x, y, w, h] of FLIPPED_BOTTOMS) drawImage(flat, x, y, w, h, out, x, y, { flipY: true, replace: true })
  clearRect(out, 0, 0, 8, 8)
  for (const area of FACE_PIECE_AREAS) clearRect(out, ...area)
  for (const feature of features) {
    for (const [tx, ty, fx, fy] of feature.eyes ? eyePieces(flat, feature) : feature.pieces) drawImage(flat, fx, fy, 1, 1, out, tx, ty, { replace: true })
  }
  for (const feature of features) {
    for (const region of feature.drawn) fillFromSurroundings(out, region)
  }
  clearRect(out, 56, 20, 8, 8)
  drawImage(flat, 8, 8, 8, 8, out, 56, 20, { replace: true })
  drawImage(flat, 40, 8, 8, 8, out, 56, 20)
  return out
}

function capeScale(img) {
  if (img.width % 22 === 0 && img.height * 22 === img.width * 17) return img.width / 22
  if (img.width % 46 === 0 && img.height * 46 === img.width * 22) return img.width / 46
  if (img.width % 64 !== 0 || img.width !== img.height * 2) return 0
  const scale = img.width / 64
  for (let i = 22 * scale * img.width * 4 + 3; i < img.rgba.length; i += 4) {
    if (img.rgba[i] > 0) return 0
  }
  return scale
}

function toDungeonsCape(img, scale) {
  const out = blank(32 * scale, 16 * scale)
  drawImage(img, 0, scale, 22 * scale, 16 * scale, out, 0, 0, { replace: true })
  for (let i = 0; i < 10 * scale; i++) {
    for (let j = 0; j < scale; j++) {
      drawImage(img, scale + i, scale - 1 - j, 1, 1, out, 23 * scale + j, i, { replace: true })
      drawImage(img, 11 * scale + i, j, 1, 1, out, 22 * scale + j, i, { replace: true })
    }
  }
  return out
}

function masked(colour) {
  return colour.slice(0, 3).concat([colour[3] > MASK_CLIP ? 255 : 0])
}

function faceColour(img, U, V, pieces) {
  const hat = pixel(img, 32 + U, V)
  if (hat[3] > MASK_CLIP) return masked(hat)
  for (const piece of pieces ? DATA.face : []) {
    let v = V
    if (piece.U[1] - piece.U[0] < 1.5) {
      const pivot = Math.round(piece.V[0]) + PUPIL_PIVOT
      v = pivot + (V - pivot) / PUPIL_SCALE
    }
    if (U < piece.U[0] || U >= piece.U[1] || v < piece.V[0] || v >= piece.V[1]) continue
    const colour = pixel(img, piece.u[0] * U + piece.u[1], piece.v[0] * v + piece.v[1])
    if (colour[3] > MASK_CLIP) return masked(colour)
  }
  return masked(pixel(img, U, V))
}

function drawFace(canvas, img, pieces = true) {
  const size = 8 * (pieces ? Math.max(img.scale || 1, 8) : img.scale || 1)
  canvas.width = size
  canvas.height = size
  const pixels = new ImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) pixels.data.set(faceColour(img, 8 + (x + 0.5) * 8 / size, 8 + (y + 0.5) * 8 / size, pieces), (y * size + x) * 4)
  }
  canvas.getContext("2d").putImageData(pixels, 0, 0)
}

function toCanvas(img) {
  const canvas = document.createElement("canvas")
  canvas.width = img.width
  canvas.height = img.height
  canvas.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(img.rgba), img.width, img.height), 0, 0)
  return canvas
}

function drawPortrait(canvas, img) {
  const s = img.scale
  canvas.width = 8 * s
  canvas.height = 8 * s
  canvas.getContext("2d").drawImage(toCanvas(img), 56 * s, 20 * s, 8 * s, 8 * s, 0, 0, 8 * s, 8 * s)
}

function drawTexture(canvas, img) {
  const context = canvas.getContext("2d")
  context.imageSmoothingEnabled = false
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.drawImage(toCanvas(img), 0, 0, canvas.width, canvas.height)
}

function differs(img, cells, tone) {
  return cells.filter(([x, y]) => {
    const colour = texel(img, x, y)
    return colour[3] > 0 && colourDistance(colour, tone) > DIFFERENT
  }).length / cells.length
}

function faceTone(img) {
  const samples = []
  for (let y = 12; y < 16; y++) {
    for (let x = 8; x < 16; x++) {
      const colour = texel(img, x, y)
      if (colour[3] > 0) samples.push({ colour: colour.slice(0, 3), weight: x === 11 || x === 12 ? 2 : 1 })
    }
  }
  return heaviestColour(samples)
}

function around(rows, columns) {
  return [Math.min(...rows) - 1, Math.max(...rows) + 1].filter(y => y >= 8 && y < 16).flatMap(y => columns.map(x => [x, y]))
}

function standsOut(img, tone, y, colour) {
  const between = [tone, texel(img, 11, y), texel(img, 12, y)].concat(y < 15 ? [texel(img, 11, y + 1), texel(img, 12, y + 1)] : [])
  return between.every(other => colourDistance(colour, other) > DIFFERENT)
}

function eyeFits(img, tone, rows) {
  if (rows.some(y => y < 8 || y >= 16)) return false
  return EYE_COLUMNS.every(columns => {
    const cells = rows.map(y => columns.map(x => texel(img, x, y)))
    if (cells.flat().some(colour => colour[3] === 0)) return false
    const mixed = cells.filter(([a, b]) => colourDistance(a, b) > DIFFERENT)
    if (!mixed.length) return false
    const colours = mixed.flat()
    return cells.every(([a, b], i) => mixed.includes(cells[i]) ? standsOut(img, tone, rows[i], a) || standsOut(img, tone, rows[i], b) : standsOut(img, tone, rows[i], a) && colours.some(colour => colourDistance(colour, a) < GROUP_DISTANCE))
  })
}

function suggestEyes(img, tone) {
  const columns = [9, 10, 13, 14]
  let best = null
  for (const option of EYES.filter(eye => eye.rows && eye.id !== "mirrored")) {
    if (!eyeFits(img, tone, option.rows)) continue
    const top = Math.min(...option.rows)
    const bottom = Math.max(...option.rows)
    const leftover = [top - 1, bottom + 1].filter(y => eyeFits(img, tone, option.rows.concat([y]))).length
    const contrast = differs(img, option.rows.flatMap(y => columns.map(x => [x, y])), tone) - differs(img, around(option.rows, columns), tone)
    const score = (option.rows.length - leftover * 2) * 10 + contrast
    if (!best || score > best.score) best = { option, score }
  }
  if (!best) return null
  const symmetric = best.option.rows.every(y => colourDistance(texel(img, 9, y), texel(img, 14, y)) < GROUP_DISTANCE)
  return symmetric && best.option.id === "row5" ? "mirrored" : best.option.id
}

function overlaps(a, b) {
  const cells = (b?.drawn || []).flat().map(([x, y]) => `${x},${y}`)
  return (a?.drawn || []).flat().some(([x, y]) => cells.includes(`${x},${y}`))
}

function suggestMouth(img, tone, eyes) {
  let best = null
  for (const option of MOUTHS.filter(mouth => mouth.cells && !overlaps(mouth, eyes) && !eyes?.rows?.includes(mouth.cells[0][1]))) {
    const row = option.cells[0][1]
    const columns = option.cells.map(([x]) => x)
    const inside = differs(img, option.cells, tone)
    const outside = around([row], columns).concat([[Math.min(...columns) - 1, row], [Math.max(...columns) + 1, row]])
    const score = inside - differs(img, outside, tone)
    if (inside >= 0.75 && (!best || score > best.score)) best = { option, score }
  }
  return best ? best.option.id : null
}

const MODEL_URL = "/assets/json/dungeons2skinconverter.json"
const FACE_FADE = 0.4
const MAX_FRAME_STEP = 0.1

let THREE
let modelData

async function loadViewerData() {
  if (!THREE) THREE = await import("https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js")
  if (!modelData) modelData = await fetch(MODEL_URL).then(r => r.json())
}

function sampleFrames(frames, position) {
  const index = Math.floor(position) % frames.length
  const next = (index + 1) % frames.length
  const blend = position - Math.floor(position)
  return frames[index].map((v, i) => v + (frames[next][i] - v) * blend)
}

function mixFrames(a, b, blend) {
  return a.map((v, i) => v + (b[i] - v) * blend)
}

function compose(a, ai, b, bi) {
  const out = new Array(12)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      out[r * 4 + c] = a[ai + r * 4] * b[bi + c] + a[ai + r * 4 + 1] * b[bi + 4 + c] + a[ai + r * 4 + 2] * b[bi + 8 + c] + (c === 3 ? a[ai + r * 4 + 3] : 0)
    }
  }
  return out
}

function createViewer(container, { yaw = 0.45, capeOnly = false } = {}) {
  const model = modelData
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.append(renderer.domElement)

  const scene = new THREE.Scene()
  scene.add(new THREE.HemisphereLight(0xffffff, 0x404048, 2.2))
  const key = new THREE.DirectionalLight(0xffffff, 1.6)
  key.position.set(-2, 3, 5)
  scene.add(key)

  const base = model.positions
  const positions = new THREE.BufferAttribute(Float32Array.from(base.flat()), 3)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", positions)
  geometry.setAttribute("uv", new THREE.BufferAttribute(Float32Array.from(model.uvs.flat().map(v => v / 64)), 2))
  const vanillaIndex = model.parts.base.concat(model.parts.hat)
  const layersIndex = model.parts.base.concat(model.parts.layers)
  geometry.setIndex(vanillaIndex)

  const headIndex = model.bodyBones.indexOf("J_Head")
  const slots = model.bones.map(name => model.bodyBones.includes(name) ? { body: model.bodyBones.indexOf(name) } : { face: model.faceBones.indexOf(name) })

  const material = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0, alphaTest: 0.1, side: THREE.DoubleSide, flatShading: true })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.visible = !capeOnly
  const pivot = new THREE.Group()
  pivot.add(mesh)
  scene.add(pivot)

  const capePositions = new THREE.BufferAttribute(Float32Array.from(model.cape.positions.flat()), 3)
  const capeGeometry = new THREE.BufferGeometry()
  capeGeometry.setAttribute("position", capePositions)
  capeGeometry.setAttribute("uv", new THREE.BufferAttribute(Float32Array.from(model.cape.uvs.flat()), 2))
  capeGeometry.setIndex(model.cape.indices)
  const capeMaterial = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0, alphaTest: 0.1, side: THREE.DoubleSide, flatShading: true })
  const capeMesh = new THREE.Mesh(capeGeometry, capeMaterial)
  capeMesh.visible = capeOnly
  pivot.add(capeMesh)

  const framed = capeOnly ? capeGeometry : geometry
  framed.computeBoundingBox()
  const centre = framed.boundingBox.getCenter(new THREE.Vector3())
  mesh.position.set(-centre.x, -centre.y, -centre.z)
  capeMesh.position.copy(mesh.position)

  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 1000)
  const height = framed.boundingBox.max.y - framed.boundingBox.min.y
  const view = { yaw, pitch: 0.1, distance: height * 0.6 / Math.tan(THREE.MathUtils.degToRad(15)), panX: 0, panY: 0 }
  const minDistance = view.distance * 0.2
  const maxDistance = view.distance * 3
  const initialView = Object.assign({}, view)
  const pointers = new Map()
  const reset = document.createElement("button")
  reset.className = "reset hidden"
  reset.textContent = "Reset view"
  reset.addEventListener("click", () => Object.assign(view, initialView))
  container.append(reset)
  let texture = null
  let capeTexture = null

  function pan(dx, dy) {
    const scale = 2 * view.distance * Math.tan(THREE.MathUtils.degToRad(15)) / container.clientWidth
    view.panX -= dx * scale
    view.panY += dy * scale
  }

  function zoom(factor) {
    view.distance = Math.max(minDistance, Math.min(maxDistance, view.distance * factor))
  }

  const canvas = renderer.domElement
  canvas.addEventListener("contextmenu", e => e.preventDefault())
  canvas.addEventListener("pointerdown", e => {
    canvas.setPointerCapture(e.pointerId)
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, button: e.button, shift: e.shiftKey })
  })
  canvas.addEventListener("pointermove", e => {
    const last = pointers.get(e.pointerId)
    if (!last) return
    const dx = e.clientX - last.x
    const dy = e.clientY - last.y
    if (pointers.size === 2) {
      const [a, b] = Array.from(pointers.values())
      const before = Math.hypot(a.x - b.x, a.y - b.y)
      last.x = e.clientX
      last.y = e.clientY
      const after = Math.hypot(a.x - b.x, a.y - b.y)
      if (before && after) zoom(before / after)
      pan(dx / 2, dy / 2)
      return
    }
    if (last.button === 2 || last.button === 1 || last.shift) {
      pan(dx, dy)
    } else {
      view.yaw += dx * 0.01
      view.pitch = Math.max(-Math.PI, Math.min(Math.PI, view.pitch + dy * 0.01))
    }
    last.x = e.clientX
    last.y = e.clientY
  })
  function release(e) {
    pointers.delete(e.pointerId)
  }
  canvas.addEventListener("pointerup", release)
  canvas.addEventListener("pointercancel", release)
  canvas.addEventListener("wheel", e => {
    e.preventDefault()
    zoom(Math.exp(e.deltaY * 0.001))
  }, { passive: false })

  function resize() {
    const size = container.clientWidth
    if (size) renderer.setSize(size, size, false)
  }
  new ResizeObserver(resize).observe(container)
  resize()

  const faces = model.faces
  let faceClip = 0
  let faceStart = 0

  function animate(time) {
    const body = sampleFrames(model.body, time * model.fps)
    let clipTime = time - faceStart
    let clip = faces[faceClip]
    const clipLength = (clip.frames.length - 1) / model.fps
    if (clipTime > clipLength) {
      faceClip = (faceClip + 1) % faces.length
      faceStart += clipLength
      clipTime -= clipLength
      clip = faces[faceClip]
    }
    let face = sampleFrames(clip.frames, clipTime * model.fps)
    const remaining = (clip.frames.length - 1) / model.fps - clipTime
    if (remaining < FACE_FADE) face = mixFrames(face, faces[(faceClip + 1) % faces.length].frames[0], 1 - remaining / FACE_FADE)
    const matrices = slots.map(slot => slot.body !== undefined ? body.slice(slot.body * 12, slot.body * 12 + 12) : compose(body, headIndex * 12, face, slot.face * 12))
    for (let v = 0; v < base.length; v++) {
      const m = matrices[model.vertexBones[v]]
      const [x, y, z] = base[v]
      positions.array[v * 3] = m[0] * x + m[1] * y + m[2] * z + m[3]
      positions.array[v * 3 + 1] = m[4] * x + m[5] * y + m[6] * z + m[7]
      positions.array[v * 3 + 2] = m[8] * x + m[9] * y + m[10] * z + m[11]
    }
    positions.needsUpdate = true
  }

  function pixelTexture(img) {
    const result = new THREE.CanvasTexture(toCanvas(img))
    result.flipY = false
    result.magFilter = THREE.NearestFilter
    result.minFilter = THREE.NearestFilter
    result.generateMipmaps = false
    result.colorSpace = THREE.SRGBColorSpace
    return result
  }

  let clock = 0
  let lastFrame = null

  function frame(now) {
    if (!canvas.isConnected) return
    requestAnimationFrame(frame)
    clock += lastFrame === null ? 0 : Math.min((now - lastFrame) / 1000, MAX_FRAME_STEP)
    lastFrame = now
    if (!container.clientWidth) return
    if (!capeOnly) animate(clock)
    reset.classList.toggle("hidden", Object.keys(view).every(key => view[key] === initialView[key]))
    pivot.rotation.set(view.pitch, view.yaw, 0)
    camera.position.set(view.panX, view.panY, view.distance)
    camera.lookAt(view.panX, view.panY, 0)
    renderer.render(scene, camera)
  }
  requestAnimationFrame(frame)

  return {
    setSkin(img) {
      if (texture) texture.dispose()
      texture = pixelTexture(img)
      material.map = texture
      material.needsUpdate = true
    },
    setCape(img) {
      if (capeTexture) capeTexture.dispose()
      capeTexture = pixelTexture(img)
      capeMaterial.map = capeTexture
      capeMaterial.needsUpdate = true
    },
    setLayers(on) {
      geometry.setIndex(on ? layersIndex : vanillaIndex)
    }
  }
}

async function readImage(file) {
  const bitmap = await createImageBitmap(file, { premultiplyAlpha: "none", colorSpaceConversion: "none" })
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const context = canvas.getContext("2d")
  context.drawImage(bitmap, 0, 0)
  const data = context.getImageData(0, 0, bitmap.width, bitmap.height)
  return { width: data.width, height: data.height, scale: 1, rgba: data.data }
}

function download(img, name) {
  toCanvas(img).toBlob(blob => saveAs(blob, `${name}.png`), "image/png")
}

const MRES_CHANNELS = ["Metallic", "Roughness", "Emissive", "Subsurface"]
const MRES_SUFFIX = new RegExp(`_(MRES|${MRES_CHANNELS.join("|")})$`, "i")
const DEFAULT_ROUGHNESS = Uint8Array.from(atob("1dre3s3By8XU2MvD0N3XzcrR0dXZ2NbP0dbRyczQ1NjR0dfW09Xa1Nbe3NrT1s/S1tbRztLZ2tbO0dLR2+LW0NrY09XUy8fB0tTAy9Hf38/R2NjY2dbb29fPz8fQycjd1dHV1tXU09Ha3tvS1dbR0dbXzdHR1NLQ2NHNzdDW1dDR2tHJ1NHDzNHJxcnP29vN0dzc1dbZ2dnX1tHO0MvR3tvV0dXY2NTZ29vb2dXNz9Xa1srN09HS0tTP0tHQ0tDNy9rRxMTFyMzNz8vH0NfZ2NjRx87W2djS1NbU0szMztje297azdTS1N7b2tzWxcbV1tHPyc/V0tTK0dvV0M3NzNXRw8LDw8PHxsTCxcvN1Nra1c3Q1tfW1dTR09LL0dvVys/R2NXW19bb2trX19fW19XPysvK0tLR19jX2d7Wy8nY1MLCx8bFxsHEwsPFxdHW1tfa1dLPz9TT0c/Kzdre2dHDwcrX09bb1Nnb1tbW19ja19PPzNHT0dfY1tze3tHP1NHIwsTGyszIxMXFx8vU1tTU1tbV0dHR08/MzdXP1dfVyL3G0tLY19La2dTS0dbY2tfV0dHS0dHW1tvX1trcxdfCxcjIzc/O0MvFxsfJ1t7Y3dnP1NHS0tHO0dTW1s/R09rByNHP0dHW2dbS0tHV2dnZ3d3Yzs/R0dXa2djc2tPNxsnNy9LU19XOx8fL19TLz9HY1NfV09DNz9nc1tXPztLW0c/UzMnO2tzW1dPR1tbX3dvX2dfW0dTS0NjZ39vbycbGydTX19fTzMnJ0NvX0MPAydbT09DJxNLc3tbW0dHXztDS1NDW2Njc29XT2tjR2t7X1dbd29vX2NHR29jb383JydDS29nU1c7M0M3Q2dTHvsPR0NDMx8nN09LYzs/Tzc/Q0tTW3dvX1dXW293b2dva19bW1tnb0dLNztHY0dXX19Tb19vX0NPV09DQy9DS1MLHz8zJx8zNzdDSzsTL09Xc1tjZ2dvW1NbY1tvZ2NbW0cva19bY0czJydHW39vO2dvX0tXV0NDZ19fU0MzJzMvJxsrHx8zMys/T1s3K09bP09XY2NvV1tfX2NjY29rU0c/R1tnY0s7Lx9Ha29bWztDX18vVztDX19Db2dPJxcXFxsbGx8fJzsvRzc7W1szN0NPW1tjW2N3b2NTX29ra1tHTzNLY0dLQz9HT1tnbydDLzc3L18vS1dTU19fXycLFxMTFxs7OzMfQ09LV0c7PytDS0dLY2dfW19bS09zb1NTS0tjZ1tDQ0dHTytHZ0c7M0M3Q0M7Q1NTQ0tDLzMnFxcXDw8bJx7/J0s3P0s/RzsvR0tDR1tjZ1tTTz9fe2NbV0tre2tnS0dXR0tnZ1tDM0czG0dTU0tTO0NDQysrKxcbHx87Ex83Tz8PKys3T1tTW1dfW1tfY2NjW1tbZ1tbW2NjW1NnP0dbT0Nvg2tjR097Cy9fSzdTRztDU18/Kx8XHx9DTyM/b2M3N0dTN0tfU1tbW19Ld29ba1tnY19LU1NTW1NjSytHX1tzY1drO0dbRyNfYzsvR0dHQ19XNzcTCxsjOz9HV1dXT1NTUzdLU2dvW1tbZ4trU2Nva2d3b1s/P0dLY1NHR0tbf09rRyM7TydjVzs/L0NHR0s/MwsXGydDTz8/U1dvY1dTR0djT0dHY2NDS29jT1tzY2dvb2dbW1NHY2dbY0NTY1NHY0MzR0cvQ0MzNztLUz9HMx8LEyNHU19bW1tja2NbX19nb1NHV1dLS1dbO0NrZ0dvd2tPW2tna1tTW0NLW19HNztbWyczRzszJy9LTztPPycPHxcnM0dbW093b1tnW2dnb3tbT3NfQ0dHVydXW1NTY2NjW1dPY2s/W1NDR1tjO0dXR0czI0cvExMzQzdLZ1sfCwsXNz9DU1Nni29TZ29fX2dnY19fb0tHPztDU1NDR0c7O1tTW087M0NPW1trXyc7U0c3NydPRwsfSy8/W2tjPwsfTzsjNzM/Z2dPW29bW2dnW1NTR0dTS1NPS1c7P0dLL0dLX1szLyMzP1drUzc3J0NTS1NXM0sjGz87Q0dPR0cfJ1s/Hx8jT2NLT29vW1tbW0NXRz9HT09PO1tbQ0NXWzdLW0dPOy9HKys3a08vGysrP1NbUzNTPw8jS09DLy9zNwsjPysTI19bM09bb1tbQ0NbW0NHV09POztDQ1tbb1srP1dHPzsvSz9XW19fW0crGyNre09jV1M/R0c/JxM/g2MnIysrHz9bV0tPQ1tbW0NDb0dLW1NPOyMPL0Nbb1c3NytDU09TVz9vg2dbY1dHP1NTX297X0c/S1NPUzMjJz9HV0czOztHUy9Xb1tbW0Nbb29DP2NTbztPTy8vL29PMx8nI0NXW1M/Z3NnRzdPZ2+DZ1NPT1tHMzc/V09LPx8fI1tPN0dHRzsfW29vW1djT1dfW1tbW19fSz83W1tfX19LLxsnX3tTW29vVx87Y3Nne2c/K0dfW1czMzsrN0NHT1tbMzdPVzcfR19nZ1NbUz9PU29rV1dXU1dfY3NrW19TS0NfX19vb2Nvb2M7Y3Nbb3NXIzdfZ1trPzdHNzsrQ19rUy8/V1dHU0dnb1tbUz8/R19ja09HT0dbc1dja0dDU1Nfe29fU1NrY09jf2NjZ29zXz9vb2dPY0dDQz8/R0MfQ1s/Q2NzZ2drZ19XV083HzNHW2dnV1NTU0NDc29bU2dvZ29fU19bU1dbV2NjV29jR1+Db19XW2dnX0c3Py9LW0cvR0dPRztDR1tjV0MzV1c3FzdLW19bV2NbU1trU1t3b29TY2dbW19XR1NfZ2M/R0dHZ4NfQ29fV1tbT18/R08XO09bcz9HZ2dXWz8jP0tXRzdLLytzW09XW1dTT0dvd29XX3t3S0dvW1tbW1tPX0c3M0dXX0NHa09HQ09LQ0s3HzdDa2s7T3NvU0tPT1NbT0dPRztHb29TS1dfX1Njb293b19PW1tbW29nW2NjY1s/U0dHR0c3L2dPLysrLz9HPzcnR19jW2dLO09TS19fS1tPRz9DR1NvY2tjN1NHU3dva29bMzdbX2tfO0d3X09HX2tbRz83M1M/Hx8vKxsjKx8TGy8vS2tfPytXT1dTPz9LS1NHV2M3L0dHWytHW2d3b2tbW0dLT2NrW2NfP0dPT2dvY29bMydjTw8fJx8XFwsXFxMnHy9PWztLS1tbMzMrNztHV1dLQyczP0NrW2d7V29vW1tHR0tPU1tPR2NHNz9PW2tvc0c7U0cnCxcTFxsbExMjJy8rS1c7T1dHSzszRy8rN19PMxsrIy8/P0d7b0tvZ1tPO0tLU1NTU1tbP09HS1tXW29vG1sPDycfJycjLx8XKzdHT2tXK0NXRz8/M0s7U1tjX1dLJxcfWztLd2tna19TP0djV0dPU1dbN0trW0dPU1tvZ1M/Hx8vM09HOzsnDyc3U2tbMzMrQ1dHT0s3W3trW2NXSz9TV1dfW1trW1tnT0tTW19fR1dXT2tnX2NrT09be29vJyMzO1tbR0M/P0cvKzdnUzMXIyM3T0c/K1t3a0M3V2dnf19PZ09bZ2tnY1tbX1djW1dbU1NvZ1tvc1tHZ2NvfzMnO1tfY0dHY1NHP1tbX19bSy8fJ1tnR09bZ1cnN1tzY29fR1dnW0tvb1tbW19jW09bY1tXY29vV09LRzdjQ09bT0sjQ19HQ19fY2N3c1tbT0c/W1tbZ2tfX2tbN29vW3d3V0M7X1cfX29LR1NXY2dTU1dTX0dTX1M7O09be283Y2tnU0tHP0c3V2tXY2tHR1NTW3dvX1dTZ2NPX4NrY2dra1tHO1tnO29rW1dnb2NbRy9La1s3OzdHN0tvb1tbO0dXWztfX0tHR0dDQ29rV1djb2NnW0dbX1tbW1dvY1NvY0tbV09rb19bb1Nbd29zV0dHO1tXU1tHQ0dTW2dvJ0c/Q0MzW1tbT09fW1NbZ1NXc2tjQ09bX1tbW0dTW2NjP0dLP0dTW1tfW1NLZ3dvW1dnb0dHV0dHR0dLK0dnRzszN0NTU0tDb1dHV1tXU09Ha29nU09PW09La0tPW1dbU1tHPzMzS09rb19bX2t3b2NTV0tfb29fOztHR2NnW0MzR0dHV1NLU29vV0dXX19TX2NjZ19jU0tfV1NbV09XX1tbR09bW0NLW1tfQ09rZ19nb1NTY29ra19bQ2+Da2dHT3srNz9DQy9Lb2dzZzdLQ0NbS0tbU0tbW1tTW1dTW2NTT1NXb3NbS19TT1dPT1NXW2dbW2NTb2tvb29jV2s7Q2NHN0tTOy9TSxMnT2M3Rzc3PzdHOzdPT0tXW1tfS1dbV09TS1tfS1tbW09POztHU29vW1tba4NnU2d/T2dLIztTJ29bS1dbb283Ny9DNys3R1NfV0c3NztbW1dTR1tXR09XU1NbP1dXR1NXV09XR1NTX2NHU2NrU1NnV0djQzNHRzNLR1NbT19rU0dHS0NDO0dTX1tbIyNHV1tjW1NbT1dXW1tTRztDT1dba19Ta1tLY1NPU1NTR0dbX0c7O19bJzNHS0dXY1tLT1dTY1tTY1NHV0dHW0tLW1NTV19bW0dPX1tHNzMjMztTa1dDT1dLV1tfU09HV0dbW08/T1dHRzMjR1tHV1s/R1NbY1M/T1NLV1tXS09XY2NbS0dTW1tDR19PRzc3Ry8nN2dPNzM3S09LV1tXU1NTW1NHKz9XRzs3J09jT0dHT09HR2NTOzc3S09PV1dbW1tbY0dHX2dXO0dbS0M/L0s7V1dfX1tHMy8/W1tbW1NDQ0dXQzMrP1NHU1c3U0dPMzdHW1dbX1tHLzM/W1tXW1tTX29vV1dbQ0c3R1NLU1c7Z3tnX19XRzdLS1dbX19TP0tXRz8fJy8/U1tPMzNLUzNHT1dXV19TRz9LT1NXX1tLQ2NvX19LR0MjKyM/V1tPP2dzZ0c7T2Nnc1tLW1NfTy9DV0dHRycfH293T2NHR1dTQzc3S0dDT1dXa1dDU1NbUzs/Y2NbU1tnUysbJ2dzU19rc1cjN1tvY3NfQ0dXTzMzK0NbU0c/T1dbb3tfTy9DW09HOzsjN1djW1tTP0dbP09bW1tbR2NnX08/W1tfb29ja2tfN2NrW29zVy9HX0czHys3S1tja4NrU09PW0cvKztPR0tHIy9LY2tbV1dPQydTa29fV2dbW2NbW29nX1dXa19PZ39jY2dvc19Da2tfLydDNzNne2dzZz8nR2NbSysvJyMvQ1NTX2NfS0tHQydHW2trT0tLS1dPb2NHWztXX19fX19nS0dnW0Nfe2tra18LX1dfb1tzc1cfN2NrW29DLzMzLytHX2N3W0dTT0dbT2N7X1NHT0Nfd2tvW0dPO09fR0dnT1tTP0dXT2t7X1dre39zY2drb3NfP3Nza1NnS0dDR1dTRyNHa08zX2tjY2dna1tHU1tLV29fZ29bV0M7Oztzc19jZ29bV0M7X19Xc3t/bz9Hd19HY4trY1Q=="), c => c.charCodeAt(0))
const METAL_HUE = [35, 60]
const METAL_SATURATION = 0.7
const METAL_VALUE = 0.5
const METAL_SHADING = 0.8
const METALLIC = 220
const SKIN_HUE = 10
const SKIN_SATURATION = 0.16
const SKIN_VALUE = 0.25
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]

function hsv([r, g, b]) {
  const max = Math.max(r, g, b)
  const range = max - Math.min(r, g, b)
  let hue = 0
  if (range) {
    if (max === r) hue = (g - b) / range
    else if (max === g) hue = (b - r) / range + 2
    else hue = (r - g) / range + 4
  }
  return [(hue * 60 + 360) % 360, max ? range / max : 0, max / 255]
}

function defaultMres(width = 64, height = 64) {
  const scale = width / 64
  const roughness = new Uint8Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) roughness[y * width + x] = DEFAULT_ROUGHNESS[Math.floor(y / scale) * 64 + Math.floor(x / scale)]
  }
  return { width, height, channels: [new Uint8Array(width * height), roughness, new Uint8Array(width * height), new Uint8Array(width * height)] }
}

function regions(mask, width) {
  const seen = new Uint8Array(mask.length)
  const out = []
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue
    const region = []
    const stack = [start]
    seen[start] = 1
    while (stack.length) {
      const p = stack.pop()
      region.push(p)
      const x = p % width
      for (const n of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width]) {
        if (n < 0 || n >= mask.length || !mask[n] || seen[n]) continue
        seen[n] = 1
        stack.push(n)
      }
    }
    out.push(region)
  }
  return out
}

function guessMres(img) {
  const mres = defaultMres(img.width, img.height)
  const tone = faceTone(img)
  const [toneHue, toneSaturation, toneValue] = tone ? hsv(tone) : []
  const gold = new Uint8Array(img.width * img.height)
  for (let p = 0; p < img.width * img.height; p++) {
    if (!img.rgba[p * 4 + 3]) continue
    const [hue, saturation, value] = hsv(img.rgba.subarray(p * 4, p * 4 + 3))
    if (hue >= METAL_HUE[0] && hue <= METAL_HUE[1] && saturation >= METAL_SATURATION && value >= METAL_VALUE) gold[p] = 1
    else if (tone && Math.abs((hue - toneHue + 540) % 360 - 180) <= SKIN_HUE && Math.abs(saturation - toneSaturation) <= SKIN_SATURATION && Math.abs(value - toneValue) <= SKIN_VALUE) mres.channels[3][p] = 255
  }
  for (const region of regions(gold, img.width)) {
    const colours = new Map()
    for (const p of region) {
      const key = img.rgba.subarray(p * 4, p * 4 + 3).join()
      colours.set(key, (colours.get(key) || 0) + 1)
    }
    if (Math.max(...colours.values()) > region.length * METAL_SHADING) continue
    for (const p of region) mres.channels[0][p] = METALLIC
  }
  return mres
}

function splitMres(img) {
  return { width: img.width, height: img.height, channels: [0, 1, 2, 3].map(c => Uint8Array.from({ length: img.width * img.height }, (_, p) => img.rgba[p * 4 + c])) }
}

function channelFrom(img) {
  const { rgba } = img
  return Uint8Array.from({ length: img.width * img.height }, (_, p) => Math.round((rgba[p * 4] + rgba[p * 4 + 1] + rgba[p * 4 + 2]) / 3 * rgba[p * 4 + 3] / 255))
}

function resample(channel, width, height, toWidth, toHeight) {
  if (width === toWidth && height === toHeight) return channel
  return Uint8Array.from({ length: toWidth * toHeight }, (_, p) => channel[Math.floor(Math.floor(p / toWidth) * height / toHeight) * width + Math.floor(p % toWidth * width / toWidth)])
}

function interleave(channels) {
  const out = new Uint8Array(channels[0].length * channels.length)
  for (const [c, channel] of channels.entries()) {
    for (let p = 0; p < channel.length; p++) out[p * channels.length + c] = channel[p]
  }
  return out
}

function crcTable() {
  return Array.from({ length: 256 }, (_, n) => {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    return c >>> 0
  })
}

const CRC_TABLE = crcTable()

function crc32(bytes) {
  let c = 0xffffffff
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

async function transform(parts, stream) {
  return new Uint8Array(await new Response(new Blob(parts).stream().pipeThrough(stream)).arrayBuffer())
}

function pngChunk(type, data) {
  const out = new Uint8Array(data.length + 12)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  out.set(Array.from(type, c => c.charCodeAt(0)), 4)
  out.set(data, 8)
  view.setUint32(data.length + 8, crc32(out.subarray(4, data.length + 8)))
  return out
}

async function encodePng(width, height, pixels, colourType) {
  const stride = width * (colourType === 6 ? 4 : 1)
  const header = new Uint8Array(13)
  const view = new DataView(header.buffer)
  view.setUint32(0, width)
  view.setUint32(4, height)
  header.set([8, colourType], 8)
  const raw = new Uint8Array((stride + 1) * height)
  for (let y = 0; y < height; y++) raw.set(pixels.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1)
  const data = await transform([raw], new CompressionStream("deflate"))
  return new Blob([new Uint8Array(PNG_SIGNATURE), pngChunk("IHDR", header), pngChunk("IDAT", data), pngChunk("IEND", new Uint8Array())], { type: "image/png" })
}

function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

async function decodePng(file) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (PNG_SIGNATURE.some((b, i) => bytes[i] !== b)) return null
  const view = new DataView(bytes.buffer)
  const data = []
  let header, palette, transparency
  for (let i = 8; i + 8 <= bytes.length; i += view.getUint32(i) + 12) {
    const type = String.fromCharCode(...bytes.subarray(i + 4, i + 8))
    const body = bytes.subarray(i + 8, i + 8 + view.getUint32(i))
    if (type === "IHDR") header = { width: view.getUint32(i + 8), height: view.getUint32(i + 12), depth: body[8], type: body[9], interlace: body[12] }
    else if (type === "PLTE") palette = body
    else if (type === "tRNS") transparency = body
    else if (type === "IDAT") data.push(body)
  }
  if (!header || header.interlace) return null
  const { width, height, depth, type } = header
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type]
  const stride = Math.ceil(width * channels * depth / 8)
  const step = Math.max(1, channels * depth / 8)
  const raw = await transform(data, new DecompressionStream("deflate"))
  const pixels = new Uint8Array(stride * height)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    const row = y * stride
    for (let x = 0; x < stride; x++) {
      const left = x >= step ? pixels[row + x - step] : 0
      const up = y ? pixels[row - stride + x] : 0
      const corner = x >= step && y ? pixels[row - stride + x - step] : 0
      pixels[row + x] = raw[row + y + 1 + x] + (filter === 1 ? left : filter === 2 ? up : filter === 3 ? (left + up) >> 1 : filter === 4 ? paeth(left, up, corner) : 0)
    }
  }
  const max = (1 << Math.min(depth, 8)) - 1
  function sample(x, y, c) {
    const bit = (x * channels + c) * depth
    const byte = pixels[y * stride + (bit >> 3)]
    return depth >= 8 ? byte : (byte >> (8 - depth - (bit & 7))) & max
  }
  const rgba = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let colour
      if (type === 3) {
        const index = sample(x, y, 0)
        colour = [palette[index * 3], palette[index * 3 + 1], palette[index * 3 + 2], transparency?.[index] ?? 255]
      } else {
        const values = Array.from({ length: channels }, (_, c) => Math.round(sample(x, y, c) * 255 / max))
        colour = channels < 3 ? [values[0], values[0], values[0], values[1] ?? 255] : [values[0], values[1], values[2], values[3] ?? 255]
      }
      rgba.set(colour, (y * width + x) * 4)
    }
  }
  return { width, height, scale: 1, rgba }
}

async function readExact(file) {
  return await decodePng(file).catch(() => null) || readImage(file)
}

const STORAGE_KEY = "dungeons2skinconverter"

const DESIGN = {
  skin: [214, 160, 120],
  hair: [90, 58, 38],
  white: [255, 255, 255],
  pupil: [45, 70, 190],
  otherPupil: [45, 160, 75],
  brow: [70, 45, 30],
  mouth: [170, 60, 60]
}

const EYE_DESIGNS = {
  mirrored: { rows: [4], brow: 3 },
  row5: { rows: [4], brow: 3, separate: true },
  row6: { rows: [5], brow: 4, separate: true },
  row7: { rows: [6], brow: 5, separate: true },
  rows45: { rows: [3, 4], brow: 2, separate: true },
  rows56: { rows: [4, 5], brow: 3, separate: true },
  rows67: { rows: [5, 6], brow: 4, separate: true }
}

const MOUTH_DESIGNS = {
  row7: { row: 6, from: 3, to: 4 },
  row8: { row: 7, from: 3, to: 4 },
  wide: { row: 6, from: 2, to: 5 }
}

function drawDesign(canvas, eyes, mouth) {
  const face = Array.from({ length: 8 }, (_, y) => Array.from({ length: 8 }, (_, x) => y < 2 || (y === 2 && (x === 0 || x === 7)) ? DESIGN.hair : DESIGN.skin))
  if (eyes) {
    for (const [row, y] of eyes.rows.entries()) {
      const shade = colour => colour.map(c => Math.round(c * (row ? 0.8 : 1)))
      face[y][1] = shade(DESIGN.white)
      face[y][2] = shade(DESIGN.pupil)
      face[y][5] = shade(eyes.separate ? DESIGN.otherPupil : DESIGN.pupil)
      face[y][6] = shade(DESIGN.white)
    }
    for (const x of [1, 2, 5, 6]) face[eyes.brow][x] = DESIGN.brow
  }
  if (mouth) {
    for (let x = mouth.from; x <= mouth.to; x++) face[mouth.row][x] = DESIGN.mouth
  }
  canvas.width = 8
  canvas.height = 8
  const context = canvas.getContext("2d")
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      context.fillStyle = `rgb(${face[y][x].join(",")})`
      context.fillRect(x, y, 1, 1)
    }
  }
}

function remembered() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

function remember(values) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.assign(remembered(), values)))
  } catch {}
}

function fileToDataUrl(file) {
  return new Promise((fulfil, reject) => {
    const reader = new FileReader()
    reader.onload = () => fulfil(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default class Dungeons2SkinConverterPage extends Page {
  constructor() {
    super("tools/dungeons2skinconverter", true, async $ => {
      const find = id => $(`#${id}`)[0]
      const state = { source: null, wide: false, layer: false, arms: 2, merge: true, eyes: "none", mouth: "none", skinName: "converted_skin", capeName: "converted_cape" }
      let viewer = null
      let capeViewer = null

      const mres = { data: defaultMres(), name: "Skin" }

      for (const button of [find("skin-save"), find("cape-save"), find("mres-save")].concat(Array.from($(".mod-download")), Array.from($(".channel-save")))) button.prepend($("#download-icon").contents().clone(true)[0])

      function rememberSkin(values) {
        remember({ skin: Object.assign(remembered().skin || {}, values) })
      }

      function baseName(file) {
        return file.name.toLowerCase().endsWith(".png") ? file.name.slice(0, -4) : file.name
      }

      async function viewers() {
        await loadViewerData()
        if (!viewer) viewer = createViewer(find("viewer"))
        if (!capeViewer) capeViewer = createViewer(find("cape-viewer"), { yaw: 0.45 + Math.PI, capeOnly: true })
      }



      function prepared(source = state.source) {
        return state.wide ? wideToSlim(source, state.arms) : source
      }

      function convert(eyes, mouth, source = state.source) {
        const features = [EYES.find(e => e.id === eyes), MOUTHS.find(m => m.id === mouth)].filter(f => f.pieces)
        return toDungeons(prepared(source), state.merge, features)
      }

      function drawArm(canvas, column) {
        const slim = wideToSlim(state.preview, column)
        const arms = blank(8, 22, slim.scale)
        for (const [x, y, dx] of [[44, 16, 0], [44, 32, 0], [36, 48, 5], [52, 48, 5]]) {
          drawImage(slim, x, y, 3, 4, arms, dx, 0)
          drawImage(slim, x, y + 4, 3, 12, arms, dx, 5)
          drawImage(slim, x + 3, y, 3, 4, arms, dx, 18)
        }
        canvas.width = arms.width
        canvas.height = arms.height
        drawTexture(canvas, arms)
      }

      function buildChoices(id, key, options, suggestion, render, blocked = null) {
        const container = find(id)
        container.replaceChildren()
        for (const option of options) {
          const card = document.createElement("div")
          const disabled = blocked ? overlaps(option, blocked.with) : false
          card.className = option.id === state[key] ? "choice selected" : disabled ? "choice disabled" : "choice"
          if (option.id === suggestion) {
            const badge = document.createElement("span")
            badge.className = "badge"
            badge.textContent = "Detected"
            card.append(badge)
          }
          const canvas = document.createElement("canvas")
          canvas.width = 64
          canvas.height = 64
          render(canvas, option)
          const title = document.createElement("span")
          title.textContent = option.label
          card.append(canvas, title)
          if (option.note || disabled) {
            const note = document.createElement("small")
            note.textContent = disabled ? blocked.note : option.note
            card.append(note)
          }
          card.addEventListener("click", () => {
            if (disabled) return
            state[key] = option.id
            refresh()
          })
          container.append(card)
        }
      }

      function refresh() {
        const eyes = EYES.find(e => e.id === state.eyes)
        const mouth = MOUTHS.find(m => m.id === state.mouth)
        if (overlaps(eyes, mouth)) state.mouth = "none"
        const result = convert(state.eyes, state.mouth)
        drawFace(find("face"), result)
        drawPortrait(find("portrait"), result)
        drawTexture(find("texture"), result)
        if (state.shownMerge !== state.merge) {
          find("layers").checked = !state.merge
          state.shownMerge = state.merge
        }
        if (viewer) {
          viewer.setSkin(result)
          viewer.setLayers(find("layers").checked)
        }
        const eyesDrawn = convert("none", state.mouth, state.preview)
        const mouthDrawn = convert(state.eyes, "none", state.preview)
        buildChoices("eyes", "eyes", EYES, state.eyeSuggestion, (canvas, option) => option.id === "none" ? drawFace(canvas, eyesDrawn, false) : drawDesign(canvas, EYE_DESIGNS[option.id], null), { with: MOUTHS.find(m => m.id === state.mouth), note: "Overlaps the chosen mouth" })
        buildChoices("mouth", "mouth", MOUTHS, state.mouthSuggestion, (canvas, option) => option.id === "none" ? drawFace(canvas, mouthDrawn, false) : drawDesign(canvas, null, MOUTH_DESIGNS[option.id]), { with: EYES.find(e => e.id === state.eyes), note: "Overlaps the chosen eyes" })
        if (state.wide) buildChoices("arms", "arms", [1, 2, 3, 4].map(n => ({ id: n, label: `Column ${n}` })), null, (canvas, option) => drawArm(canvas, option.id))
        const flat = prepared(state.preview)
        if (state.layer) buildChoices("layer", "merge", [{ id: true, label: "Merge", note: "Onto the base layer, so it shows in game" }, { id: false, label: "Leave separate", note: "Only shows with the Second Skin Layer mod" }], null, (canvas, option) => drawTexture(canvas, toDungeons(flat, option.id, [])))
        rememberSkin({ settings: { arms: state.arms, merge: state.merge, eyes: state.eyes, mouth: state.mouth, layers: find("layers").checked } })
      }

      function show(id, visible) {
        find(id).classList.toggle("hidden", !visible)
      }

      async function load(file, settings, restoring) {
        find("error").textContent = ""
        show("skin", false)
        show("cape", false)
        let img
        try {
          img = await readImage(file)
        } catch {
          find("error").textContent = `${file.name} could not be opened as an image.`
          return
        }
        const scale = capeScale(img)
        if (scale) {
          state.cape = toDungeonsCape(img, scale)
          state.capeName = baseName(file)
          drawTexture(find("cape-texture"), state.cape)
          if (!restoring) remember({ cape: { image: await fileToDataUrl(file), name: file.name }, showing: "cape" })
          show("cape", true)
          await viewers()
          capeViewer.setCape(state.cape)
          return
        }
        if (img.width % 64 || img.width > MAX_SKIN_SIZE || (img.height !== img.width && img.height * 2 !== img.width)) {
          find("error").textContent = `${file.name} is ${img.width}×${img.height}. Skins need to be 64×64 or the old 64×32, or a multiple of that size up to ${MAX_SKIN_SIZE}×${MAX_SKIN_SIZE}.`
          return
        }
        if (!restoring) remember({ skin: { image: await fileToDataUrl(file), name: file.name }, showing: "skin" })
        state.skinName = baseName(file)
        img.scale = img.width / 64
        state.source = img.height < img.width ? expandLegacy(img) : img
        state.preview = downscale(state.source, 4)
        state.wide = !isSlim(state.source)
        state.arms = settings?.arms ?? 2
        const slim = prepared()
        state.layer = hasOuterLayer(slim)
        state.merge = settings?.merge ?? true
        const tone = faceTone(slim)
        state.eyeSuggestion = tone ? suggestEyes(slim, tone) : null
        state.mouthSuggestion = tone ? suggestMouth(slim, tone, EYES.find(e => e.id === state.eyeSuggestion)) : null
        state.eyes = settings?.eyes ?? (state.eyeSuggestion || "none")
        state.mouth = settings?.mouth ?? (state.mouthSuggestion || "none")
        find("eyes-note").textContent = state.eyeSuggestion ? "The shape was detected automatically. Check the preview, and pick a different one if it is wrong." : "The eyes could not be detected automatically, so they are kept as drawn. Pick a shape if your skin uses a compatible one."
        find("mouth-note").textContent = state.mouthSuggestion ? "The shape was detected automatically. Check the preview, and pick a different one if it is wrong." : "The mouth could not be detected automatically, so it is kept as drawn. Pick a shape if your skin uses a compatible one."
        show("arms-panel", state.wide)
        show("layer-panel", state.layer)
        if (settings && settings.layers !== undefined) {
          find("layers").checked = settings.layers
          state.shownMerge = state.merge
        } else {
          state.shownMerge = null
        }
        show("skin", true)
        await viewers()
        refresh()
      }

      find("layers").addEventListener("change", () => {
        if (viewer) viewer.setLayers(find("layers").checked)
        rememberSkin({ settings: Object.assign(remembered().skin?.settings || {}, { layers: find("layers").checked }) })
      })

      function drawMres() {
        const { width, height, channels } = mres.data
        const defaults = defaultMres(width, height).channels
        for (const [index, channel] of channels.entries()) {
          const canvas = find(`channel-${index}`)
          canvas.width = width
          canvas.height = height
          canvas.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(interleave([channel, channel, channel, new Uint8Array(channel.length).fill(255)])), width, height), 0, 0)
          $(".channel-reset")[index].classList.toggle("hidden", channel.every((value, p) => value === defaults[index][p]))
        }
      }

      function mresName(file) {
        return baseName(file).replace(MRES_SUFFIX, "")
      }

      async function loadMres(file) {
        find("mres-error").textContent = ""
        let img
        try {
          img = await readExact(file)
        } catch {
          find("mres-error").textContent = `${file.name} could not be opened as an image.`
          return
        }
        if (find("mres-tab").querySelector("input[name=mres-mode]:checked").value === "guess") {
          if (img.width % 64 || img.width > MAX_SKIN_SIZE || img.height !== img.width) {
            find("mres-error").textContent = `${file.name} is ${img.width}×${img.height}. Guessing needs a Dungeons II skin, 64×64 or a multiple of that size up to ${MAX_SKIN_SIZE}×${MAX_SKIN_SIZE}.`
            return
          }
          img.scale = img.width / 64
          mres.data = guessMres(img)
          find("mres-note").textContent = `Guessed from ${file.name}. Check it over, and fix anything it got wrong.`
        } else {
          mres.data = splitMres(img)
          find("mres-note").textContent = `Split from ${file.name}.`
        }
        mres.name = mresName(file)
        drawMres()
      }

      async function replaceChannel(index, file) {
        let img
        try {
          img = await readExact(file)
        } catch {
          return `${file.name} could not be opened as an image.`
        }
        const { width, height } = mres.data
        if (img.width * height !== img.height * width) return `${file.name} is ${img.width}×${img.height}, which does not match the ${width}×${height} MRES texture.`
        const size = img.width > width ? [img.width, img.height] : [width, height]
        mres.data.channels = mres.data.channels.map(channel => resample(channel, width, height, ...size))
        mres.data.channels[index] = resample(channelFrom(img), img.width, img.height, ...size)
        mres.data.width = size[0]
        mres.data.height = size[1]
      }

      for (const tab of Array.from($(".tab"))) {
        tab.addEventListener("click", () => {
          for (const other of Array.from($(".tab"))) other.classList.toggle("active", other === tab)
          show("converter-tab", tab.dataset.tab === "converter")
          show("mres-tab", tab.dataset.tab === "mres")
        })
      }

      for (const panel of Array.from($(".channel"))) {
        const index = Number(panel.dataset.channel)
        async function replace(file) {
          find("mres-error").textContent = await replaceChannel(index, file) || ""
          drawMres()
        }
        panel.addEventListener("dragover", e => e.preventDefault())
        panel.addEventListener("drop", e => {
          e.preventDefault()
          if (e.dataTransfer.files[0]) replace(e.dataTransfer.files[0])
        })
        panel.querySelector(".channel-input").addEventListener("change", e => {
          if (e.target.files[0]) replace(e.target.files[0])
          e.target.value = ""
        })
        panel.querySelector(".channel-reset").addEventListener("click", () => {
          mres.data.channels[index] = defaultMres(mres.data.width, mres.data.height).channels[index]
          drawMres()
        })
        panel.querySelector(".channel-save").addEventListener("click", async () => saveAs(await encodePng(mres.data.width, mres.data.height, mres.data.channels[index], 0), `${mres.name}_${MRES_CHANNELS[index]}.png`))
      }

      find("mres-save").addEventListener("click", async () => saveAs(await encodePng(mres.data.width, mres.data.height, interleave(mres.data.channels), 6), `${mres.name}_MRES.png`))
      $("#mres-input").on("change", e => {
        const file = e.currentTarget.files[0]
        if (file && !find("mres-tab").classList.contains("hidden")) loadMres(file)
      })
      drawMres()

      $("#skin-input").on("change", e => {
        const file = e.currentTarget.files[0]
        if (file && !find("converter-tab").classList.contains("hidden")) load(file)
      })
      find("skin-save").addEventListener("click", () => download(convert(state.eyes, state.mouth), state.skinName))
      find("cape-save").addEventListener("click", () => download(state.cape, state.capeName))
      const memory = remembered()
      const last = memory[memory.showing]
      if (last) {
        const blob = await fetch(last.image).then(r => r.blob())
        load(new File([blob], last.name, { type: "image/png" }), last.settings, true)
      }
    })
    $("a").removeClass("selected")
  }

  static tag = "dungeons2skinconverter-page"
  static title = "Custom Skin Converter for Minecraft Dungeons II - Ewan Howell"
  static description = "Convert Minecraft Java skins and capes to the Minecraft Dungeons II layout for the Custom Skin Loader mod"
  static image = "dungeons2/skinconverter.webp"
  static colour = "#12A86C"
}
