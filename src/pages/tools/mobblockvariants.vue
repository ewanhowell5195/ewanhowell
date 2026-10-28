<script setup>
  import { ref, computed } from "vue"
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

  function gcd(a, b) {
    a = Math.abs(a)
    b = Math.abs(b)
    while (b) [a, b] = [b, a % b]
    return a
  }

  const TYPES = {
    snow_golem: {
      name: "Snow Golem",
      block: "carved_pumpkin",
      defaultModel: "minecraft:block/carved_pumpkin_snow_golem",
      state: { facing: "north" },
      isolate: { property: "facing", values: ["north", "east", "south", "west"] },
      placedLabel: "north placed block"
    },
    mooshroom_red: {
      name: "Mooshroom (Red)",
      block: "red_mushroom",
      defaultModel: "minecraft:block/red_mushroom_mooshroom",
      state: {},
      isolate: null,
      placedLabel: "placed block"
    },
    mooshroom_brown: {
      name: "Mooshroom (Brown)",
      block: "brown_mushroom",
      defaultModel: "minecraft:block/brown_mushroom_mooshroom",
      state: {},
      isolate: null,
      placedLabel: "placed block"
    },
    iron_copper_golem: {
      name: "Iron / Copper Golem",
      block: "poppy",
      defaultModel: "minecraft:block/poppy_golem",
      state: {},
      isolate: null,
      placedLabel: "placed block"
    },
    enderman: {
      name: "Enderman",
      block: "grass_block",
      custom: true,
      defaultModel: "minecraft:block/grass_block_enderman",
      defaultStateValues: [["snowy", "false"]],
      isolate: null,
      placedLabel: "placed block in its default blockstate"
    }
  }

  function keyMatches(key, state) {
    const t = key.trim()
    if (t === "") return true
    return t.split(",").every(part => {
      const [p, v] = part.split("=").map(s => s.trim())
      return state[p] === v
    })
  }

  function keyPinsState(key, state) {
    const parts = key.trim().split(",")
    return Object.entries(state).every(([p, v]) => parts.some(part => {
      const [kp, kv] = part.split("=").map(s => s.trim())
      return kp === p && kv === v
    }))
  }

  function matchStateKey(variants, state, typeName) {
    const keys = Object.keys(variants)
    const matches = keys.filter(k => keyMatches(k, state))
    if (!matches.length) {
      const desc = Object.keys(state).length ? Object.entries(state).map(([p, v]) => p + "=" + v).join(",") : "the default state"
      throw new Error("Could not find a variant matching the " + typeName + " state (" + desc + "). Keys present: " + keys.join(", "))
    }
    matches.sort((a, b) => (b.trim() ? b.split(",").length : 0) - (a.trim() ? a.split(",").length : 0))
    return matches[0]
  }

  function generate(jsonData, model, rarity, type, customState) {
    if (!jsonData || typeof jsonData !== "object") throw new Error("Invalid JSON.")
    const variants = jsonData.variants
    if (!variants || typeof variants !== "object" || Array.isArray(variants)) throw new Error('This file has no "variants" object. Multipart blockstates are not supported.')
    if (!model) throw new Error("Enter a model ID for the mob's variant.")

    const targetState = type.custom ? (customState || {}) : type.state
    const key = matchStateKey(variants, targetState, type.name)

    const raw = variants[key]
    const originals = (Array.isArray(raw) ? raw : [raw]).map(v => {
      const o = Object.assign({}, v)
      let w = o.weight === undefined ? 1 : o.weight
      if (!Number.isInteger(w) || w < 1) throw new Error("Found a non-positive or non-integer weight in " + key)
      delete o.weight
      return { obj: o, weight: w }
    })

    const g = originals.reduce((acc, e) => gcd(acc, e.weight), 0)
    if (g > 1) originals.forEach(e => e.weight /= g)

    const S = originals.reduce((a, e) => a + e.weight, 0)
    const R = Math.max(1, Math.floor(rarity) || 1)
    const k = Math.max(1, Math.ceil((R - 1) / S))
    const scaled = originals.map(e => ({ obj: e.obj, weight: e.weight * k }))
    const T = k * S + 1
    const sel = new JRandom(42).nextInt(T)

    const mob = { model }
    const list = []
    let cum = 0, inserted = false
    for (const e of scaled) {
      if (!inserted && cum === sel) {
        list.push({ obj: mob, weight: 1, mob: true })
        inserted = true
      }
      if (!inserted && cum < sel && sel < cum + e.weight) {
        list.push({ obj: e.obj, weight: sel - cum })
        list.push({ obj: mob, weight: 1, mob: true })
        list.push({ obj: e.obj, weight: cum + e.weight - sel })
        inserted = true
      } else {
        list.push({ obj: e.obj, weight: e.weight })
      }
      cum += e.weight
    }
    if (!inserted) list.push({ obj: mob, weight: 1, mob: true })

    const rng = new JRandom(42)
    const vSel = rng.nextInt(T)
    let c = 0, chosen = -1
    for (let i = 0; i < list.length; i++) {
      c += list[i].weight
      if (vSel < c) {
        chosen = i
        break
      }
    }
    const ok = chosen >= 0 && list[chosen].mob === true

    const outArr = list.map(e => {
      const o = Object.assign({}, e.obj)
      if (e.weight !== 1) o.weight = e.weight
      return o
    })

    const result = JSON.parse(JSON.stringify(jsonData))
    let splitNote = ""
    if (!type.isolate || keyPinsState(key, type.state)) {
      result.variants[key] = outArr
    } else {
      const prop = type.isolate.property
      const targetVal = type.state[prop]
      const original = jsonData.variants[key]
      delete result.variants[key]
      const survivors = Object.keys(result.variants)
      result.variants[prop + "=" + targetVal] = outArr
      for (const val of type.isolate.values) {
        if (val === targetVal) continue
        if (!survivors.some(kk => keyMatches(kk, { [prop]: val }))) result.variants[prop + "=" + val] = JSON.parse(JSON.stringify(original))
      }
      splitNote = key === "" ? '"" (catch-all)' : key
    }

    return { result, key, splitNote, originals: originals.length, k, T, vSel, ok, chosen }
  }

  const typeKey = ref("snow_golem")
  const type = computed(() => TYPES[typeKey.value])
  const model = ref(TYPES.snow_golem.defaultModel)
  const rarity = ref("20000")
  const rows = ref([])
  const output = ref(null)
  const stateHint = ref("")
  let jsonData = null
  let modelEdited = false
  let stateEdited = false
  let rowId = 0
  let renderId = 0

  const rowsComplete = computed(() => rows.value.every(row => row.prop.trim() && row.val.trim()))

  function onRowChange() {
    stateEdited = true
    run()
  }

  function setRow(row, field, e) {
    row[field] = e.currentTarget.value
    onRowChange()
  }

  function removeRow(row) {
    rows.value.splice(rows.value.indexOf(row), 1)
    onRowChange()
  }

  function setStateRows(values) {
    rows.value = values.map(([prop, val]) => ({ id: rowId++, prop, val }))
  }

  function addRow() {
    if (!rowsComplete.value) return
    stateEdited = true
    rows.value.push({ id: rowId++, prop: "", val: "" })
  }

  function getCustomState() {
    const state = {}
    for (const row of rows.value) {
      const p = row.prop.trim()
      const v = row.val.trim()
      if (p) state[p] = v
    }
    return state
  }

  function showError(msg) {
    output.value = { error: msg }
  }

  function render(data) {
    const t = type.value
    output.value = {
      id: renderId++,
      data,
      type: t,
      jsonText: JSON.stringify(data.result, null, 2),
      stats: [
        ["Mob", t.name],
        ["Matched state", data.key === "" ? '"" (only state)' : data.key],
        data.splitNote ? ["Isolated from", data.splitNote] : null,
        ["Original variants", data.originals],
        ["Weight scale", "x" + data.k],
        ["Total weight", data.T],
        ["Seed-42 slot", data.vSel],
        ["Chance on a " + t.placedLabel, "1 in " + data.T.toLocaleString()]
      ].filter(Boolean)
    }
  }

  function run() {
    if (!jsonData) return
    let data
    try {
      data = generate(jsonData, model.value.trim(), parseInt(rarity.value), type.value, getCustomState())
    } catch (e) {
      return showError(e.message)
    }
    render(data)
  }

  function selectType(key) {
    const t = TYPES[key]
    typeKey.value = key
    if (!modelEdited) model.value = t.defaultModel || ""
    if (t.custom && !stateEdited) setStateRows(t.defaultStateValues || [])
    if (t.custom) stateHint.value = "The " + t.name + " renders whatever block it holds, so enter that block's default state below as property = value pairs. Leave it empty for a block with no properties."
    run()
  }

  async function onFiles(files) {
    if (!files || !files.length) return
    try {
      jsonData = JSON.parse(await files[0].text())
    } catch (err) {
      jsonData = null
      return showError("Could not read that file as JSON: " + (err.message || err))
    }
    run()
  }

  function onModelInput(e) {
    model.value = e.currentTarget.value
    modelEdited = true
    run()
  }

  function onRarityInput(e) {
    rarity.value = e.currentTarget.value
    run()
  }

  function download() {
    saveAs(new Blob([output.value.jsonText], { type: "application/json" }), (output.value.type.block || "blockstate") + ".json")
  }

  function copy() {
    navigator.clipboard.writeText(output.value.jsonText)
  }
</script>

<template>
  <Page>
    <div class="container">
      <h1>Mob Block Variants</h1>
      <p>This is a tool that edits a block's blockstate so that a chosen mob always shows a variant of your choice, while that variant stays almost impossible to see on a placed block.</p>
      <p>Several mobs render a block model on themselves using a fixed seed of 42, so every mob of a given type picks the same weighted variant. This tool inserts your variant at that exact slot, scales the existing weights so it is rare on placed blocks, and keeps the original weighting intact.</p>
      <details class="how">
        <summary>How it works</summary>
        <p>When a block's model has several weighted variants, the game picks one at random. A placed block uses its position in the world as the starting point for that pick, so blocks come out nicely varied. These mobs instead always use the same fixed starting point, a seed of 42, so every mob of a type makes the identical pick and they all end up showing the same variant.</p>
        <p>This tool adds your variant to the list and tunes the weights so that fixed pick always lands on it, while giving it such a small weight that it almost never turns up on a placed block. Your existing variants keep their relative chances, so normal blocks look the same as before.</p>
        <p>Each mob shows a different block: snow golems use <code>carved_pumpkin</code>, mooshrooms use <code>red_mushroom</code> or <code>brown_mushroom</code>, and iron golems and copper golems both use <code>poppy</code>. Endermen show whatever block they are holding, so the same trick works on that block.</p>
      </details>
      <br>
      <h3>Mob</h3>
      <div class="types">
        <div v-for="(t, key) in TYPES" :key="key" class="type-option" :class="{ selected: key === typeKey }" :data-type="key" @click="selectType(key)">{{ t.name }}</div>
      </div>
      <div class="default-state" :class="{ hidden: !type.custom }" id="default-state">
        <h3>Block default state</h3>
        <p id="default-state-hint">{{ stateHint }}</p>
        <div id="state-rows">
          <div v-for="row in rows" :key="row.id" class="state-row">
            <input class="state-prop" placeholder="property" :value="row.prop" @input="setRow(row, 'prop', $event)">
            <span class="state-eq">=</span>
            <input class="state-val" placeholder="value" :value="row.val" @input="setRow(row, 'val', $event)">
            <div class="remove-row" @click="removeRow(row)"><Icon name="close" /></div>
          </div>
        </div>
        <div class="button" :class="{ disabled: !rowsComplete }" id="add-row" @click="addRow">
          <span>Add property</span>
        </div>
      </div>
      <p id="file-hint">Please provide a <code>{{ type.block }}</code> blockstate JSON file<template v-if="type.custom">, or the blockstate of another block the {{ type.name.toLowerCase() }} holds</template>.</p>
      <FileInput accept=".json,application/json" @change="onFiles" />
      <div class="controls">
        <label>
          <span>Model to show on the mob</span>
          <input id="model" type="text" :value="model" @input="onModelInput">
        </label>
        <label>
          <span id="rarity-label">Rarity as a {{ type.placedLabel }} (1 in N)</span>
          <input id="rarity" type="number" :value="rarity" min="1" @input="onRarityInput">
        </label>
      </div>
      <div id="output">
        <div v-if="output?.error !== undefined" class="errors">
          <h2>Error</h2>
          <p>{{ output.error }}</p>
        </div>
        <template v-else-if="output">
          <div class="verdict" :class="output.data.ok ? 'ok' : 'err'">{{ output.data.ok ? `Verified: seed 42 selects slot ${output.data.vSel}, which is the added variant (index ${output.data.chosen}). Every ${output.type.name} will show it.` : `Verification failed (slot ${output.data.vSel}, index ${output.data.chosen}). Please report this.` }}</div>
          <div class="stats">
            <div v-for="[k, v] in output.stats" :key="k" class="stat">
              <div class="stat-key">{{ k }}</div>
              <div class="stat-value">{{ v }}</div>
            </div>
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
          </div>
          <textarea :key="output.id" class="result-json" spellcheck="false" readonly :value="output.jsonText"></textarea>
        </template>
      </div>
    </div>
  </Page>
</template>

<style lang="stylus" scoped>
  @import "../../styles/buttons.styl"

  .container
    max-width: var(--content-width)
    margin: 0 auto
    min-height: calc(100% - var(--header-height))
    padding: 0 20px
    display: flex
    flex-direction: column

  h1
    margin: 0
    padding: 22px 0 0

  h3
    margin: 20px 0 10px

  p
    white-space: pre-wrap

  a
    color: var(--color-link-blue)

  code
    font-family: monospace
    background-color: var(--color-grey-dark)
    padding: 1px 5px

  .how
    box-sizing: border-box
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

  .types
    display: flex
    flex-wrap: wrap
    gap: 10px
    margin-bottom: 20px

  .type-option
    box-sizing: border-box
    background-color: var(--color-grey)
    box-shadow: var(--box-shadow)
    padding: 10px 16px
    cursor: pointer
    user-select: none
    font-weight: 700
    transition: filter .15s, background-color .15s

    &:hover
      filter: brightness(1.2)

    &.selected
      background-color: var(--color-download)

  .hidden
    display: none

  .default-state
    margin-bottom: 20px

    p
      margin: 0 0 12px

  #state-rows
    display: flex
    flex-direction: column
    gap: 10px
    margin-bottom: 12px

  .state-row
    display: flex
    align-items: center
    gap: 8px

    input
      box-sizing: border-box
      background-color: #fff
      border: none
      color: #000
      padding: 8px 10px
      font-family: Arial
      font-size: 1rem
      width: 220px
      max-width: 40vw

      &:focus
        outline: 2px solid var(--color-link-blue)

    .state-eq
      font-weight: 700

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

  #add-row
    display: inline-flex

    &.disabled
      opacity: .5
      pointer-events: none

  .controls
    display: flex
    flex-wrap: wrap
    gap: 20px
    margin-top: 20px

    label
      display: flex
      flex-direction: column
      gap: 6px
      flex: 1
      min-width: 260px

    span
      font-weight: 700

    input
      box-sizing: border-box
      background-color: #fff
      border: none
      color: #000
      padding: 10px 12px
      font-family: Arial
      font-size: 1rem

      &:focus
        outline: 2px solid var(--color-link-blue)

  #output
    padding: 20px 0 40px
    display: flex
    flex-direction: column
    gap: 20px
    align-items: flex-start

  .verdict
    box-sizing: border-box
    margin-top: 30px
    padding: 10px 14px
    width: 100%
    border: 2px dashed var(--color-download)

    &.err
      border-color: var(--color-red-light)

  .stats
    display: grid
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr))
    gap: 12px
    width: 100%

  .stat
    box-sizing: border-box
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

  .result-json
    box-sizing: border-box
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

  .errors
    box-sizing: border-box
    background-color: var(--color-grey)
    padding: 12px 16px
    box-shadow: var(--box-shadow)
    width: 100%

    h2
      margin: 0 0 8px
      font-size: 1.1rem

    p
      margin: 0
</style>
