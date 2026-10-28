<script setup>
import { ref, shallowRef, reactive, computed, h, nextTick, onBeforeUnmount } from "vue"
import { useRoute, useRouter } from "vue-router"
import Page from "../components/Page.vue"
import Link from "../components/Link.vue"
import Icon from "../components/Icon.js"
import { site } from "../lib/site.js"
import { fetchJSON, toTitleCase, setFavicon } from "../lib/utils.js"
import { notFound, silentNavigate } from "../router.js"

const props = defineProps({ name: String })

site.selected = "/guides"

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const guide = ref()
const guideData = ref()
const content = shallowRef([])
const contents = ref([])
const popup = ref(false)
const linksCollapsed = ref(true)
const contentsCollapsed = ref(true)
const linksContent = ref()
const contentsContent = ref()
const linksMaxHeight = ref()
const contentsMaxHeight = ref()
const state = reactive({ tabs: {}, copied: {}, copyText: {} })
const timeouts = {}
let scrollTarget, scrollElement

const title = computed(() => guideData.value ? guideData.value.name ?? toTitleCase(props.name, true) : "")

const linkGroups = computed(() => {
  const links = guide.value?.links
  if (!links) return []
  const groups = []
  if (links.examples) groups.push({ title: "Example Resource Packs", links: links.examples.map(pack => ({ to: `/resourcepacks/${pack}`, text: toTitleCase(pack, true) })) })
  if (links.documentation) groups.push({ title: "Documentation", links: links.documentation.map(doc => ({ href: doc.link, icon: "open_in_new", text: doc.text })) })
  if (links.video) groups.push({ title: "Tutorial Video", links: [{ href: `https://youtu.be/${links.video}`, icon: "youtube", text: "Tutorial" }] })
  if (links.other) groups.push({ title: "Other Links", links: links.other.map(doc => ({ href: doc.link, icon: "open_in_new", text: doc.text })) })
  return groups
})

function guideLink(path) {
  return `/guides/${props.name}?view=${path.join()}`
}

function htmlText(html) {
  const template = document.createElement("template")
  template.innerHTML = html
  return template.content.textContent
}

function parseString(str, depth) {
  return str.replace(/\*\*((?:[^`]|\n)+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*((?:[^`]|\n)+?)\*/g, "<i>$1</i>")
            .replace(/`((?:.|\n)+?)`/g, `<code${depth === 1 ? ' class="light"' : ""}>$1</code>`)
            .replace(/\[([^\[\]]+?)\]\((.+?)(?<!\\)\)/g, (m, s, l) => {
              if (l.startsWith("/")) return `<a href="${l}">${s}</a>`
              return `<a href="${l.replaceAll("\\)", ")")}" target="_blank">${s}</a>`
            })
}

function addContents(type, text, link, depth) {
  contents.value.push({ type, text, link, depth })
}

function build(blocks, args) {
  return blocks.map((block, b) => {
    const blockPath = (args.blockPath ?? []).concat(b)
    const key = blockPath.join()
    let node
    if (typeof block === "string") {
      node = { type: "text", html: parseString(block, true) }
    } else if (block.type === "heading") {
      node = { type: "heading", key, html: block.text, link: guideLink(blockPath) }
      addContents("heading", htmlText(block.text), node.link, blockPath.length - 1)
    } else if (block.type === "tablelist") {
      node = { type: "tablelist", rows: block.rows.map(row => row.map(cell => parseString(cell))) }
    } else if (block.type === "image") {
      node = { type: "image", src: `/assets/images/guides/${block.source ?? props.name}/${block.name}.webp`, height: block.height ?? 256 }
    } else if (block.type === "tabs") {
      node = { type: "tabs", key, light: args.depth === 1, tabs: [] }
      let active = 0
      for (const [i, sect] of block.tabs.entries()) {
        const tabPath = blockPath.concat(i)
        const tab = { name: sect.name, link: guideLink(tabPath) }
        addContents("tab", sect.name, tab.link, blockPath.length)
        tab.content = build(sect.content, {
          depth: (args.depth ?? 0) + 1,
          blockPath: tabPath,
          view: args.view
        })
        node.tabs.push(tab)
        if (tabPath.every((val, index) => val == args.view[index])) {
          active = i
          if (tabPath.length === args.view.length) scrollTarget = tab
        }
      }
      state.tabs[key] = active
    } else if (block.type === "step") {
      node = { type: "step", key, html: block.text, step: `${block.step}.`, link: guideLink(blockPath) }
      addContents("step", `${node.step} ${htmlText(block.text)}`, node.link, blockPath.length - 1)
    } else if (block.type === "codeblock") {
      node = { type: "codeblock", key, name: block.name, text: block.text, depth: args.depth }
      state.copyText[key] = "Copy"
    }
    if (!scrollTarget && node && blockPath.length === args.view.length && blockPath.every((val, index) => val == args.view[index])) scrollTarget = node
    return node
  }).filter(node => node)
}

function scrollRef(target) {
  if (target === scrollTarget) return el => {
    if (el) scrollElement = el
  }
}

function copyLink(node) {
  clearTimeout(timeouts[node.key])
  navigator.clipboard.writeText(location.origin + node.link)
  state.copied[node.key] = true
  timeouts[node.key] = setTimeout(() => state.copied[node.key] = false, 2000)
}

function copyCode(node) {
  clearTimeout(timeouts[node.key])
  navigator.clipboard.writeText(node.text)
  state.copyText[node.key] = "Copied!"
  timeouts[node.key] = setTimeout(() => state.copyText[node.key] = "Copy", 2000)
}

function selectTab(node, i) {
  state.tabs[node.key] = i
  silentNavigate(node.tabs[i].link, true)
}

function renderSection(nodes) {
  return h("div", { class: "section" }, nodes.map(renderBlock))
}

function renderBlock(node) {
  const target = scrollRef(node)
  if (node.type === "text") return h("div", { class: "text", innerHTML: node.html, ref: target })
  if (node.type === "heading") return h("div", { class: ["heading", { copied: state.copied[node.key] }], innerHTML: node.html, ref: target, onClick: () => copyLink(node) })
  if (node.type === "tablelist") return h("table", { class: "tablelist", ref: target }, node.rows.map(row => h("tr", row.map(cell => h("td", { innerHTML: cell })))))
  if (node.type === "image") return h("img", { "data-popupable": "", src: node.src, height: node.height, style: { maxHeight: `${node.height}px` }, ref: target })
  if (node.type === "tabs") {
    const active = state.tabs[node.key]
    return h("div", { class: ["tab-container", { light: node.light }], ref: target }, [
      h("div", { class: "tabs" }, node.tabs.map((tab, i) => h("div", { "data-tab": i, class: ["section-tab tab", { active: i === active }], innerHTML: tab.name, ref: scrollRef(tab), onClick: () => selectTab(node, i) }))),
      h("div", { class: "tab-sections sections" }, node.tabs.map((tab, i) => h("div", { "data-tab": i, class: ["tab-section", { selected: i === active }] }, [renderSection(tab.content)])))
    ])
  }
  if (node.type === "step") return h("div", { class: ["step", { copied: state.copied[node.key] }], innerHTML: node.html, "data-step": node.step, ref: target, onClick: () => copyLink(node) })
  if (node.type === "codeblock") {
    return h("div", { class: `codeblock${node.depth ? ` light${node.depth}` : ""}`, ref: target }, [
      h("div", { class: "codeblock-banner" }, [
        h("div", { class: "codeblock-name" }, node.name),
        h("div", { class: "codeblock-copy", onClick: () => copyCode(node) }, [
          h(Icon, { name: "copy" }),
          h("div", state.copyText[node.key])
        ])
      ]),
      h("div", { class: "codeblock-content" }, node.text)
    ])
  }
}

function Content() {
  return renderSection(content.value)
}

function onContentClick(e) {
  const link = e.target.closest("a")
  if (!link || link.target || !link.getAttribute("href")?.startsWith("/") || e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
  e.preventDefault()
  router.push(link.getAttribute("href"))
}

function resizePage() {
  linksMaxHeight.value = `${linksContent.value.scrollHeight}px`
  contentsMaxHeight.value = `${contentsContent.value.scrollHeight}px`
}

function toggleLinks() {
  linksCollapsed.value = !linksCollapsed.value
  resizePage()
}

function toggleContents() {
  contentsCollapsed.value = !contentsCollapsed.value
  resizePage()
}

async function load() {
  const [data, guides] = await Promise.all([fetchJSON(`guides/${props.name}`), fetchJSON("guides")])
  if (!data) return notFound(route)
  guide.value = data
  guideData.value = guides.find(e => e.id === props.name)
  setFavicon("/assets/images/guides/icon.webp")
  document.title = `${title.value} - Guides - Ewan Howell`
  content.value = build(data.content, { view: route.query.view?.split(",") ?? [] })
  loading.value = false
  addEventListener("resize", resizePage)
  await nextTick()
  if (scrollElement) setTimeout(() => scrollElement.scrollIntoView({ behavior: "smooth" }), 100)
}

load()

onBeforeUnmount(() => removeEventListener("resize", resizePage))
</script>

<template>
  <Page :loading="loading">
    <div class="container">
      <div id="content-container">
        <header :style="guideData && { backgroundImage: `url(/assets/images/guides/${name}/thumbnail.webp)` }">
          <div id="header-background"></div>
          <div id="header-contents">
            <div id="title">{{ title }}</div>
            <div id="subtitle">{{ guideData?.description }}</div>
          </div>
        </header>
        <div id="optifine" :class="{ hidden: !guideData?.optifine }">
          <div id="optifine-img">
            <img src="/assets/images/logo/optifine.webp">
          </div>
          <div class="optifine-desc">This feature requires OptiFine</div>
          <div class="spacer"></div>
          <div id="optifine-info" @click="popup = true">
            <Icon name="info" />
            <span class="text"></span>
          </div>
          <a href="https://optifine.net/downloads" target="_blank">
            <Icon name="download" />
            <span class="text"></span>
          </a>
        </div>
        <div id="mobile-links" :class="{ collapsed: linksCollapsed }">
          <div id="mobile-links-header" @click="toggleLinks">
            <h1>Useful Links</h1>
            <Icon name="arrow_right" />
          </div>
          <div id="mobile-links-content" ref="linksContent" :style="{ maxHeight: linksMaxHeight }">
            <template v-for="group of linkGroups">
              <div class="sidebar-subtitle">{{ group.title }}</div>
              <div class="sidebar-links">
                <template v-for="link of group.links">
                  <Link v-if="link.to" class="button link-example" :to="link.to"><Icon name="local_link" /><span>{{ link.text }}</span></Link>
                  <a v-else class="button" :href="link.href" target="_blank"><Icon :name="link.icon" /><span>{{ link.text }}</span></a>
                </template>
              </div>
            </template>
          </div>
        </div>
        <div id="mobile-contents" :class="{ collapsed: contentsCollapsed }">
          <div id="mobile-contents-header" @click="toggleContents">
            <h1>Table of Contents</h1>
            <Icon name="arrow_right" />
          </div>
          <div id="mobile-contents-content" ref="contentsContent" :style="{ maxHeight: contentsMaxHeight }">
            <Link v-for="item of contents.slice(1)" :to="item.link" :class="`sidebar-contents-${item.type}`" :style="{ marginLeft: `${item.depth * 20}px` }">{{ item.text }}</Link>
          </div>
        </div>
        <div id="content" @click="onContentClick">
          <Content />
        </div>
      </div>
      <aside id="sidebar">
        <div id="sidebar-links">
          <div class="sidebar-title">Useful Links</div>
          <template v-for="group of linkGroups">
            <div class="sidebar-subtitle">{{ group.title }}</div>
            <div class="sidebar-links">
              <template v-for="link of group.links">
                <Link v-if="link.to" class="button link-example" :to="link.to"><Icon name="local_link" /><span>{{ link.text }}</span></Link>
                <a v-else class="button" :href="link.href" target="_blank"><Icon :name="link.icon" /><span>{{ link.text }}</span></a>
              </template>
            </div>
          </template>
        </div>
        <div id="sidebar-contents">
          <div class="sidebar-title">Table of Contents</div>
          <div id="sidebar-contents-contents">
            <Link v-for="item of contents" :to="item.link" :class="`sidebar-contents-${item.type}`" :style="{ marginLeft: `${item.depth * 20}px` }">{{ item.text }}</Link>
          </div>
        </div>
      </aside>
    </div>
    <Teleport to="body">
      <div v-if="popup" class="popup" @click.self="popup = false">
        <div class="popup-container">
          <div class="popup-optifine">
            <div id="popup-optifine-banner">
              <img src="/assets/images/logo/optifine.webp">
              <div>OptiFine</div>
              <div class="spacer"></div>
              <div id="popup-optifine-close" @click="popup = false">
                <Icon name="close" />
              </div>
            </div>
            <div id="popup-optifine-content">
              <div id="popup-optifine-text" v-html="`OptiFine is a mod that adds a lot of extra resource pack related features to Minecraft.\n\n<b>${title}</b> requires OptiFine installed to function in a resource pack.`"></div>
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
  </Page>
</template>

<style lang="stylus" scoped>
@import "../styles/buttons.styl"

:deep(.page-body)
  background-image: linear-gradient(to right, var(--color-grey-darker) 50%, var(--color-grey) 50%)

.container
  max-width: var(--content-width)
  margin: 0 auto
  display: flex
  flex-direction: row
  align-items: stretch
  overflow: clip

#content-container
  flex: 1
  background-color: var(--color-grey-darker)
  overflow-x: hidden

header
  height: 228px
  background-position: 50% 50%
  background-size: cover
  position: relative
  box-shadow: var(--box-shadow)

#header-contents
  position: absolute
  inset: 0
  backdrop-filter: blur(4px)
  padding: 30px
  background-color: #0004

#title
  font-size: 2.75rem
  font-weight: 700
  text-shadow: -5px 5px 1px var(--color-text-shadow)
  margin-bottom: 10px

#subtitle
  text-shadow: -3px 3px 1px var(--color-text-shadow)

.spacer
  flex: 1

.hidden
  display: none !important

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
  position: relative

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

    svg
      padding-right: 10px
      min-width: 28px
      min-height: 28px
      fill: var(--color-text-optifine)
      filter: drop-shadow(0 3px 1px var(--color-text-shadow-optifine))

    &:hover
      background-color: #A93931

    &:active > *
      transform: translateY(4px)

#sidebar
  background-color: var(--color-grey)
  min-height: calc(100vh - var(--header-height) * 2 - 40px)
  width: 296px
  box-shadow: -5px 0 10px var(--color-box-shadow)
  display: flex
  flex-direction: column
  align-items: center
  text-align: center

  > div
    display: flex
    flex-direction: column

#sidebar-links
  width: calc(100% - 40px)
  padding: 20px 0

.sidebar-title
  font-size: 1.75rem
  font-weight: 700
  text-shadow: -4px 4px 1px var(--color-text-shadow)
  margin-bottom: 20px

.sidebar-subtitle
  font-size: 1.25rem
  text-shadow: -3px 3px 1px var(--color-text-shadow)
  margin-bottom: 20px

.sidebar-links
  display: flex
  flex-direction: column
  margin-bottom: 40px
  width: 100%
  gap: 15px

.link-example
  background-color: var(--color-download)

#sidebar-contents
  width: 100%
  position: sticky
  top: calc(var(--header-height) + 20px)

  *:not(.sidebar-title)
    text-align: left

  a
    color: var(--color-text-white)
    text-decoration: none

    &:hover
      text-decoration: underline

#sidebar-contents-contents
  max-height: calc(100vh - var(--header-height) * 2 - 72px)
  overflow-y: auto
  overflow-x: clip
  width: calc(100% - 40px)
  display: flex
  flex-direction: column
  gap: 10px
  padding: 0 20px

  :last-child
    margin-bottom: 20px

.sidebar-contents-heading
  font-size: 1.3rem

.sidebar-contents-step
  font-size: 1.15rem

#content
  padding: 20px 20px 80px

:deep(.section)
  display: flex
  flex-direction: column
  gap: 20px
  width: 100%
  align-items: flex-start

  img
    object-fit: contain
    filter: drop-shadow(var(--box-shadow))
    width: 100%

:deep(.heading)
  font-size: 2rem
  font-weight: 700
  text-shadow: -3px 3px 1px var(--color-text-shadow)
  margin-top: 20px

:deep(.text)
  white-space: pre-wrap
  line-height: 24px

:deep(.tablelist)
  td
    white-space: pre-wrap

  td:not(:last-child)
    padding-right: 16px

  td:first-child
    font-weight: 600
    white-space: nowrap !important
    display: list-item
    list-style: inside

:deep(.tab-container)
  filter: drop-shadow(var(--box-shadow))
  width: 100%

  &.light
    .active
      background: var(--color-grey-light)

    .tab-sections
      background-color: var(--color-grey-light)

    .tabs::-webkit-scrollbar-track
      background-color: var(--color-grey-light)

:deep(.tabs)
  display: flex
  width: 100%
  gap: 10px
  padding: 0 10px
  max-width: calc(100% - 20px)
  overflow-x: auto

  &::-webkit-scrollbar-track
    background-color: var(--color-grey)

:deep(.tab)
  min-height: 18px
  background-color: var(--color-grey-dark)
  cursor: pointer
  display: flex
  justify-content: center
  align-items: center
  border-top: 2px solid transparent
  transition: background-color .15s, border-top .15s
  user-select: none
  padding: 10px 15px
  text-align: center

  &.active
    background-color: var(--color-grey)
    border-top: 2px solid var(--color-red-light)

:deep(.sections)
  background-color: var(--color-grey)
  padding: 20px
  flex: 1
  z-index: 1
  position: relative

:deep(.tab-section)
  display: none

:deep(.selected)
  display: flex

:deep(code)
  font-family: consolas, monospace
  background-color: black
  padding: 0 4px
  border: 1px solid var(--color-green)
  word-wrap: break-word

  &.light
    background-color: var(--color-grey-darker)

:deep(.step)
  font-size: 1.75rem
  margin-top: 20px

  &::before
    content: attr(data-step)
    margin-right: 10px

:deep(.entry)
  font-size: 1.75rem
  margin-top: 20px

  &::before
    content: "-"
    margin-right: 10px

:deep(.codeblock)
  background-color: var(--color-grey)
  font-family: consolas, monospace
  box-shadow: var(--box-shadow)
  width: 100%

  &.light1
    background-color: var(--color-grey-light)

  &.light2
    background-color: #505050

:deep(.codeblock-banner)
  display: flex
  justify-content: space-between
  align-items: center
  padding: 10px
  border-bottom: 2px solid rgba(255,255,255,0.25)

:deep(.codeblock-name)
  opacity: 0.5

:deep(.codeblock-copy)
  display: flex
  cursor: pointer
  gap: 5px
  align-items: center
  user-select: none
  opacity: 0.5
  transition: opacity .15s
  position: relative

  svg
    fill: var(--color-text-white)
    width: 18px
    height: 18px

  &:hover
    opacity: 1

:deep(.codeblock-content)
  padding: 10px
  white-space: pre-wrap
  word-break: break-all

:deep(:where(.page-body) a)
  color: var(--color-link-blue)

#mobile-links, #mobile-contents
  display: none
  background-color: var(--color-grey)
  box-shadow: var(--box-shadow)
  flex-direction: column
  align-items: center

#mobile-links-header, #mobile-contents-header
  padding: 11px 20px
  display: flex
  position: relative
  cursor: pointer
  user-select: none
  width: calc(100% - 40px)

  h1
    margin: 0
    text-shadow: -3px 3px 1px var(--color-text-shadow)
    font-size: 24px

  svg
    fill: var(--color-text-white)
    transform: rotateZ(90deg)
    filter: drop-shadow(3px 3px 1px var(--color-text-shadow))
    position: absolute
    top: 1px
    right: 15px
    width: 30px
    transition: transform .15s, filter .15s

#mobile-links-content, #mobile-contents-content
  padding: 0 20px
  display: flex
  flex-direction: column
  align-items: center
  overflow: hidden
  transition: max-height .5s
  max-height: 0px

  .sidebar-links
    flex-direction: row
    flex-wrap: wrap
    justify-content: center

  a.button
    min-width: 206px
    flex: 1

#mobile-contents-content
  gap: 10px
  align-items: flex-start

  a
    color: var(--color-text-white)
    text-decoration: none

    &:hover
      text-decoration: underline

  :first-child
    padding-top: 20px

  :last-child
    padding-bottom: 20px

.collapsed
  #mobile-links-header svg, #mobile-contents-header svg
    transform: rotateZ(0)
    filter: drop-shadow(-3px 3px 1px var(--color-text-shadow))

  #mobile-links-content, #mobile-contents-content
    max-height: 0px !important

:deep(.heading), :deep(.step)
  cursor: pointer
  display: flex
  align-items: center
  position: relative

  &.copied::after
    content: "Copied link!"
    margin-left: 10px
    font-size: 1rem
    opacity: 0.5
    margin-top: 4px
    font-weight: 400
    position: absolute
    right: 0
    translate: calc(100% + 10px)

@media only screen and (max-width: 1010px)
  #optifine
    #optifine-info .text::after
      content: "Information"

    a .text::after
      content: "Download"

@media only screen and (max-width: 900px)
  #optifine
    #optifine-info .text::after
      content: "More Information"

    a .text::after
      content: "Download OptiFine"

  #sidebar
    display: none

  #mobile-links, #mobile-contents
    display: flex

  #title, #subtitle, :deep(.heading)
    text-align: center

@media only screen and (max-width: 720px)
  #optifine
    #optifine-info .text::after
      content: "Information"

    a .text::after
      content: "Download"

@media only screen and (max-width: 600px)
  #optifine
    #optifine-info .text::after
      content: "Requirement Information"

    .optifine-desc
      display: none

@media only screen and (max-width: 470px)
  #optifine
    #optifine-info .text::after
      content: "Information"
</style>
