import path from "node:path"
import sharp from "sharp"
import fs from "node:fs"

const bgPath = "src/assets/images/resourcepacks/f8thful/images/house.webp"
const logoPath = "src/assets/images/resourcepacks/f8thful/logo.webp"

const bgSharp = sharp(fs.readFileSync(bgPath)).resize(640, 360)
bgSharp.blur(5)

const logoSharp = sharp(await sharp(logoPath).resize(576, 192, {
  background: "#00000000",
  fit: "contain"
}).toBuffer())
const logoMeta = await logoSharp.clone().metadata()

bgSharp.composite([
  {
    input: await sharp(await logoSharp.clone().extend(20).blur(10).extractChannel("alpha").negate().toBuffer()).modulate({
      lightness: 8
    }).toBuffer(),
    top: 170 - logoMeta.height / 2,
    left: 300 - logoMeta.width / 2,
    blend: "multiply"
  },
  {
    input: await logoSharp.toBuffer(),
    top: 180 - logoMeta.height / 2,
    left: 320 - logoMeta.width / 2
  }
])

await bgSharp.toFile("test.png")