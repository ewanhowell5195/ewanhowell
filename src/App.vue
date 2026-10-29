<script setup>
  import { ref, onMounted, onBeforeUnmount } from "vue"
  import { site } from "./lib/site.js"
  import Link from "./components/Link.vue"
  import Icon from "./components/Icon.js"

  const sidebarActive = ref(false)
  const sidebar = ref()
  const sidebarButton = ref()

  const socials = [
    ["https://www.youtube.com/ewanhowell", "youtube"],
    ["https://twitter.com/ewanhowell5195", "twitter"],
    ["https://github.com/ewanhowell5195", "github"],
    ["https://www.reddit.com/user/ewanhowell5195/", "reddit"],
    ["https://www.instagram.com/ewan.howell/", "instagram"]
  ]

  const isNarrow = () => innerWidth < 1330 + parseFloat(getComputedStyle(sidebar.value).width) * 2 + 200

  function onClick(e) {
    const target = e.target
    const inSidebar = sidebar.value.contains(target) && target !== sidebar.value
    const inButton = sidebarButton.value.contains(target)
    if (isNarrow() && (target.classList.contains("page-button") || target.parentElement?.closest(".page-button") && inSidebar || sidebarActive.value && !(target === sidebar.value || inSidebar) && !inButton)) {
      sidebarActive.value = false
    }
  }

  function onResize() {
    if (isNarrow() && sidebarActive.value) sidebarActive.value = false
  }

  onMounted(() => {
    addEventListener("click", onClick)
    addEventListener("resize", onResize)
  })

  onBeforeUnmount(() => {
    removeEventListener("click", onClick)
    removeEventListener("resize", onResize)
  })
</script>

<template>
  <div id="header-container">
    <div id="header">
      <div class="logo" id="logo-side">
        <img src="/assets/images/logo/logo_side.webp">
      </div>
      <Link class="page-button logo" :class="{ selected: site.selected === '/' }" to="/">
        <img src="/assets/images/logo/logo.webp" width="40" height="40" alt="logo">
        <span></span>
      </Link>
      <Link class="page-button" :class="{ selected: site.selected === '/resourcepacks' }" to="/resourcepacks"><span>Resource Packs</span></Link>
      <Link class="page-button" :class="{ selected: site.selected === '/plugins' }" to="/plugins"><span>Blockbench Plugins</span></Link>
      <Link class="page-button" :class="{ selected: site.selected === '/maps' }" to="/maps"><span>Maps</span></Link>
      <div class="spacer"></div>
      <a class="page-button" href="https://wynem.com/" target="_blank"><span>Wynem</span></a>
      <a class="page-button" href="https://discord.ewanhowell.com/" target="_blank"><span>Discord</span></a>
    </div>
    <div class="sidebar-button hamburger-container outside" :class="{ active: sidebarActive }" ref="sidebarButton" @click="sidebarActive = !sidebarActive">
      <div class="hamburger">
        <div class="hamburger-line"></div>
      </div>
    </div>
  </div>
  <div id="sidebar" :class="{ active: sidebarActive }" ref="sidebar">
    <Link class="page-button" :class="{ selected: site.selected === '/' }" to="/"><span>Home</span></Link>
    <div class="line"></div>
    <Link class="page-button" :class="{ selected: site.selected === '/resourcepacks' }" to="/resourcepacks"><span>Resource Packs</span></Link>
    <Link class="page-button" :class="{ selected: site.selected === '/plugins' }" to="/plugins"><span>Blockbench Plugins</span></Link>
    <Link class="page-button" :class="{ selected: site.selected === '/themes' }" to="/themes"><span>Blockbench Themes</span></Link>
    <Link class="page-button" :class="{ selected: site.selected === '/maps' }" to="/maps"><span>Maps</span></Link>
    <Link class="page-button" :class="{ selected: site.selected === '/dungeonsmods' }" to="/dungeonsmods"><span>Dungeons Mods</span></Link>
    <Link class="page-button" :class="{ selected: site.selected === '/dungeons2mods' }" to="/dungeons2mods"><span>Dungeons II Mods</span></Link>
    <div class="line"></div>
    <Link class="page-button" :class="{ selected: site.selected === '/tools' }" to="/tools"><span>Tools</span></Link>
    <Link class="page-button" :class="{ selected: site.selected === '/guides' }" to="/guides"><span>Guides</span></Link>
    <Link class="page-button" :class="{ selected: site.selected === '/renders' }" to="/renders"><span>Renders</span></Link>
    <Link class="page-button" :class="{ selected: site.selected === '/npm' }" to="/npm"><span>NPM Modules</span></Link>
    <a class="page-button" href="https://sketchfab.com/ewanhowell5195/models" target="_blank"><span>Models</span></a>
    <a class="page-button" href="https://github.com/ewanhowell5195/ewanhowell5195.github.io/releases" target="_blank"><span>Programs</span></a>
    <div class="line"></div>
    <a class="page-button" href="https://wynem.com/" target="_blank"><span>Wynem</span></a>
    <a class="page-button" href="https://discord.ewanhowell.com/" target="_blank"><span>Discord</span></a>
    <div class="spacer"></div>
    <div class="line"></div>
    <div class="sidebar-link-icons">
      <a v-for="[href, icon] of socials" :href="href" target="_blank"><Icon :name="icon" /></a>
    </div>
  </div>
  <div id="content">
    <RouterView v-slot="{ Component }">
      <component :is="Component" :key="site.view" />
    </RouterView>
  </div>
  <div id="footer-container">
    <div id="footer">
      <a v-for="[href, icon] of socials" class="page-button" :href="href" target="_blank"><Icon :name="icon" /></a>
      <div id="footer-username"></div>
      <div class="spacer"></div>
      <a class="page-button" href="https://ko-fi.com/ewanhowell" target="_blank"><span>Donate</span></a>
      <a class="page-button" href="mailto:contact@ewanhowell.com" target="_blank"><span>Contact</span></a>
    </div>
  </div>
</template>
