<script setup>
  import { ref, computed, watch } from "vue"
  import { useRoute } from "vue-router"
  import Page from "../components/Page.vue"
  import Link from "../components/Link.vue"
  import Icon from "../components/Icon.js"
  import PluginIcon from "../components/PluginIcon.vue"
  import IconTiles from "../components/IconTiles.vue"
  import { site } from "../lib/site.js"
  import { silentNavigate } from "../router.js"
  import { loadPlugins, formatCount } from "../lib/plugins.js"

  site.selected = "/plugins"

  const route = useRoute()
  const loading = ref(true)
  const failed = ref(false)
  const plugins = ref([])
  const search = ref("")
  const sort = ref("used")
  const tag = ref(route.query.tag ?? null)

  watch(tag, value => silentNavigate({ path: "/plugins", query: value ? { tag: value } : {} }, true))

  const sorts = {
    used: { name: "Most used", fn: (a, b) => b.weekly - a.weekly },
    new: { name: "Newest", fn: (a, b) => (b.creation_date ?? "").localeCompare(a.creation_date ?? "") },
    name: { name: "Name", fn: (a, b) => a.title.localeCompare(b.title) }
  }

  const tags = computed(() => {
    const counts = {}
    for (const t of plugins.value.flatMap(p => p.tags ?? [])) counts[t] = (counts[t] ?? 0) + 1
    return Object.keys(counts).filter(t => counts[t] > 1 || t === tag.value).sort()
  })
  const hasStats = computed(() => plugins.value.length > 0 && plugins.value[0].weekly !== null)
  const visibleSorts = computed(() => Object.fromEntries(Object.entries(sorts).filter(([id]) => id !== "used" || hasStats.value)))
  const totals = computed(() => plugins.value.reduce((t, p) => ({ weekly: t.weekly + p.weekly, total: t.total + p.total }), { weekly: 0, total: 0 }))
  const shown = computed(() => {
    const q = search.value.trim().toLowerCase()
    return plugins.value.filter(p => (!tag.value || p.tags?.includes(tag.value)) && (!q || `${p.title} ${p.description} ${p.tags?.join(" ")}`.toLowerCase().includes(q))).sort(sorts[sort.value].fn)
  })

  function cardImage(p) {
    if (!p.card) return null
    const image = `url("/assets/images/plugins/${p.slug}/images/${p.card}.webp")`
    return p.logo ? `linear-gradient(#00000060, #00000060), ${image}` : image
  }

  loadPlugins().then(data => {
    plugins.value = data
    if (!hasStats.value && sort.value === "used") sort.value = "new"
  }, () => failed.value = true).finally(() => loading.value = false)
</script>

<template>
  <Page :loading="loading">
    <div class="container">
      <div id="hero">
        <h1>Blockbench Plugins</h1>
        <p>Plugins that extend <a href="https://www.blockbench.net" target="_blank">Blockbench</a>, from Minecraft title logos and entity templates to colour gradient palettes.</p>
        <div v-if="plugins.length" id="totals">
          <div class="total"><span class="number">{{ plugins.length }}</span> plugins</div>
          <template v-if="hasStats">
            <div class="total"><span class="number">{{ formatCount(totals.total) }}</span> installs</div>
            <div class="total"><span class="number">{{ formatCount(totals.weekly) }}</span> per week</div>
          </template>
        </div>
      </div>
      <div id="controls">
        <label id="search">
          <Icon name="search" />
          <input v-model="search" placeholder="Search plugins..." @keypress.enter="e => e.currentTarget.blur()">
        </label>
        <div id="sorts">
          <button v-for="(s, id) of visibleSorts" class="sort" :class="{ selected: sort === id }" @click="sort = id">{{ s.name }}</button>
        </div>
      </div>
      <div id="tags">
        <button class="tag" :class="{ selected: !tag }" @click="tag = null">All</button>
        <button v-for="t of tags" class="tag" :class="{ selected: tag === t }" @click="tag = tag === t ? null : t">{{ t }}</button>
      </div>
      <div v-if="failed" class="message">Couldn't load the plugins right now. Try again in a moment.</div>
      <div v-else-if="!loading && !shown.length" class="message">No plugins match</div>
      <div id="grid">
        <Link v-for="p of shown" :key="p.id" class="card" :to="`/plugins/${p.slug}`">
          <div class="card-image" :style="{ backgroundImage: cardImage(p) }">
            <img v-if="p.logo" class="card-logo" :src="`/assets/images/plugins/${p.slug}/logo.webp`" alt="">
            <template v-else-if="!p.card">
              <IconTiles v-if="/^https?:/.test(p.icon)" :icon="p.icon" :rows="8" :columns="10" />
              <PluginIcon v-else class="card-placeholder" :icon="p.icon" />
            </template>
          </div>
          <div class="card-body">
            <PluginIcon class="card-icon" :icon="p.icon" />
            <div class="card-title">{{ p.title }}</div>
            <div class="card-description">{{ p.description }}</div>
            <div class="card-meta">
              <span>v{{ p.version }}</span>
              <span v-if="p.weekly !== null" class="installs" :title="`${p.total.toLocaleString()} installs in total`">{{ formatCount(p.weekly) }} / week</span>
              <span v-if="p.variant === 'desktop'" class="badge">Desktop only</span>
              <span v-else-if="p.variant === 'web'" class="badge">Web only</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  </Page>
</template>

<style lang="stylus" scoped>
  .container
    max-width: var(--content-width)
    margin: 0 auto
    padding: 0 20px 60px

  #hero
    padding: 48px 0 32px
    text-align: center

    h1
      margin: 0
      font-size: 3rem
      text-shadow: -4px 4px 1px var(--color-text-shadow)

    p
      margin: 12px auto 0
      max-width: 640px
      line-height: 1.5em
      color: #CCC

    a
      color: var(--color-link-blue)

  #totals
    display: flex
    justify-content: center
    gap: 12px
    margin-top: 24px
    flex-wrap: wrap

  .total
    background-color: var(--color-grey)
    padding: 10px 16px
    box-shadow: var(--box-shadow)
    color: #CCC

    .number
      color: var(--color-text-white)
      font-weight: 700
      font-size: 1.25em
      margin-right: 4px

  #controls
    display: flex
    gap: 12px
    position: sticky
    top: var(--header-height)
    z-index: 1
    padding: 12px 0
    background-color: var(--color-grey-darker)
    flex-wrap: wrap

  #search
    flex: 1
    min-width: 220px
    display: flex
    align-items: center
    gap: 6px
    background-color: var(--color-grey)
    box-shadow: var(--box-shadow)
    padding: 0 10px
    cursor: text

    svg
      width: 24px
      height: 24px
      fill: #AAA

    input
      flex: 1
      background: none
      border: none
      outline: none
      color: var(--color-text-white)
      font-size: 1.1em
      height: 42px
      padding: 0
      font-family: inherit

  #sorts
    display: flex
    box-shadow: var(--box-shadow)

  button
    font-family: inherit
    border: none
    cursor: pointer
    user-select: none
    color: var(--color-text-white)
    transition: background-color .15s

  .sort
    background-color: var(--color-grey)
    padding: 0 16px
    height: 42px
    font-size: 1em

    &:hover
      background-color: var(--color-grey-light)

    &.selected
      background-color: var(--color-accent)

  #tags
    display: flex
    flex-wrap: wrap
    gap: 8px
    padding-bottom: 24px

  .tag
    background-color: var(--color-grey)
    padding: 6px 12px
    font-size: .9em
    border-radius: 100px

    &:hover
      background-color: var(--color-grey-light)

    &.selected
      background-color: var(--color-accent)

  .message
    text-align: center
    padding: 60px 0
    font-size: 1.25em
    color: #AAA

  #grid
    display: grid
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))
    gap: 24px

  .card
    display: flex
    flex-direction: column
    background-color: var(--color-grey)
    box-shadow: var(--box-shadow)
    color: var(--color-text-white)
    text-decoration: none
    transition: transform .15s, background-color .15s

    &:hover
      transform: translateY(-4px)
      background-color: var(--color-grey-light)

      .card-image
        filter: brightness(1.1)

  .card-image
    position: relative
    overflow: hidden
    aspect-ratio: 16 / 9
    background-color: var(--color-grey-dark)
    background-size: cover
    background-position: 50% 50%
    display: flex
    align-items: center
    justify-content: center
    transition: filter .15s

  .card-logo
    width: calc(100% - 48px)
    height: calc(100% - 48px)
    object-fit: contain
    image-rendering: pixelated
    filter: drop-shadow(0 10px 8px var(--color-svg-shadow))

  .card-placeholder
    position: relative
    width: 48px
    height: 48px
    opacity: .9
    filter: drop-shadow(0 8px 4px var(--color-text-shadow))

  .card-body
    position: relative
    padding: 36px 16px 16px
    display: flex
    flex-direction: column
    gap: 8px
    flex: 1

  .card-icon
    position: absolute
    top: -24px
    left: 16px
    width: 48px
    height: 48px
    filter: drop-shadow(0 4px 4px var(--color-text-shadow))

  .card-title
    font-weight: 700
    font-size: 1.25em

  .card-description
    color: #BBB
    line-height: 1.4em
    font-size: .95em
    display: -webkit-box
    -webkit-line-clamp: 3
    -webkit-box-orient: vertical
    overflow: hidden

  .card-meta
    margin-top: auto
    display: flex
    gap: 12px
    align-items: center
    font-size: .85em
    color: #999
    flex-wrap: wrap

  .installs
    color: var(--color-accent)
    font-weight: 700

  .badge
    margin-left: auto
    background-color: var(--color-grey-dark)
    padding: 3px 8px
    border-radius: 100px
    color: #CCC

  @media (max-width: 600px)
    #hero h1
      font-size: 2.25rem

    #sorts
      width: 100%

    .sort
      flex: 1
</style>
