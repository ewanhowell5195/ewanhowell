export async function loadImage(file) {
  const reader = new FileReader()
  reader.readAsDataURL(file)
  return await new Promise(fulfil => {
    reader.onloadend = e => {
      const img = new Image()
      img.src = e.target.result
      img.onload = _ => fulfil(img)
    }
  })
}