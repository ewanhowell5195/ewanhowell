import "/js/components/file-input.js"
import "/js/libs/FileSaver.js"

const MASK48 = (1n << 48n) - 1n, MUL = 25214903917n, INC = 11n
class JRandom {
  constructor(seed) { this.seed = (BigInt(seed) ^ MUL) & MASK48 }
  next(bits) { this.seed = (this.seed * MUL + INC) & MASK48; return Number(this.seed >> BigInt(48 - bits)) }
  nextInt(bound) {
    bound = bound | 0
    if (bound <= 0) throw new Error("bound must be positive")
    if ((bound & (bound - 1)) === 0) return Number((BigInt(bound) * BigInt(this.next(31))) >> 31n)
    let sample, modulo
    do { sample = this.next(31); modulo = sample % bound } while (((sample - modulo + (bound - 1)) | 0) < 0)
    return modulo
  }
}

function mthGetSeed(x, y, z) {
  const xi = BigInt(Math.imul(x, 3129871))
  let s = BigInt.asIntN(64, xi ^ (BigInt(z) * 116129781n) ^ BigInt(y))
  s = BigInt.asIntN(64, s * s * 42317861n + s * 11n)
  return s >> 16n
}

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b] } return a }

const MAXINT = 2147483647
const MAX_BLOCKS = 250000
const PREVIEW_MAX = 4000
const CALC_MAX = 50000000
const CALC_CHUNK = 300000
const Y_MIN = -64, Y_MAX = 319
const clampY = v => Math.min(Y_MAX, Math.max(Y_MIN, v))

const clone = x => JSON.parse(JSON.stringify(x))

function slotsAt(coord, T) {
  const slotToModel = new Map()
  const conflicts = []
  for (const [ck, model] of coord) {
    const [x, y, z] = ck.split(",").map(Number)
    const sel = new JRandom(mthGetSeed(x, y, z)).nextInt(T)
    const held = slotToModel.get(sel)
    if (held !== undefined && held !== model) conflicts.push({ coord: ck, model })
    else slotToModel.set(sel, model)
  }
  return { slotToModel, conflicts }
}

function resolveCoords(singles, regions) {
  const coord = new Map()
  const key = (x, y, z) => x + "," + y + "," + z
  let count = 0
  for (const r of regions) {
    const x1 = Math.min(r.from[0], r.to[0]), x2 = Math.max(r.from[0], r.to[0])
    const y1 = Math.min(r.from[1], r.to[1]), y2 = Math.max(r.from[1], r.to[1])
    const z1 = Math.min(r.from[2], r.to[2]), z2 = Math.max(r.from[2], r.to[2])
    count += (x2 - x1 + 1) * (y2 - y1 + 1) * (z2 - z1 + 1)
    if (count > MAX_BLOCKS) throw new Error("Too many blocks (over " + MAX_BLOCKS.toLocaleString() + "). Reduce the regions.")
    for (let x = x1; x <= x2; x++) for (let y = y1; y <= y2; y++) for (let z = z1; z <= z2; z++) coord.set(key(x, y, z), r.model)
  }
  for (const s of singles) coord.set(key(s.x, s.y, s.z), s.model)
  if (coord.size > MAX_BLOCKS) throw new Error("Too many blocks (over " + MAX_BLOCKS.toLocaleString() + "). Reduce the regions.")
  return coord
}

function normalizeVariants(raw) {
  const list = (Array.isArray(raw) ? raw : [raw]).map(v => {
    const o = Object.assign({}, v)
    let w = o.weight === undefined ? 1 : o.weight
    if (!Number.isInteger(w) || w < 1) throw new Error("The base blockstate has a non-positive or non-integer weight.")
    delete o.weight
    return { obj: o, weight: w }
  })
  const g = list.reduce((acc, e) => gcd(acc, e.weight), 0)
  if (g > 1) list.forEach(e => e.weight /= g)
  return list
}

function mergeState(rawVariants, singles, regions) {
  const coord = resolveCoords(singles, regions)
  if (!coord.size) return null

  const base = normalizeVariants(rawVariants)
  const S = base.reduce((a, e) => a + e.weight, 0)
  const k = Math.floor(MAXINT / S)
  const T = k * S

  const { slotToModel, conflicts } = slotsAt(coord, T)
  const pins = [...slotToModel.entries()].map(([sel, model]) => ({ sel, model })).sort((a, b) => a.sel - b.sel)
  const pinSlots = new Set(slotToModel.keys())
  const pinKeys = new Set(coord.keys())

  const scaled = base.map(e => ({ obj: e.obj, weight: e.weight * k }))
  const out = []
  let cum = 0, pi = 0
  for (const v of scaled) {
    const end = cum + v.weight
    let segStart = cum
    while (pi < pins.length && pins[pi].sel < end) {
      const p = pins[pi]
      if (p.sel > segStart) out.push({ obj: v.obj, weight: p.sel - segStart })
      out.push({ obj: { model: p.model }, weight: 1 })
      segStart = p.sel + 1
      pi++
    }
    if (end > segStart) out.push({ obj: v.obj, weight: end - segStart })
    cum = end
  }

  const outArr = out.map(e => {
    const o = Object.assign({}, e.obj)
    if (e.weight !== 1) o.weight = e.weight
    return o
  })
  return { outArr, blockCount: coord.size, entries: outArr.length, conflicts, T, pinSlots, pinKeys }
}

function generate(base, configs, mode) {
  if (!base || !base.variants) throw new Error("No base blockstate loaded.")

  const output = clone(base)
  delete output._placed_variants

  const states = []
  const savedStates = {}
  let totalBlocks = 0, totalConflicts = 0, worstLeak = Infinity

  for (const [key, cfg] of Object.entries(configs)) {
    const singles = cfg.singles || [], regions = cfg.regions || []
    if (!singles.length && !regions.length) continue
    if (!(key in base.variants)) continue
    const m = mergeState(base.variants[key], singles, regions)
    if (!m) continue
    output.variants[key] = m.outArr
    states.push({ key, ...m })
    savedStates[key] = { singles, regions }
    totalBlocks += m.blockCount
    totalConflicts += m.conflicts.length
    worstLeak = Math.min(worstLeak, Math.round(m.T / m.blockCount))
  }

  let configFile = null
  if (mode === "baked") {
    const original = { variants: {} }
    for (const key of Object.keys(savedStates)) original.variants[key] = clone(base.variants[key])
    output._placed_variants = { original, states: savedStates }
  } else if (mode === "separate") {
    const original = clone(base)
    delete original._placed_variants
    configFile = { placedVariantsConfig: true, original, states: savedStates }
  }

  return { result: output, configFile, states, totalBlocks, totalConflicts, worstLeak, empty: states.length === 0 }
}

export default class PlacedBlockVariantsPage extends Page {
  constructor() {
    super("tools/placedblockvariants", true, $ => {
      const downloadIcon = $("#download-icon").contents()
      const copyIcon = $("#copy-icon").contents()
      const closeIcon = $("#close-icon").contents()
      const output = $("#output")
      const editor = $("#editor")
      const stateChips = $("#state-chips")
      const singleRows = $("#single-rows")
      const regionRows = $("#region-rows")

      let base = null
      let configs = {}
      let currentState = null
      let fileName = "blockstate"
      let configMode = "baked"
      let outText = ""
      let debounce
      const calcRegion = ["-100", "-64", "-100", "100", "319", "100"]
      let calcBusy = false

      function clampInput(el, min, max) {
        const v = el.value.trim()
        if (v === "" || !Number.isFinite(+v)) return false
        let n = +v
        if (min !== undefined) n = Math.max(min, n)
        if (max !== undefined) n = Math.min(max, n)
        if (String(n) === el.value) return false
        el.value = String(n)
        return true
      }
      function numInput(cls, ph, min, max) {
        const attrs = { type: "number", placeholder: ph }
        if (min !== undefined) attrs.min = min
        if (max !== undefined) attrs.max = max
        const inp = E("input").addClass(cls).attr(attrs).on("input", onEdit)
        if (min !== undefined || max !== undefined) inp.on("blur", e => { if (clampInput(e.currentTarget, min, max)) onEdit() })
        return inp
      }
      function txtInput(cls, ph, val) { return E("input").addClass(cls).attr({ type: "text", placeholder: ph }).val(val || "").on("input", onEdit) }
      function removeBtn(row) { return E("div").addClass("remove-row").append(closeIcon.clone(true)).on("click", () => { row.remove(); onEdit() }) }

      function rowComplete(row, coordSels, modelSel) {
        if (!$(modelSel, row).val().trim()) return false
        return coordSels.every(s => { const v = $(s, row).val().trim(); return v !== "" && Number.isInteger(+v) })
      }
      function singlesComplete() {
        let ok = true
        singleRows.find(".single-row").each((i, row) => { if (!rowComplete(row, [".sx", ".sy", ".sz"], ".smodel")) ok = false })
        return ok
      }
      function regionsComplete() {
        let ok = true
        regionRows.find(".region-row").each((i, row) => { if (!rowComplete(row, [".rx1", ".ry1", ".rz1", ".rx2", ".ry2", ".rz2"], ".rmodel")) ok = false })
        return ok
      }
      function updateAddButtons() {
        $("#add-single").toggleClass("disabled", !singlesComplete())
        $("#add-region").toggleClass("disabled", !regionsComplete())
      }
      function onEdit() { updateAddButtons(); scheduleRun() }
      function sep() { return E("span").addClass("row-sep") }

      function addSingle(x = "", y = "", z = "", model = "") {
        const row = E("div").addClass("single-row")
        row.append(numInput("sx", "x").val(x), numInput("sy", "y", Y_MIN, Y_MAX).val(y), numInput("sz", "z").val(z), sep(), txtInput("smodel", "model", model), removeBtn(row))
        singleRows.append(row)
      }
      function addRegion(from = ["", "", ""], to = ["", "", ""], model = "") {
        const row = E("div").addClass("region-row")
        row.append(
          E("span").addClass("region-label").text("from"),
          numInput("rx1", "x").val(from[0]), numInput("ry1", "y", Y_MIN, Y_MAX).val(from[1]), numInput("rz1", "z").val(from[2]),
          E("span").addClass("region-label").text("to"),
          numInput("rx2", "x").val(to[0]), numInput("ry2", "y", Y_MIN, Y_MAX).val(to[1]), numInput("rz2", "z").val(to[2]),
          sep(), txtInput("rmodel", "model", model), removeBtn(row)
        )
        regionRows.append(row)
      }

      function readSingles() {
        const arr = []
        singleRows.find(".single-row").each((i, row) => {
          const x = $(".sx", row).val().trim(), y = $(".sy", row).val().trim(), z = $(".sz", row).val().trim(), m = $(".smodel", row).val().trim()
          if (x !== "" && y !== "" && z !== "" && m && [x, y, z].every(n => Number.isInteger(+n)))
            arr.push({ x: +x, y: clampY(+y), z: +z, model: m })
        })
        return arr
      }
      function readRegions() {
        const arr = []
        regionRows.find(".region-row").each((i, row) => {
          const n = c => $(c, row).val().trim()
          const nums = [n(".rx1"), n(".ry1"), n(".rz1"), n(".rx2"), n(".ry2"), n(".rz2")], m = n(".rmodel")
          if (m && nums.every(v => v !== "" && Number.isInteger(+v)))
            arr.push({ from: [+nums[0], clampY(+nums[1]), +nums[2]], to: [+nums[3], clampY(+nums[4]), +nums[5]], model: m })
        })
        return arr
      }

      function saveRows() {
        if (currentState === null) return
        const singles = readSingles(), regions = readRegions()
        if (singles.length || regions.length) configs[currentState] = { singles, regions }
        else delete configs[currentState]
      }

      function loadRows(key) {
        singleRows.empty(); regionRows.empty()
        const cfg = configs[key] || { singles: [], regions: [] }
        for (const s of cfg.singles || []) addSingle(s.x, s.y, s.z, s.model)
        for (const r of cfg.regions || []) addRegion(r.from, r.to, r.model)
        if (!singleRows.children().length && !regionRows.children().length) addSingle()
        updateAddButtons()
      }

      function stateLabel(key) { return key === "" ? "(default)" : key }

      function buildChips() {
        stateChips.empty()
        for (const key of Object.keys(base.variants)) {
          const chip = E("div").addClass("state-chip").text(stateLabel(key)).appendTo(stateChips)
          if (key === currentState) chip.addClass("selected")
          if (configs[key] && (configs[key].singles?.length || configs[key].regions?.length)) chip.addClass("has-config")
          chip.on("click", () => {
            if (key === currentState) return
            saveRows()
            currentState = key
            loadRows(key)
            refreshChips()
          })
        }
      }

      function refreshChips() {
        stateChips.find(".state-chip").each((i, el) => {
          const chip = $(el)
          const key = Object.keys(base.variants)[i]
          chip.toggleClass("selected", key === currentState)
          chip.toggleClass("has-config", !!(configs[key] && (configs[key].singles?.length || configs[key].regions?.length)))
        })
      }

      function message(text, cls) {
        output.empty()
        E("div").addClass(cls || "note").text(text).appendTo(output)
      }

      function render(data) {
        output.empty()
        outText = JSON.stringify(data.result, null, 2)

        const ok = data.totalConflicts === 0
        E("div").addClass("verdict " + (ok ? "ok" : "err")).text(
          ok
            ? "Every one of the " + data.totalBlocks.toLocaleString() + " target blocks is pinned to its variant, merged into the base blockstate."
            : data.totalConflicts + " block(s) clashed on a slot and could not be pinned (see below). The rest are fine."
        ).appendTo(output)

        const stats = [
          ["States pinned", data.states.length.toLocaleString()],
          ["Target blocks", data.totalBlocks.toLocaleString()],
          data.totalBlocks > 20000 ? ["Heads up", "large blockstate"] : null,
          ["World leakage", "1 in " + (data.worstLeak === Infinity ? "0" : data.worstLeak.toLocaleString())]
        ].filter(Boolean)
        const grid = E("div").addClass("stats").appendTo(output)
        for (const [k, v] of stats) E("div").addClass("stat").append(E("div").addClass("stat-key").text(k), E("div").addClass("stat-value").text(v)).appendTo(grid)

        const conflicts = data.states.flatMap(s => s.conflicts)
        if (conflicts.length) {
          const box = E("div").addClass("errors").appendTo(output)
          box.append(E("h2").text("Slot clashes"))
          const list = E("ul").appendTo(box)
          for (const c of conflicts.slice(0, 10)) list.append(E("li").text("(" + c.coord + ") wanted " + c.model))
          if (conflicts.length > 10) list.append(E("li").text("and " + (conflicts.length - 10) + " more"))
        }

        const entries = data.states.reduce((a, s) => a + s.entries, 0)

        const modeSelect = E("select").addClass("save-mode-select").on("change", e => { configMode = e.currentTarget.value; run() })
        for (const [val, label] of [["baked", "Config: baked in"], ["separate", "Config: separate file"], ["none", "Config: don't save"]]) {
          const opt = E("option").attr("value", val).text(label)
          if (val === configMode) opt.prop("selected", true)
          modeSelect.append(opt)
        }

        const buttons = E("div").addClass("buttons").appendTo(output)
        E("div").addClass("button-download").append(downloadIcon.clone(true), E("span").text("Download")).on("click", () =>
          saveAs(new Blob([outText], { type: "application/json" }), (fileName || "blockstate") + ".json")).appendTo(buttons)
        E("div").addClass("button").append(copyIcon.clone(true), E("span").text("Copy")).on("click", () => navigator.clipboard.writeText(outText)).appendTo(buttons)
        if (configMode === "separate" && data.configFile) {
          const cfgText = JSON.stringify(data.configFile, null, 2)
          E("div").addClass("button").append(downloadIcon.clone(true), E("span").text("Download config")).on("click", () =>
            saveAs(new Blob([cfgText], { type: "application/json" }), (fileName || "blockstate") + ".config.json")).appendTo(buttons)
        }
        E("label").addClass("save-mode").append(modeSelect).appendTo(buttons)

        if (configMode === "none") {
          E("div").addClass("config-warning").text("With no saved config this blockstate is very hard to edit again: the weighting is baked into the raw variants and cannot be read back into this tool. Keep a baked or separate config if you might change these blocks later.").appendTo(output)
        }

        if (entries <= PREVIEW_MAX) {
          E("textarea").addClass("result-json").attr("spellcheck", "false").prop("readonly", true).val(outText).appendTo(output)
        } else {
          E("div").addClass("note").text("Output is " + entries.toLocaleString() + " entries, too large to preview. Use Download.").appendTo(output)
        }

        buildCalculator(data)
      }

      function setCalcBusy(on, ins, calcBtn) {
        calcBusy = on
        editor.toggleClass("generating", on)
        $("file-input").toggleClass("generating", on)
        calcBtn.toggleClass("generating", on)
        ins.forEach(i => i.prop("disabled", on))
      }

      function buildCalculator(data) {
        const calc = E("div").addClass("calc").appendTo(output)
        calc.append(E("h3").text("Leak calculator"), E("p").addClass("field-hint").text("Find which blocks in a region would show a pinned variant if placed there. Give two opposite corners."))
        const spec = [["x"], ["y", Y_MIN, Y_MAX], ["z"], ["x"], ["y", Y_MIN, Y_MAX], ["z"]]
        const ins = spec.map(([ph, mn, mx], i) => {
          const attrs = { type: "number", placeholder: ph }
          if (mn !== undefined) { attrs.min = mn; attrs.max = mx }
          const inp = E("input").addClass("calc-in").attr(attrs).val(calcRegion[i]).on("input", e => calcRegion[i] = e.currentTarget.value)
          if (mn !== undefined) inp.on("blur", e => { if (clampInput(e.currentTarget, mn, mx)) calcRegion[i] = e.currentTarget.value })
          return inp
        })
        const row = E("div").addClass("calc-row").appendTo(calc)
        row.append(E("span").addClass("region-label").text("from"), ins[0], ins[1], ins[2], E("span").addClass("region-label").text("to"), ins[3], ins[4], ins[5])
        const result = E("div").addClass("calc-result")
        const calcBtn = E("div").addClass("button").append(E("span").text("Calculate"))
        calcBtn.on("click", () => runCalc(data, ins, calcBtn, result)).appendTo(calc)
        result.appendTo(calc)
      }

      async function runCalc(data, ins, calcBtn, result) {
        if (calcBusy) return
        result.empty()
        const vals = ins.map(i => i.val().trim())
        if (!vals.every(v => v !== "" && Number.isInteger(+v))) return void E("div").addClass("note").text("Enter both corners.").appendTo(result)
        const fx = [+vals[0], clampY(+vals[1]), +vals[2]], tx = [+vals[3], clampY(+vals[4]), +vals[5]]
        const b = { x1: Math.min(fx[0], tx[0]), x2: Math.max(fx[0], tx[0]), y1: Math.min(fx[1], tx[1]), y2: Math.max(fx[1], tx[1]), z1: Math.min(fx[2], tx[2]), z2: Math.max(fx[2], tx[2]) }
        const count = (b.x2 - b.x1 + 1) * (b.y2 - b.y1 + 1) * (b.z2 - b.z1 + 1)
        if (count > CALC_MAX) return void E("div").addClass("note").text("Region is " + count.toLocaleString() + " blocks, too big (max " + CALC_MAX.toLocaleString() + "). Shrink it.").appendTo(result)

        const sd = data.states.map(s => ({ key: s.key, T: s.T, pinSlots: s.pinSlots, pinKeys: s.pinKeys, leaks: [] }))

        setCalcBusy(true, ins, calcBtn)
        let cancelled = false
        const bar = E("div").addClass("progress").appendTo(result)
        const fill = E("div").addClass("progress-fill").appendTo(bar)
        const label = E("div").addClass("progress-text").text("0%").appendTo(result)
        E("div").addClass("button").append(E("span").text("Cancel")).on("click", () => cancelled = true).appendTo(result)

        let done = 0, since = 0
        const yieldUI = () => new Promise(r => setTimeout(r))
        for (let x = b.x1; x <= b.x2 && !cancelled; x++) for (let y = b.y1; y <= b.y2 && !cancelled; y++) for (let z = b.z1; z <= b.z2; z++) {
          const ck = x + "," + y + "," + z
          const seed = mthGetSeed(x, y, z)
          for (const s of sd) {
            if (s.pinKeys.has(ck)) continue
            if (s.pinSlots.has(new JRandom(seed).nextInt(s.T))) s.leaks.push([x, y, z])
          }
          if (++since >= CALC_CHUNK) {
            done += since; since = 0
            const frac = Math.min(1, done / count)
            fill.css("width", (frac * 100).toFixed(1) + "%")
            label.text(Math.round(frac * 100) + "%")
            if (cancelled) break
            await yieldUI()
          }
        }
        setCalcBusy(false, ins, calcBtn)
        result.empty()
        if (cancelled) return void E("div").addClass("note").text("Cancelled.").appendTo(result)

        const perState = sd.filter(s => s.leaks.length)
        const total = perState.reduce((a, s) => a + s.leaks.length, 0)
        E("div").text(total.toLocaleString() + " of " + count.toLocaleString() + " blocks in the region would show a pinned variant.").appendTo(result)
        if (total) {
          E("div").addClass("button").append(downloadIcon.clone(true), E("span").text("Download leak list")).on("click", () => {
            const lines = []
            for (const s of perState) {
              lines.push("# " + stateLabel(s.key) + ": " + s.leaks.length.toLocaleString() + " leaking blocks")
              for (const [x, y, z] of s.leaks) lines.push(x + " " + y + " " + z)
            }
            saveAs(new Blob([lines.join("\n")], { type: "text/plain" }), (fileName || "blockstate") + ".leaks.txt")
          }).appendTo(result)
        }
      }

      function run() {
        if (!base) return message("Upload a blockstate to begin.")
        saveRows()
        refreshChips()
        let data
        try {
          data = generate(base, configs, configMode)
        } catch (e) {
          return message(e.message, "errors-inline")
        }
        if (data.empty) return message("Add a block or region to a state to begin.")
        render(data)
      }
      function scheduleRun() { clearTimeout(debounce); debounce = setTimeout(run, 250) }

      function loadFile(json, name) {
        fileName = name || "blockstate"
        if (json && json.placedVariantsConfig && json.original) {
          base = clone(json.original)
          delete base._placed_variants
          configs = clone(json.states || {})
          configMode = "separate"
        } else if (json && json.variants) {
          base = clone(json)
          delete base._placed_variants
          if (json._placed_variants) {
            const src = json._placed_variants
            configs = clone(src.states || {})
            const orig = src.original && src.original.variants ? src.original.variants : {}
            for (const key of Object.keys(orig)) base.variants[key] = clone(orig[key])
            configMode = "baked"
          } else {
            configs = {}
          }
        } else {
          base = null
          editor.addClass("hidden")
          return message('That file has no "variants" object. Multipart blockstates are not supported.', "errors-inline")
        }
        if (!base.variants || typeof base.variants !== "object" || Array.isArray(base.variants)) {
          base = null
          editor.addClass("hidden")
          return message('That file has no "variants" object. Multipart blockstates are not supported.', "errors-inline")
        }
        currentState = Object.keys(base.variants)[0] ?? null
        editor.removeClass("hidden")
        buildChips()
        loadRows(currentState)
        run()
      }

      $("#add-single").on("click", () => { if (singlesComplete()) { addSingle(); updateAddButtons() } })
      $("#add-region").on("click", () => { if (regionsComplete()) { addRegion(); updateAddButtons() } })

      $("file-input").on("change", async e => {
        const files = e.currentTarget.files
        if (!files || !files.length) return
        let json
        try { json = JSON.parse(await files[0].text()) }
        catch (err) { return message("Could not read that file as JSON: " + (err.message || err), "errors-inline") }
        loadFile(json, files[0].name.replace(/\.json$/i, "").replace(/\.config$/i, ""))
      })
    })
    $("a").removeClass("selected")
  }

  static tag = "placedblockvariants-page"
  static title = "Placed Block Variants - Ewan Howell"
  static description = "Force specific placed blocks at chosen coordinates to render chosen variants, from a single block"
  static image = "minecraft/placedblockvariants.webp"
  static colour = "#8E9F80"
}
