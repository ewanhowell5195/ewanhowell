<script setup>
import { onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import Page from "../components/Page.vue"
import Link from "../components/Link.vue"
import { site } from "../lib/site.js"

site.selected = "/"

const route = useRoute()
const router = useRouter()

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
    <div class="page-container">
      <div class="img-block" style='background-image: url("/assets/images/home/logo_3d.webp")'>
        <div class="container">
          <h1>Ewan Howell</h1>
        </div>
      </div>
      <div class="container">
        <div class="text-block">
          <h2>Hello, welcome to my website!</h2>
          <div class="text-box">
            <p>My name is Ewan and I make lots of different things.</p>
            <p>I am a Web Developer, Discord Bot Developer, and a Resource Pack Creator. This website is home to some of those projects, and also links to some not on this website.</p>
            <p>You can find out more about some of my main projects futher down on this page.</p>
          </div>
        </div>
      </div>
      <div class="img-block" style='background-image: url("/assets/images/home/wynem.webp")'>
        <div class="container">
          <h1>Wynem</h1>
        </div>
      </div>
      <div class="container">
        <div class="text-block">
          <div class="text-box">
            <p>Wynem is a multipurpose Discord bot that has a vast array of features for all sorts of purposes. From Moderation, to Fun, to Image Editing!</p>
          </div>
          <div class="text-box">
            <p>Wynem is a Discord bot that I have been working on by myself since late 2019. I had the idea for the bot when I didn't like the number of bots in my Discord server, so I set out to create my own Discord bot that would eventually replace all of the bots in my server with one single bot!</p>
          </div>
          <div class="text-box">
            <p>After a lot of requests, the bot was opened to the public and now anyone can add it to their server.</p>
            <p>If you are interested in a fun Discord bot, which is also packaged with server management and moderation commands, I highly recommend adding Wynem to your server and checking it out!</p>
            <p>You can find out more information about Wynem at <a href="https://wynem.com/" target="_blank">this link</a>!</p>
          </div>
        </div>
      </div>
      <div class="img-block" style='background-image: url("/assets/images/home/f8thful.webp")'>
        <div class="container">
          <h1>Minecraft</h1>
        </div>
      </div>
      <div class="container">
        <div class="text-block">
          <div class="text-box">
            <p>I make a large variety of resource packs for Java edition, with some ported across to bedrock edition. These can range from completely redesigning the in-game textures, to adding healthbars to every entiy, to making every entity roll around. You can see all my resource packs <Link to="/resourcepacks">here</Link>.</p>
          </div>
          <div class="text-box">
            <p>I have created some <a href="https://www.blockbench.net" target="_blank">Blockbench</a> plugins that extend the functionality of Blockbench. The largest plugin is CEM Template Loader, which allows you to load template Minecraft Java edition entity models, as well as animate them inside Blockbench. All of my plugins can be found <Link to="/plugins">here</Link>.</p>
          </div>
          <div class="text-box">
            <p>I create tools and scripts to help aid with resource pack creation. These tools include one that shows what textures you are missing, one that compresses JSON files to smaller file sizes, a converter to convert compact CTM to overlay or full CTM, and even a resource pack converter that converts packs between game versions. They can be found <a href="https://github.com/ewanhowell5195/ewanhowell5195.github.io/releases" target="_blank">here</a> and <a href="https://github.com/ewanhowell5195?tab=repositories" target="_blank">here</a>.</p>
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
  flex: 1

.img-block
  max-height: 512px
  min-height: 256px
  height: calc(50vw / 2)
  width: 100%
  background-size: cover
  background-position: 50% 50%
  display: flex
  justify-content: center
  box-shadow: var(--box-shadow)
  
h1
  margin: 0
  padding: 50px 0 0 10%
  font-size: clamp(1.5em, 3em, 5vw)
  text-shadow: -4px 4px 1px var(--color-text-shadow)

a
  color: var(--color-link-blue)
  
.text-block
  max-width: 100%
  min-height: 256px
  display: flex
  justify-content: space-around
  align-items: center
  padding: 0 40px
  flex-wrap: wrap;
  box-sizing: border-box

.text-box
  padding: 10px
  width: 300px
  flex-shrink: 1
</style>
