import { createRouter, createWebHistory } from "vue-router"
import { setFavicon, setThemeColour } from "./lib/utils.js"
import { site } from "./lib/site.js"
import routes from "./routes.js"

const pages = import.meta.glob("./pages/**/*.vue")

const catchAll = "/:pathMatch(.*)*"

export const router = createRouter({
  history: createWebHistory(),
  routes: routes.map(r => ({
    path: r.path,
    component: pages[`./pages/${r.page}.vue`],
    props: route => Object.assign({}, r.type && { type: r.type }, route.params),
    meta: Object.assign({ title: "Ewan Howell" }, r.meta)
  })).concat({ path: catchAll, component: { render: () => null } })
})

let silent = false

export function silentNavigate(to, replace) {
  silent = true
  return (replace ? router.replace(to) : router.push(to)).finally(() => silent = false)
}

export function parentRoute(route) {
  const parts = route.path.replace(/\/$/, "").split("/")
  for (let i = 1; i < parts.length; i++) {
    const path = parts.slice(0, -i).join("/") || "/"
    if (router.resolve(path).matched[0]?.path !== catchAll) return { path, query: route.query, replace: true }
  }
  return { path: "/", query: route.query, replace: true }
}

export function notFound(route) {
  return router.replace(parentRoute(route))
}

router.beforeEach(to => {
  if (to.matched[0]?.path === catchAll) return parentRoute(to)
  if (silent) return
  setFavicon("/assets/images/logo/logo_16.webp", "/assets/images/logo/logo_32.webp")
  document.title = to.meta.title
  setThemeColour("#AE3535")
})

router.afterEach((to, from, failure) => {
  if (!failure && !silent) site.view++
})
