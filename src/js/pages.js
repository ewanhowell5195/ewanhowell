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
customElements.define('page-body', PageBody)

class Page extends HTMLElement {
  constructor(name, hasStyle = true, onReady = () => {}) {
    super()
    this.name = name
    this.hasBeenConnected = false
    this.hasLoaded = false
    this.setProgress = () => {}
    this.attachShadow({mode: "open"})
    this.ready = fetch(`/pages/${this.name}/`).then(e => e.text()).then(async content => {
      this.shadowBody = E("page-body")
      if (!supportsCBIE()) {
        $(this.shadowBody).on("click", 'a[is="f-a"]', evt => {
          evt.preventDefault()
          openPage(new URL(evt.currentTarget.href), true)
        })
      }
      this.shadowRoot.append(this.shadowBody[0])
      setInnerHTML(this.shadowBody[0], content)
      this.shadowBody.append($("#footer-template").contents().clone(true))
      if (hasStyle) {
        this.shadowRoot.append(
          E('link').attr("rel", "stylesheet").attr("href", `/pages/${this.name}/index.css`)[0]
        )
      }
      this.$ = (...args) => $(...args, this.shadowRoot)
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
            background-color: #fcfcfc;
            transition: width 100ms, height 250ms;
            z-index: 9999;
          }
          page-body {
            display: block;
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
          }
          #footer-container {
            position: relative;
            background-color: var(--color-red);
            width: 100%;
            display: flex;
            justify-content: center;
            height: var(--header-height);
            box-shadow: 0 -10px 10px var(--color-box-shadow);
          }
          #footer {
            width: var(--content-width);
            display: flex;
          }
          #footer-spacer {
            flex: 1;
          }
          .footer-button {
            text-decoration: none;
            display: flex;
            align-items: center;
            color: white;
            font-weight: 700;
            letter-spacing: 1px;
            padding: 0 10px;
            transition: background-color .15s, padding .15s;
            user-select: none;
            fill: var(--color-text-white);
            gap: 5px;
            text-shadow: -2px 2px 1px var(--color-text-shadow)
          }
          .footer-button > svg {
            filter: drop-shadow(-2px 2px 1px var(--color-text-shadow));
          }
          .footer-button:hover {
            background-color: var(--color-red-light);
          }
          .footer-button:active {
            padding-top: 6px;
          }
          ::-webkit-scrollbar {
              width:10px
          }
          ::-webkit-scrollbar-thumb {
              background-color: var(--color-red)
          }
          ::-webkit-scrollbar-thumb:hover {
              background-color: var(--color-red-light)
          }
          ::-webkit-scrollbar-thumb:hover:active {
              background-color: var(--color-red-dark)
          }
        `)[0],
        E("div").addClass("progress-bar")[0]
      )
      this.setProgress = setProgressFor(this)
      this.classList.add("page")
      if (!this.hasLoaded) {
        this.classList.add("loading")
      }
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

export {
  Page
}
