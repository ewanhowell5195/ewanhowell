window.E = (tagName, options) => $(document.createElement(tagName, options))

// google analytics

// window.dataLayer  =  window.dataLayer || []
// const gtag = (...args) => dataLayer.push(args)
// gtag("js", new Date())
// gtag("config", "UA-155158328-2")

// lazy loading

window.imageObserver  =  new IntersectionObserver((entries, observer) => {
	entries.forEach(entry => {
		if ("src" in entry.target.dataset) {
			if (entry.isIntersecting) {
				entry.target.src  =  entry.target.dataset.src
				imageObserver.unobserve(entry.target)
			}
		} else {
			imageObserver.unobserve(entry.target)
		}
	})
})

if (!String.prototype.toTitleCase) String.prototype.toTitleCase = function() {
  return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()})
}

// header

$("#mobile-menu").on("click", e => {
  if (e.target.id === "mobile-menu") e.target.classList.add("hidden")
})

$("#mobile-menu-button").on("click", e => $("#mobile-menu").removeClass("hidden"))

$("#mobile-menu-close-button").on("click", e => $("#mobile-menu").addClass("hidden"))

// pages

function setupPage(name, container, data) {
  const page = E(`${name}-page`)
  container.empty().append(page)
  if (data) {
    page[0].setData(data)
  }
}

function basicPageRoute(name, rgx) {
  return [
    rgx ?? new RegExp(`^\/${name}\/?(?:\\?.*)?$`,"i"),
    async (url, container, updateHistory) => {
      await import(`/pages/${name}/page.js`)
      setupPage(name, container, Object.fromEntries(url.searchParams))
      if (updateHistory) {
        history.pushState({}, "", url)
      }
      return true
    }
  ]
}

const routes = [
  basicPageRoute("resourcepacks"),
  [ /^\/resourcepacks\/.+/i,
    async (url, container, updateHistory) => {
      await fetchResourcepacks()
      const pack = url.pathname.slice(15).replace(/\/$/, "").toLowerCase()
      if (Object.keys(resourcepacks.packs).includes(pack)) {
        await import("/pages/pack/page.js")
        setupPage("pack", container, {pack})
        if (updateHistory) {
          history.pushState({}, "", url)
        }
        return true
      }
    }
  ]
]

let isOpeningPage = false
window.openPage = async function(url, updateHistory = false, forceUpdate = false) {
  if (isOpeningPage || (!forceUpdate && url.href === location.href)) return
  $("#mobile-menu").addClass("hidden")
  $('link[rel="icon"][sizes="16x16"]').attr("href", "/assets/images/logo/logo_16.webp")
  $('link[rel="icon"][sizes="32x32"]').attr("href", "/assets/images/logo/logo_32.webp")
  $("title").text("Ewan Howell")
  isOpeningPage = true
  let foundPage = false
  const ps = url.pathname + url.search
  for (const [rgx, func] of routes) {
    if (ps.match(rgx)) {
      if (!(await func(url, $("#content"), updateHistory))) {
        await import("/pages/home/page.js")
        $("#content").empty().append(E("home-page"))
        history.replaceState({}, "", "/")
      }
      foundPage = true
      break
    }
  }
  if (!foundPage) {
    await import("/pages/home/page.js")
    $("#content").empty().append(E("home-page"))
    if (updateHistory) {
      history.pushState({}, "", "/")
    }
  }
  isOpeningPage = false
}

const onLoad = () => openPage(new URL(location.href), false, true)

class FastAnchorElement extends HTMLAnchorElement {
  constructor() {
    super()
    this.addEventListener("click", evt => {
      if (evt.button === 0) {
        evt.preventDefault()
        openPage(new URL(this.href), true)
      }
    })
  }
}

customElements.define("f-a", FastAnchorElement, { extends: "a" })

// files

let resourcepacksFetch
window.fetchResourcepacks = async () => {
  if (window.resourcepacks === undefined) {
    if (resourcepacksFetch === undefined) {
      resourcepacksFetch = fetch('/assets/json/resourcepacks.json').then(e => e.json()).then(e => window.resourcepacks = e)
    }
    await resourcepacksFetch
  }
}

// end

addEventListener("popstate", onLoad)
onLoad()