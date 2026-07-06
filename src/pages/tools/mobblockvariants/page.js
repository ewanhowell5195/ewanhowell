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

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b] } return a }

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
  iron_golem: {
    name: "Iron Golem",
    block: "poppy",
    defaultModel: "minecraft:block/poppy_iron_golem",
    state: {},
    isolate: null,
    placedLabel: "placed block"
  },
  copper_golem: {
    name: "Copper Golem",
    block: "poppy",
    defaultModel: "minecraft:block/poppy_copper_golem",
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
    if (!inserted && cum === sel) { list.push({ obj: mob, weight: 1, mob: true }); inserted = true }
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
  for (let i = 0; i < list.length; i++) { c += list[i].weight; if (vSel < c) { chosen = i; break } }
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

export default class MobBlockVariantPage extends Page {
  constructor() {
    super("tools/mobblockvariants", true, $ => {
      const downloadIcon = $("#download-icon").contents()
      const copyIcon = $("#copy-icon").contents()
      const closeIcon = $("#close-icon").contents()
      const output = $("#output")
      const modelInput = $("#model")
      const rarityInput = $("#rarity")
      const rarityLabel = $("#rarity-label")
      const fileHint = $("#file-hint")
      const defaultState = $("#default-state")
      const defaultStateHint = $("#default-state-hint")
      const stateRows = $("#state-rows")
      let jsonData = null
      let currentType = TYPES.snow_golem
      let modelEdited = false
      let stateEdited = false

      function rowsComplete() {
        let ok = true
        stateRows.find(".state-row").each((i, row) => {
          if (!$(".state-prop", row).val().trim() || !$(".state-val", row).val().trim()) ok = false
        })
        return ok
      }

      function onRowChange() {
        stateEdited = true
        $("#add-row").toggleClass("disabled", !rowsComplete())
        run()
      }

      // programmatically fill the editor with a placeholder default state; does not count as a user edit
      function setStateRows(values) {
        stateRows.empty()
        for (const [p, v] of values) addStateRow(p, v)
        $("#add-row").toggleClass("disabled", !rowsComplete())
      }

      function addStateRow(prop = "", val = "") {
        const row = E("div").addClass("state-row").append(
          E("input").addClass("state-prop").attr("placeholder", "property").val(prop).on("input", onRowChange),
          E("span").addClass("state-eq").text("="),
          E("input").addClass("state-val").attr("placeholder", "value").val(val).on("input", onRowChange),
          E("div").addClass("remove-row").append(closeIcon.clone(true)).on("click", () => { row.remove(); onRowChange() })
        )
        stateRows.append(row)
        $("#add-row").toggleClass("disabled", !rowsComplete())
      }

      function getCustomState() {
        const state = {}
        stateRows.find(".state-row").each((i, row) => {
          const p = $(".state-prop", row).val().trim()
          const v = $(".state-val", row).val().trim()
          if (p) state[p] = v
        })
        return state
      }

      function updateTypeLabels() {
        rarityLabel.text("Rarity as a " + currentType.placedLabel + " (1 in N)")
        if (currentType.custom) {
          fileHint.html("Please provide a <code>" + currentType.block + "</code> blockstate JSON file, or the blockstate of another block the " + currentType.name.toLowerCase() + " holds.")
          defaultStateHint.text("The " + currentType.name + " renders whatever block it holds, so enter that block's default state below as property = value pairs. Leave it empty for a block with no properties.")
          defaultState.removeClass("hidden")
        } else {
          fileHint.html("Please provide a <code>" + currentType.block + "</code> blockstate JSON file.")
          defaultState.addClass("hidden")
        }
      }

      function showError(msg) {
        output.empty()
        E("div").addClass("errors").append(
          E("h2").text("Error"),
          E("p").text(msg)
        ).appendTo(output)
      }

      function render(data) {
        output.empty()
        const jsonText = JSON.stringify(data.result, null, 2)

        E("div").addClass("verdict " + (data.ok ? "ok" : "err")).text(
          data.ok
            ? `Verified: seed 42 selects slot ${data.vSel}, which is the added variant (index ${data.chosen}). Every ${currentType.name} will show it.`
            : `Verification failed (slot ${data.vSel}, index ${data.chosen}). Please report this.`
        ).appendTo(output)

        const stats = [
          ["Mob", currentType.name],
          ["Matched state", data.key === "" ? '"" (only state)' : data.key],
          data.splitNote ? ["Isolated from", data.splitNote] : null,
          ["Original variants", data.originals],
          ["Weight scale", "x" + data.k],
          ["Total weight", data.T],
          ["Seed-42 slot", data.vSel],
          ["Chance on a " + currentType.placedLabel, "1 in " + data.T.toLocaleString()]
        ].filter(Boolean)
        const grid = E("div").addClass("stats").appendTo(output)
        for (const [k, v] of stats) {
          E("div").addClass("stat").append(
            E("div").addClass("stat-key").text(k),
            E("div").addClass("stat-value").text(v)
          ).appendTo(grid)
        }

        E("div").addClass("buttons").append(
          E("div").addClass("button-download").append(
            downloadIcon.clone(true),
            E("span").text("Download")
          ).on("click", () => saveAs(new Blob([jsonText], { type: "application/json" }), (currentType.block || "blockstate") + ".json")),
          E("div").addClass("button").append(
            copyIcon.clone(true),
            E("span").text("Copy")
          ).on("click", () => navigator.clipboard.writeText(jsonText))
        ).appendTo(output)

        E("textarea").addClass("result-json").attr("spellcheck", "false").prop("readonly", true).val(jsonText).appendTo(output)
      }

      function run() {
        if (!jsonData) return
        let data
        try {
          data = generate(jsonData, modelInput.val().trim(), parseInt(rarityInput.val()), currentType, getCustomState())
        } catch (e) {
          return showError(e.message)
        }
        render(data)
      }

      $(".type-option").on("click", e => {
        const t = TYPES[e.currentTarget.dataset.type]
        if (!t) return
        currentType = t
        $(".type-option").removeClass("selected")
        $(e.currentTarget).addClass("selected")
        if (!modelEdited) modelInput.val(t.defaultModel || "")
        if (t.custom && !stateEdited) setStateRows(t.defaultStateValues || [])
        updateTypeLabels()
        run()
      })

      $("file-input").on("change", async e => {
        const files = e.currentTarget.files
        if (!files || !files.length) return
        try {
          jsonData = JSON.parse(await files[0].text())
        } catch (err) {
          jsonData = null
          return showError("Could not read that file as JSON: " + (err.message || err))
        }
        run()
      })

      $("#add-row").on("click", () => { if (rowsComplete()) { stateEdited = true; addStateRow() } })

      modelInput.on("input", () => { modelEdited = true; run() })
      rarityInput.on("input", run)
      updateTypeLabels()
    })
    $("a").removeClass("selected")
  }

  static tag = "mobblockvariants-page"
  static title = "Mob Block Variants - Ewan Howell"
  static description = "Make a mob always show a chosen block variant while keeping it extremely rare on placed blocks"
  static image = "minecraft/mobblockvariants.webp"
  static colour = "#4A6274"
}
