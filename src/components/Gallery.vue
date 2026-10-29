<script setup>
  import { ref, onMounted, onBeforeUnmount } from "vue"
  import Splide from "@splidejs/splide"
  import "@splidejs/splide/css/core"
  import Icon from "./Icon.js"

  const props = defineProps({
    items: Array,
    group: String
  })

  const mainEl = ref()
  const thumbsEl = ref()
  let main, thumbs

  function thumbnail(item) {
    return item.video ? `https://img.youtube.com/vi/${item.video.split("?")[0]}/maxresdefault.jpg` : item.image
  }

  onMounted(() => {
    main = new Splide(mainEl.value, {
      pagination: false,
      speed: 400,
      flickPower: 75,
      flickMaxPages: 0.3
    })
    if (thumbsEl.value) {
      thumbs = new Splide(thumbsEl.value, {
        perPage: Math.min(props.items.length, 6),
        fixedHeight: 100,
        gap: 8,
        flickPower: 75,
        flickMaxPages: 0.3,
        pagination: false,
        arrows: false,
        isNavigation: true,
        breakpoints: {
          600: {
            perPage: Math.min(props.items.length, 4),
            fixedHeight: 60
          }
        }
      })
      main.sync(thumbs)
    }
    main.on("move", (index, prev) => {
      mainEl.value.querySelectorAll(".splide__slide")[prev]?.querySelector("iframe")?.contentWindow.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "*")
    })
    main.mount()
    thumbs?.mount()
  })

  onBeforeUnmount(() => {
    main?.destroy()
    thumbs?.destroy()
  })
</script>

<template>
  <div class="gallery">
    <div ref="mainEl" class="splide main" :data-popupable-group="group">
      <div class="splide__arrows">
        <button class="splide__arrow splide__arrow--prev"><Icon name="arrow_back_ios_new" /></button>
        <button class="splide__arrow splide__arrow--next"><Icon name="arrow_forward_ios" /></button>
      </div>
      <div class="splide__track">
        <ul class="splide__list">
          <li v-for="item of items" class="splide__slide">
            <div v-if="item.video" class="video">
              <iframe :src="`https://www.youtube.com/embed/${item.video}${item.video.includes('?') ? '&' : '?'}rel=0&enablejsapi=1`" frameborder="0" allow="picture-in-picture" allowfullscreen></iframe>
            </div>
            <img v-else :src="item.image" data-popupable>
          </li>
        </ul>
      </div>
    </div>
    <div v-if="items.length > 1" ref="thumbsEl" class="splide thumbs">
      <div class="splide__track">
        <ul class="splide__list">
          <li v-for="item of items" class="splide__slide" :style="{ backgroundImage: `url(&quot;${thumbnail(item)}&quot;)` }"></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
  .gallery
    width: 100%
    user-select: none

  .main
    position: relative
    overflow: hidden

    img
      display: block
      width: 100%

    &:hover .splide__arrow
      opacity: 1

      &--prev
        left: 0

      &--next
        right: 0

  .video
    aspect-ratio: 16 / 9

    iframe
      width: 100%
      height: 100%

  .splide__arrow
    position: absolute
    top: 50%
    transform: translateY(-50%)
    z-index: 1
    padding: 20px
    background: none
    border: none
    cursor: pointer
    opacity: 0
    transition: left .15s, right .15s, opacity .15s, transform .15s

    &--prev
      left: -60px

    &--next
      right: -60px

    &:hover
      transform: translateY(-50%) scale(1.4)

    &[disabled]
      opacity: 0 !important
      cursor: default

    .icon
      font-size: 48px
      color: white
      filter: drop-shadow(4px 4px 1px var(--color-text-shadow))

  .thumbs
    margin-top: 8px

  .thumbs .splide__slide
    background-size: cover
    background-position: 50% 50%
    filter: grayscale(100%)
    opacity: .6
    transition: filter .15s, opacity .15s
    cursor: pointer
    border: none !important

    &:hover, &.is-active
      filter: grayscale(0)
      opacity: 1

    &.is-active::after
      content: ""
      position: absolute
      bottom: 0
      left: 0
      right: 0
      height: 5px
      background-color: var(--color-red-light)

  @media (max-width: 768px)
    .splide__arrow
      padding: 10px
      opacity: 1

      &--prev
        left: 0

      &--next
        right: 0
</style>
