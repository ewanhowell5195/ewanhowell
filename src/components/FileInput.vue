<script setup>
  import { ref, computed, onMounted, onBeforeUnmount } from "vue"
  import Icon from "./Icon.js"

  const props = defineProps({
    multiple: Boolean,
    limit: [Number, String]
  })

  const emit = defineEmits(["change"])

  const fileLimit = computed(() => parseInt(props.limit))
  const active = ref(false)
  const text = ref(`or drag and drop ${fileLimit.value ? `up to ${fileLimit.value}` : ""} ${props.multiple ? "files" : "a file"} here`)
  let files

  function fileChange() {
    if (files.length === 1) text.value = files[0].name.split("\\").pop()
    else text.value = `${files.length} files selected`
    emit("change", files)
  }

  function onDrop(evt) {
    evt.preventDefault()
    files = Array.from(evt.dataTransfer.items).filter(e => e.kind === "file").map(e => e.getAsFile()).slice(0, !props.multiple ? 1 : fileLimit.value || Infinity)
    fileChange()
  }

  function onInputChange(e) {
    files = Array.from(e.currentTarget.files).slice(0, fileLimit.value || Infinity)
    fileChange()
  }

  function onPaste(e) {
    files = Array.from(e.clipboardData.files)
    if (!files.length) return
    fileChange()
  }

  onMounted(() => addEventListener("paste", onPaste))
  onBeforeUnmount(() => removeEventListener("paste", onPaste))

  defineExpose({ get files() { return files } })
</script>

<template>
  <div class="file-input" @drop="onDrop" @dragover.prevent>
    <div class="file-drop" :class="{ active }">
      <span class="file-drop-button">
        <Icon name="upload" />
        <span>Choose file{{ multiple ? "s" : "" }}</span>
      </span>
      <span class="file-drop-text">{{ text }}</span>
      <input class="file-drop-input" type="file" :multiple="multiple" @change.stop="onInputChange" @dragenter="active = true" @focus="active = true" @click="active = true" @mouseenter="active = true" @dragleave="active = false" @blur="active = false" @drop="active = false" @mouseleave="active = false">
    </div>
  </div>
</template>

<style lang="stylus" scoped>
  .file-drop
    position: relative
    display: flex
    align-items: center
    padding: 25px
    background-color: var(--color-grey)
    transition: background-color .15s
    box-shadow: var(--box-shadow)
    user-select: none

  .file-drop.active
    background-color: var(--color-grey-light)

  .file-drop-button
    min-width: 150px
    color: var(--color-text-white)
    padding: 10px
    background-color: var(--color-download)
    align-items: center
    font-weight: 700
    box-shadow: 0 8px 5px rgba(0, 0, 0, .314)
    transition: filter .15s
    filter: hue-rotate(90deg)
    display: flex
    gap: 4px
    margin-right: 10px

  .file-drop-button > *
    transition: transform .15s

  .file-drop.active > .file-drop-button
    filter: hue-rotate(100deg) brightness(1.2)

  .file-drop:active > .file-drop-button > *
    transform: translateY(4px)

  .file-drop-button > .icon
    font-size: 28px
    color: white
    filter: drop-shadow(-2px 2px 1px var(--color-svg-shadow))

  .file-drop-button > span
    text-shadow: var(--text-shadow)
    letter-spacing: 1px

  .file-drop-text
    white-space: nowrap
    overflow: hidden
    text-overflow: ellipsis

  .file-drop-input
    position: absolute
    top: 0
    left: 0
    right: 0
    bottom: 0
    cursor: pointer
    opacity: 0
    z-index: 1
</style>
