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

if (!String.prototype.toTitleCase) String.prototype.toTitleCase = function() {
  return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()})
}

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
  container.empty().append(page)
  if (data) return await page[0].setData(data) ?? true
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
  pageRoute("dungeonsmods"),
  pageRoute("dungeonsmod", "/dungeonsmods/:name"),
  pageRoute("colours"),
  pageRoute("renders"),
  pageRoute("tools"),
  pageRoute("tools/ctmconverter"),
  pageRoute("tools/mojangconverter"),
  pageRoute("tools/minecrafttitleconverter"),
  pageRoute("tools/chestconverter")
]

let isOpeningPage = false
window.openPage = async function(url, updateHistory = false, forceUpdate = false) {
  if (isOpeningPage || (!forceUpdate && url.href === location.href)) return
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
  if (window[name] === undefined && jsonFetch[name] === undefined) jsonFetch[name] = fetch(`/assets/json/${name}.json`).then(e => e.json())
  window[name] = await jsonFetch[name]
}

// end

addEventListener("popstate", onLoad)
onLoad()