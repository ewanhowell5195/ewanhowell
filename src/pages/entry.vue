<script setup>
  import { ref, computed } from "vue"
  import { useRoute } from "vue-router"
  import Page from "../components/Page.vue"
  import Link from "../components/Link.vue"
  import Icon from "../components/Icon.js"
  import Gallery from "../components/Gallery.vue"
  import { site } from "../lib/site.js"
  import { notFound } from "../router.js"
  import { fetchJSON, entryName, setFavicon } from "../lib/utils.js"

  const props = defineProps({ type: String, name: String })

  site.selected = `/${props.type}`

  const route = useRoute()
  const loading = ref(true)
  const data = ref()
  const entry = ref()
  const category = ref()
  const versions = ref()
  const linksTab = ref("main")
  const popup = ref(false)

  const name = computed(() => entryName(entry.value))
  const optifineType = props.type.slice(0, props.type.length - 1).replace("resource", "")
  const gallery = computed(() => (data.value.video ? [{ video: data.value.video }] : []).concat((data.value.images ?? []).map(image => ({ image: imagePath(image) }))))
  const popupText = computed(() => `OptiFine is a mod that adds a lot of extra resource pack related features to Minecraft.\n\nSome resource packs may be enhanced by OptiFine, or completely rely on it to function correctly.\n<h3>${name.value} OptiFine requirement: </h3>${entry.value.optifine === 1 ? "Optional" : "Required"}${data.value.optifine ? `\n<h3>${name.value} specific information:</h3>${data.value.optifine}` : ""}`)

  function imagePath(image) {
    return `/assets/images/${props.type}/${entry.value.id}/images/${image}.webp`
  }

  function closePopup(e) {
    if (e.target.classList[0] === "popup") popup.value = false
  }

  async function load() {
    try {
      data.value = await fetch(`/assets/json/${props.type}/${props.name}.json`).then(e => e.json())
    } catch {
      return notFound(route)
    }
    const index = await fetchJSON(props.type)
    const found = index.categories.map(e => e.entries.find(e => e.id === props.name)).find(e => e)
    if (!found) return notFound(route)
    entry.value = found
    category.value = index.categories.find(e => e.entries.includes(found)).name
    versions.value = index.versions ? found.versions : null
    setFavicon(`/assets/images/${props.type}/${entry.value.id}/icon.webp`)
    document.title = `${name.value} - ${data.value.author ?? "Ewan Howell"}`
    loading.value = false
  }

  load()
</script>

<template>
  <Page :loading="loading">
    <div v-if="entry" class="container">
      <div id="banner">
        <div id="banner-background" :style="{ backgroundImage: `url(&quot;/assets/images/${entry.image ? `${type}/${entry.id}/images/${entry.image}` : '/home/logo_3d'}.webp&quot;)` }"></div>
        <div id="banner-content">
          <template v-if="!entry.plain">
            <div v-if="entry.logoless" id="logo">{{ name }}</div>
            <img v-else id="logo" :src="`/assets/images/${type}/${entry.id}/logo.webp`">
          </template>
          <div id="category-name">{{ category }}</div>
        </div>
      </div>
      <div id="optifine" :class="entry.optifine ? (entry.optifine === 1 ? 'optional' : 'required') : 'hidden'">
        <div id="optifine-img">
          <img src="/assets/images/logo/optifine.webp">
        </div>
        <div class="optifine-desc" id="required">This <div class="type">{{ entry.optifine ? optifineType : "" }}</div> requires OptiFine to function correctly.</div>
        <div class="optifine-desc" id="optional">OptiFine can be used to enhance this <div class="type">{{ entry.optifine ? optifineType : "" }}</div>, but it is not a requirement.</div>
        <div class="spacer"></div>
        <div id="optifine-info" @click="entry.optifine && (popup = true)">
          <Icon name="info" />
          <span class="text"></span>
        </div>
        <a href="https://optifine.net/downloads" target="_blank">
          <Icon name="download" />
          <span class="text"></span>
        </a>
      </div>
      <div id="entry-content">
        <div id="entry-info">
          <div id="title">{{ name }}</div>
          <div id="subtitle">{{ data.subtitle }}</div>
          <div id="images">
            <Gallery v-if="gallery.length" :items="gallery" :group="`${type}-${entry.id}`" />
          </div>
          <div id="description" v-html="data.description"></div>
        </div>
        <div id="entry-links">
          <div id="entry-links-tabs" :style="data.downloads ? null : { display: 'none' }">
            <div id="main-tab" :class="{ selected: linksTab === 'main' }" @click="linksTab = 'main'">Downloads</div>
            <div id="mirrors-tab" :class="{ selected: linksTab === 'mirrors' }" @click="linksTab = 'mirrors'">Mirrors</div>
          </div>
          <div id="entry-links-contents" :style="data.downloads ? null : { height: 'calc(100% - 60px)' }">
            <div id="downloads" :class="{ hidden: !data.downloads }">
              <div id="main" :class="{ selected: linksTab === 'main' }">
                <a v-for="link of data.downloads" class="button-download" :href="`http://adfoc.us/serve/sitelinks/?id=546537&url=${link.link}`" target="_blank">
                  <Icon name="download" />
                  <span>{{ link.text }}</span>
                </a>
              </div>
              <div id="mirrors" :class="{ selected: linksTab === 'mirrors' }">
                <a v-for="link of data.downloads" class="button-download mirror" :href="link.link" target="_blank">
                  <Icon name="open_in_new" />
                  <span>{{ link.text }}</span>
                </a>
              </div>
            </div>
            <div id="links" :class="{ hidden: !data.links }">
              <h3>{{ data.downloads ? "Other Links" : "Links" }}</h3>
              <div>
                <template v-for="link of data.links">
                  <Link v-if="link.type === 'entry'" class="button" :to="`/${type}/${link.name}`">
                    <Icon name="link" />
                    <span>{{ link.text }}</span>
                  </Link>
                  <Link v-else-if="link.type === 'guide'" class="button" :to="`/guides/${link.name}`">
                    <Icon name="menu_book" />
                    <span>{{ link.text }}</span>
                  </Link>
                  <a v-else class="button" :href="link.link" target="_blank">
                    <Icon v-if="link.icon" :name="link.icon" />
                    <Icon v-else name="open_in_new" />
                    <span>{{ link.text }}</span>
                  </a>
                </template>
              </div>
            </div>
            <div id="versions" :class="{ hidden: !versions }">
              <h3>Supported Versions</h3>
              <div id="version-list">
                <Link v-for="version of versions" :to="`/${type}/?version=${version}`">{{ version }}</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Page>
  <Teleport v-if="popup" to="body">
    <div class="popup" @click="closePopup">
      <div class="popup-container">
        <div class="popup-optifine">
          <div id="popup-optifine-banner">
            <img src="/assets/images/logo/optifine.webp">
            <div>OptiFine</div>
            <div class="spacer"></div>
            <div id="popup-optifine-close" @click="popup = false"><Icon name="close" /></div>
          </div>
          <div id="popup-optifine-content">
            <div id="popup-optifine-text" v-html="popupText"></div>
            <div id="popup-optifine-download">
              <div>
                <a href="https://optifine.net/downloads" target="_blank">
                  <Icon name="download" />
                  <span>Download OptiFine</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="stylus" scoped>
  @import "../styles/buttons.styl"

  .container
    max-width: var(--content-width)
    margin: 0 auto
    display: flex
    flex-direction: column
    min-height: calc(100vh - var(--header-height) * 2)

  .hidden
    display: none !important

  .spacer
    flex: 1

  #banner
    position: relative
    overflow: hidden
    box-shadow: var(--box-shadow)

  #banner-background
    width: 100%
    height: 228px
    background-size: cover
    background-position: 50% 50%
  
  #banner-content
    position: absolute
    inset: 0
    backdrop-filter: blur(4px)

  #logo
    padding: 50px
    height: 128px
    image-rendering: pixelated
    filter: drop-shadow(0 10px 4px var(--color-text-shadow))
    font-size: 3.25rem
    text-align: center
    display: flex
    align-items: center
    font-weight: 700
    
  #category-name
    position: absolute
    text-transform: uppercase
    font-weight: 700
    filter: drop-shadow(var(--text-shadow))
  
  #category-name
    top: 20px
    right: 20px
    letter-spacing: 5px

  #optifine
    display: flex
    background-image: var(--gradient-optifine)
    min-height: 50px
    box-shadow: var(--box-shadow)
    font-weight: 700
    text-shadow: 0 3px 1px var(--color-text-shadow-optifine)
    color: var(--color-text-optifine)
    overflow: hidden
    width: 100%
    z-index: 1

    .optifine-desc
      padding: 10px
      display: flex
      align-items: center
      white-space: pre

    #optifine-img
      width: 50px
      display: flex
      align-items: center
    
      img
        height: 50px

    #optifine-info
      display: flex
      align-items: center

      .text::after
        content: "More Information"
      
    a .text::after
      content: "Download OptiFine"

    a, #optifine-info
      display: flex
      align-items: center
      padding: 0 15px
      cursor: pointer
      transition: background-color .15s
      user-select: none
      color: var(--color-text-optifine)
      text-decoration: none

      & > *
        transition: transform .15s

      span
        text-align: center

      .icon
        padding-right: 10px
        font-size: 28px
        color: var(--color-text-optifine)
        filter: drop-shadow(0 3px 1px var(--color-text-shadow-optifine))

      &:hover
        background-color: #A93931

      &:active > *
        transform: translateY(4px)
      
    &.optional #required
      display: none

    &.required #optional
      display: none

  #entry-content
    flex: 1
    display: flex

  #entry-info
    flex: 1
    display: flex
    flex-direction: column
    align-items: center
    padding: 20px 20px 60px

  #images
    display: flex
    user-select: none
    position: relative
    overflow: hidden
    margin: 30px 40px 60px
    max-width: 720px
    width: clamp(50vw, 50vw, 80vw)

  #title
    font-size: 4em
    padding: 32px 0 10px
    font-weight: 700
    letter-spacing: 2px
    text-align: center

  #subtitle
    font-size: 1.5em
    padding-bottom: 16px

  #description
    line-height: 1.5em
    display: flex
    flex-direction: column
    align-items: center
    
    :deep(code)
      font-size: 16px
      background-color: black
      padding: 0 4px
      font-family: Consolas, monospace
    
    :deep(ul), :deep(ol)
      text-align: left
    
    :deep(li)
      margin-bottom: 5px
    
    :deep(img)
      image-rendering: pixelated
    
    :deep(p)
      margin-top: 0

  #description, #subtitle
    white-space: pre-wrap
    text-align: center
    max-width: 900px

  #entry-links
    width: 256px

  #entry-links-contents
    height: calc(100% - 110px)
    background-color: var(--color-grey)
    box-shadow: -10px 0 10px var(--color-box-shadow)
    padding-bottom: 60px

  #entry-links-tabs
    display: flex
    justify-content: space-around
    padding: 10px 10px 0
    gap: 10px
    background-color: var(--color-grey-darker)
    user-select: none
    overflow-y: hidden

    div
      height: 38px
      flex: 1
      background-color: var(--color-grey-dark)
      cursor: pointer
      display: flex
      justify-content: center
      align-items: center
      border-top: 2px solid transparent
      transition: background-color .15s, border-top .15s
      box-shadow: -10px 0 10px var(--color-box-shadow)

    .selected
      background-color: var(--color-grey)
      border-top: 2px solid var(--color-red-light)

  #downloads
    width: 100%

    div
      display: none
      width: 100%
      flex-direction: column
      align-items: center
      padding: 15px 0
      gap: 15px
      flex-wrap: wrap
  
    .selected
      display: flex

  .button-download
    width: 206px
  
    &.mirror
      filter: hue-rotate(90deg)
    
    &:hover.mirror
        filter: hue-rotate(80deg) brightness(1.2)

  #links, #versions
    max-width: 100%
    display: flex
    flex-direction: column
    align-items: center
    padding: 15px 0 30px
    gap: 15px
  
    h3
      margin: 0

    div
      gap: 15px
      display: flex
      flex-direction: column
      flex-wrap: wrap

  #version-list
    flex-direction: row !important
    max-width: 85%
    justify-content: center

    a
      color: var(--color-text-white)
      background-color: var(--color-grey-lighter)
      padding: 4px 8px
      width: 46px
      border-radius: 100px
      text-align: center
      box-shadow: var(--box-shadow)
      text-shadow: var(--text-shadow)
      text-decoration: none

  .button
    width: 206px
    padding: 5px 10px

  // mobile

  @media only screen and (max-width: 1020px)
    #optifine.optional
      #optifine-info .text::after
        content: "Information"
    
      a .text::after
        content: "Download"
      
  @media only screen and (max-width: 910px)
    #optifine.optional
      #optifine-info .text::after
        content: "Requirement Information"
      
      .optifine-desc
        display: none !important

  @media only screen and (max-width: 860px)
    #optifine.required
      #optifine-info .text::after
        content: "Information"
    
      a .text::after
        content: "Download"

  @media only screen and (max-width: 768px)
    #entry-content
      flex-flow: column
    
    #entry-info
      order: 2
    
    #entry-links
      order: 1
      width: 100%
    
    #entry-links-contents
      padding: 0
  
    #downloads div, #links div
      flex-direction: row
      justify-content: center
    
    #banner-content
      display: flex
      justify-content: center
      align-items: center
    
      img
        max-width: 80vw
        height: auto
      
    #category-name
      right: initial
    
    #images
      width: 80vw
    
  @media only screen and (max-width: 750px)
    #optifine.required
      #optifine-info .text::after
        content: "Requirement Information"
      
      .optifine-desc
        display: none !important

  @media only screen and (max-width: 500px)
    #logo
      font-size: 2rem
    
  @media only screen and (max-width: 470px)
    #optifine.required, #optifine.optional
      #optifine-info .text::after
        content: "Information"
</style>
