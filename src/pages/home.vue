<script setup>
  import { ref, onMounted } from "vue"
  import { useRoute, useRouter } from "vue-router"
  import Page from "../components/Page.vue"
  import Link from "../components/Link.vue"
  import Carousel from "../components/Carousel.vue"
  import SkinDoll from "../components/SkinDoll.vue"
  import WynemChat from "../components/WynemChat.vue"
  import Icon from "../components/Icon.js"
  import MinecraftTitle from "../components/MinecraftTitle.vue"
  import { site } from "../lib/site.js"
  import { fetchJSON, entryName } from "../lib/utils.js"
  import { loadPlugins } from "../lib/plugins.js"

  site.selected = "/"

  const route = useRoute()
  const router = useRouter()

  const heroLinks = [
    { text: "Resource Packs", to: "/resourcepacks" },
    { text: "Wynem", href: "https://wynem.com/" },
    { text: "Blockbench Plugins", to: "/plugins" },
    { text: "NPM Modules", to: "/npm" }
  ]

  const projects = [
    { to: "/resourcepacks/f8thful", image: "resourcepacks/f8thful/images/house.webp", tag: "Resource Pack", title: "F8thful", description: "Every vanilla texture recreated in 8x8!" },
    { to: "/plugins/minecraft-title-generator", image: "plugins/minecraft-title-generator/images/banner.webp", logo: "plugins/minecraft-title-generator/logo.webp", tag: "Blockbench Plugin", title: "Minecraft Title Generator", description: "Create Minecraft styled title models!" },
    { to: "/maps/entity-tester", image: "maps/entity-tester/images/entities.webp", tag: "Map", title: "Entity Tester", description: "Every entity laid out in a small area, for testing your entity models and textures." },
    { to: "/plugins/cem-template-loader", image: "plugins/cem-template-loader/images/entities.webp", tag: "Blockbench Plugin", title: "CEM Template Loader", description: "Load the Java Edition entity models for OptiFine CEM, with an animation editor for making custom entity animations." },
    { to: "/resourcepacks/entity-healthbars", image: "resourcepacks/entity-healthbars/images/all.webp", tag: "Resource Pack", title: "Entity Healthbars", description: "Adds a healthbar to every entity, so you can see their health update live as you damage them!" },
    { to: "/plugins/asset-browser", image: "plugins/asset-browser/images/textures.webp", tag: "Blockbench Plugin", title: "Asset Browser", description: "Browse the vanilla Minecraft assets from inside Blockbench." },
    { to: "/guides/random-entity-textures", image: "guides/random-entity-textures/thumbnail.webp", tag: "Guide", title: "Random Entity Textures", description: "How to add texture variations to entities based on things like name, biome, Y level, and more." },
    { to: "/tools/bedconverter", image: "minecraft/beds.webp", contain: true, tag: "Tool", title: "Bed Converter", description: "Convert bed entity textures to the 26.2 block format." }
  ]

  const apps = [
    { href: "https://structure-viewer.ewanhowell.com/", image: "https://structure-viewer.ewanhowell.com/cover.png", title: "Structure Viewer", description: "View every Minecraft structure and worldgen feature in 3D, and load your own structures, worlds, and resource packs!", badge: "In development" },
    { href: "https://asset-browser.ewanhowell.com/", image: "https://asset-browser.ewanhowell.com/og.png", title: "Asset Browser", description: "Browse, view, and download the vanilla assets from any Java or Bedrock version, straight from your browser.", badge: "In development" },
    { href: "https://horizonwayfind.ing/", image: "https://horizonwayfind.ing/social/home.jpg", title: "Horizon Wayfinder", description: "Guess where you are on the map from a random photosphere in Horizon Zero Dawn or Horizon Forbidden West!", badge: "In development" }
  ]

  const selectedApp = ref(0)

  function compact(value) {
    return value >= 1000000 ? Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value) : value.toLocaleString("en")
  }

  const wynemStats = ref([])
  const wynemOnline = ref()

  fetch("https://api.wynem.com/info").then(r => r.json()).catch(() => wynemOnline.value = false).then(info => {
    if (!info) return
    wynemOnline.value = true
    wynemStats.value = [[info.guilds, "Servers"], [info.userInstalls, "User installs"], [info.commandsProcessed, "Commands run"]].filter(([value]) => value !== undefined).map(([value, label]) => [compact(value), label])
  })

  const pluginStats = ref([])

  loadPlugins().then(plugins => {
    if (plugins[0]?.total === null) return
    pluginStats.value = [[plugins.reduce((sum, p) => sum + p.total, 0), "Downloads"], [plugins.reduce((sum, p) => sum + p.lastWeek, 0), "Downloads last week"]].map(([value, label]) => [compact(value), label])
  })

  const packIds =["f8thful", "skeleton-physics", "entity-healthbars", "oledcraft", "better-bows", "snowstorm", "umbrella-villagers", "pack-and-white", "minecarts-with-wheels", "butterflies", "boomerangs", "quindent"]
  const packs = ref([])

  fetchJSON("resourcepacks").then(async data => {
    const entries = Object.fromEntries(data.categories.flatMap(c => c.entries.map(e => [e.id, { entry: e, category: c.name }])))
    const subtitles = await Promise.all(packIds.map(id => fetchJSON(`resourcepacks/${id}`).then(d => d.subtitle)))
    packs.value = packIds.map((id, i) => ({
      to: `/resourcepacks/${id}`,
      image: `/assets/images/resourcepacks/${id}/images/${entries[id].entry.image}.webp`,
      title: entryName(entries[id].entry),
      subtitle: subtitles[i],
      tag: entries[id].category
    }))
  })

  const tiles = [
    { to: "/resourcepacks", image: "home/f8thful.webp", label: "Resource Packs" },
    { href: "https://wynem.com/", image: "home/wynem.webp", label: "Wynem" },
    { to: "/plugins", image: "plugins/cem-template-loader/images/dialog.webp", label: "Blockbench Plugins" },
    { to: "/npm", image: "logo/logo.webp", logo: true, label: "NPM Modules" },
    { to: "/maps", image: "maps/entity-tester/images/entities.webp", label: "Maps" },
    { to: "/themes", image: "themes/blockbenchcord/images/menu.webp", label: "Blockbench Themes" },
    { to: "/dungeonsmods", image: "dungeonsmods/strider/images/strider.webp", label: "Dungeons Mods" },
    { to: "/guides", image: "guides/emissive-textures/thumbnail.webp", label: "Guides" },
    { to: "/renders", image: "renders/pickup_truck.webp", label: "Renders" },
    { to: "/tools", image: "minecraft/minecrafttitle.webp", label: "Tools" },
    { href: "https://sketchfab.com/ewanhowell5195/models", image: "renders/glados.webp", label: "3D Models" },
    { href: "https://github.com/ewanhowell5195/ewanhowell5195.github.io/releases", image: "logo/logo.webp", logo: true, label: "Programs" }
  ]

  function background(image) {
    return { backgroundImage: `url("${/^https?:/.test(image) ? image : `/assets/images/${image}`}")` }
  }

  function getRedirect(params) {
    if (params.pack) return `/resourcepacks/${params.pack}`
    if ("resourcepacks" in params || "pack" in params) return "/resourcepacks"
    if (params.map) return `/maps/${params.map}`
    if ("maps" in params || "map" in params) return "/maps"
    if (params.dungeon) return `/dungeonsmods/${params.dungeon}`
    if ("dungeons" in params || "dungeon" in params) return "/dungeonsmods"
    if ("renders" in params) return "/renders"
  }

  onMounted(() => {
    const redirect = getRedirect(route.query)
    if (redirect) router.replace(redirect)
  })
</script>

<template>
  <Page>
    <div class="hero-wrap">
      <div class="hero">
        <div class="hero-bg" :style="background('home/logo_3d.webp')"></div>
        <div class="hero-content">
          <img class="hero-logo" src="/assets/images/logo/logo.webp" alt="Ewan Howell">
          <h1>Ewan Howell</h1>
          <p class="tagline">Resource packs, Blockbench plugins, Discord bots, and more!</p>
          <div class="hero-links">
            <template v-for="link of heroLinks">
              <Link v-if="link.to" class="button" :to="link.to"><span>{{ link.text }}</span></Link>
              <a v-else class="button" :href="link.href" target="_blank"><span>{{ link.text }}</span></a>
            </template>
          </div>
        </div>
      </div>
      <div class="hero-doll">
        <SkinDoll uuid="d31e5dcafafb4e5bbb10b14dff9dbc8a" />
      </div>
    </div>

    <section class="feature feature-alt">
      <div class="feature-inner">
        <div class="feature-image feature-image-contain" :style="background('home/logo_3d.webp')"></div>
        <div class="feature-text">
          <h2>Hey, I am Ewan</h2>
          <p>I make resource packs, Blockbench plugins, a Discord bot, web tools, and NPM modules. Almost all of it lives on this site, and the rest is linked from here.</p>
          <p>Nearly everything I make is free!</p>
        </div>
      </div>
    </section>

    <section class="feature">
      <div class="feature-stack">
        <div class="feature-header">
          <div class="feature-text">
            <h2>Resource Packs</h2>
            <p>I make resource packs for Minecraft Java Edition. Some retexture the whole game, like F8thful, and others add new things to it, like healthbars above every mob!</p>
          </div>
          <Link class="button" to="/resourcepacks"><span>Browse resource packs</span></Link>
        </div>
        <Carousel :items="packs" />
      </div>
    </section>

    <section class="feature feature-alt">
      <div class="feature-inner">
        <WynemChat class="wynem-chat" />
        <div class="feature-text">
          <div class="wynem-heading">
            <img src="https://wynem.com/assets/images/logo/wynem.svg" alt="">
            <h2>Wynem</h2>
            <span v-if="wynemOnline !== undefined" class="status" :class="{ online: wynemOnline }">{{ wynemOnline ? "Online" : "Offline" }}</span>
          </div>
          <p>Wynem is my multipurpose Discord bot. It has moderation, image editing, fun commands, and a lot of features I made because I wanted them in my own server.</p>
          <div v-if="wynemStats.length" class="stats">
            <div v-for="[value, label] of wynemStats">
              <strong>{{ value }}</strong>
              <span>{{ label }}</span>
            </div>
          </div>
          <div class="feature-buttons">
            <a class="button button-discord" href="https://invite.wynem.com/" target="_blank"><Icon name="discord" /><span>Add to Discord</span></a>
            <a class="button" href="https://wynem.com/" target="_blank"><span>Visit wynem.com</span></a>
          </div>
        </div>
      </div>
    </section>

    <section class="feature">
      <div class="feature-inner">
        <MinecraftTitle />
        <div class="feature-text">
          <h2>Blockbench Plugins</h2>
          <p>I make plugins for Blockbench, the 3D model editor used for Minecraft. They add things like entity model templates, a vanilla asset browser, and Minecraft Title Generator, which makes Minecraft styled title models like this one.</p>
          <div v-if="pluginStats.length" class="stats">
            <div v-for="[value, label] of pluginStats">
              <strong>{{ value }}</strong>
              <span>{{ label }}</span>
            </div>
          </div>
          <div class="feature-buttons">
            <Link class="button" to="/plugins"><span>Browse plugins</span></Link>
            <Link class="button" to="/plugins/minecraft-title-generator"><span>Minecraft Title Generator</span></Link>
          </div>
        </div>
      </div>
    </section>

    <section class="apps">
      <div class="container">
        <h2 class="section-heading">Websites</h2>
        <div class="app-showcase">
          <div class="app-list">
            <button v-for="(app, i) of apps" class="app" :class="{ selected: selectedApp === i }" @click="selectedApp = i" @mouseenter="selectedApp = i">
              <div class="app-title">
                <h3>{{ app.title }}</h3>
                <span v-if="app.badge" class="app-badge">{{ app.badge }}</span>
              </div>
              <p>{{ app.description }}</p>
            </button>
          </div>
          <a class="app-preview" :href="apps[selectedApp].href" target="_blank">
            <div v-for="(app, i) of apps" class="app-image" :class="{ selected: selectedApp === i }" :style="background(app.image)"></div>
            <div class="app-open"><span>Open {{ apps[selectedApp].title }}</span></div>
          </a>
        </div>
      </div>
    </section>

    <section class="container">
      <h2 class="section-heading">Featured projects</h2>
      <div class="project-grid">
        <Link v-for="project of projects" class="project" :to="project.to">
          <div class="project-image" :class="{ 'project-image-contain': project.contain }" :style="background(project.image)">
            <div v-if="project.logo" class="project-logo" :style="background(project.logo)"></div>
          </div>
          <div class="project-body">
            <div class="project-tag">{{ project.tag }}</div>
            <h3>{{ project.title }}</h3>
            <p>{{ project.description }}</p>
          </div>
        </Link>
      </div>
    </section>

    <section class="container">
      <h2 class="section-heading">Explore all</h2>
      <div class="tile-grid">
        <template v-for="tile of tiles">
          <Link v-if="tile.to" class="tile" :to="tile.to">
            <div class="tile-image" :class="{ 'tile-image-logo': tile.logo }" :style="background(tile.image)"></div>
            <div class="tile-label">{{ tile.label }}</div>
          </Link>
          <a v-else class="tile" :href="tile.href" target="_blank">
            <div class="tile-image" :class="{ 'tile-image-logo': tile.logo }" :style="background(tile.image)"></div>
            <div class="tile-label">{{ tile.label }}</div>
          </a>
        </template>
      </div>
    </section>
  </Page>
</template>

<style lang="stylus" scoped>
  @import "../styles/buttons.styl"

  .hero .button
    background-color: var(--color-red)

  .hero-wrap
    position: relative
    overflow-x: clip

  .hero-doll
    position: absolute
    top: 100%
    right: calc(max(20px, (100% - var(--content-width)) / 2) - 80px)
    z-index: 2
    pointer-events: none

  .hero
    position: relative
    width: 100%
    min-height: 520px
    display: flex
    align-items: center
    justify-content: center
    overflow: hidden

  .hero-bg
    position: absolute
    inset: 0
    background-size: cover
    background-position: 50% 50%
    filter: blur(8px) brightness(0.5)
    transform: scale(1.1)

  .hero-content
    position: relative
    display: flex
    flex-direction: column
    align-items: center
    text-align: center
    padding: 60px 20px
    max-width: var(--content-width)

  .hero-logo
    width: 120px
    height: 120px
    image-rendering: pixelated
    box-shadow: var(--box-shadow)

  .hero h1
    margin: 20px 0 10px
    font-size: clamp(2.5em, 6vw, 4.5em)
    text-shadow: -4px 4px 1px var(--color-text-shadow)
    letter-spacing: 2px

  .tagline
    margin: 0 0 30px
    font-size: clamp(1em, 2vw, 1.3em)
    opacity: 0.85
    max-width: 600px

  .hero-links
    display: flex
    flex-wrap: wrap
    justify-content: center
    gap: 12px

  .container
    max-width: calc(var(--content-width) + 40px)
    margin: 0 auto
    padding: 60px 20px

  .section-heading
    margin: 0 0 30px
    font-size: clamp(1.6em, 3vw, 2.2em)
    text-shadow: var(--text-shadow)

  .feature
    width: 100%
    padding: 80px 20px
    display: flex
    justify-content: center
    overflow-x: clip

  .feature-alt
    background-color: var(--color-grey-dark)

  .feature-inner
    width: 100%
    max-width: var(--content-width)
    display: grid
    grid-template-columns: 1fr 1fr
    gap: 60px
    align-items: center

  .feature-stack
    width: 100%
    max-width: var(--content-width)
    display: flex
    flex-direction: column
    gap: 30px

  .feature-header
    display: flex
    align-items: flex-end
    justify-content: space-between
    gap: 30px

    .feature-text
      max-width: 640px

    .button
      flex-shrink: 0

  .feature-alt .feature-inner
    direction: rtl

    & > *
      direction: ltr

  .feature-image
    aspect-ratio: 16 / 9
    background-size: cover
    background-position: 50% 50%
    box-shadow: var(--box-shadow)

  .feature-image-contain
    background-color: var(--color-grey)
    background-size: contain
    background-repeat: no-repeat
    background-position: 50% 50%

  .feature-text
    display: flex
    flex-direction: column
    gap: 16px

    h2
      margin: 0
      font-size: clamp(1.8em, 3.5vw, 2.6em)
      text-shadow: var(--text-shadow)

    p
      margin: 0
      line-height: 1.6
      opacity: 0.9
      font-size: 1.05em

  .feature-buttons
    display: flex
    flex-wrap: wrap
    gap: 12px
    margin-top: 4px

  .wynem-heading
    display: flex
    align-items: center
    gap: 16px

    img
      width: clamp(48px, 5vw, 64px)
      filter: drop-shadow(-4px 4px 1px var(--color-text-shadow))

  .status
    display: flex
    align-items: center
    gap: 8px
    padding: 4px 12px
    border-radius: 20px
    background-color: rgba(255, 255, 255, 0.08)
    font-size: 0.85em
    font-weight: 700
    letter-spacing: 1px
    text-transform: uppercase
    color: #ED4245

    &::before
      content: ""
      width: 10px
      height: 10px
      border-radius: 50%
      background-color: currentColor

    &.online
      color: #23A55A

  .button-discord
    background-color: #5865F2

  .stats
    display: flex
    flex-wrap: wrap
    gap: 12px 40px

    div
      display: flex
      flex-direction: column

    strong
      font-size: 2em
      line-height: 1.2
      text-shadow: var(--text-shadow)

    span
      opacity: 0.7
      font-size: 0.9em
      text-transform: uppercase
      letter-spacing: 1px

  .project-grid
    display: grid
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))
    gap: 20px

  .project
    display: flex
    flex-direction: column
    background-color: var(--color-grey)
    color: var(--color-text-white)
    text-decoration: none
    box-shadow: var(--box-shadow)
    overflow: hidden
    transition: background-color .15s, transform .15s

    &:hover
      background-color: var(--color-grey-light)
      transform: translateY(-3px)

  .project-image
    position: relative
    width: 100%
    aspect-ratio: 16 / 9
    background-size: cover
    background-position: 50% 50%

  .project-logo
    position: absolute
    inset: 10%
    background-size: contain
    background-repeat: no-repeat
    background-position: 50% 50%
    filter: drop-shadow(0 8px 8px var(--color-shadow))

  .project-image-contain
    background-color: var(--color-grey-dark)
    background-size: contain
    background-repeat: no-repeat
    background-position: 50% 50%

  .project-body
    padding: 16px 20px 20px
    display: flex
    flex-direction: column
    gap: 6px
    flex: 1

    h3
      margin: 0
      font-size: 1.2em

    p
      margin: 0
      opacity: 0.85
      line-height: 1.5
      font-size: 0.95em

  .project-tag
    font-size: 0.75em
    font-weight: 700
    letter-spacing: 2px
    text-transform: uppercase
    color: var(--color-red-light)

  .apps
    background-color: var(--color-grey-dark)

  .app-showcase
    display: grid
    grid-template-columns: 2fr 3fr
    gap: 40px
    align-items: center

  .app-list
    display: flex
    flex-direction: column
    gap: 4px

  .app
    display: flex
    flex-direction: column
    gap: 6px
    padding: 16px 20px
    border: none
    border-left: 4px solid transparent
    background: none
    color: var(--color-text-white)
    font-family: inherit
    font-size: 1em
    text-align: left
    cursor: pointer
    user-select: none
    opacity: 0.6
    transition: opacity .15s, background-color .15s, border-color .15s

    p
      margin: 0
      line-height: 1.5
      font-size: 0.95em

    &.selected
      opacity: 1
      background-color: var(--color-grey)
      border-left-color: var(--color-red)

  .app-preview
    position: relative
    display: block
    aspect-ratio: 1200 / 630
    overflow: hidden
    box-shadow: var(--box-shadow)

    &:hover .app-open
      opacity: 1

  .app-image
    position: absolute
    inset: 0
    background-size: cover
    background-position: 50% 50%
    opacity: 0
    transition: opacity .3s

    &.selected
      opacity: 1

  .app-open
    position: absolute
    inset: 0
    display: flex
    align-items: center
    justify-content: center
    background-color: #00000080
    opacity: 0
    transition: opacity .15s

    span
      background-color: var(--color-red)
      color: var(--color-text-white)
      padding: 10px 18px
      font-weight: 700
      box-shadow: var(--box-shadow)

  .app-title
    display: flex
    align-items: center
    gap: 10px
    flex-wrap: wrap

    h3
      margin: 0
      font-size: 1.3em

  .app-badge
    background-color: var(--color-grey-dark)
    padding: 3px 8px
    border-radius: 100px
    font-size: 0.75em
    color: #CCC

  .tile-grid
    display: grid
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))
    gap: 16px

  .tile
    position: relative
    display: block
    aspect-ratio: 4 / 3
    overflow: hidden
    box-shadow: var(--box-shadow)
    text-decoration: none
    color: var(--color-text-white)

  .tile-image
    position: absolute
    inset: 0
    background-size: cover
    background-position: 50% 50%
    transition: transform .3s

  .tile-image-logo
    background-color: var(--color-grey-dark)
    background-size: 50%
    background-repeat: no-repeat
    background-position: 50% 50%

  .tile::before, .tile::after
    content: ""
    position: absolute
    inset: 0
    z-index: 1

  .tile::before
    background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0) 100%)

  .tile::after
    background: linear-gradient(to top, rgba(174,53,53,0.85) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%)
    opacity: 0
    transition: opacity .15s

  .tile-label
    position: absolute
    left: 0
    right: 0
    bottom: 0
    padding: 16px 18px
    font-weight: 700
    letter-spacing: 1px
    font-size: 1.15em
    text-shadow: var(--text-shadow)
    z-index: 2

  .tile:hover .tile-image
    transform: scale(1.05)

  .tile:hover::after
    opacity: 1

  @media only screen and (max-width: 1000px)
    .hero-doll
      visibility: hidden

  @media only screen and (max-width: 768px)
    .hero
      min-height: 420px

    .hero-content
      padding: 40px 20px

    .container
      padding: 40px 20px

    .feature
      padding: 40px 20px

    .feature-inner
      grid-template-columns: 1fr
      gap: 30px

    .feature-alt .feature-inner
      direction: ltr

    .wynem-chat
      order: 1

    .feature-header
      flex-direction: column
      align-items: flex-start

    .app-showcase
      grid-template-columns: 1fr
      gap: 20px

    .app-preview
      order: -1
</style>
