import * as Brotli from "/js/libs/brotli/index.js"

const Base64Binary = {
  _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
  removePaddingChars(input) {
    if (this._keyStr.indexOf(input.charAt(input.length - 1)) === 64) return input.substring(0,input.length - 1)
    return input
  },
  decode(input, arrayBuffer) {
    input = this.removePaddingChars(input)
    input = this.removePaddingChars(input)
    const bytes = parseInt((input.length / 4) * 3, 10)
    let uarray, chr1, chr2, chr3, enc1, enc2, enc3, enc4, j = 0
    if (arrayBuffer) uarray = new Uint8Array(arrayBuffer)
    else uarray = new Uint8Array(bytes)
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "")
    for (let i = 0; i < bytes; i += 3) {  
      enc1 = this._keyStr.indexOf(input.charAt(j++))
      enc2 = this._keyStr.indexOf(input.charAt(j++))
      enc3 = this._keyStr.indexOf(input.charAt(j++))
      enc4 = this._keyStr.indexOf(input.charAt(j++))
      chr1 = (enc1 << 2) | (enc2 >> 4)
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
      chr3 = ((enc3 & 3) << 6) | enc4
      uarray[i] = chr1
      if (enc3 != 64) uarray[i+1] = chr2
      if (enc4 != 64) uarray[i+2] = chr3
    }
    return uarray
  }
}

export default class ColoursPage extends Page {
  constructor() {
    super("colours")
  }

  static tag = "colours-page"
  static title = "Colours - Ewan Howell"
  static description = "View a colour palette"

  async setData({c}) {
    await Brotli.default("/js/libs/brotli/index_bg.wasm")
    await this.ready
    if (!c) this.newState = `/colours/?c=${c = "GxcA+KVgzJIHQySJBxjuAQ=="}`
    c = c.replace(/ /g, "+")
    const container = this.$(".color-container")
    const colours = new TextDecoder().decode(Brotli.brotliDec(Base64Binary.decode(c)))
    for (const col of colours.match(/.{8}/g)) {
      const hex = `#${col.replace(/(.{6})(ff)/, "$1")}`
      container.append(
        E("div").addClass("colour").append(
          E("div").addClass("hex").css("background-color", hex).append(
            E("div").addClass("text").text(hex)
          )
        ).on("click", async e => {
          const input = this.$("#text-copier")
          input.val(hex).select()
          document.execCommand("Copy")
          input.blur()
          this.$(e.currentTarget).find(".text").text("copied...")
          await new Promise(fulfil => setTimeout(fulfil, 1000))
          this.$(e.currentTarget).find(".text").text(hex)
        })
      )
    }
  }

  onOpened() {
    if (this.newState) history.replaceState({}, null, this.newState)
  }
}