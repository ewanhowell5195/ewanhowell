import "/js/libs/FileSaver.js"

export async function loadImage(file) {
  if (typeof file === "string") {
    return new Promise((fulfil, reject) => {
      const image = new Image()
      image.src = file
      image.onload = e => fulfil(image)
      image.onerror = reject
    })
  }
  const reader = new FileReader()
  reader.readAsDataURL(file)
  return await new Promise((fulfil, reject) => {
    reader.onloadend = e => {
      const image = new Image()
      image.onload = e => fulfil(image)
      image.src = e.target.result
      image.onerror = reject
    }
  })
}

export class Canvas extends HTMLCanvasElement {
  constructor(width, height, popupable, scale) {
    super()
    this.width = width
    this.height = height
    if (popupable) {
      this.classList.add("popupable")
      this.setAttribute("scale", scale)
    }
  }

  addClass(classNames) {
    this.classList.add(...classNames.trim().split(/\s+/))
    return this
  }

  on(event, func) {
    this.addEventListener(event, func)
    return this
  }

  appendTo(element) {
    if (element instanceof jQuery) element = element[0]
    element.appendChild(this)
    return this
  }

  saveAs(name, type = "png", quality = 1) {
    this.toBlob(blob => saveAs(blob, name), `image/${type}`, quality)
  }

  trim() {
    const ctx = this.getContext("2d")
    const imageData = ctx.getImageData(0, 0, this.width, this.height)
    let top = 0, bottom = imageData.height, left = 0, right = imageData.width
    while (top < bottom && rowBlank(imageData, this.width, top)) ++top
    while (bottom - 1 > top && rowBlank(imageData, this.width, bottom - 1)) --bottom
    while (left < right && columnBlank(imageData, this.width, left, top, bottom)) ++left
    while (right - 1 > left && columnBlank(imageData, this.width, right - 1, top, bottom)) --right
    if (top === bottom && bottom === left && left === right) {
      this.width = 1
      this.height = 1
      return this
    }
    const trimmed = ctx.getImageData(left, top, right - left, bottom - top);
    const copy = new Canvas(trimmed.width, trimmed.height)
    const copyCtx = copy.getContext("2d")
    copyCtx.putImageData(trimmed, 0, 0)
    this.width = copy.width
    this.height = copy.height
    ctx.clearRect(0, 0, this.width, this.height)
    ctx.drawImage(copy, 0, 0)
    return this
  }
}

customElements.define("ewan-canvas", Canvas, { extends: "canvas" })

function rowBlank(imageData, width, y) {
  for (let x = 0; x < width; ++x) if (imageData.data[y * width * 4 + x * 4 + 3] !== 0) return false
  return true
}

function columnBlank(imageData, width, x, top, bottom) {
  for (let y = top; y < bottom; ++y) if (imageData.data[y * width * 4 + x * 4 + 3] !== 0) return false
  return true
}