import { createApp } from "vue"
import { router } from "./router.js"
import App from "./App.vue"
import "./style.styl"

createApp(App).use(router).mount("#app")
