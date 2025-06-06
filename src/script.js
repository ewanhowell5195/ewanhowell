window.Page = (await import("/js/libs/pages.js")).Page

window.E = (tagName, options) => $(document.createElement(tagName, options))

const rgxURLParams = /(?:^\?|&)([A-z0-9-]+)(?:=([^&]+)|(?=&)|$|=)/g

window.getURLParams = s => {
  let str = s
  if (!str) str = location.search
  if (str.length < 2) return null
  let params = {}
  let m; while (m = rgxURLParams.exec(str)) {
    params[m[1]] = m[2] ? decodeURIComponent(m[2].replace(/\+/g, "%20")) : true
  }
  return params
}

window.toURLParams = o => {
  let arr = []
  for (let k in o) if (o.hasOwnProperty(k) && o[k] != null) {
    if (o[k] === true) {
      arr.push(`${arr.length == 0 ? "?" : "&"}${k}`)
    } else {
      let encodedVal = encodeURIComponent(o[k])
        .replace(/%3A/g, ":")
        .replace(/%3B/g, ";")
        .replace(/%20/g, "+")
        .replace(/%2C/g, ",")
        .replace(/%2F/g, "/")
        .replace(/%40/g, "@")
      arr.push(`${arr.length == 0 ? "?" : "&"}${k}=${encodedVal}`)
    }
  }
  return arr.join("")
}

const titleReplacements = {
  "U R L": "URL",
  "Id": "ID",
  "I D": "ID",
  "Uv": "UV",
  "3 D": "3D",
  "Dmca": "DMCA",
  "9minecraft": "9Minecraft"
}

const titlePattern = new RegExp(`\\b(${Object.keys(titleReplacements).join("|")})\\b`, "gi")

String.prototype.toTitleCase = function(c, n) {
  let t
  if (c) t = this.replace(/\s/g, "").replace(n ? /([A-Z])/g : /([A-Z0-9])/g, " $1").replace(/[_-]/g, " ")
  else t = this
  return t.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).trim().replace(titlePattern, (a, b) => titleReplacements[b])
}

// analytics

window.dataLayer = window.dataLayer || []
function gtag(){dataLayer.push(arguments)}
gtag("js", new Date())
gtag("config", "G-VSJF1VRJHW", {
  send_page_view: false,
  cookie_flags: "max-age=7200;SameSite=Strict"
})

window.lastAnalytics = ""
window.analytics = () => {
  if (location.href === lastAnalytics) return
  gtag("event", "page_view", {
    page_title: document.title,
    page_path: location.pathname,
    page_location: location.href
  })
  lastAnalytics = location.href
}

// lazy loading

window.imageObserver = new IntersectionObserver((entries, observer) => {
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

// sidebar

const sidebarButton = $(".sidebar-button")
const sidebar = $("#sidebar")
sidebarButton.on("click", e => {
  sidebarButton.toggleClass("active")
  sidebar.toggleClass("active")
})

$(window).on({
  click(e) {
    const target = $(e.target)
    if (globalThis.innerWidth < 1330 + sidebar.width() * 2 + 200 && ((target.hasClass("page-button") || target.parents(".page-button").length && target.parents("#sidebar").length) || sidebar.hasClass("active") && !(e.target === sidebar[0] || target.parents("#sidebar").length) && !(e.target === sidebarButton[0] || target.parents(".sidebar-button").length))) {
      sidebarButton.removeClass("active")
      sidebar.removeClass("active")
    }
  },
  resize() {
    if (globalThis.innerWidth < 1330 + sidebar.width() * 2 + 200 && sidebar.hasClass("active")) {
      sidebarButton.removeClass("active")
      sidebar.removeClass("active")
    }
  }
})

// pages

async function setupPage(PageClass, container, data) {
  if (!customElements.get(PageClass.tag)) customElements.define(PageClass.tag, PageClass)
  const page = E(PageClass.tag)
  if (PageClass.title) document.title = PageClass.title
  container.children()[0]?.onClosed?.()
  container.empty().append(page)
  if (data) return await page[0].setData?.(data) ?? true
  return true
}

function historyHandler(updateHistory, url) {
  if (updateHistory === "replace") {
    history.replaceState({}, "", url)
  } else if (updateHistory) {
    history.pushState({}, "", url)
  }
}

function pageRoute(path, rgx) {
  return [
    typeof rgx === "string" ? new RegExp(`^${rgx.replace(/:(?<name>[^/?.]+)/g, (m, name) => `(?<${name}>[^/?.]+)(?=$|/|\\?|.)`).replace(/\./g, "\\$&")}/?(?:\\?.*)?$`, "i") : rgx ?? new RegExp(`^/${path}/?(?:\\?.*)?$`, "i"),
    async (url, container, updateHistory, params) => {
      const searchParams = Object.fromEntries(url.searchParams)
      if (await setupPage((await import(`/pages/${path}/page.js`)).default, container, params !== undefined ? Object.assign(params, {searchParams}) : searchParams)) {
        historyHandler(updateHistory, url)
        return true
      } else {
        return false
      }
    }
  ]
}

const routes = [
  pageRoute("home", "/"),
  pageRoute("resourcepacks"),
  pageRoute("pack", "/resourcepacks/:name"),
  pageRoute("maps"),
  pageRoute("map", "/maps/:name"),
  pageRoute("plugins"),
  pageRoute("plugin", "/plugins/:name"),
  pageRoute("themes"),
  pageRoute("theme", "/themes/:name"),
  pageRoute("dungeonsmods"),
  pageRoute("dungeonsmod", "/dungeonsmods/:name"),
  pageRoute("renders"),
  pageRoute("tools"),
  pageRoute("tools/ctmconverter"),
  pageRoute("tools/mojangconverter"),
  pageRoute("tools/minecrafttitleconverter"),
  pageRoute("tools/chestconverter"),
  pageRoute("guides"),
  pageRoute("guide", "/guides/:name")
]

function compareURLs(a, b) {
  return a.href === b.href || a.search === b.search && a.hash === b.hash && (
    a.pathname.endsWith("/") && !b.pathname.endsWith("/") && a.pathname === b.pathname + "/" ||
    b.pathname.endsWith("/") && !a.pathname.endsWith("/") && b.pathname === a.pathname + "/"
  )
}

let pageLoadPromise = Promise.resolve()
let isOpeningPage = false
window.openPage = function(url, updateHistory = false, forceUpdate = false) {
  if (!forceUpdate && (isOpeningPage || compareURLs(url, location))) return
  return pageLoadPromise = pageLoadPromise.finally(async () => {
    $("#mobile-menu").addClass("hidden")
    $('link[rel="icon"][sizes="16x16"]').attr("href", "/assets/images/logo/logo_16.webp")
    $('link[rel="icon"][sizes="32x32"]').attr("href", "/assets/images/logo/logo_32.webp")
    document.title = "Ewan Howell"
    isOpeningPage = true
    const findPage = async ps => {
      for (const [rgx, func] of routes) {
        const m = ps.match(rgx)
        if (m !== null) return await func(url, $("#content"), updateHistory, m.groups)
      }
    }
    let foundPage = await findPage(url.pathname + url.search)
    if (!foundPage) {
      let i = 1
      const parts = url.pathname.split("/")
      while (!foundPage && parts.length > i) {
        const path = parts.slice(0, -i++).join('/')
        const ps = (path.length ? path : '/') + url.search
        foundPage = await findPage(ps)
        if (foundPage) historyHandler("replace", ps)
      }
    }
    isOpeningPage = false
    $('meta[name="theme-color"]').attr("content", "#AE3535")
    $("#content > *")[0].onOpened?.()
    analytics()
  })
}

const onLoad = () => openPage(new URL(location.href), "replace", true)

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

{
  let cbieTestRegistered = false
  window.supportsCBIE = () => {
    if (!cbieTestRegistered) {
      class TestElement extends HTMLAnchorElement {
        constructor() {
          super()
          this.output = true
        }
      }
      customElements.define("cbie-test", TestElement, { extends: "a" })
      cbieTestRegistered = true
    }
    return !!document.createElement("a", { is: "cbie-test" }).output
  }

  if (!supportsCBIE()) {
    $(document).on("click", 'a[is="f-a"]', evt => {
      evt.preventDefault()
      openPage(new URL(evt.currentTarget.href), true)
    })
  }
}

// files

const jsonFetch = {}
window.fetchJSON = async name => {
  if (window[name] === undefined && jsonFetch[name] === undefined) try {
    jsonFetch[name] = await fetch(`/assets/json/${name}.json`).then(e => e.json())
  } catch {
    return false
  }
  window[name] = jsonFetch[name]
  return true
}

// end

addEventListener("popstate", onLoad)
onLoad()