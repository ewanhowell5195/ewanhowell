<script setup>
  import { ref, computed } from "vue"
  import { useRoute } from "vue-router"
  import Page from "../components/Page.vue"
  import Link from "../components/Link.vue"
  import Icon from "../components/Icon.js"
  import PluginIcon from "../components/PluginIcon.vue"
  import IconTiles from "../components/IconTiles.vue"
  import Gallery from "../components/Gallery.vue"
  import { site } from "../lib/site.js"
  import { notFound } from "../router.js"
  import { setFavicon } from "../lib/utils.js"
  import { loadPlugins, loadAbout, loadChangelog, formatCount, formatDate } from "../lib/plugins.js"
  import { slug } from "../lib/pluginRepo.js"

  const props = defineProps({ name: String })

  site.selected = "/plugins"

  const route = useRoute()
  const loading = ref(true)
  const plugin = ref()
  const all = ref([])
  const about = ref()
  const aboutLinks = ref([])
  const aboutVideo = ref()
  const changelog = ref([])
  const tab = ref("about")

  const platforms = { both: "Desktop and web", desktop: "Desktop only", web: "Web only" }

  const gallery = computed(() => {
    const items = (plugin.value.images ?? []).map(image => ({ image: `/assets/images/plugins/${plugin.value.slug}/images/${image}.webp` }))
    const video = aboutVideo.value ?? plugin.value.video
    if (video) items.unshift({ video })
    return items
  })
  const dependencies = computed(() => (plugin.value.dependencies ?? []).map(id => all.value.find(p => p.id === id) ?? { id, title: id, external: true }))
  const dependents = computed(() => all.value.filter(p => p.dependencies?.includes(plugin.value.id)))
  const banner = computed(() => `url("/assets/images/plugins/${plugin.value.slug}/images/${plugin.value.card}.webp")`)

  async function load() {
    let plugins
    try {
      plugins = await loadPlugins()
    } catch {
      loading.value = false
      return
    }
    const found = plugins.find(p => p.slug === props.name)
    if (!found) return notFound(route)
    all.value = plugins
    plugin.value = found
    document.title = `${found.title} - ${found.author}`
    if (/^https?:/.test(found.icon)) setFavicon(found.icon)
    const [aboutData, log] = await Promise.all([loadAbout(found.id), loadChangelog(found.id)])
    about.value = aboutData.html
    aboutLinks.value = aboutData.links
    aboutVideo.value = aboutData.video
    changelog.value = log
    if (!aboutData.html) tab.value = "changelog"
    loading.value = false
  }

  load()
</script>

<template>
  <Page :loading="loading">
    <div v-if="!loading && !plugin" class="message">Couldn't load this plugin right now. Try again in a moment.</div>
    <div v-if="plugin" class="container">
      <div id="banner">
        <div v-if="plugin.card" id="banner-background" :style="{ backgroundImage: banner }"></div>
        <IconTiles v-else-if="/^https?:/.test(plugin.icon)" :icon="plugin.icon" :rows="14" :columns="32" />
        <div id="banner-content">
          <div id="heading">
            <Link id="back" to="/plugins">Blockbench Plugins</Link>
            <div id="title-row">
              <PluginIcon id="icon" :icon="plugin.icon" />
              <h1>{{ plugin.title }}</h1>
            </div>
            <div v-if="plugin.author !== 'Ewan Howell'" id="author">by {{ plugin.author }}</div>
            <p id="description">{{ plugin.description }}</p>
            <div id="actions">
              <a v-if="plugin.variant !== 'desktop'" class="button-download" :href="`https://web.blockbench.net/?plugins=${plugin.id}`" target="_blank">
                <Icon name="open_in_new" />
                <span>Open in Blockbench Web</span>
              </a>
              <a class="button" :class="{ 'button-download': plugin.variant === 'desktop' }" :href="`https://www.blockbench.net/plugins/${plugin.id}`" target="_blank">
                <Icon name="open_in_new" />
                <span>View on blockbench.net</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div v-if="plugin.deprecation_note" id="deprecated">{{ plugin.deprecation_note }}</div>
      <div id="stats">
        <div class="stat"><div class="stat-value">{{ plugin.version }}</div><div class="stat-name">Version</div></div>
        <div class="stat"><div class="stat-value">{{ formatCount(plugin.weekly) }}</div><div class="stat-name">Installs per week</div></div>
        <div class="stat" :title="plugin.total.toLocaleString()"><div class="stat-value">{{ formatCount(plugin.total) }}</div><div class="stat-name">Installs in total</div></div>
        <div v-if="plugin.creation_date" class="stat"><div class="stat-value">{{ formatDate(plugin.creation_date) }}</div><div class="stat-name">Released</div></div>
        <div v-if="changelog[0]?.date" class="stat"><div class="stat-value">{{ formatDate(changelog[0].date) }}</div><div class="stat-name">Last updated</div></div>
        <div class="stat"><div class="stat-value">{{ platforms[plugin.variant] ?? plugin.variant }}</div><div class="stat-name">Blockbench {{ plugin.min_version }}+</div></div>
      </div>
      <div id="content">
        <div id="main">
          <Gallery v-if="gallery.length" :items="gallery" :group="`plugin-${plugin.id}`" />
          <section v-if="about || changelog.length">
            <div id="tab-bar">
              <button v-if="about" class="tab" :class="{ selected: tab === 'about' }" @click="tab = 'about'">About</button>
              <button v-if="changelog.length" class="tab" :class="{ selected: tab === 'changelog' }" @click="tab = 'changelog'">Changelog</button>
            </div>
            <div v-if="about" v-show="tab === 'about'" id="about" v-html="about"></div>
            <div v-if="changelog.length" v-show="tab === 'changelog'" id="changelog">
              <div v-for="change of changelog" class="change">
                <div class="change-header">
                  <span class="change-version">{{ change.title }}</span>
                  <span v-if="change.date" class="change-date">{{ formatDate(change.date) }}</span>
                </div>
                <div v-for="category of change.categories" class="change-category">
                  <div class="change-category-title">{{ category.title }}</div>
                  <ul>
                    <li v-for="item of category.list" v-html="item"></li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>
        <aside id="side">
          <div v-if="plugin.tags?.length" class="panel">
            <h3>Tags</h3>
            <div id="tags">
              <Link v-for="tag of plugin.tags" class="tag" :to="`/plugins?tag=${encodeURIComponent(tag)}`">{{ tag }}</Link>
            </div>
          </div>
          <div v-if="dependencies.length" class="panel">
            <h3>Requires</h3>
            <template v-for="dep of dependencies">
              <a v-if="dep.external" class="related" :href="`https://www.blockbench.net/plugins/${dep.id}`" target="_blank">{{ dep.title }}</a>
              <Link v-else class="related" :to="`/plugins/${slug(dep.id)}`"><PluginIcon class="related-icon" :icon="dep.icon" />{{ dep.title }}</Link>
            </template>
          </div>
          <div v-if="dependents.length" class="panel">
            <h3>Add-ons</h3>
            <Link v-for="dep of dependents" class="related" :to="`/plugins/${dep.slug}`"><PluginIcon class="related-icon" :icon="dep.icon" />{{ dep.title }}</Link>
          </div>
          <div v-if="aboutLinks.length || plugin.repository || plugin.bug_tracker" class="panel">
            <h3>Links</h3>
            <a v-for="link of aboutLinks" class="button" :href="link.href" target="_blank">
              <i :class="link.iconClass">{{ link.iconText }}</i>
              <span>{{ link.text }}</span>
            </a>
            <a v-if="plugin.repository" class="button" :href="plugin.repository" target="_blank">
              <Icon name="github" />
              <span>Source code</span>
            </a>
            <a v-if="plugin.bug_tracker" class="button" :href="plugin.bug_tracker" target="_blank">
              <Icon name="open_in_new" />
              <span>Report a bug</span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </Page>
</template>

<style lang="stylus" scoped>
  @import "../styles/buttons.styl"

  .container
    max-width: var(--content-width)
    margin: 0 auto
    padding-bottom: 60px

  .message
    text-align: center
    padding: 80px 20px
    font-size: 1.25em
    color: #AAA

  #banner
    position: relative
    overflow: hidden
    background-color: var(--color-grey-dark)
    box-shadow: var(--box-shadow)

  #banner-background
    position: absolute
    inset: -20px
    background-size: cover
    background-position: 50% 50%
    filter: blur(8px) brightness(.45)

  #banner-content
    position: relative
    display: flex
    gap: 32px
    padding: 48px 40px
    align-items: center

  #title-row
    display: flex
    align-items: center
    gap: 14px

  #icon
    width: 48px
    height: 48px
    flex-shrink: 0
    filter: drop-shadow(0 4px 4px var(--color-text-shadow))

  #heading
    display: flex
    flex-direction: column
    gap: 8px

  #back
    color: #CCC
    text-decoration: none
    text-transform: uppercase
    letter-spacing: 3px
    font-size: .8em
    font-weight: 700

    &:hover
      color: var(--color-text-white)

  h1
    margin: 0
    font-size: 3rem
    text-shadow: -4px 4px 1px var(--color-text-shadow)

  #author
    color: #DDD
    font-weight: 700

  #description
    margin: 4px 0 8px
    max-width: 720px
    line-height: 1.5em
    font-size: 1.1em

  #actions
    display: flex
    gap: 12px
    flex-wrap: wrap

  #deprecated
    background-color: var(--color-red-dark)
    padding: 16px 40px
    font-weight: 700

  #stats
    display: grid
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))
    background-color: var(--color-grey)
    box-shadow: var(--box-shadow)

  .stat
    padding: 18px 20px
    text-align: center

    &:not(:last-child)
      border-right: 1px solid var(--color-grey-light)

  .stat-value
    font-weight: 700
    font-size: 1.3em

  .stat-name
    color: #999
    font-size: .85em
    margin-top: 4px

  #content
    display: flex
    gap: 32px
    padding: 32px 0 0
    align-items: flex-start

  #main
    flex: 1
    min-width: 0
    display: flex
    flex-direction: column
    gap: 32px

  #side
    width: 260px
    flex-shrink: 0
    display: flex
    flex-direction: column
    gap: 16px
    position: sticky
    top: calc(var(--header-height) + 20px)

  h2
    margin: 0 0 16px
    font-size: 1.75rem
    text-shadow: -3px 3px 1px var(--color-text-shadow)

  h3
    margin: 0
    font-size: 1.1em


  #tab-bar
    display: flex
    border-bottom: 2px solid var(--color-grey-light)
    margin-bottom: 20px

  .tab
    background: none
    border: none
    border-bottom: 3px solid transparent
    margin-bottom: -2px
    padding: 10px 20px
    color: #AAA
    font-family: inherit
    font-size: 1.1em
    font-weight: 700
    cursor: pointer
    user-select: none
    transition: color .15s, border-color .15s

    &:hover
      color: var(--color-text-white)

    &.selected
      color: var(--color-text-white)
      border-bottom-color: var(--color-accent)

  #about
    --color-accent: #3E90FF
    --color-light: #F4F3FF
    --color-subtle_text: #848891
    --color-back: #181B1F
    --color-border: #101316
    line-height: 1.6em
    color: #CACAD4
    overflow-wrap: anywhere
    user-select: text

  :where(#about)
    :deep(h1)
      margin: 8px 0
      color: var(--color-light)

    :deep(h2)
      margin: 14px 0 8px
      color: var(--color-light)

    :deep(h3)
      color: var(--color-light)

    :deep(p)
      margin: 12px 0

    :deep(li)
      margin: 8px 0

    :deep(li > p)
      margin: 0

    :deep(ul), :deep(ol)
      padding-left: 24px

    :deep(a)
      color: var(--color-accent)

    :deep(pre)
      border: 1px solid var(--color-border)
      background: var(--color-back)
      padding: 6px 10px
      overflow: auto

    :deep(code)
      font-family: Consolas, monospace

    :deep(blockquote)
      margin: 0
      border-left: 4px solid var(--color-accent)
      padding: 4px 4px 4px 16px
      background: var(--color-back)

    :deep(img)
      max-width: 100%

  #about :deep(.material-symbols-outlined)
    display: inline-block
    width: auto
    height: auto
    font-size: 22px
    line-height: 1
    vertical-align: baseline

  #changelog
    display: flex
    flex-direction: column
    gap: 12px

  .change
    background-color: var(--color-grey)
    box-shadow: var(--box-shadow)
    padding: 16px 20px

  .change-header
    display: flex
    align-items: baseline
    gap: 12px
    margin-bottom: 8px

  .change-version
    font-weight: 700
    font-size: 1.2em

  .change-date
    color: #999
    font-size: .9em

  .change-category-title
    font-weight: 700
    color: #CCC
    font-size: .9em
    margin-top: 8px

  .change ul
    margin: 4px 0 0
    padding-left: 22px
    color: #DDD
    line-height: 1.5em
    overflow-wrap: anywhere

    :deep(a)
      color: var(--color-link-blue)

    :deep(code)
      background-color: black
      padding: 0 4px
      font-family: Consolas, monospace

  .panel
    background-color: var(--color-grey)
    box-shadow: var(--box-shadow)
    padding: 16px
    display: flex
    flex-direction: column
    gap: 10px

    .button
      justify-content: flex-start

  #tags
    display: flex
    flex-wrap: wrap
    gap: 6px

  .tag
    background-color: var(--color-grey-light)
    padding: 4px 10px
    border-radius: 100px
    font-size: .85em
    color: var(--color-text-white)
    text-decoration: none
    user-select: none
    transition: background-color .15s

    &:hover
      background-color: var(--color-grey-lighter)

  .related
    display: flex
    align-items: center
    gap: 10px
    color: var(--color-text-white)
    text-decoration: none
    font-weight: 700

    &:hover
      color: var(--color-link-blue)

  .related-icon
    width: 32px
    height: 32px

  @media (max-width: 1320px)
    #content
      padding: 32px 20px 0

  @media (max-width: 900px)
    #content
      flex-direction: column
      padding: 24px 20px 0

    #side
      width: 100%
      position: static

  @media (max-width: 600px)
    #banner-content
      flex-direction: column
      text-align: center
      padding: 32px 20px

    #title-row
      flex-direction: column
      gap: 10px

    #actions
      justify-content: center

    h1
      font-size: 2.25rem
</style>
