window.E = (tagName, options) => $(document.createElement(tagName, options))

// google analytics

// window.dataLayer  =  window.dataLayer || []
// const gtag = (...args) => dataLayer.push(args)
// gtag("js", new Date())
// gtag("config", "UA-155158328-2")

// lazy loading

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
        .replace(/%3A/g, ':')
        .replace(/%3B/g, ';')
        .replace(/%20/g, '+')
        .replace(/%2C/g, ',')
        .replace(/%2F/g, '/')
        .replace(/%40/g, '@')
      arr.push(`${arr.length == 0 ? "?" : "&"}${k}=${encodedVal}`)
    }
  }
  return arr.join("")
}

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
  if (data) page[0].setData(data)
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

function entriesPageRoute(name, singular) {
  return [
    new RegExp(`^\\/${name}\\/.+`, "i"),
    async (url, container, updateHistory) => {
      await fetchEntries(name)
      const entry = url.pathname.slice(name.length + 2).replace(/\/$/, "").toLowerCase()
      console.log(entry)
      if (Object.keys(window[name].entries).includes(entry)) {
        await import(`/pages/${singular}/page.js`)
        setupPage(singular, container, {[singular]: entry})
        if (updateHistory) {
          history.pushState({}, "", url)
        }
        return true
      }
    }
  ]
}

const routes = [
  basicPageRoute("resourcepacks"),
  entriesPageRoute("resourcepacks", "pack"),
  basicPageRoute("maps"),
  entriesPageRoute("maps", "map"),
  basicPageRoute("colours")
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
        setupPage("home", $("#content"), Object.fromEntries(url.searchParams))
        history.replaceState({}, "", "/")
      }
      foundPage = true
      break
    }
  }
  if (!foundPage) {
    await import("/pages/home/page.js")
    setupPage("home", $("#content"), Object.fromEntries(url.searchParams))
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

const entriesFetch = {}
window.fetchEntries = async type => {
  if (window[type] === undefined && entriesFetch[type] === undefined) entriesFetch[type] = fetch(`/assets/json/${type}.json`).then(e => e.json())
  window[type] = await entriesFetch[type]
}

// end

addEventListener("popstate", onLoad)
onLoad()