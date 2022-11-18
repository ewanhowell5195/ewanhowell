import { popupImage } from "/js/popupImage.js"

function setInnerHTML(elm, html) {
  elm.innerHTML = html
  for (const oldScript of elm.querySelectorAll("script")) {
    const newScript = document.createElement("script")
    for (const attr of oldScript.attributes) {
      newScript.setAttribute(attr.name, attr.value)
    }
    newScript.appendChild(document.createTextNode(oldScript.innerHTML))
    oldScript.parentNode.replaceChild(newScript, oldScript)
  }
}

function setProgressFor(page) {
  const progressBar = $(".progress-bar", page.shadowRoot)
  return function(done, progress, total) {
    progressBar.css({
      width: (100 * progress / total).toFixed(4) + "%",
      height: !done * 4 + "px"
    })
  }
}

class PageBody extends HTMLElement {
  constructor() {
    super()
  }
}
customElements.define("page-body", PageBody)

class Page extends HTMLElement {
  constructor(path, hasStyle = true, onReady = () => {}) {
    super()
    this.path = path
    this.hasBeenConnected = false
    this.hasLoaded = false
    this.setProgress = () => {}
    this.attachShadow({mode: "open"})
    if (hasStyle) this.shadowRoot.append(
      E("link").attr("rel", "stylesheet").attr("href", `/pages/${this.path}/index.css`)[0]
    )
    this.ready = fetch(`/pages/${this.path}/`).then(e => e.text()).then(async content => {
      this.shadowBody = E("page-body")
      if (!supportsCBIE()) $(this.shadowBody).on("click", 'a[is="f-a"]', evt => {
        evt.preventDefault()
        openPage(new URL(evt.currentTarget.href), true)
      })
      this.shadowRoot.append(this.shadowBody[0])
      setInnerHTML(this.shadowBody[0], content)
      this.$ = (...args) => $(...args, this.shadowRoot)
      this.$(this.shadowBody).on("click", "img.popupable", e => popupImage(e.currentTarget.getAttribute("src"), e.currentTarget.getAttribute("scale")))
      await onReady(this.$)
      this.hasLoaded = true
      this.classList.remove("loading")
    })
  }

  connectedCallback() {
    if (!this.hasBeenConnected) {
      this.hasBeenConnected = true
      this.shadowRoot.append(
        E("style").text(`
          .progress-bar {
            position: absolute;
            top: 0;
            left: 0;
            background-color: var(--color-text-white);
            transition: width 100ms, height 250ms;
            z-index: 9999;
          }
          page-body {
            display: block;
            overflow-x: hidden;
          }
          img.popupable {
            cursor: pointer;
          }
          ::-webkit-scrollbar {
            width:10px;
          }
          ::-webkit-scrollbar-thumb {
            background-color: var(--color-red);
          }
          ::-webkit-scrollbar-thumb:hover {
            background-color: var(--color-red-light);
          }
          ::-webkit-scrollbar-thumb:hover:active {
            background-color: var(--color-red-dark);
          }
        `)[0],
        E("div").addClass("progress-bar")[0]
      )
      this.setProgress = setProgressFor(this)
      this.classList.add("page")
      if (!this.hasLoaded) this.classList.add("loading")
    }
  }

  async fetch(url) {
    this.setProgress(true, 0, 1)

    const response = await fetch(url)
    const reader = response.body.getReader()
    const contentLength = +response.headers.get("Content-Length")

    let receivedLength = 0
    let chunks = []
    while(true) {
      const {done, value} = await reader.read()

      if (done) {
        this.setProgress(true, receivedLength, contentLength)
        break
      }

      chunks.push(value)
      receivedLength += value.length

      this.setProgress(false, receivedLength, contentLength)
    }

    const chunksAll = new Uint8Array(receivedLength)
    let position = 0
    for(let chunk of chunks) {
      chunksAll.set(chunk, position)
      position += chunk.length
    }

    return {
      data: chunksAll,
      blob: () => new Blob([chunksAll]),
      text: () => new TextDecoder("utf-8").decode(chunksAll),
      arrayBuffer: () => chunksAll.buffer,
      json: () => JSON.parse(new TextDecoder("utf-8").decode(chunksAll))
    }
  }

  setData() {}
}

export { Page }