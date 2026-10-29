<script setup>
  import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from "vue"
  import { useRoute } from "vue-router"
  import Page from "../components/Page.vue"
  import Link from "../components/Link.vue"
  import Icon from "../components/Icon.js"
  import { site } from "../lib/site.js"
  import { silentNavigate } from "../router.js"
  import { fetchJSON, entryName, getURLParams, toURLParams, gtag, analytics } from "../lib/utils.js"

  const props = defineProps({ type: String })

  site.selected = `/${props.type}`

  const route = useRoute()
  const title = route.meta.title.split(" - ")[0]

  const loading = ref(true)
  const hasVersions = ref(false)
  const versions = ref([])
  const current = ref()
  const query = ref("")
  const searchValue = ref("")
  const collapsed = reactive(new Set)
  const featured = reactive({})
  const tabs = ref()
  const headerTop = ref()
  const picker = ref()
  const pickerOpen = ref(false)

  const versionGroups = computed(() => {
    const groups = []
    for (const version of versions.value.slice(1)) {
      const parts = version.id.split(".")
      const name = parts[0] === "1" ? parts.slice(0, 2).join(".") : parts[0]
      if (groups.at(-1)?.name === name) groups.at(-1).versions.push(version)
      else groups.push({ name, versions: [version] })
    }
    const merged = []
    for (const group of groups) {
      const last = merged.at(-1)
      if (group.versions.length === 1 && last?.older) last.versions.push(group.versions[0])
      else if (group.versions.length === 1 && merged.length) merged.push({ name: "Older", versions: group.versions, older: true })
      else merged.push(group)
    }
    return merged
  })

  function entryCount(version) {
    return version.categories.reduce((total, category) => total + category.entries.length, 0)
  }

  function choose(version) {
    pickerOpen.value = false
    if (version.id !== current.value) selectTab(version)
  }

  function closePicker(e) {
    if (pickerOpen.value && (e.key === "Escape" || e.type === "pointerdown" && !picker.value?.contains(e.target))) pickerOpen.value = false
  }
  let searchTimeout

  function build(data) {
    const month = new Date().getMonth() + 1
    if (data.versions) for (const category of data.categories) {
      category.entries.sort((a, b) => {
        const aHas = a.featured?.includes(month)
        const bHas = b.featured?.includes(month)
        if (aHas && !bHas) return -1
        else if (!aHas && bHas) return 1
        return data.versions.indexOf(a.versions[0]) - data.versions.indexOf(b.versions[0])
      })
    }
    const list = data.versions?.map(e => ({ id: e, categories: [] })) ?? []
    list.unshift({ id: "all", categories: data.categories })
    if (data.versions) for (const category of data.categories) {
      category.featured = []
      for (const entry of category.entries) {
        if (entry.featured) {
          for (const month of entry.featured) {
            if (!category.featured.includes(month)) {
              category.featured.push(month)
            }
          }
        }
        for (const version of entry.versions) {
          const versionData = list.find(e => e.id === version)
          let categoryData = versionData.categories.find(e => e.name === category.name)
          if (!categoryData) {
            categoryData = { name: category.name, entries: [], featured: category.featured }
            versionData.categories.push(categoryData)
          }
          categoryData.entries.push(entry)
        }
      }
    }
    if (data.versions) for (const version of list) {
      version.categories.sort((a, b) => {
        const aHas = a.featured.includes(month)
        const bHas = b.featured.includes(month)
        if (aHas && !bHas) return -1
        else if (!aHas && bHas) return 1
        return 0
      })
    }
    return list
  }

  function matches(entry, category) {
    const text = query.value
    if (!text) return true
    const spaceless = text.replace(/\s/g, "")
    const name = entryName(entry).toLowerCase().replace(/&/g, "and")
    const simple = name.replace(/[^a-zA-Z0-9]/g, "")
    return category.name.toLowerCase().includes(text) || entry.id.toLowerCase().includes(text) || name.includes(text) || simple.includes(spaceless)
  }

  function categoryVisible(category) {
    return category.entries.some(e => matches(e, category))
  }

  const noResults = computed(() => {
    const version = versions.value.find(e => e.id === current.value)
    return version && !version.categories.some(categoryVisible)
  })

  function versionId(id) {
    return id.replaceAll(".", "-")
  }

  function categoryClass(name) {
    return name.replace(/ /g, "-")
  }

  function backgroundImage(entry) {
    return `url("/assets/images/${entry.image ? `${props.type}/${entry.id}/images/${entry.image}` : "/home/logo_3d"}.webp")`
  }

  function logoStyle(entry) {
    if (entry.logoless) return entry.fontsize ? { fontSize: `${entry.fontsize}rem` } : {}
    return { backgroundImage: `url("/assets/images/${props.type}/${entry.id}/logo.webp")` }
  }

  async function addFeatured(version) {
    if (version.id in featured) return
    const entries = version.categories.flatMap(category => category.entries.map(entry => ({ entry, category })))
    if (entries.length <= 5) return
    featured[version.id] = null
    const d = new Date(Date.now())
    const { entry, category } = entries[(d.getUTCFullYear() * 764900 + d.getUTCMonth() * 51470 + d.getUTCDate() * 311) % entries.length]
    const description = await fetch(`/assets/json/${props.type}/${entry.id}.json`).then(e => e.json()).then(e => e.description)
    featured[version.id] = { entry, category, description }
  }

  function selectTab(version) {
    current.value = version.id
    silentNavigate(`/${props.type}/?version=${version.id}`)
    sessionStorage.setItem(`${props.type}Version`, version.id)
    if (!noResults.value) addFeatured(version)
    const parts = document.title.split(" - ")
    if (version.id === "all") document.title = [parts[0], parts[parts.length - 1]].join(" - ")
    else document.title = [parts[0], version.id, parts[parts.length - 1]].join(" - ")
    analytics()
  }

  function toggleCategory(name) {
    if (collapsed.has(name)) collapsed.delete(name)
    else collapsed.add(name)
  }

  function onSearch(e) {
    clearTimeout(searchTimeout)
    searchValue.value = e.currentTarget.value
    const text = searchValue.value.toLowerCase().replace(/&/g, "and")
    query.value = text
    const params = getURLParams() ?? {}
    params.search = text
    if (!params.search) delete params.search
    silentNavigate(`/${props.type}/${toURLParams(params)}`, true)
    searchTimeout = setTimeout(() => {
      gtag("event", "search", { "search_term": text })
    }, 1000)
  }

  const searchInput = ref()

  function onResize() {
    headerTop.value = `${tabs.value.offsetHeight}px`
  }

  fetchJSON(props.type).then(async data => {
    hasVersions.value = !!data.versions
    versions.value = build(data)
    let { version, search } = route.query
    if (!data.versions) version = "all"
    else if (!version) {
      version = sessionStorage.getItem(`${props.type}Version`)
      if (!version) version = "all"
    }
    if (data.versions && !versions.value.some(e => e.id === version)) version = data.versions[0]
    current.value = version
    addFeatured(versions.value.find(e => e.id === version))
    sessionStorage.setItem(`${props.type}Version`, version)
    if (!data.versions) version = undefined
    if (version && version !== "all") {
      const parts = document.title.split(" - ")
      document.title = [parts[0], version, parts[1]].join(" - ")
    }
    loading.value = false
    await nextTick()
    onResize()
    await silentNavigate(`/${props.type}/${toURLParams({ version, search })}`, true)
    if (search) {
      searchInput.value.value = search
      setTimeout(() => searchInput.value.dispatchEvent(new Event("input")), 0)
    }
  })

  onMounted(() => {
    addEventListener("resize", onResize)
    addEventListener("pointerdown", closePicker)
    addEventListener("keydown", closePicker)
  })
  onBeforeUnmount(() => {
    removeEventListener("resize", onResize)
    removeEventListener("pointerdown", closePicker)
    removeEventListener("keydown", closePicker)
    clearTimeout(searchTimeout)
  })
</script>

<template>
  <Page :loading="loading">
    <div class="container">
      <div id="toolbar" ref="tabs">
        <label id="search">
          <Icon name="search" />
          <input ref="searchInput" :placeholder="`Search ${title.toLowerCase()}...`" @keypress.enter="e => e.currentTarget.blur()" @input="onSearch">
        </label>
        <div v-if="hasVersions" id="version-picker" ref="picker">
          <button id="version-button" :class="{ open: pickerOpen }" @click="pickerOpen = !pickerOpen">
            <span id="version-label">Version</span>
            <span id="version-value">{{ current === "all" ? "All" : current }}</span>
            <Icon name="expand_more" />
          </button>
          <div v-if="pickerOpen" id="version-panel">
            <a class="version-option" :class="{ selected: current === 'all' }" :href="`/${type}/?version=all`" @click.prevent="choose(versions[0])">All versions<span class="count">{{ entryCount(versions[0]) }}</span></a>
            <div v-for="group of versionGroups" class="version-group">
              <div class="version-group-name">{{ group.name }}</div>
              <div class="version-group-options">
                <a v-for="version of group.versions" class="version-option" :class="{ selected: version.id === current }" :href="`/${type}/?version=${version.id}`" @click.prevent="choose(version)">{{ version.id }}<span class="count">{{ entryCount(version) }}</span></a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="versions">
        <div id="no-results" :class="{ shown: noResults }">
          <div id="no-results-text">No results</div>
        </div>
        <div v-for="version of versions" class="version" :class="{ shown: version.id === current }" :id="versionId(version.id)">
          <div v-if="featured[version.id]" class="featured-entry" :class="{ hidden: searchValue }">
            <div class="featured-title">Featured {{ title.slice(0, -1) }}</div>
            <Link class="featured" :to="`/${type}/${featured[version.id].entry.id}`">
              <div class="entry-images featured-images">
                <div class="entry-image" :style="{ backgroundImage: backgroundImage(featured[version.id].entry) }"></div>
                <div v-if="!featured[version.id].entry.plain" class="logo featured-logo" :style="{ backgroundImage: featured[version.id].entry.logoless ? 'none' : logoStyle(featured[version.id].entry).backgroundImage }">{{ featured[version.id].entry.logoless ? entryName(featured[version.id].entry) : "" }}</div>
              </div>
              <div class="featured-details">
                <div class="featured-category">{{ featured[version.id].category.name }}</div>
                <div class="featured-name">{{ entryName(featured[version.id].entry) }}</div>
                <div class="featured-description" v-html="featured[version.id].description"></div>
              </div>
            </Link>
          </div>
          <div v-for="category of version.categories" class="category" :class="{ hidden: !categoryVisible(category) }" :id="category.name">
            <div class="category-header" :style="{ top: headerTop }">
              <h1>{{ category.name }}</h1>
              <Icon name="arrow_forward_ios" :class="[`arrow-${categoryClass(category.name)}`, { collapsed: collapsed.has(category.name) }]" @click="toggleCategory(category.name)" />
            </div>
            <div class="entries" :class="[`category-${categoryClass(category.name)}`, { collapsed: collapsed.has(category.name) }]">
              <Link v-for="entry of category.entries" class="entry" :class="{ hidden: !matches(entry, category) }" :to="`/${type}/${entry.id}`" :data-id="entry.id">
                <div class="entry-images" :id="entry.id">
                  <div class="entry-image" :style="{ backgroundImage: backgroundImage(entry) }"></div>
                  <div v-if="!entry.plain" class="logo" :style="logoStyle(entry)">{{ entry.logoless ? entryName(entry) : "" }}</div>
                  <img v-if="entry.optifine" class="optifine" src="/assets/images/logo/optifine.webp">
                </div>
                <div class="entry-name">{{ entryName(entry) }}</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>

<style lang="stylus" scoped>
  .container
    max-width: var(--content-width)
    margin: 0 auto

  .hidden
    display: none !important

  #toolbar
    display: flex
    position: sticky
    top: 0
    z-index: 2
    background-color: var(--color-green)
    box-shadow: var(--box-shadow)
    min-height: var(--header-height)

  #search
    flex: 1
    display: flex
    align-items: center
    gap: 4px
    padding: 0 8px
    background-color: var(--color-green-light)
    cursor: text

    .icon
      font-size: 28px
      color: var(--color-text-white)

    input
      flex: 1
      min-width: 0
      border: none
      outline: none
      background: none
      color: var(--color-text-white)
      height: var(--header-height)
      font-family: inherit
      font-size: 1.1em
      padding: 0 4px
      text-overflow: ellipsis

      &::placeholder
        color: #FFFFFF80

  #version-picker
    position: relative
    display: flex

  #version-button
    display: flex
    align-items: center
    gap: 8px
    padding: 0 10px 0 16px
    min-height: var(--header-height)
    background-color: var(--color-green)
    border: none
    color: var(--color-text-white)
    font-family: inherit
    font-size: 1em
    cursor: pointer
    user-select: none
    transition: background-color .15s

    &:hover
      background-color: var(--color-green-light)

    &.open
      background-color: var(--color-green-dark)

      .icon
        transform: rotate(180deg)

    .icon
      transition: transform .15s

  #version-label
    color: #FFFFFFA0
    font-size: .8em
    text-transform: uppercase
    letter-spacing: 2px

  #version-value
    font-weight: 700
    text-shadow: var(--text-shadow)

  #version-panel
    position: absolute
    top: 100%
    right: 0
    width: 440px
    max-width: calc(100vw - 32px)
    max-height: 70vh
    overflow-y: auto
    box-sizing: border-box
    padding: 12px
    display: flex
    flex-direction: column
    gap: 14px
    background-color: var(--color-green-dark)
    box-shadow: var(--box-shadow)

  .version-group-name
    font-size: .75em
    font-weight: 700
    text-transform: uppercase
    letter-spacing: 2px
    color: #FFFFFF90
    margin-bottom: 6px

  .version-group-options
    display: grid
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr))
    gap: 6px

  .version-option
    display: flex
    align-items: center
    justify-content: space-between
    gap: 6px
    padding: 7px 10px
    background-color: var(--color-green)
    color: var(--color-text-white)
    text-decoration: none
    user-select: none
    transition: background-color .15s

    &:hover
      background-color: var(--color-green-light)

    &.selected
      background-color: var(--color-red)

    .count
      font-size: .75em
      opacity: .6

  .version
    padding: 0 20px
    display: none

  #versions
    padding-bottom: 60px

  .shown
    display: block !important
    animation: fadeIn .25s forwards 1
    opacity: 0

    @keyframes fadeIn
      from
        opacity: 0
      to
        opacity: 1

  #no-results
    display: none
  
  #no-results-text
    display: flex
    justify-content: center
    margin-top: 128px
    font-weight: 700
    letter-spacing: 2px
    text-shadow: -4px 4px 1px var(--color-text-shadow)
    font-size: 2em

  .entries
    display: grid
    grid-template-columns: repeat(auto-fill, minmax(256px, 1fr))
    justify-content: space-around
    gap: 10px
    padding: 0 20px
  
    &.collapsed
      display: none

  .entry
    display: flex
    flex-direction: column
    align-items: center
    gap: 10px
    text-decoration: none
    transition: background-color .15s
  
    &:hover .entry-image
      scale: 1.05
      filter: blur(2px)
  
  .entry-name
    color: var(--color-text-white)
    font-size: 1.2em
    letter-spacing: 1px
    font-weight: 700
    padding-bottom: 10px
    text-align: center

  .entry-images
    min-width: 256px
    height: 128px
    display: flex
    justify-content: center
    align-items: center
    cursor: pointer
    text-decoration: none
    color: var(--color-text-white)
    position: relative
    overflow: hidden
    align-self: stretch
    box-shadow: var(--box-shadow)
  
  .entry-image
    width: 100%
    height: 100%
    background-size: cover
    background-position: 50% 50%
    position: relative
    transition: scale .3s, filter .3s

  .logo
    position: absolute
    inset: 16px
    background-size: contain
    background-position: 50% 50%
    background-repeat: no-repeat
    filter: drop-shadow(0 10px 4px var(--color-text-shadow))
    display: flex
    align-items: center
    font-size: 2.25rem
    text-align: center
    font-weight: 700
    justify-content: center

  .optifine
    position: absolute
    bottom: 0
    right: 0
    width: 32px
    height: 32px

  .category-header
    position: sticky
    background-color: var(--color-grey-darker)
    z-index: 1
    padding: 20px 0
  
    h1
      margin: 0
      text-shadow: -4px 4px 1px var(--color-text-shadow)
    
    .icon
      user-select: none
      color: var(--color-text-white)
      position: absolute
      top: 14px
      right: 0
      font-size: 38px
      transform: rotateZ(90deg)
      cursor: pointer
      filter: drop-shadow(4px 4px 1px var(--color-text-shadow))
      transition: color .15s, transform .15s, filter .15s
      
      &.collapsed
        transform: rotateZ(0)
        filter: drop-shadow(-4px 4px 1px var(--color-text-shadow))

  .featured-entry
    padding: var(--header-height)
    display: flex
    align-items: center
    flex-direction: column
    gap: 20px

  .featured-title
    font-weight: 700
    font-size: 2rem
    text-shadow: -4px 4px 1px var(--color-text-shadow)

  .featured
    display: flex
    justify-content: center
    text-decoration: none
    color: var(--color-text-white)
    gap: 20px
    background-color: var(--color-grey)
    padding: 10px 20px 10px 10px
    box-shadow: var(--box-shadow)
    transition: background-color .15s
  
    .logo
      inset: 24px
  
    &:hover
      background-color: var(--color-grey-light)
    
      .entry-image
        scale: 1.05
        filter: blur(2px)
      
  .featured-images
    min-width: 384px
    height: 192px

  .featured-category
    margin-bottom: 5px
    text-transform: uppercase
    letter-spacing: 5px
    font-size: 0.75rem

  .featured-name
    font-weight: 700
    font-size: 1.5rem
    text-shadow: var(--text-shadow)
    margin-bottom: 10px

  .featured-description
    line-height: 1.5rem
    display: flex
    flex-direction: column
    max-height: 135px
    overflow-y: auto
    white-space: pre-wrap
    padding-right: 10px
    margin-right: -10px
  
    :deep(code)
      font-size: 16px
      background-color: black
      padding: 0 4px
      font-family: Consolas, monospace
    
    :deep(li)
      margin-top: 5px
  
    :deep(img)
      image-rendering: pixelated
      max-width: 100%
    
    :deep(p)
      margin-top: 0

  // mobile

  @media only screen and (max-width: 900px)
    .featured
      flex-direction: column
      text-align: center
      padding: 10px
    
    .featured-images
      min-width: initial
    
    .featured-details
      padding: 0 10px 10px

  @media only screen and (max-width: 768px)
    #version-label
      display: none

    .category-header
      font-size: 0.75em
      padding: 10px 0
    
      .icon
        top: 0
        font-size: 24px
    
    .entries
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))
    
    .entry
      .entry-images
        min-width: 160px
        height: 80px
    
      .logo
        inset: 8px
        font-size: 1.3rem !important
    
    .featured-title
      font-size: 1.5rem
      text-align: center
</style>
