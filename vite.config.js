import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import fs from "node:fs"
import { renderPage, resolvePage } from "./build/meta.js"

function opengraph() {
  return {
    name: "opengraph",
    apply: "serve",
    configureServer(server) {
      const assets = new Map()
      server.middlewares.use(async (req, res, next) => {
        try {
          const { pathname } = new URL(req.url, "http://localhost")
          if (assets.has(pathname)) {
            res.setHeader("Content-Type", pathname.endsWith(".png") ? "image/png" : "image/jpeg")
            return res.end(assets.get(pathname))
          }
          if (req.method !== "GET") return next()
          const page = await resolvePage(pathname)
          if (!page) return next()
          for (const [file, data] of Object.entries(page.assets)) assets.set(`/assets/images/${file}`, data)
          const html = await server.transformIndexHtml(req.url, fs.readFileSync("index.html", "utf-8"))
          res.setHeader("Content-Type", "text/html")
          res.end(renderPage(html, page.meta, `${req.headers["x-forwarded-proto"] ?? "http"}://${req.headers["x-forwarded-host"] ?? req.headers.host}`))
        } catch (err) {
          next(err)
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [vue(), opengraph()],
  server: {
    host: true,
    port: 9123,
    strictPort: true
  }
})
