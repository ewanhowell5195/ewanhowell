<script setup>
  import { ref, onMounted, onBeforeUnmount } from "vue"

  const site = "https://wynem.com"
  const picks = [
    ["minecraft-textures", "e!texture steve", { reply: { message: "<span class=\"command slash\">used <span class=\"link\">/minecraft resourcepacks texture</span></span>" }, options: [["texture", "steve"], ["version", "1.20.4"]] }],
    ["moderation-records", "e!warn", { options: [["member", "@TheAnnoying"], ["reason", "Spamming in chat"]] }],
    ["auto-responses", "Where can I download"],
    ["issue-tracker", "Hey does anyone know"],
    ["customisation", "e!wynemavatar #", { options: [["vertical-bars", "#B81F23"], ["horizontal-bars", "#FE612C"], ["background", "#431220"]] }],
    ["faqs", "e!faq download", { options: [["id", "download"]] }],
    ["mod-pings", "e!modping", {
      reply: { name: "TheAnnoying", colour: "#E67E22", image: "/assets/images/avatars/theannoying.webp", message: "<@&Moderator Ping> someone is spamming in general" },
      content: "Moderator ping - <@Ewan>",
      footer: ["Started by TheAnnoying\nTrying again in 60 seconds…", "/assets/images/avatars/theannoying.webp"]
    }]
  ]

  const el = ref()
  const log = ref()
  const messages = ref([])
  const draft = ref()
  const typing = ref()
  let exchanges
  let id = 0
  let visible = false
  let destroyed = false
  let observer

  const time = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches

  function absolute(url) {
    return url?.startsWith("/") ? site + url : url
  }

  function parse(str) {
    return str.replace(/<command:(.+?)\|(.+?)>/g, "<code class=\"inline-code\">/$2</code>")
      .replace(/<commandlink:(.+?)\|(.+?)\|(.+?)>/g, "$3")
      .replace(/```(?:[a-z]*\n)?((?:.|\n)+?)```\n?/g, (_, code) => `<div class="codeblock">${code.replace(/`/g, "´").trim()}</div>`)
      .replace(/`((?:.|\n)+?)`/g, "<code class=\"inline-code\">$1</code>")
      .replace(/´/g, "`")
      .replace(/<@&(.+?)>/g, "<span class=\"ping role\">@$1</span>")
      .replace(/<([@#].+?)>/g, "<span class=\"ping\">$1</span>")
      .replace(/<:(\/.+?)>/g, "<span class=\"ping\">$1</span>")
      .replace(/<:(.+?):>/g, `<img class="emoji" src="${site}/assets/images/emojis/$1.webp">`)
      .replace(/<t:(.+?)>/g, "<span class=\"timestamp\">$1</span>")
      .replace(/\*\*((?:.|\n)+?)\*\*/g, "<strong>$1</strong>")
      .replace(/^>\s/gm, "<span class=\"listbar\"></span>")
      .replace(/^(###|##|#|-#)\s(.*)\n?/gm, (m, marker, text) => `<span class="${{ "###": "heading3", "##": "heading2", "#": "heading1", "-#": "small" }[marker]}">${text}</span>`)
      .replace(/\[([^\[\]]+?)\]\((.+?)\)/g, `<a href="$2" target="_blank">$1</a>`)
      .replace(/(src|href)="\//g, `$1="${site}/`)
  }

  function slashCommand(html) {
    return new DOMParser().parseFromString(html, "text/html").querySelector(".command.slash .link")?.textContent
  }

  function mentions(text) {
    const span = document.createElement("span")
    span.textContent = text
    return span.innerHTML.replace(/&lt;@&amp;(.+?)&gt;|@\w+/g, (m, role) => `<span class="ping">${role ? `@${role}` : m}</span>`)
  }

  function embed(data) {
    return {
      colour: data.colour,
      warning: data.warning,
      author: data.author && [data.author[0], absolute(data.author[1])],
      title: data.title && parse(data.title),
      url: data.url,
      description: data.description && parse(data.description),
      fields: data.fields?.reduce((rows, field) => {
        const cell = { name: parse(field[0]), value: parse(field[1]) }
        if (field[2] && rows.length && rows.at(-1).inline) rows.at(-1).cells.push(cell)
        else rows.push({ inline: field[2], cells: [cell] })
        return rows
      }, []),
      image: absolute(data.image),
      thumbnail: absolute(data.thumbnail),
      footer: data.footer && [data.footer[0], absolute(data.footer[1])]
    }
  }

  function exchange(data) {
    const embeds = [data].concat(data.embeds ?? []).map(embed).filter(e => e.author || e.title || e.description || e.fields || e.image || e.thumbnail || e.footer)
    const slash = slashCommand(data.reply.message)
    return {
      user: {
        name: data.reply.name,
        colour: data.reply.colour,
        avatar: absolute(data.reply.image),
        slash,
        options: data.options ?? [],
        text: slash ? undefined : data.reply.message.replace(/<@&(.+?)>/g, "@$1"),
        html: slash ? undefined : mentions(data.reply.message)
      },
      bot: {
        avatar: absolute(data.avatar) ?? `${site}/assets/images/logo/logo.webp`,
        content: data.content && parse(data.content),
        embeds,
        buttons: data.buttons?.map(button => Object.assign({}, button, { emoji: button.emoji && `${site}/assets/images/emojis/${button.emoji}.webp` }))
      }
    }
  }

  function find(node, match) {
    if (Array.isArray(node)) {
      for (const child of node) {
        const found = find(child, match)
        if (found) return found
      }
    } else if (node && typeof node === "object") {
      if (node.type === "embed" && node.data?.reply?.message.includes(match)) return node.data
      return find(Object.values(node), match)
    }
  }

  async function load() {
    const features = await Promise.all(picks.map(([feature]) => fetch(`${site}/assets/json/features/${feature}.json`).then(r => r.json())))
    return picks.map(([feature, match, overrides], i) => {
      const data = find(features[i], match)
      if (!data) throw new Error(`No Wynem mock in ${feature} with a reply matching "${match}"`)
      return exchange(Object.assign({}, data, overrides, { reply: Object.assign({}, data.reply, overrides?.reply) }))
    })
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async function type(set, text) {
    for (let c = 1; c <= text.length; c++) {
      set(text.slice(0, c))
      await wait(35 + Math.random() * 45)
    }
  }

  async function until() {
    while (!visible && !destroyed) await wait(250)
  }

  function post(message) {
    if (destroyed) return
    const top = log.value.getBoundingClientRect().top
    messages.value = messages.value.filter(m => log.value.querySelector(`[data-id="${m.id}"]`).getBoundingClientRect().bottom > top).concat(Object.assign({ id: id++ }, message))
  }

  async function play() {
    for (let i = 0; !destroyed; i = (i + 1) % exchanges.length) {
      const { user, bot } = exchanges[i]
      await until()
      if (user.name !== "Ewan") {
        typing.value = user.name
        await wait(1400)
        typing.value = null
      } else if (!reducedMotion) {
        draft.value = { text: "", options: [] }
        await type(text => draft.value.text = text, user.slash ?? user.text)
        for (const [name, value] of user.options) {
          await wait(500)
          draft.value.options.push({ name, value: "" })
          const option = draft.value.options.at(-1)
          await type(text => option.value = text, value)
        }
        await wait(1000)
        draft.value = null
      }
      if (user.slash) {
        await wait(300)
      } else {
        post({ type: "user", data: user })
        await wait(400)
        typing.value = "Wynem"
        await wait(900)
        typing.value = null
      }
      post({ type: "bot", data: bot, reply: user })
      await wait(4500)
    }
  }

  onMounted(async () => {
    observer = new IntersectionObserver(([entry]) => visible = entry.isIntersecting)
    observer.observe(el.value)
    exchanges = await load()
    messages.value = exchanges.slice(-2).flatMap(({ user, bot }) => (user.slash ? [] : [{ type: "user", data: user }]).concat({ type: "bot", data: bot, reply: user })).map(message => Object.assign({ id: id++, instant: true }, message))
    if (!destroyed) play()
  })

  onBeforeUnmount(() => {
    destroyed = true
    observer?.disconnect()
  })
</script>

<template>
  <div ref="el" class="chat">
    <div class="chat-header"><span>#</span>bot-commands</div>
    <div ref="log" class="chat-log">
      <div v-for="message of messages" :key="message.id" class="message" :class="{ instant: message.instant }" :data-id="message.id">
        <template v-if="message.type === 'user'">
          <img class="avatar" :src="message.data.avatar" alt="">
          <div class="message-body">
            <div class="name-row">
              <span class="name" :style="{ color: message.data.colour }">{{ message.data.name }}</span>
              <span class="time">Today at {{ time }}</span>
            </div>
            <div class="text" v-html="message.data.html"></div>
          </div>
        </template>
        <template v-else>
          <div class="reply">
            <img :src="message.reply.avatar" alt="">
            <span :style="{ color: message.reply.colour }">{{ message.reply.name }}</span>
            <span v-if="message.reply.slash" class="reply-text">used <span class="slash">{{ message.reply.slash }}</span><span v-for="[name, value] of message.reply.options" class="option"><span>{{ name }}</span>{{ value }}</span></span>
            <span v-else class="reply-text">{{ message.reply.text }}</span>
          </div>
          <img class="avatar" :src="message.data.avatar" alt="">
          <div class="message-body">
            <div class="name-row">
              <span class="name wynem">Wynem</span>
              <span class="tag"><svg viewBox="0 0 24 24"><path d="M18.7 7.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4l3.3 3.29 7.3-7.3a1 1 0 0 1 1.4 0Z"/></svg>APP</span>
              <span class="time">Today at {{ time }}</span>
            </div>
            <div v-if="message.data.content" class="text" v-html="message.data.content"></div>
            <article v-for="embed of message.data.embeds" class="embed" :class="{ 'has-thumbnail': embed.thumbnail }" :style="{ borderLeftColor: embed.colour }">
              <div v-if="embed.author" class="embed-author">
                <img v-if="embed.author[1]" :src="embed.author[1]" alt="">
                <span>{{ embed.author[0] }}</span>
              </div>
              <div v-if="embed.title" class="embed-title" v-html="embed.title"></div>
              <div v-if="embed.description" class="embed-description" v-html="embed.description"></div>
              <div v-if="embed.fields" class="embed-fields">
                <div v-for="row of embed.fields" class="embed-field-row">
                  <div v-for="field of row.cells">
                    <div class="embed-field-name" v-html="field.name"></div>
                    <div v-html="field.value"></div>
                  </div>
                </div>
              </div>
              <img v-if="embed.image" class="embed-image" :src="embed.image" alt="">
              <div v-if="embed.footer" class="embed-footer">
                <img v-if="embed.footer[1]" :src="embed.footer[1]" alt="">
                <span>{{ embed.footer[0] }}</span>
              </div>
              <img v-if="embed.thumbnail" class="embed-thumbnail" :src="embed.thumbnail" alt="">
            </article>
            <div v-if="message.data.buttons" class="buttons">
              <component :is="button.url ? 'a' : 'div'" v-for="button of message.data.buttons" class="action" :class="button.style" :href="button.url" :target="button.url ? '_blank' : undefined">
                <img v-if="button.emoji" :src="button.emoji" alt="">
                {{ button.label }}
                <svg v-if="button.url" viewBox="0 0 24 24"><path d="M15 2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V4.41l-4.3 4.3a1 1 0 1 1-1.4-1.42L19.58 3H16a1 1 0 0 1-1-1Z"/><path d="M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-6a1 1 0 1 0-2 0v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6a1 1 0 1 0 0-2H5Z"/></svg>
              </component>
            </div>
          </div>
        </template>
      </div>
    </div>
    <div class="typing" :class="{ visible: typing }">
      <span class="dots"><i></i><i></i><i></i></span>
      <span><strong>{{ typing }}</strong> is typing...</span>
    </div>
    <div class="chat-input">
      <div v-if="draft" class="input-line">
        <span>{{ draft.text }}</span>
        <span v-for="option of draft.options" class="option"><span>{{ option.name }}</span>{{ option.value }}</span>
        <span class="caret"></span>
      </div>
      <span v-else class="placeholder">Message #bot-commands</span>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
  .chat
    --dc-bg: #1A1A1E
    --dc-surface: #242429
    --dc-input: #222226
    --dc-border: rgba(151, 151, 159, 0.12)
    --dc-text: #F3F3F4
    --dc-text-soft: #C5C6CA
    --dc-text-faint: #9D9EA5
    --dc-link: #76AFF6
    --dc-blurple: #5865F2
    --dc-blue: #6C80F6
    --dc-mention-bg: rgba(88, 101, 242, 0.24)
    --dc-mention-text: #CDD7FF
    --dc-code-bg: rgba(88, 101, 242, 0.08)
    --dc-quote-bar: #595A63
    display: flex
    flex-direction: column
    height: 570px
    background-color: var(--dc-bg)
    box-shadow: var(--box-shadow)
    color: var(--dc-text)
    font-size: 15px
    overflow: hidden
    user-select: none

  .chat-header
    display: flex
    align-items: center
    gap: 6px
    padding: 12px 16px
    border-bottom: 1px solid var(--dc-border)
    font-weight: 600

    span
      color: var(--dc-text-faint)
      font-size: 1.3em
      font-weight: 400

  .chat-log
    flex: 1
    min-height: 0
    display: flex
    flex-direction: column
    justify-content: flex-end
    padding: 0 16px
    overflow: hidden

  .message
    display: grid
    grid-template-columns: 40px minmax(0, 1fr)
    column-gap: 14px
    padding-top: 16px
    animation: message .3s

    &.instant
      animation: none

  @keyframes message
    from
      opacity: 0
      transform: translateY(12px)

  .avatar
    width: 40px
    height: 40px
    border-radius: 50%
    grid-column: 1

  .reply
    grid-column: 2
    display: flex
    align-items: center
    gap: 4px
    min-width: 0
    margin-bottom: 4px
    font-size: 13px
    position: relative

    &::before
      content: ""
      position: absolute
      left: -34px
      top: 8px
      width: 28px
      height: 10px
      border-left: 2px solid var(--dc-quote-bar)
      border-top: 2px solid var(--dc-quote-bar)
      border-top-left-radius: 6px

    img
      width: 16px
      height: 16px
      border-radius: 50%

    span:nth-of-type(1)
      font-weight: 500
      opacity: .8

  .reply-text
    color: var(--dc-text-soft)
    white-space: nowrap
    overflow: hidden
    text-overflow: ellipsis

  .slash
    color: var(--dc-link)

  .message-body
    min-width: 0
    display: flex
    flex-direction: column
    align-items: flex-start

  .name-row
    display: flex
    align-items: center
    gap: 6px
    line-height: 22px

  .name
    font-weight: 500

    &.wynem
      color: var(--dc-blue)

  .tag
    display: inline-flex
    align-items: center
    height: 15px
    padding: 0 4px 0 2px
    border-radius: 4px
    background-color: var(--dc-blurple)
    font-size: 10px
    font-weight: 600

    svg
      width: 12px
      height: 12px
      fill: white

  .time
    font-size: 12px
    color: var(--dc-text-faint)

  .text
    line-height: 22px
    white-space: pre-wrap
    overflow-wrap: anywhere

  .embed
    display: grid
    grid-template-columns: minmax(0, 1fr)
    width: 100%
    max-width: 432px
    box-sizing: border-box
    margin-top: 4px
    padding: 2px 16px 16px 12px
    border-left: 4px solid var(--dc-blue)
    border-radius: 4px
    background-color: var(--dc-surface)
    font-size: 14px
    line-height: 18px
    white-space: pre-wrap
    overflow-wrap: anywhere

    &.has-thumbnail
      grid-template-columns: minmax(0, 1fr) 80px
      column-gap: 16px

  .embed-author
    display: flex
    align-items: center
    gap: 8px
    margin-top: 8px
    font-weight: 600

    img
      width: 24px
      height: 24px
      border-radius: 50%

  .embed-title
    margin-top: 8px
    font-size: 16px
    line-height: 22px
    font-weight: 600

  .embed-description
    margin-top: 8px

  .embed-fields
    display: flex
    flex-direction: column
    gap: 8px
    margin-top: 8px

  .embed-field-row
    display: flex
    gap: 8px

    > div
      flex: 1
      min-width: 0

  .embed-field-name
    margin-bottom: 2px
    font-weight: 600

  .embed-image
    max-width: 100%
    max-height: 128px
    margin-top: 16px
    border-radius: 4px

  .embed-thumbnail
    grid-column: 2
    grid-row: 1 / 100
    width: 80px
    height: 80px
    margin-top: 8px
    border-radius: 4px
    object-fit: cover

  .embed-footer
    display: flex
    align-items: center
    gap: 8px
    margin-top: 8px
    font-size: 12px
    font-weight: 500

    img
      width: 20px
      height: 20px
      border-radius: 50%

  .buttons
    display: flex
    flex-wrap: wrap
    gap: 8px
    margin-top: 8px

  .action
    display: flex
    align-items: center
    justify-content: center
    gap: 4px
    min-width: 60px
    height: 32px
    padding: 3px 11px
    box-sizing: border-box
    border-radius: 8px
    border: 1px solid rgba(151, 151, 159, 0.04)
    background-color: rgba(151, 151, 159, 0.12)
    color: white
    font-size: 14px
    font-weight: 500
    line-height: 18px
    text-decoration: none
    white-space: nowrap
    cursor: pointer
    transition: background-color .17s

    &:hover
      background-color: rgba(151, 151, 159, 0.16)
      color: white
      text-decoration: none

    img
      width: 19px
      height: 19px

    svg
      width: 16px
      height: 16px
      margin-left: 4px
      fill: white

    &.green
      border-color: rgba(255, 255, 255, 0.08)
      background-color: #008545

      &:hover
        background-color: #006C37

    &.red
      border-color: rgba(255, 255, 255, 0.08)
      background-color: #D22D39

      &:hover
        background-color: #A9232E

  .chat-input
    display: flex
    align-items: center
    justify-content: flex-end
    margin: 0 16px 16px
    padding: 12px 16px
    border-radius: 8px
    background-color: var(--dc-input)
    line-height: 22px
    white-space: nowrap
    overflow: hidden

  .input-line
    flex: 1 0 auto
    display: flex
    align-items: center

    > *
      flex-shrink: 0

  .placeholder
    flex: 1
    color: var(--dc-text-faint)

  .caret
    flex-shrink: 0
    width: 1px
    height: 1.1em
    margin-left: 1px
    background-color: var(--dc-text)

  .option
    display: inline-flex
    margin-left: 6px
    padding-right: 6px
    border-radius: 4px
    overflow: hidden
    background-color: rgba(151, 151, 159, 0.12)
    color: var(--dc-text)

    > span
      margin-right: 6px
      padding: 0 6px
      background-color: rgba(151, 151, 159, 0.2)
      color: var(--dc-text-soft)

  .reply-text .option
    margin-left: 4px
    padding-right: 4px
    font-size: 11px
    line-height: 15px
    color: var(--dc-text-soft)

    > span
      margin-right: 4px
      padding: 0 4px
      font-weight: 400
      opacity: 1

  .typing
    display: flex
    align-items: center
    gap: 6px
    height: 24px
    padding: 0 16px
    font-size: 12px
    color: var(--dc-text-soft)
    opacity: 0
    transition: opacity .15s

    &.visible
      opacity: 1

  .dots
    display: flex
    gap: 3px

    i
      width: 5px
      height: 5px
      border-radius: 50%
      background-color: var(--dc-text-soft)
      animation: dot 1.2s infinite

      &:nth-child(2)
        animation-delay: .15s

      &:nth-child(3)
        animation-delay: .3s

  @keyframes dot
    0%, 60%, 100%
      opacity: .4
      transform: none

    30%
      opacity: 1
      transform: translateY(-2px)

  :deep(.inline-code)
    padding: 1px 3px
    border: 1px solid rgba(151, 151, 159, 0.2)
    border-radius: 4px
    background-color: var(--dc-code-bg)
    font-family: consolas, monospace
    font-size: .85em

  :deep(.ping)
    padding: 0 2px
    border-radius: 3px
    background-color: var(--dc-mention-bg)
    color: var(--dc-mention-text)
    font-weight: 500

  :deep(.timestamp)
    padding: 0 2px
    border-radius: 3px
    background-color: rgba(151, 151, 159, 0.16)

  :deep(.emoji)
    width: 1.375em
    height: 1.375em
    vertical-align: -0.3em

  :deep(a)
    color: var(--dc-link)
    text-decoration: none

    &:hover
      text-decoration: underline

  @media (prefers-reduced-motion: reduce)
    .message, .dots i
      animation: none
</style>
