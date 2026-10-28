import { reactive } from "vue"

export function useProgress() {
  const progress = reactive({ style: {} })

  function setProgress(done, value, total) {
    progress.style = {
      width: (100 * value / total).toFixed(4) + "%",
      height: !done * 4 + "px"
    }
  }

  async function fetchWithProgress(url) {
    setProgress(true, 0, 1)

    const response = await fetch(url)
    const reader = response.body.getReader()
    const contentLength = +response.headers.get("Content-Length")

    let receivedLength = 0
    const chunks = []
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        setProgress(true, receivedLength, contentLength)
        break
      }

      chunks.push(value)
      receivedLength += value.length

      setProgress(false, receivedLength, contentLength)
    }

    const chunksAll = new Uint8Array(receivedLength)
    let position = 0
    for (const chunk of chunks) {
      chunksAll.set(chunk, position)
      position += chunk.length
    }

    return {
      data: chunksAll,
      blob: () => new Blob([chunksAll]),
      text: () => new TextDecoder("utf-8").decode(chunksAll),
      arrayBuffer: () => chunksAll.buffer,
      json: () => JSON.parse(new TextDecoder("utf-8").decode(chunksAll))
    }
  }

  return { progress, setProgress, fetch: fetchWithProgress }
}
