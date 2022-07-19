import { Page } from "/js/pages.js"

class TestPage extends Page {
  constructor() {
    super("test")
  }
}

customElements.define("test-page", TestPage)

export { TestPage }