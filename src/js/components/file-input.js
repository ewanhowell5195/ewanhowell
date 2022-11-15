class FileInput extends HTMLElement {
  #files

  constructor() {
    super()
    let fileDrop, textContainer, fileDropInput
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
          min-width: 140px;
          color: var(--color-text-white);
          padding: 10px;
          background-color: var(--color-link-blue);
          align-items: center;
          font-weight: 700;
          box-shadow: 0 8px 5px rgba(0, 0, 0, .314);
          transition: filter .15s;
          filter: hue-rotate(-90deg);
          display: flex;
          gap: 4px;
          margin-right: 10px;
        }

        .file-drop.active > .file-drop-button {
          filter: hue-rotate(-100deg) brightness(1.2)
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
          E("img").attr("src", "../assets/images/svg/upload.svg"),
          E("span").text("Choose files")
        ),
        textContainer = E("span").addClass("file-drop-text").append().text("or drag and drop files here"),
        fileDropInput = E("input").addClass("file-drop-input").attr("type", "file").prop("multiple", true)
      )[0]
    )

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
      this.#files = Array.from(evt.dataTransfer.items).filter(e => e.kind === "file").map(e => e.getAsFile())
      fileChange(this)
    })

    this.addEventListener("dragover", evt => {
      evt.preventDefault()
    })

    fileDropInput.on("change", e => {
      this.#files = Array.from(e.currentTarget.files)
      fileChange(this)
    })
  }

  get files() {
    return this.#files
  }
}

customElements.define("file-input", FileInput)