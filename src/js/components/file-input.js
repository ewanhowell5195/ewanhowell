class FileInput extends HTMLElement {
  #files
  #pasteHandler

  constructor() {
    super()
    let fileDrop, textContainer, fileDropInput
    const multiple = this.getAttribute("multiple")
    const fileLimit = parseInt(this.getAttribute("limit"))
    this.attachShadow({mode: "open"}).append(
      E("style").text(`
        .file-drop {
          position: relative;
          display: flex;
          align-items: center;
          padding: 25px;
          background-color: var(--color-grey);
          transition: background-color .15s;
          box-shadow: var(--box-shadow);
          user-select: none;
        }

        .file-drop.active {
          background-color: var(--color-grey-light);
        }

        .file-drop-button {
          min-width: 130px;
          color: var(--color-text-white);
          padding: 10px;
          background-color: var(--color-download);
          align-items: center;
          font-weight: 700;
          box-shadow: 0 8px 5px rgba(0, 0, 0, .314);
          transition: filter .15s;
          filter: hue-rotate(90deg);
          display: flex;
          gap: 4px;
          margin-right: 10px;
        }

        .file-drop-button > * {
          transition: transform .15s;
        }

        .file-drop.active > .file-drop-button {
          filter: hue-rotate(100deg) brightness(1.2)
        }

        .file-drop:active > .file-drop-button > * {
          transform: translateY(4px);
        }

        .file-drop-button > img {
          width: 28px;
          filter: invert() drop-shadow(-2px 2px 1px var(--color-svg-shadow));
        }

        .file-drop-button > span {
          text-shadow: -2px 2px 1px var(--color-text-shadow);
          letter-spacing: 1px;
        }

        .file-drop-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-drop-input {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          cursor: pointer;
          opacity: 0;
          z-index: 1;
        }
      `)[0],
      fileDrop = E("div").addClass("file-drop").append(
        E("span").addClass("file-drop-button").append(
          E("img").attr("src", "/../assets/images/svg/upload.svg"),
          E("span").text(`Choose file${multiple ? "s" : ""}`)
        ),
        textContainer = E("span").addClass("file-drop-text").append().text(`or drag and drop ${fileLimit ? `up to ${fileLimit}` : ""} ${multiple ? "files" : "a file"} here`),
        fileDropInput = E("input").addClass("file-drop-input").attr("type", "file")
      )[0]
    )

    if (multiple) fileDropInput.prop("multiple", true)

    $(fileDropInput).on({
      "dragenter focus click mouseenter": _ => fileDrop.classList.add("active"),
      "dragleave blur drop mouseleave": _ => fileDrop.classList.remove("active")
    })

    function fileChange(input) {
      if (input.files.length === 1) textContainer.text(input.files[0].name.split("\\").pop())
      else textContainer.text(`${input.files.length} files selected`)
      input.dispatchEvent(new Event("change"))
    }

    this.addEventListener("drop", evt => {
      evt.preventDefault()
      this.#files = Array.from(evt.dataTransfer.items).filter(e => e.kind === "file").map(e => e.getAsFile()).slice(0, !multiple ? 1 : fileLimit || Infinity)
      fileChange(this)
    })

    this.addEventListener("dragover", evt => {
      evt.preventDefault()
    })

    fileDropInput.on("change", e => {
      this.#files = Array.from(e.currentTarget.files).slice(0, fileLimit || Infinity)
      fileChange(this)
    })

    this.#pasteHandler = e => {
      this.#files = Array.from(e.clipboardData.files)
      if (!this.#files.length) return
      fileChange(this)
    }
  }

  connectedCallback() {
    window.addEventListener("paste", this.#pasteHandler)
  }

  disconnectedCallback() {
    window.removeEventListener("paste", this.#pasteHandler)
  }

  get files() {
    return this.#files
  }
}

customElements.define("file-input", FileInput)