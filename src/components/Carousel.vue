<script setup>
  import { ref, watch, onBeforeUnmount, nextTick } from "vue"
  import Splide from "@splidejs/splide"
  import "@splidejs/splide/css/core"
  import Link from "./Link.vue"
  import Icon from "./Icon.js"

  const props = defineProps({
    items: Array
  })

  const el = ref()
  let splide

  watch(() => props.items, async items => {
    if (!items?.length || splide) return
    await nextTick()
    splide = new Splide(el.value, {
      type: "loop",
      perPage: 3,
      gap: 20,
      padding: "var(--bleed)",
      autoplay: true,
      interval: 5000,
      pauseOnHover: true,
      flickPower: 75,
      flickMaxPages: 0.3,
      breakpoints: {
        1000: { perPage: 2 },
        600: { perPage: 1, gap: 12 }
      }
    }).mount()
  }, { immediate: true })

  onBeforeUnmount(() => splide?.destroy())
</script>

<template>
  <div ref="el" class="splide carousel">
    <div class="splide__arrows">
      <button class="splide__arrow splide__arrow--prev"><Icon name="arrow_back_ios_new" /></button>
      <button class="splide__arrow splide__arrow--next"><Icon name="arrow_forward_ios" /></button>
    </div>
    <div class="splide__track">
      <ul class="splide__list">
        <li v-for="item of items" class="splide__slide">
          <Link class="card" :to="item.to">
            <div class="card-image" :style="{ backgroundImage: `url(&quot;${item.image}&quot;)` }"></div>
            <div class="card-body">
              <div v-if="item.tag" class="card-tag">{{ item.tag }}</div>
              <div class="card-title">{{ item.title }}</div>
              <div v-if="item.subtitle" class="card-subtitle">{{ item.subtitle }}</div>
            </div>
          </Link>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
  .carousel
    --bleed: unquote("clamp(20px, calc((100vw - var(--content-width)) / 2), 160px)")
    position: relative
    margin: 0 calc(-1 * var(--bleed)) 21px
    user-select: none

    &:hover .splide__arrow
      opacity: 1

  .splide__track
    mask-image: linear-gradient(to right, transparent, black var(--bleed), black calc(100% - var(--bleed)), transparent)

  .splide__slide
    padding: 6px 0 12px

  .card
    display: flex
    flex-direction: column
    height: 100%
    background-color: var(--color-grey)
    box-shadow: var(--box-shadow)
    color: var(--color-text-white)
    text-decoration: none
    transition: background-color .15s, transform .15s

    &:hover
      background-color: var(--color-grey-light)
      transform: translateY(-3px)

  .card-image
    aspect-ratio: 16 / 9
    background-size: cover
    background-position: 50% 50%

  .card-body
    padding: 14px 18px 18px
    display: flex
    flex-direction: column
    gap: 4px

  .card-tag
    font-size: 0.75em
    font-weight: 700
    letter-spacing: 2px
    text-transform: uppercase
    color: var(--color-red-light)

  .card-title
    font-weight: 700
    font-size: 1.2em

  .card-subtitle
    opacity: 0.85
    font-size: 0.95em
    line-height: 1.4

  .splide__arrow
    position: absolute
    top: 50%
    transform: translateY(-50%)
    z-index: 1
    padding: 10px
    background: none
    border: none
    cursor: pointer
    opacity: 0
    transition: opacity .15s, transform .15s

    &--prev
      left: unquote("max(0px, calc(var(--bleed) - 70px))")

    &--next
      right: unquote("max(0px, calc(var(--bleed) - 70px))")

    &:hover
      transform: translateY(-50%) scale(1.3)

    .icon
      font-size: 40px
      color: white
      filter: drop-shadow(4px 4px 1px var(--color-text-shadow))

  :deep(.splide__pagination)
    position: absolute
    top: 100%
    left: 0
    right: 0
    display: flex
    justify-content: center
    gap: 8px
    margin: 16px 0 0
    padding: 0

    button
      position: relative
      display: block
      width: 24px
      height: 5px
      padding: 0
      border: none
      background-color: var(--color-grey-light)
      cursor: pointer
      transition: background-color .15s, width .15s

      &::before
        content: ""
        position: absolute
        inset: -12px -4px

      &:hover
        background-color: #777

      &.is-active
        width: 40px
        background-color: var(--color-red-light)

  @media (max-width: 768px)
    .splide__arrow
      opacity: 1
</style>
