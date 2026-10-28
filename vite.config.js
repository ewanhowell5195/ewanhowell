import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  plugins: [vue(), {
    name: "cfasync",
    transformIndexHtml: {
      order: "post",
      handler: html => html.replace(/<script type="module"/g, "<script data-cfasync=\"false\" type=\"module\"")
    }
  }],
  server: {
    port: 8080,
    strictPort: true
  }
})
