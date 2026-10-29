<script setup>
  import { ref } from "vue"
  import Page from "../components/Page.vue"
  import Link from "../components/Link.vue"
  import { site } from "../lib/site.js"
  import { fetchJSON, toTitleCase, setFavicon } from "../lib/utils.js"

  site.selected = "/guides"

  const loading = ref(true)
  const guides = ref([])

  setFavicon("/assets/images/guides/icon.webp")
  fetchJSON("guides").then(data => {
    guides.value = data
    loading.value = false
  })
</script>

<template>
  <Page :loading="loading">
    <div class="container">
      <h1>Guides</h1>
      <div id="guides">
        <Link v-for="guide of guides" class="guide" :to="`/guides/${guide.id}`">
          <div class="details">
            <h2>{{ guide.name ?? toTitleCase(guide.id, true) }}</h2>
            <p>{{ guide.description }}</p>
          </div>
          <div class="images">
            <img class="image" :src="`/assets/images/guides/${guide.id}/thumbnail.webp`">
            <img v-if="guide.optifine" class="optifine" src="/assets/images/logo/optifine.webp">
          </div>
        </Link>
      </div>
    </div>
  </Page>
</template>

<style lang="stylus" scoped>
  .container
    max-width: calc(var(--content-width) + 40px)
    margin: 0 auto
    padding: 0 20px
    display: flex
    flex-direction: column
  
  h1
    margin: 0
    padding: 22px 0

  h2
    margin: 0

  #guides
    display: flex
    flex-direction: column
    gap: 20px
    padding-bottom: 20px

  .guide
    background-color: var(--color-grey)
    padding: 20px
    display: flex
    gap: 20px
    justify-content: space-between
    box-shadow: var(--box-shadow)
    color: var(--color-text-white)
    text-decoration: none
    transition: background-color .15s

    &:hover
      background-color: var(--color-grey-light)

  .details
    display: flex
    flex-direction: column
    flex: 1

  .spacer
    flex: 1

  .images
    position: relative
    display: flex

  .image
    max-height: 224px
    max-width: 100%
    box-shadow: var(--box-shadow)
  
  .optifine
    position: absolute
    bottom: 0
    right: 0
    width: 50px
    height: 50px

  @media only screen and (max-width: 768px)
    .guide
      flex-direction: column
      align-items: center
    
    .details
      width: 100%
    
    img
      margin: auto
</style>
