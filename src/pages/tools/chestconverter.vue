<script setup>
  import { shallowRef } from "vue"
  import Page from "../../components/Page.vue"
  import FileInput from "../../components/FileInput.vue"
  import Icon from "../../components/Icon.js"
  import { Canvas, loadImage } from "../../lib/canvas.js"
  import { site } from "../../lib/site.js"

  site.selected = null

  const message = shallowRef(null)
  const inputs = shallowRef([])
  const outputs = shallowRef([])
  let nextId = 0

  const vDraw = {
    mounted: draw,
    updated(el, binding) {
      if (binding.value !== binding.oldValue) draw(el, binding)
    }
  }

  function draw(el, { value }) {
    el.width = value.width
    el.height = value.height
    el.getContext("2d").drawImage(value, 0, 0)
  }

  async function onChange(fileList) {
    message.value = null
    inputs.value = []
    outputs.value = []
    const files = fileList.filter(e => e.type === "image/png")
    if (!files.length) return message.value = "Please provide up to 2 PNG files"
    const images = []
    for (let i = 0; i < files.length; i++) {
      const image = await loadImage(files[i])
      if (files.length === 1) {
        if (!(image.width === image.height || image.width === image.height * 2)) return message.value = "bruh"
      } else {
        if (image.width !== image.height) return message.value = "Both double chest textures must be square."
        if (i === 1 && image.width !== images[0].width) return message.value = "Both double chest textures must be the same size."
      }
      if (Math.log2(image.width) % 1 !== 0 || Math.log2(image.height) % 1 !== 0) return message.value = `Chest textures must be a power of 2 in size.`
      const canvas = new Canvas(image.width, image.height, true, 1024)
      canvas.getContext("2d").drawImage(image, 0, 0)
      images.push(canvas)
    }
    inputs.value = images.map(canvas => ({ id: nextId++, canvas }))
    convertChests()
  }

  function move(from, to) {
    const arr = inputs.value.slice()
    arr.splice(to, 0, arr.splice(from, 1)[0])
    inputs.value = arr
    convertChests()
  }

  function output(name, texts, canvas) {
    return { id: nextId++, name, texts, canvas }
  }

  const drawFlipped = (ctx, m, img, x, y, w, h, x2, y2) => ctx.drawImage(img, Math.floor(x * m), Math.floor(y * m), Math.floor(w * m), Math.floor(h * m), Math.floor(x2 * m), Math.floor(ctx.canvas.height - (y2 + h) * m), Math.floor(w * m), Math.floor(h * m))
  const drawRotated = (ctx, m, img, x, y, w, h, x2, y2) => ctx.drawImage(img, Math.floor(x * m), Math.floor(y * m), Math.floor(w * m), Math.floor(h * m), Math.floor(ctx.canvas.width - (x2 + w) * m), Math.floor(ctx.canvas.height - (y2 + h) * m), Math.floor(w * m), Math.floor(h * m))
  const torad = deg => deg * Math.PI / 180

  function convertChests() {
    const images = inputs.value.map(e => e.canvas)
    if (images.length === 1) {
      if (images[0].width === images[0].height) {
        const m = images[0].width / 64
        const canvas = new Canvas(images[0].width, images[0].height, true, 1024)
        const ctx = canvas.getContext("2d")
        ctx.save()
        ctx.scale(1, -1)
        ctx.translate(0, -canvas.height)
        drawFlipped(ctx, m, images[0], 14, 0, 14, 14, 28, 0)
        drawFlipped(ctx, m, images[0], 28, 0, 14, 14, 14, 0)
        drawFlipped(ctx, m, images[0], 14, 19, 14, 14, 28, 19)
        drawFlipped(ctx, m, images[0], 28, 19, 14, 14, 14, 19)
        drawFlipped(ctx, m, images[0], 1, 0, 2, 1, 3, 0)
        drawFlipped(ctx, m, images[0], 3, 0, 2, 1, 1, 0)
        ctx.restore()
        ctx.rotate(torad(180))
        ctx.translate(-canvas.width, -canvas.height)
        drawRotated(ctx, m, images[0], 14, 14, 42, 5, 14, 14)
        drawRotated(ctx, m, images[0], 0, 14, 14, 5, 0, 14)
        drawRotated(ctx, m, images[0], 14, 33, 42, 10, 14, 33)
        drawRotated(ctx, m, images[0], 0, 33, 14, 10, 0, 33)
        drawRotated(ctx, m, images[0], 1, 1, 5, 4, 1, 1)
        drawRotated(ctx, m, images[0], 0, 1, 1, 4, 0, 1)
        outputs.value = [output("normal.png", ["The single chest texture.", "This is in the opposite format to whatever the input format was."], canvas)]
      } else {
        const m = images[0].width / 128
        const canvasLeft = new Canvas(images[0].height, images[0].height, true, 1024)
        const left = canvasLeft.getContext("2d")
        left.save()
        left.scale(1, -1)
        left.translate(0, -canvasLeft.height)
        drawFlipped(left, m, images[0], 59, 0, 15, 14, 14, 0)
        drawFlipped(left, m, images[0], 29, 0, 15, 14, 29, 0)
        drawFlipped(left, m, images[0], 59, 19, 15, 14, 14, 19)
        drawFlipped(left, m, images[0], 29, 19, 15, 14, 29, 19)
        drawFlipped(left, m, images[0], 4, 0, 1, 1, 1, 0)
        drawFlipped(left, m, images[0], 2, 0, 1, 1, 2, 0)
        left.restore()
        left.rotate(torad(180))
        left.translate(-canvasLeft.width, -canvasLeft.height)
        drawRotated(left, m, images[0], 29, 14, 44, 5, 14, 14)
        drawRotated(left, m, images[0], 29, 33, 44, 10, 14, 33)
        drawRotated(left, m, images[0], 2, 1, 3, 4, 1, 1)
        const canvasRight = new Canvas(images[0].height, images[0].height, true, 1024)
        const right = canvasRight.getContext("2d")
        right.save()
        right.scale(1, -1)
        right.translate(0, -canvasRight.height)
        drawFlipped(right, m, images[0], 44, 0, 15, 14, 14, 0)
        drawFlipped(right, m, images[0], 14, 0, 15, 14, 29, 0)
        drawFlipped(right, m, images[0], 44, 19, 15, 14, 14, 19)
        drawFlipped(right, m, images[0], 14, 19, 15, 14, 29, 19)
        drawFlipped(right, m, images[0], 3, 0, 1, 1, 1, 0)
        drawFlipped(right, m, images[0], 1, 0, 1, 1, 2, 0)
        right.restore()
        right.rotate(torad(180))
        right.translate(-canvasRight.width, -canvasRight.height)
        drawRotated(right, m, images[0], 0, 14, 14, 5, 0, 14)
        drawRotated(right, m, images[0], 73, 14, 15, 5, 14, 14)
        drawRotated(right, m, images[0], 14, 14, 15, 5, 43, 14)
        drawRotated(right, m, images[0], 0, 33, 14, 10, 0, 33)
        drawRotated(right, m, images[0], 73, 33, 15, 10, 14, 33)
        drawRotated(right, m, images[0], 14, 33, 15, 10, 43, 33)
        drawRotated(right, m, images[0], 0, 1, 1, 4, 0, 1)
        drawRotated(right, m, images[0], 5, 1, 1, 4, 1, 1)
        drawRotated(right, m, images[0], 1, 1, 1, 4, 3, 1)
        outputs.value = [
          output("normal_left.png", ["The left side of the large chest texture for 1.15 and above."], canvasLeft),
          output("normal_right.png", ["The right side of the large chest texture for 1.15 and above."], canvasRight)
        ]
      }
    } else {
      const m = images[0].width / 64
      const canvas = new Canvas(images[0].width * 2, images[0].height, true, 1024).addClass("large")
      const ctx = canvas.getContext("2d")
      ctx.save()
      ctx.scale(1, -1)
      ctx.translate(0, -canvas.height)
      drawFlipped(ctx, m, images[0], 14, 0, 15, 14, 59, 0)
      drawFlipped(ctx, m, images[1], 14, 0, 15, 14, 44, 0)
      drawFlipped(ctx, m, images[0], 29, 0, 15, 14, 29, 0)
      drawFlipped(ctx, m, images[1], 29, 0, 15, 14, 14, 0)
      drawFlipped(ctx, m, images[0], 14, 19, 15, 14, 59, 19)
      drawFlipped(ctx, m, images[1], 14, 19, 15, 14, 44, 19)
      drawFlipped(ctx, m, images[0], 29, 19, 15, 14, 29, 19)
      drawFlipped(ctx, m, images[1], 29, 19, 15, 14, 14, 19)
      drawFlipped(ctx, m, images[0], 1, 0, 1, 1, 4, 0)
      drawFlipped(ctx, m, images[1], 1, 0, 1, 1, 3, 0)
      drawFlipped(ctx, m, images[0], 2, 0, 1, 1, 2, 0)
      drawFlipped(ctx, m, images[1], 2, 0, 1, 1, 1, 0)
      ctx.restore()
      ctx.rotate(torad(180))
      ctx.translate(-canvas.width, -canvas.height)
      drawRotated(ctx, m, images[0], 14, 14, 44, 5, 29, 14)
      drawRotated(ctx, m, images[1], 0, 14, 14, 5, 0, 14)
      drawRotated(ctx, m, images[1], 14, 14, 15, 5, 73, 14)
      drawRotated(ctx, m, images[1], 43, 14, 15, 5, 14, 14)
      drawRotated(ctx, m, images[0], 14, 33, 44, 10, 29, 33)
      drawRotated(ctx, m, images[1], 0, 33, 14, 10, 0, 33)
      drawRotated(ctx, m, images[1], 14, 33, 15, 10, 73, 33)
      drawRotated(ctx, m, images[1], 43, 33, 15, 10, 14, 33)
      drawRotated(ctx, m, images[0], 1, 1, 3, 4, 2, 1)
      drawRotated(ctx, m, images[1], 0, 1, 1, 4, 0, 1)
      drawRotated(ctx, m, images[1], 1, 1, 1, 4, 5, 1)
      drawRotated(ctx, m, images[1], 3, 1, 1, 4, 1, 1)
      outputs.value = [output("normal_large.png", ["The large chest texture for 1.14 and below."], canvas)]
    }
  }
</script>

<template>
  <Page>
    <div class="container">
      <h1>Chest Converter</h1>
      <p>This is a tool that allows you to convert the chest textures between the 1.14 and 1.15 formats.</p>
      <p>This is also available as a <a href="https://wynem.com/commands/prefix/minecraft/resourcepacks/chestconverter" target="_blank">command on Discord</a>.</p>
      <br>
      <p>Please provide either a single chest texture (1.14/15 format), a single double chest texture (1.14 format), or both halves of the double chest texture (1.15 format).</p>
      <FileInput multiple limit="2" @change="onChange" />
      <div id="output">
        <template v-if="message">{{ message }}</template>
        <template v-else-if="inputs.length">
          <h2>Input image{{ inputs.length === 1 ? "" : "s" }}</h2>
          <div v-if="inputs.length === 1" class="chest-textures">
            <div><canvas v-draw="inputs[0].canvas" data-popupable data-popupable-no-upscale></canvas></div>
          </div>
          <template v-else>
            <div>Reorder the textures below to put the left chest texture on the left side.</div>
            <div class="chest-textures double">
              <div v-for="(input, i) of inputs" :key="input.id">
                <div class="chest-buttons">
                  <Icon name="arrow_back_ios_new" @click="move(i, i - 1)" />
                  <Icon name="arrow_forward_ios" @click="move(i, i + 1)" />
                </div>
                <canvas v-draw="input.canvas" data-popupable data-popupable-no-upscale></canvas>
              </div>
            </div>
          </template>
          <div id="generated">
            <div v-for="out of outputs" :key="out.id" class="output-container">
              <div>
                <h2>{{ out.name }}</h2>
                <p v-for="text of out.texts">{{ text }}</p>
                <div class="button-download" @click="out.canvas.saveAs(out.name)"><Icon name="download" /><span>Download</span></div>
              </div>
              <canvas v-draw="out.canvas" :class="out.canvas.className" data-popupable data-popupable-no-upscale></canvas>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Page>
</template>

<style lang="stylus" scoped>
  @import "../../styles/buttons.styl"

  .container
    max-width: calc(var(--content-width) + 40px)
    margin: 0 auto
    min-height: calc(100% - var(--header-height))
    padding: 0 20px
    display: flex
    flex-direction: column

  h1
    margin: 0
    padding: 22px 0 0

  p
    white-space: pre-wrap

  a
    color: var(--color-link-blue)

  #output
    padding: 20px 20px 40px

  #output, #generated
    display: flex
    gap: 20px
    align-items: flex-start
    flex-direction: column

  canvas
    image-rendering: pixelated

  .output-container
    width: 100%
    display: flex
    justify-content: space-between
    gap: 20px
    flex-wrap: wrap

    canvas
      background-image: url("/assets/images/misc/transparent_dark.webp")
      box-shadow: var(--box-shadow)
      width: 512px
      max-width: calc(100vw - 80px)

      &.large
        width: 512px

  .chest-textures
    display: flex
    box-shadow: var(--box-shadow)
    max-width: 100%
    background-image: url("/assets/images/misc/transparent_dark.webp")

    > div
      position: relative
      display: flex
      flex: 1

    canvas
      flex: 1
      display: block
      width: 256px

    &:not(.double) canvas
      max-width: calc(100vw - 80px)

    &.double canvas
      max-width: calc(50vw - 40px)

  .chest-buttons
    position: absolute
    top: 0
    left: 0
    right: 0
    bottom: 0
    display: flex
    justify-content: space-between
    align-items: center
    overflow: hidden
    user-select: none

    .icon
      color: white
      filter: drop-shadow(0 0 4px black)
      position: absolute
      transition: left .15s, right .15s, font-size .15s
      cursor: pointer
      font-size: 32px

      &:first-child
        left: -40px

      &:last-child
        right: -40px

      &:hover
        font-size: 48px

    &:hover > .icon
      &:first-child
        left: 0

      &:last-child
        right: 0

  .chest-textures
    > div:first-child .icon:first-child
      display: none

    > div:last-child .icon:last-child
      display: none
</style>
