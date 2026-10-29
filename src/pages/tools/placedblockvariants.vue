<script setup>
  import { ref, shallowRef, reactive, computed } from "vue"
  import { saveAs } from "file-saver"
  import Page from "../../components/Page.vue"
  import FileInput from "../../components/FileInput.vue"
  import Icon from "../../components/Icon.js"
  import { site } from "../../lib/site.js"

  site.selected = null

  const MASK48 = (1n << 48n) - 1n, MUL = 25214903917n, INC = 11n
  class JRandom {
    constructor(seed) {
      this.seed = (BigInt(seed) ^ MUL) & MASK48
    }

    next(bits) {
      this.seed = (this.seed * MUL + INC) & MASK48
      return Number(this.seed >> BigInt(48 - bits))
    }

    nextInt(bound) {
      bound = bound | 0
      if (bound <= 0) throw new Error("bound must be positive")
      if ((bound & (bound - 1)) === 0) return Number((BigInt(bound) * BigInt(this.next(31))) >> 31n)
      let sample, modulo
      do {
        sample = this.next(31)
        modulo = sample % bound
      } while (((sample - modulo + (bound - 1)) | 0) < 0)
      return modulo
    }
  }

  function mthGetSeed(x, y, z) {
    const xi = BigInt(Math.imul(x, 3129871))
    let s = BigInt.asIntN(64, xi ^ (BigInt(z) * 116129781n) ^ BigInt(y))
    s = BigInt.asIntN(64, s * s * 42317861n + s * 11n)
    return s >> 16n
  }

  function gcd(a, b) {
    a = Math.abs(a)
    b = Math.abs(b)
    while (b) [a, b] = [b, a % b]
    return a
  }

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
    const pins = Array.from(slotToModel.entries()).map(([sel, model]) => ({ sel, model })).sort((a, b) => a.sel - b.sel)
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

  const SAVE_MODES = [["baked", "Config: baked in"], ["separate", "Config: separate file"], ["none", "Config: don't save"]]
  const CALC_SPEC = [["x"], ["y", Y_MIN, Y_MAX], ["z"], ["x"], ["y", Y_MIN, Y_MAX], ["z"]]

  const editorVisible = ref(false)
  const chipKeys = ref([])
  const currentState = ref(null)
  const configs = ref({})
  const singles = ref([])
  const regions = ref([])
  const output = shallowRef(null)
  const calcRegion = reactive(["-100", "-64", "-100", "100", "319", "100"])
  const calcResult = shallowRef(null)
  const calcBusy = ref(false)
  const calcBusyId = ref(null)

  let base = null
  let fileName = "blockstate"
  let configMode = "baked"
  let debounce
  let rowId = 0
  let renderId = 0

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

  function setField(row, field, e) {
    row[field] = e.currentTarget.value
    onEdit()
  }

  function clampField(row, field, e) {
    if (!clampInput(e.currentTarget, Y_MIN, Y_MAX)) return
    row[field] = e.currentTarget.value
    onEdit()
  }

  function removeRow(rows, row) {
    rows.splice(rows.indexOf(row), 1)
    onEdit()
  }

  function rowComplete(row, coordFields) {
    if (!row.model.trim()) return false
    return coordFields.every(f => {
      const v = row[f].trim()
      return v !== "" && Number.isInteger(+v)
    })
  }

  const singlesComplete = computed(() => singles.value.every(row => rowComplete(row, ["x", "y", "z"])))
  const regionsComplete = computed(() => regions.value.every(row => rowComplete(row, ["x1", "y1", "z1", "x2", "y2", "z2"])))

  function onEdit() {
    scheduleRun()
  }

  function addSingle(x = "", y = "", z = "", model = "") {
    singles.value.push({ id: rowId++, x: String(x), y: String(y), z: String(z), model })
  }

  function addRegion(from = ["", "", ""], to = ["", "", ""], model = "") {
    regions.value.push({ id: rowId++, x1: String(from[0]), y1: String(from[1]), z1: String(from[2]), x2: String(to[0]), y2: String(to[1]), z2: String(to[2]), model })
  }

  function readSingles() {
    const arr = []
    for (const row of singles.value) {
      const x = row.x.trim(), y = row.y.trim(), z = row.z.trim(), m = row.model.trim()
      if (x !== "" && y !== "" && z !== "" && m && [x, y, z].every(n => Number.isInteger(+n))) arr.push({ x: +x, y: clampY(+y), z: +z, model: m })
    }
    return arr
  }

  function readRegions() {
    const arr = []
    for (const row of regions.value) {
      const nums = [row.x1, row.y1, row.z1, row.x2, row.y2, row.z2].map(v => v.trim()), m = row.model.trim()
      if (m && nums.every(v => v !== "" && Number.isInteger(+v))) arr.push({ from: [+nums[0], clampY(+nums[1]), +nums[2]], to: [+nums[3], clampY(+nums[4]), +nums[5]], model: m })
    }
    return arr
  }

  function saveRows() {
    if (currentState.value === null) return
    const s = readSingles(), r = readRegions()
    if (s.length || r.length) configs.value[currentState.value] = { singles: s, regions: r }
    else delete configs.value[currentState.value]
  }

  function loadRows(key) {
    singles.value = []
    regions.value = []
    const cfg = configs.value[key] || { singles: [], regions: [] }
    for (const s of cfg.singles || []) addSingle(s.x, s.y, s.z, s.model)
    for (const r of cfg.regions || []) addRegion(r.from, r.to, r.model)
    if (!singles.value.length && !regions.value.length) addSingle()
  }

  function stateLabel(key) {
    return key === "" ? "(default)" : key
  }

  function hasConfig(key) {
    const cfg = configs.value[key]
    return !!(cfg && (cfg.singles?.length || cfg.regions?.length))
  }

  function selectChip(key) {
    if (key === currentState.value) return
    saveRows()
    currentState.value = key
    loadRows(key)
  }

  function message(text, cls) {
    output.value = { message: text, cls: cls || "note" }
  }

  function render(data) {
    const conflicts = data.states.flatMap(s => s.conflicts)
    output.value = {
      id: renderId++,
      data,
      mode: configMode,
      outText: JSON.stringify(data.result, null, 2),
      ok: data.totalConflicts === 0,
      stats: [
        ["States pinned", data.states.length.toLocaleString()],
        ["Target blocks", data.totalBlocks.toLocaleString()],
        data.totalBlocks > 20000 ? ["Heads up", "large blockstate"] : null,
        ["World leakage", "1 in " + (data.worstLeak === Infinity ? "0" : data.worstLeak.toLocaleString())]
      ].filter(Boolean),
      conflicts,
      entries: data.states.reduce((a, s) => a + s.entries, 0)
    }
    calcResult.value = null
  }

  function download() {
    saveAs(new Blob([output.value.outText], { type: "application/json" }), (fileName || "blockstate") + ".json")
  }

  function copy() {
    navigator.clipboard.writeText(output.value.outText)
  }

  function downloadConfig() {
    const cfgText = JSON.stringify(output.value.data.configFile, null, 2)
    saveAs(new Blob([cfgText], { type: "application/json" }), (fileName || "blockstate") + ".config.json")
  }

  function setMode(e) {
    configMode = e.currentTarget.value
    run()
  }

  function setCalc(i, e) {
    calcRegion[i] = e.currentTarget.value
  }

  function clampCalc(i, e) {
    const [, mn, mx] = CALC_SPEC[i]
    if (mn !== undefined && clampInput(e.currentTarget, mn, mx)) calcRegion[i] = e.currentTarget.value
  }

  async function runCalc() {
    if (calcBusy.value) return
    const data = output.value.data
    calcResult.value = null
    const vals = calcRegion.map(v => v.trim())
    if (!vals.every(v => v !== "" && Number.isInteger(+v))) {
      calcResult.value = { note: "Enter both corners." }
      return
    }
    const fx = [+vals[0], clampY(+vals[1]), +vals[2]], tx = [+vals[3], clampY(+vals[4]), +vals[5]]
    const b = { x1: Math.min(fx[0], tx[0]), x2: Math.max(fx[0], tx[0]), y1: Math.min(fx[1], tx[1]), y2: Math.max(fx[1], tx[1]), z1: Math.min(fx[2], tx[2]), z2: Math.max(fx[2], tx[2]) }
    const count = (b.x2 - b.x1 + 1) * (b.y2 - b.y1 + 1) * (b.z2 - b.z1 + 1)
    if (count > CALC_MAX) {
      calcResult.value = { note: "Region is " + count.toLocaleString() + " blocks, too big (max " + CALC_MAX.toLocaleString() + "). Shrink it." }
      return
    }

    const sd = data.states.map(s => ({ key: s.key, T: s.T, pinSlots: s.pinSlots, pinKeys: s.pinKeys, leaks: [] }))

    calcBusy.value = true
    calcBusyId.value = output.value.id
    let cancelled = false
    const progress = reactive({ progress: true, width: null, label: "0%", cancel: () => cancelled = true })
    calcResult.value = progress

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
        done += since
        since = 0
        const frac = Math.min(1, done / count)
        progress.width = (frac * 100).toFixed(1) + "%"
        progress.label = Math.round(frac * 100) + "%"
        if (cancelled) break
        await yieldUI()
      }
    }
    calcBusy.value = false
    calcBusyId.value = null
    if (calcResult.value !== progress) return
    if (cancelled) {
      calcResult.value = { note: "Cancelled." }
      return
    }

    const perState = sd.filter(s => s.leaks.length)
    const total = perState.reduce((a, s) => a + s.leaks.length, 0)
    calcResult.value = {
      text: total.toLocaleString() + " of " + count.toLocaleString() + " blocks in the region would show a pinned variant.",
      download: total ? () => {
        const lines = []
        for (const s of perState) {
          lines.push("# " + stateLabel(s.key) + ": " + s.leaks.length.toLocaleString() + " leaking blocks")
          for (const [x, y, z] of s.leaks) lines.push(x + " " + y + " " + z)
        }
        saveAs(new Blob([lines.join("\n")], { type: "text/plain" }), (fileName || "blockstate") + ".leaks.txt")
      } : null
    }
  }

  function run() {
    if (!base) return message("Upload a blockstate to begin.")
    saveRows()
    let data
    try {
      data = generate(base, configs.value, configMode)
    } catch (e) {
      return message(e.message, "errors-inline")
    }
    if (data.empty) return message("Add a block or region to a state to begin.")
    render(data)
  }

  function scheduleRun() {
    clearTimeout(debounce)
    debounce = setTimeout(run, 250)
  }

  function loadFile(json, name) {
    fileName = name || "blockstate"
    if (json && json.placedVariantsConfig && json.original) {
      base = clone(json.original)
      delete base._placed_variants
      configs.value = clone(json.states || {})
      configMode = "separate"
    } else if (json && json.variants) {
      base = clone(json)
      delete base._placed_variants
      if (json._placed_variants) {
        const src = json._placed_variants
        configs.value = clone(src.states || {})
        const orig = src.original && src.original.variants ? src.original.variants : {}
        for (const key of Object.keys(orig)) base.variants[key] = clone(orig[key])
        configMode = "baked"
      } else {
        configs.value = {}
      }
    } else {
      base = null
      editorVisible.value = false
      return message('That file has no "variants" object. Multipart blockstates are not supported.', "errors-inline")
    }
    if (!base.variants || typeof base.variants !== "object" || Array.isArray(base.variants)) {
      base = null
      editorVisible.value = false
      return message('That file has no "variants" object. Multipart blockstates are not supported.', "errors-inline")
    }
    currentState.value = Object.keys(base.variants)[0] ?? null
    editorVisible.value = true
    chipKeys.value = Object.keys(base.variants)
    loadRows(currentState.value)
    run()
  }

  function onAddSingle() {
    if (singlesComplete.value) addSingle()
  }

  function onAddRegion() {
    if (regionsComplete.value) addRegion()
  }

  async function onFiles(files) {
    if (!files || !files.length) return
    let json
    try {
      json = JSON.parse(await files[0].text())
    } catch (err) {
      return message("Could not read that file as JSON: " + (err.message || err), "errors-inline")
    }
    loadFile(json, files[0].name.replace(/\.json$/i, "").replace(/\.config$/i, ""))
  }
</script>

<template>
  <Page>
    <div class="container">
      <h1>Placed Block Variants</h1>
      <p>This is a tool that forces the blocks at specific coordinates to render a variant of your choice, using only one block. Each coordinate can be given its own model, so the same block type renders differently depending on where it is placed.</p>
      <p>You start from the block's real blockstate file, and it weaves your variants into the ones already there, so every other block in the world keeps its normal look. It works out the weighting for you, and saves your list of blocks inside the blockstate so you can load it back in and edit it later.</p>
      <details class="how">
        <summary>How it works</summary>
        <p>When a block's model has several weighted variants, the game picks one at random. A placed block uses its position as the starting point for that pick, so the choice is fixed for each coordinate but looks random across the world. This tool works out which slot each coordinate lands on and gives that slot your chosen model.</p>
        <p>To keep every other block in the world looking normal, it stretches the blockstate's existing variants across the whole range and carves out a tiny slot for each coordinate you pin. A random block elsewhere has only about a one in a few hundred million chance of showing one of your variants.</p>
        <p>A blockstate can hold several states (like a log's <code>axis=x</code>, <code>axis=y</code> and <code>axis=z</code>). You pick a state with the tabs and give it its own list of blocks, so each state can pin different coordinates.</p>
        <p>This is fragile: the blocks must stay at exactly these coordinates, and it only affects how they look. You can save your list of coordinates and the original blockstate baked into the blockstate or as a separate file, then upload that here again to make changes.</p>
      </details>
      <br>
      <p>Upload the blockstate file you want to apply variants to:</p>
      <FileInput accept=".json,application/json" :class="{ generating: calcBusy }" @change="onFiles" />
      <div id="editor" :class="{ hidden: !editorVisible, generating: calcBusy }">
        <h3>State</h3>
        <p>Pick which blockstate to pin coordinates on. Each state keeps its own list.</p>
        <div id="state-chips">
          <div v-for="key in chipKeys" :key="key" class="state-chip" :class="{ selected: key === currentState, 'has-config': hasConfig(key) }" @click="selectChip(key)">{{ stateLabel(key) }}</div>
        </div>
        <h3>Single blocks</h3>
        <div id="single-rows">
          <div v-for="row in singles" :key="row.id" class="single-row">
            <input class="sx" type="number" placeholder="x" :value="row.x" @input="setField(row, 'x', $event)">
            <input class="sy" type="number" placeholder="y" :min="Y_MIN" :max="Y_MAX" :value="row.y" @input="setField(row, 'y', $event)" @blur="clampField(row, 'y', $event)">
            <input class="sz" type="number" placeholder="z" :value="row.z" @input="setField(row, 'z', $event)">
            <span class="row-sep"></span>
            <input class="smodel" type="text" placeholder="model" :value="row.model" @input="setField(row, 'model', $event)">
            <div class="remove-row" @click="removeRow(singles, row)"><Icon name="close" /></div>
          </div>
        </div>
        <div class="button" :class="{ disabled: !singlesComplete }" id="add-single" @click="onAddSingle">
          <span>Add block</span>
        </div>
        <h3>Regions</h3>
        <p>Every block inside the region gets the model. Give the two opposite corners.</p>
        <div id="region-rows">
          <div v-for="row in regions" :key="row.id" class="region-row">
            <span class="region-label">from</span>
            <input class="rx1" type="number" placeholder="x" :value="row.x1" @input="setField(row, 'x1', $event)">
            <input class="ry1" type="number" placeholder="y" :min="Y_MIN" :max="Y_MAX" :value="row.y1" @input="setField(row, 'y1', $event)" @blur="clampField(row, 'y1', $event)">
            <input class="rz1" type="number" placeholder="z" :value="row.z1" @input="setField(row, 'z1', $event)">
            <span class="region-label">to</span>
            <input class="rx2" type="number" placeholder="x" :value="row.x2" @input="setField(row, 'x2', $event)">
            <input class="ry2" type="number" placeholder="y" :min="Y_MIN" :max="Y_MAX" :value="row.y2" @input="setField(row, 'y2', $event)" @blur="clampField(row, 'y2', $event)">
            <input class="rz2" type="number" placeholder="z" :value="row.z2" @input="setField(row, 'z2', $event)">
            <span class="row-sep"></span>
            <input class="rmodel" type="text" placeholder="model" :value="row.model" @input="setField(row, 'model', $event)">
            <div class="remove-row" @click="removeRow(regions, row)"><Icon name="close" /></div>
          </div>
        </div>
        <div class="button" :class="{ disabled: !regionsComplete }" id="add-region" @click="onAddRegion">
          <span>Add region</span>
        </div>
      </div>
      <div id="output">
        <div v-if="output?.message !== undefined" :class="output.cls">{{ output.message }}</div>
        <template v-else-if="output">
          <div class="verdict" :class="output.ok ? 'ok' : 'err'">{{ output.ok ? "Every one of the " + output.data.totalBlocks.toLocaleString() + " target blocks is pinned to its variant, merged into the base blockstate." : output.data.totalConflicts + " block(s) clashed on a slot and could not be pinned (see below). The rest are fine." }}</div>
          <div class="stats">
            <div v-for="[k, v] in output.stats" :key="k" class="stat">
              <div class="stat-key">{{ k }}</div>
              <div class="stat-value">{{ v }}</div>
            </div>
          </div>
          <div v-if="output.conflicts.length" class="errors">
            <h2>Slot clashes</h2>
            <ul>
              <li v-for="c in output.conflicts.slice(0, 10)" :key="c.coord">({{ c.coord }}) wanted {{ c.model }}</li>
              <li v-if="output.conflicts.length > 10">and {{ output.conflicts.length - 10 }} more</li>
            </ul>
          </div>
          <div class="buttons">
            <div class="button-download" @click="download">
              <Icon name="download" />
              <span>Download</span>
            </div>
            <div class="button" @click="copy">
              <Icon name="content_copy" />
              <span>Copy</span>
            </div>
            <div v-if="output.mode === 'separate' && output.data.configFile" class="button" @click="downloadConfig">
              <Icon name="download" />
              <span>Download config</span>
            </div>
            <label class="save-mode">
              <select :key="output.id" class="save-mode-select" @change="setMode">
                <option v-for="[val, label] in SAVE_MODES" :key="val" :value="val" :selected="val === output.mode">{{ label }}</option>
              </select>
            </label>
          </div>
          <div v-if="output.mode === 'none'" class="config-warning">With no saved config this blockstate is very hard to edit again: the weighting is baked into the raw variants and cannot be read back into this tool. Keep a baked or separate config if you might change these blocks later.</div>
          <textarea v-if="output.entries <= PREVIEW_MAX" :key="output.id" class="result-json" spellcheck="false" readonly :value="output.outText"></textarea>
          <div v-else class="note">Output is {{ output.entries.toLocaleString() }} entries, too large to preview. Use Download.</div>
          <div :key="output.id" class="calc">
            <h3>Leak calculator</h3>
            <p class="field-hint">Find which blocks in a region would show a pinned variant if placed there. Give two opposite corners.</p>
            <div class="calc-row">
              <template v-for="([ph, mn, mx], i) in CALC_SPEC" :key="i">
                <span v-if="i === 0" class="region-label">from</span>
                <span v-if="i === 3" class="region-label">to</span>
                <input class="calc-in" type="number" :placeholder="ph" :min="mn" :max="mx" :value="calcRegion[i]" :disabled="calcBusyId === output.id" @input="setCalc(i, $event)" @blur="clampCalc(i, $event)">
              </template>
            </div>
            <div class="button" :class="{ generating: calcBusyId === output.id }" @click="runCalc">
              <span>Calculate</span>
            </div>
            <div class="calc-result">
              <template v-if="calcResult">
                <div v-if="calcResult.note" class="note">{{ calcResult.note }}</div>
                <template v-else-if="calcResult.progress">
                  <div class="progress">
                    <div class="progress-fill" :style="calcResult.width && { width: calcResult.width }"></div>
                  </div>
                  <div class="progress-text">{{ calcResult.label }}</div>
                  <div class="button" @click="calcResult.cancel">
                    <span>Cancel</span>
                  </div>
                </template>
                <template v-else>
                  <div>{{ calcResult.text }}</div>
                  <div v-if="calcResult.download" class="button" @click="calcResult.download">
                    <Icon name="download" />
                    <span>Download leak list</span>
                  </div>
                </template>
              </template>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Page>
</template>

<style lang="stylus" scoped>
  @import "../../styles/buttons.styl"

  .container
    max-width: calc(var(--content-width) + 40px)
    margin: 0 auto
    min-height: calc(100% - var(--header-height))
    padding: 0 20px
    display: flex
    flex-direction: column

  h1
    margin: 0
    padding: 22px 0 0

  h3
    margin: 24px 0 10px

  p
    white-space: pre-wrap

  a
    color: var(--color-link-blue)

  code
    font-family: monospace
    background-color: var(--color-grey-dark)
    padding: 1px 5px

  input
    background-color: #fff
    border: none
    color: #000
    padding: 8px 10px
    font-family: Arial
    font-size: 1rem

    &:focus
      outline: 2px solid var(--color-link-blue)

  .how
    background-color: var(--color-grey)
    box-shadow: var(--box-shadow)
    margin-top: 20px
    padding: 12px 16px

    summary
      cursor: pointer
      font-weight: 700
      user-select: none

    p
      margin: 12px 0 0

  .hidden
    display: none

  #state-chips
    display: flex
    flex-wrap: wrap
    gap: 8px
    margin-bottom: 4px

  .state-chip
    background-color: var(--color-grey)
    box-shadow: var(--box-shadow)
    padding: 8px 14px
    cursor: pointer
    user-select: none
    font-family: monospace
    transition: filter .15s
    border: 2px solid transparent

    &:hover
      filter: brightness(1.3)

    &.selected
      border-color: var(--color-link-blue)

    &.has-config::after
      content: ""
      display: inline-block
      width: 7px
      height: 7px
      margin-left: 8px
      border-radius: 50%
      background-color: var(--color-accent)
      vertical-align: middle

  #single-rows, #region-rows
    display: flex
    flex-direction: column
    gap: 10px
    margin-bottom: 12px

  .single-row, .region-row
    display: flex
    align-items: center
    gap: 8px
    flex-wrap: wrap

    input[type = "number"]
      width: 80px

    .smodel, .rmodel
      flex: 1
      min-width: 200px

  .field-hint
    font-size: .85rem
    opacity: .6
    margin: 10px 0 0

  .region-label
    font-weight: 700
    opacity: .7

  .row-sep
    width: 2px
    height: 28px
    flex-shrink: 0
    background-color: var(--color-grey-lighter)
    margin: 0 6px

  .remove-row
    background-color: var(--color-grey)
    box-shadow: var(--box-shadow)
    width: 34px
    height: 34px
    flex-shrink: 0
    display: flex
    align-items: center
    justify-content: center
    cursor: pointer
    user-select: none
    transition: filter .15s

    &:hover
      filter: brightness(1.3)

    .icon
      font-size: 18px
      color: var(--color-text-white)

  #add-single, #add-region
    display: inline-flex
    align-self: flex-start

    &.disabled
      opacity: .5
      pointer-events: none

  #output
    padding: 20px 0 40px
    display: flex
    flex-direction: column
    gap: 20px
    align-items: flex-start

  .note
    opacity: .8

  .verdict
    margin-top: 30px
    padding: 10px 14px
    width: 100%
    border: 2px dashed var(--color-accent)

    &.err
      border-color: var(--color-red-light)

  .stats
    display: grid
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr))
    gap: 12px
    width: 100%

  .stat
    background-color: var(--color-grey)
    padding: 12px
    box-shadow: var(--box-shadow)

    .stat-key
      font-size: .8rem
      opacity: .6
      text-transform: uppercase
      letter-spacing: .05em

    .stat-value
      font-size: 1.1rem
      margin-top: 2px
      word-break: break-word

  .buttons
    display: flex
    gap: 12px
    flex-wrap: wrap
    align-items: center

  .save-mode
    display: flex
    align-items: center

  .save-mode-select
    background-color: #fff
    color: #000
    border: none
    padding: 8px 10px
    font-family: Arial
    font-size: 1rem
    cursor: pointer

    &:focus
      outline: 2px solid var(--color-link-blue)

  .config-warning
    width: 100%
    padding: 10px 14px
    border: 2px dashed var(--color-red-light)

  .calc
    width: 100%
    background-color: var(--color-grey)
    box-shadow: var(--box-shadow)
    padding: 12px 16px

    h3
      margin: 0 0 4px

    .field-hint
      margin: 0 0 12px

  .calc-row
    display: flex
    align-items: center
    gap: 8px
    flex-wrap: wrap
    margin-bottom: 12px

  .calc-in
    width: 80px

  .calc-result
    display: flex
    flex-direction: column
    gap: 12px
    align-items: flex-start

    &:not(:empty)
      margin-top: 12px

  .generating
    pointer-events: none
    opacity: .55

  .progress
    width: 100%
    height: 22px
    background-color: var(--color-grey-dark)
    box-shadow: var(--box-shadow)
    overflow: hidden

  .progress-fill
    height: 100%
    width: 0
    background-color: var(--color-accent)
    transition: width .1s linear

  .progress-text
    opacity: .8
    font-variant-numeric: tabular-nums

  .result-json
    width: 100%
    min-height: 320px
    background-color: var(--color-grey)
    color: var(--color-text-white)
    border: none
    box-shadow: var(--box-shadow)
    padding: 12px
    font-family: monospace
    font-size: .8rem
    resize: vertical
    white-space: pre

  .errors, .errors-inline
    background-color: var(--color-grey)
    padding: 12px 16px
    box-shadow: var(--box-shadow)
    width: 100%

    h2
      margin: 0 0 8px
      font-size: 1.1rem

    ul
      margin: 0
      padding-left: 20px
</style>
