export async function loadImage(file) {
  const reader = new FileReader()
  reader.readAsDataURL(file)
  return await new Promise(fulfil => {
    reader.onloadend = e => {
      const img = new Image()
      img.src = e.target.result
      img.onload = _ => fulfil(img)
    }
  })
}

export class Canvas extends HTMLCanvasElement {
  constructor(width, height) {
    super()
    this.setAttribute("width", width)
    this.setAttribute("height", height)
  }

  addClass(classNames) {
    for (const className of classNames.split(" ")) this.classList.add(className)
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
}

customElements.define("skia-canvas", Canvas, { extends: "canvas" })

console.log(new Canvas(32, 64).addClass("test"))