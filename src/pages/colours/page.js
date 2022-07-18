import { Page } from "/js/pages.js"
import * as Brotli from "/js/brotli/index.js"

await Brotli.default("/js/brotli/index_bg.wasm")

const Base64Binary = {
  _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

  removePaddingChars(input) {
    if (this._keyStr.indexOf(input.charAt(input.length - 1)) === 64) return input.substring(0,input.length - 1)
    return input
  },

  decode(input, arrayBuffer) {
    input = this.removePaddingChars(input);
    input = this.removePaddingChars(input);

    var bytes = parseInt((input.length / 4) * 3, 10);
    
    var uarray;
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    var j = 0;
    
    if (arrayBuffer)
      uarray = new Uint8Array(arrayBuffer);
    else
      uarray = new Uint8Array(bytes);
    
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    
    for (i = 0; i < bytes; i += 3) {  
      enc1 = this._keyStr.indexOf(input.charAt(j++));
      enc2 = this._keyStr.indexOf(input.charAt(j++));
      enc3 = this._keyStr.indexOf(input.charAt(j++));
      enc4 = this._keyStr.indexOf(input.charAt(j++));
  
      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;
  
      uarray[i] = chr1;     
      if (enc3 != 64) uarray[i+1] = chr2;
      if (enc4 != 64) uarray[i+2] = chr3;
    }
  
    return uarray;  
  }
}

class ColoursPage extends Page {
  constructor() {
    super("colours")
  }
  async setData({c}) {
    await this.ready
    if (!c) {
      c = "GxcA+KVgzJIHQySJBxjuAQ=="
      history.replaceState({}, null, `/colours/?c=${c}`)
    }
    c = c.replace(/ /g, "+")
    const container = this.$(".color-container")
    const colours = new TextDecoder().decode(Brotli.brotliDec(Base64Binary.decode(c)))
    for (const col of colours.match(/.{8}/g)) {
      container.append(E("div").addClass("colour").css("background-color", `#${col}`))
    }
  }
}

customElements.define("colours-page", ColoursPage)

export { ColoursPage }