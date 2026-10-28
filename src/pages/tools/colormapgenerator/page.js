import { Canvas, loadImage } from "/js/libs/canvas.js"
import "/js/components/file-input.js"

const API = "https://minecraft-biome-colors.ewanh.workers.dev"

const CHANNELS = {
  grass:      { tex: "grass",      color: "grassColor",      fixed: "grassColorFixed",      file: "grass",       label: "Grass" },
  foliage:    { tex: "foliage",    color: "foliageColor",    fixed: "foliageColorFixed",    file: "foliage",     label: "Foliage" },
  dryFoliage: { tex: "dryFoliage", color: "dryFoliageColor", fixed: "dryFoliageColorFixed", file: "dry_foliage", label: "Dry Foliage" }
}

const BLOCKS = {
  grass: "grass_block short_grass grass tall_grass fern large_fern potted_fern sugar_cane",
  foliage: "oak_leaves jungle_leaves acacia_leaves dark_oak_leaves mangrove_leaves vines",
  dryFoliage: "leaf_litter"
}

const clamp01 = v => Math.max(0, Math.min(1, v))
const hexToPacked = h => parseInt(h.slice(1), 16)
const packedToCss = c => "#" + c.toString(16).padStart(6, "0")

// game-accurate colormap coordinates: the game stores temperature/downfall as
// float32 and clamps them as floats before the double-precision uv maths
const fr = Math.fround
function triangleCoords(temp, downfall) {
  const t = clamp01(fr(temp))
  const d = clamp01(fr(downfall)) * t
  return [Math.floor((1 - t) * 255), Math.floor((1 - d) * 255)]
}

function samplePacked(data, temp, downfall) {
  const [x, y] = triangleCoords(temp, downfall)
  const i = (y * 256 + x) * 4
  return (data[i] << 16) | (data[i + 1] << 8) | data[i + 2]
}

const altitudeTemp = (temp, worldY) =>
  worldY > 80 ? fr(fr(temp) - fr(fr(fr(worldY - 80) * fr(0.05)) / 40)) : temp

function biomeColumn(biome, channel, texData, minY, height, mode) {
  if (biome[channel.fixed] || mode === "flat") {
    return new Uint32Array(height).fill(hexToPacked(biome[channel.color]))
  }
  const darkForest = channel.tex === "grass" && biome.grassColorModifier === "dark_forest"
  const column = new Uint32Array(height)
  for (let r = 0; r < height; r++) {
    let colour = samplePacked(texData, altitudeTemp(biome.temperature, minY + r), biome.downfall)
    if (darkForest) colour = ((colour & 0xfefefe) + 0x28340a) >> 1
    column[r] = colour
  }
  return column
}

function trianglePoint(biome) {
  return triangleCoords(biome.temperature, biome.downfall)
}

function fitPixels(element, width, height, { pad = 0, maxHeight = Infinity } = {}) {
  const container = element.parentElement
  let attached = false
  const observer = new ResizeObserver(() => {
    if (!element.isConnected) {
      if (attached) observer.disconnect()
      return
    }
    attached = true
    const style = getComputedStyle(container)
    const available = container.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
    const dpr = devicePixelRatio
    const fit = Math.min(available / width, maxHeight / height) * dpr
    const scale = fit >= 1 ? Math.floor(fit) : fit
    element.style.width = `${(width + pad * 2) * scale / dpr}px`
    if (pad) element.style.margin = `0 auto ${-pad * scale / dpr}px`
  })
  observer.observe(container)
}

function saveText(name, text) {
  saveAs(new Blob([text], { type: "text/plain" }), name)
}

export default class ColormapGeneratorPage extends Page {
  constructor() {
    super("tools/colormapgenerator", true, async $ => {
      const downloadIcon = $("#download-icon").contents()
      $(".button-download").prepend(() => downloadIcon.clone(true))

      const status = $("#status")
      fitPixels($("#triangle-wrap")[0], 256, 256, { pad: 8, maxHeight: 512 })
      const cache = new Map()
      const state = { tab: "vanilla", version: null, channel: "grass", mode: "flat", size: "full", entry: null, convert: { version: null, entry: null, imgData: null } }

      const loadVersion = async version => {
        if (cache.has(version)) return cache.get(version)
        const res = await fetch(`${API}/colormap/${version}`)
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Request failed (${res.status})`)
        const doc = await res.json()
        const textures = {}
        await Promise.all(Object.entries(doc.textures).map(async ([key, hash]) => {
          const tex = await fetch(`${API}/texture/${hash}`)
          if (!tex.ok) throw new Error(`Failed to load ${key} texture`)
          const bitmap = await createImageBitmap(await tex.blob())
          const canvas = new Canvas(256, 256)
          const ctx = canvas.getContext("2d")
          ctx.drawImage(bitmap, 0, 0)
          textures[key] = { bitmap, data: ctx.getImageData(0, 0, 256, 256).data }
        }))
        const entry = { doc, textures }
        cache.set(version, entry)
        return entry
      }

      function gridView(canvas, doc, minY) {
        const names = new Array(256).fill(null)
        for (const biome of doc.biomes) names[biome.numericId] = biome.id
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        const tooltip = E("div").addClass("tooltip grid-tooltip hidden")
        const wrap = E("div").addClass("grid-wrap").append(canvas, tooltip)
        canvas.on("mousemove", e => {
          const rect = canvas.getBoundingClientRect()
          const x = Math.max(0, Math.min(255, Math.floor((e.clientX - rect.left) / rect.width * 256)))
          const y = Math.max(0, Math.min(canvas.height - 1, Math.floor((e.clientY - rect.top) / rect.height * canvas.height)))
          const [r, g, b] = ctx.getImageData(x, y, 1, 1).data
          const hex = packedToCss(r << 16 | g << 8 | b)
          tooltip.empty().removeClass("hidden").append(
            E("div").addClass("tooltip-biome").append(
              E("span").addClass("swatch").css("background-color", hex),
              E("span").text(names[x] ?? "unused (plains)"),
              E("span").addClass("tooltip-hex").text(hex)
            ),
            E("div").addClass("tooltip-meta").text(`Y ${minY + y}, column ${x}`)
          )
          const left = e.clientX - rect.left + 16
          const top = e.clientY - rect.top + 16
          const flip = e.clientX + 16 + tooltip[0].offsetWidth > document.documentElement.clientWidth - 8
          tooltip.css({ left: flip ? left - 32 - tooltip[0].offsetWidth : left, top })
        }).on("mouseleave", () => tooltip.addClass("hidden"))
        return wrap
      }

      function showGrid(holder, wrap, height, maxHeight) {
        holder.append(wrap)
        fitPixels(wrap[0], 256, height, { maxHeight })
      }

      const renderGrid = () => {
        const { doc } = state.entry
        const channel = CHANNELS[state.channel]
        const texData = state.entry.textures[channel.tex].data
        const square = state.size === "square" || doc.worldMinY === 0 && doc.worldMaxY === 256
        const minY = square ? 0 : doc.worldMinY
        const height = square ? 256 : doc.worldMaxY - doc.worldMinY
        const img = new ImageData(256, height)

        const plains = doc.biomes.find(b => b.id === "plains") ?? doc.biomes[0]
        const fill = biomeColumn(plains, channel, texData, minY, height, state.mode)
        const columns = new Array(256).fill(fill)
        for (const biome of doc.biomes) {
          columns[biome.numericId] = biomeColumn(biome, channel, texData, minY, height, state.mode)
        }

        for (let x = 0; x < 256; x++) {
          const column = columns[x]
          for (let y = 0; y < height; y++) {
            const i = (y * 256 + x) * 4
            const colour = column[y]
            img.data[i] = colour >> 16 & 255
            img.data[i + 1] = colour >> 8 & 255
            img.data[i + 2] = colour & 255
            img.data[i + 3] = 255
          }
        }

        const canvas = new Canvas(256, height)
        canvas.getContext("2d", { willReadFrequently: true }).putImageData(img, 0, 0)
        showGrid($("#grid-holder").empty(), gridView(canvas, doc, minY), height, 768)
        $("#size-full-note").text(`Y ${doc.worldMinY} to ${doc.worldMaxY - 1}, needs a yOffset`)
        $("#grid-info").text(`256×${height}, covers Y ${minY} to ${minY + height - 1}${minY < 0 ? ` (needs yOffset=${minY})` : ""}`)
        $("#properties-example").text([
          `# ${channel.file}.properties`,
          "format=grid",
          `blocks=${BLOCKS[state.channel]}`,
          `source=./${channel.file}.png`,
          ...minY < 0 ? [`yOffset=${minY}`] : []
        ].join("\n"))
        state.gridCanvas = canvas
      }

      // 3x3 square marker with a white centre pixel
      const drawDot = (ctx, group, off = 0, outer = "#000", inner = "#fff") => {
        ctx.fillStyle = outer
        ctx.fillRect(group.x - 1 + off, group.y - 1 + off, 3, 3)
        ctx.fillStyle = inner
        ctx.fillRect(group.x + off, group.y + off, 1, 1)
      }

      // the game only ever samples the lower left half (downfall <= temperature)
      const clearUnused = (ctx, off = 0) => {
        for (let y = 0; y < 255; y++) ctx.clearRect(off + y + 1, off + y, 255 - y, 1)
      }

      const buildGroups = channel => {
        const texData = state.entry.textures[channel.tex].data
        const heldColour = packedToCss(samplePacked(texData, 0.5, 1))
        const groups = new Map()
        const fixed = []
        for (const biome of state.entry.doc.biomes) {
          if (biome[channel.fixed]) {
            fixed.push(biome)
            continue
          }
          const [x, y] = trianglePoint(biome)
          const key = `${x},${y}`
          if (!groups.has(key)) groups.set(key, { x, y, biomes: [] })
          groups.get(key).biomes.push(biome)
        }
        // held and dropped blocks always sample the centre of the colormap
        const heldKey = "127,127"
        if (!groups.has(heldKey)) groups.set(heldKey, { x: 127, y: 127, biomes: [] })
        Object.assign(groups.get(heldKey), { held: true, heldColour })
        return { groups, fixed, heldColour }
      }

      const renderTriangle = () => {
        const channel = CHANNELS[state.channel]
        const { groups, fixed, heldColour } = buildGroups(channel)
        const pad = 8
        const size = 256 + pad * 2

        const base = new Canvas(size, size)
        const bctx = base.getContext("2d")
        bctx.drawImage(state.entry.textures[channel.tex].bitmap, pad, pad)
        clearUnused(bctx, pad)
        for (const group of groups.values()) drawDot(bctx, group, pad)

        const canvas = new Canvas(size, size)
        const ctx = canvas.getContext("2d")
        ctx.drawImage(base, 0, 0)

        const tooltip = $("#triangle-tooltip")
        let hovered = null
        const setHovered = group => {
          if (group === hovered) return
          hovered = group
          ctx.clearRect(0, 0, size, size)
          ctx.drawImage(base, 0, 0)
          if (group) drawDot(ctx, group, pad, "#fff", "#000")
        }

        canvas.on("mousemove", e => {
          const rect = canvas.getBoundingClientRect()
          const mx = (e.clientX - rect.left) / rect.width * size - pad
          const my = (e.clientY - rect.top) / rect.height * size - pad
          let nearest, nearestDist = 36
          for (const group of groups.values()) {
            const dist = (group.x + .5 - mx) ** 2 + (group.y + .5 - my) ** 2
            if (dist < nearestDist) {
              nearest = group
              nearestDist = dist
            }
          }
          setHovered(nearest)
          if (!nearest) return tooltip.addClass("hidden")
          tooltip.empty().removeClass("hidden")
          const byColour = new Map()
          if (nearest.held) byColour.set(heldColour.toLowerCase(), ["held and dropped blocks"])
          for (const biome of nearest.biomes) {
            const hex = biome[channel.color].toLowerCase()
            if (!byColour.has(hex)) byColour.set(hex, [])
            byColour.get(hex).push(channel.tex === "grass" && biome.grassColorModifier === "dark_forest" ? `${biome.id} (colormap darkened with #28340a)` : biome.id)
          }
          for (const [hex, names] of byColour) {
            tooltip.append(E("div").addClass("tooltip-group").append(
              E("div").addClass("tooltip-biome").append(
                E("span").addClass("swatch").css("background-color", hex),
                E("span").addClass("tooltip-hex").text(hex),
                E("span").addClass("tooltip-count").text(names.length === 1 ? "" : `${names.length} biomes`)
              ),
              E("div").addClass("tooltip-names").append(names.map(name => E("div").text(name)))
            ))
          }
          const first = nearest.biomes[0]
          tooltip.append(E("div").addClass("tooltip-meta").text(
            `${first ? `temperature ${first.temperature}, downfall ${first.downfall}` : "temperature 0.5, downfall 1"}\npixel ${nearest.x}, ${nearest.y}`
          ))
        }).on("mouseleave", () => {
          setHovered(null)
          tooltip.addClass("hidden")
        })

        const wrap = $("#triangle-wrap")
        wrap.children("canvas").remove()
        wrap.prepend(canvas)

        const modified = channel.tex === "grass" ? state.entry.doc.biomes.filter(b => !b[channel.fixed] && b.grassColorModifier === "dark_forest") : []
        $("#fixed-wrap").toggleClass("hidden", !fixed.length && !modified.length)
        const fixedHolder = $("#fixed-biomes").empty()
        for (const biome of fixed.concat(modified)) {
          fixedHolder.append(E("div").addClass("fixed-chip").append(
            E("span").addClass("swatch swatch-large").css("background-color", biome[channel.color]),
            E("div").addClass("fixed-chip-text").append(
              E("span").text(biome.id),
              E("span").addClass("fixed-chip-hex").text(modified.includes(biome) ? `${biome[channel.color]}, colormap darkened with #28340a` : biome[channel.color])
            )
          ))
        }
      }

      const renderTable = () => {
        const { doc } = state.entry
        const hasDry = !!doc.textures.dryFoliage
        const table = $("#biome-table").empty()
        const header = E("tr").append(
          E("th").text("ID"),
          E("th").text("Biome"),
          E("th").text("Temperature"),
          E("th").text("Downfall"),
          E("th").text("Grass"),
          E("th").text("Foliage")
        )
        if (hasDry) header.append(E("th").text("Dry Foliage"))
        header.append(E("th").text("Water"), E("th").text("Sky"))
        table.append(header)

        const colourCell = colour => E("td").append(E("div").addClass("colour-cell").append(
          E("span").addClass("swatch").css("background-color", colour),
          E("span").text(colour)
        ))

        for (const biome of doc.biomes) {
          const row = E("tr").append(
            E("td").text(biome.numericId),
            E("td").text(biome.id),
            E("td").text(biome.temperature),
            E("td").text(biome.downfall),
            colourCell(biome.grassColor),
            colourCell(biome.foliageColor)
          )
          if (hasDry) row.append(colourCell(biome.dryFoliageColor))
          row.append(colourCell(biome.waterColor), colourCell(biome.skyColor))
          table.append(row)
        }
      }

      const renderConvert = () => {
        const out = $("#convert-output").empty()
        const convert = state.convert
        $("#convert-empty").toggleClass("hidden", !!convert.imgData)
        if (!convert.imgData || !convert.entry || !state.entry) return
        const tgtDoc = state.entry.doc
        const srcDoc = convert.entry.doc
        const channel = CHANNELS[state.channel]
        const texData = state.entry.textures[channel.tex].data

        const { width: srcW, height: srcH, data: srcData } = convert.imgData
        const srcFullHeight = srcDoc.worldMaxY - srcDoc.worldMinY
        const srcIsFull = srcH === srcFullHeight && srcDoc.worldMinY < 0
        // output matches the input: full height stays full height (when the
        // target supports it), anything else stays square
        const full = srcIsFull && tgtDoc.worldMinY < 0
        const minY = full ? tgtDoc.worldMinY : 0
        const height = full ? tgtDoc.worldMaxY - tgtDoc.worldMinY : 256
        // OptiFine clamps out of range rows, and wraps columns on narrow images
        const srcRowFor = worldY => Math.min(srcH - 1, Math.max(0, srcIsFull ? worldY - srcDoc.worldMinY : worldY))

        const srcIds = new Map(srcDoc.biomes.map(b => [b.id, b.numericId]))
        const tgtIds = new Set(tgtDoc.biomes.map(b => b.id))

        const generated = []
        const columns = new Array(256).fill(null)
        for (const biome of tgtDoc.biomes) {
          if (srcIds.has(biome.id)) {
            columns[biome.numericId] = { copy: srcIds.get(biome.id) % srcW }
          } else {
            columns[biome.numericId] = { synth: biomeColumn(biome, channel, texData, minY, height, "flat") }
            generated.push(biome.id)
          }
        }
        const plains = tgtDoc.biomes.find(b => b.id === "plains") ?? tgtDoc.biomes[0]
        const fill = srcIds.has(plains.id)
          ? { copy: srcIds.get(plains.id) % srcW }
          : { synth: biomeColumn(plains, channel, texData, minY, height, "flat") }
        for (let x = 0; x < 256; x++) if (!columns[x]) columns[x] = fill

        const img = new ImageData(256, height)
        for (let y = 0; y < height; y++) {
          const sy = srcRowFor(minY + y)
          for (let x = 0; x < 256; x++) {
            const column = columns[x]
            const i = (y * 256 + x) * 4
            if (column.copy !== undefined) {
              const j = (sy * srcW + column.copy) * 4
              img.data[i] = srcData[j]
              img.data[i + 1] = srcData[j + 1]
              img.data[i + 2] = srcData[j + 2]
              img.data[i + 3] = srcData[j + 3]
            } else {
              const colour = column.synth[y]
              img.data[i] = colour >> 16 & 255
              img.data[i + 1] = colour >> 8 & 255
              img.data[i + 2] = colour & 255
              img.data[i + 3] = 255
            }
          }
        }

        const canvas = new Canvas(256, height)
        canvas.getContext("2d", { willReadFrequently: true }).putImageData(img, 0, 0)

        const dropped = srcDoc.biomes.filter(b => !tgtIds.has(b.id)).map(b => b.id)
        out.append(E("p").addClass("hint").text(`256×${height}, covers Y ${minY} to ${minY + height - 1}${minY < 0 ? ` (needs yOffset=${minY})` : ""}`))
        if (generated.length) out.append(E("p").addClass("note").text(`Generated from vanilla (not in ${convert.version}): ${generated.join(", ")}`))
        if (dropped.length) out.append(E("p").addClass("note").text(`Dropped (not in ${state.version}): ${dropped.join(", ")}`))
        showGrid(out, gridView(canvas, tgtDoc, minY), height, 768)
        out.append(E("div").addClass("button-download").append(
          downloadIcon.clone(true),
          E("span").text("Download")
        ).on("click", () => canvas.saveAs(`${channel.file}_grid_${state.version}.png`)))
      }

      const renderChannelChoices = () => {
        const { textures } = state.entry
        for (const holder of Array.from($(".channel-choices"))) {
          const choices = $(holder).empty()
          for (const [key, channel] of Object.entries(CHANNELS)) {
            if (!textures[channel.tex]) continue
            const canvas = new Canvas(256, 256)
            const ctx = canvas.getContext("2d")
            ctx.drawImage(textures[channel.tex].bitmap, 0, 0)
            clearUnused(ctx)
            choices.append(E("div").addClass("choice").toggleClass("selected", key === state.channel).attr("data-channel", key).append(
              canvas,
              E("span").text(channel.label)
            ))
          }
        }
      }

      const showTab = () => {
        $("#generator-tab").toggleClass("hidden", state.tab === "converter" || !state.entry).attr("data-view", state.tab)
        $("#converter-tab").toggleClass("hidden", state.tab !== "converter" || !state.entry)
      }

      const render = () => {
        const { doc } = state.entry
        $(".size-wrap").toggleClass("hidden", doc.worldMinY === 0 && doc.worldMaxY === 256)
        if (!doc.textures.dryFoliage && state.channel === "dryFoliage") state.channel = "grass"
        renderChannelChoices()
        renderGrid()
        renderTriangle()
        renderTable()
        renderConvert()
        showTab()
      }

      const selectVersion = async version => {
        state.version = version
        $("#version").val(version)
        $("#convert-to").val(version)
        status.text(`Loading ${version}...`)
        try {
          state.entry = await loadVersion(version)
        } catch (err) {
          return status.text(`Failed to load ${version}: ${err.message}`)
        }
        if (state.version !== version) return
        status.text("")
        render()
      }

      $("#page-tabs").on("click", ".tab", e => {
        state.tab = e.currentTarget.dataset.tab
        $("#page-tabs .tab").removeClass("active")
        $(e.currentTarget).addClass("active")
        showTab()
      })

      $(".channel-choices").on("click", ".choice", e => {
        const channel = e.currentTarget.dataset.channel
        if (channel === state.channel) return
        state.channel = channel
        if (state.entry) render()
      })

      $("#modes").on("click", ".choice", e => {
        const mode = e.currentTarget.dataset.mode
        if (mode === state.mode) return
        state.mode = mode
        $("#modes .choice").removeClass("selected")
        $(e.currentTarget).addClass("selected")
        if (state.entry) renderGrid()
      })

      $("#sizes").on("click", ".choice", e => {
        const size = e.currentTarget.dataset.size
        if (size === state.size) return
        state.size = size
        $("#sizes .choice").removeClass("selected")
        $(e.currentTarget).addClass("selected")
        if (state.entry) renderGrid()
      })

      $("#version").on("change", e => selectVersion(e.currentTarget.value))
      $("#convert-to").on("change", e => selectVersion(e.currentTarget.value))

      const selectFrom = async version => {
        state.convert.version = version
        state.convert.entry = null
        try {
          state.convert.entry = await loadVersion(version)
        } catch (err) {
          return $("#convert-output").empty().append(E("p").text(`Failed to load ${version}: ${err.message}`))
        }
        if (state.convert.version !== version) return
        renderConvert()
      }

      $("#convert-from").on("change", e => selectFrom(e.currentTarget.value))

      $("file-input").on("change", async e => {
        const file = e.currentTarget.files?.[0]
        if (!file) return
        try {
          const image = await loadImage(file)
          const canvas = new Canvas(image.width, image.height)
          const ctx = canvas.getContext("2d")
          ctx.drawImage(image, 0, 0)
          state.convert.imgData = ctx.getImageData(0, 0, image.width, image.height)
        } catch (err) {
          state.convert.imgData = null
          return $("#convert-output").empty().append(E("p").text(`Failed to read image: ${err.message || err}`))
        }
        if (state.convert.entry) renderConvert()
        else selectFrom(state.convert.version)
      })

      $("#download-grid").on("click", () => {
        if (state.gridCanvas) state.gridCanvas.saveAs(`${CHANNELS[state.channel].file}_grid_${state.version}.png`)
      })

      $("#download-ids").on("click", () => {
        if (!state.entry) return
        saveText(`biome_ids_${state.version}.txt`, state.entry.doc.biomes.map(b => `${b.numericId}=${b.id}`).join("\n"))
      })

      $("#download-texture").on("click", () => {
        if (!state.entry) return
        const channel = CHANNELS[state.channel]
        const { groups } = buildGroups(channel)
        const canvas = new Canvas(256, 256)
        const ctx = canvas.getContext("2d")
        ctx.drawImage(state.entry.textures[channel.tex].bitmap, 0, 0)
        clearUnused(ctx)
        for (const group of groups.values()) drawDot(ctx, group)
        canvas.saveAs(`${channel.file}_map_${state.version}.png`)
      })

      status.text("Loading versions...")
      let versions
      try {
        const res = await fetch(`${API}/versions`)
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        versions = await res.json()
      } catch (err) {
        return status.text(`Failed to load version list: ${err.message}`)
      }

      const floor = versions.versions.findIndex(v => v.id === "1.16.2")
      if (floor !== -1) versions.versions = versions.versions.slice(0, floor + 1)

      const select = $("#version").empty()
      const fromSelect = $("#convert-from").empty()
      const toSelect = $("#convert-to").empty()
      for (const version of versions.versions) {
        select.append(E("option").attr("value", version.id).text(version.id))
        fromSelect.append(E("option").attr("value", version.id).text(version.id))
        toSelect.append(E("option").attr("value", version.id).text(version.id))
      }
      const latest = typeof versions.latest === "string" ? versions.latest : versions.latest?.release
      const initial = versions.versions.some(v => v.id === latest) ? latest
        : (versions.versions.find(v => !v.snapshot) ?? versions.versions[0]).id
      select.val(initial)
      // default the converter source to the previous release
      const from = versions.versions.find(v => !v.snapshot && v.id !== initial)?.id ?? initial
      fromSelect.val(from)
      state.convert.version = from
      selectVersion(initial)
    })
    $("a").removeClass("selected")
  }

  static tag = "colormapgenerator-page"
  static title = "Biome Colormap Generator - Ewan Howell"
  static description = "Generate Minecraft biome colormaps for any version, including OptiFine grid colormaps, biome ID lists, and vanilla colormap biome maps"
  static image = "minecraft/biomecolormaps.webp"
  static colour = "#91BD59"
}
