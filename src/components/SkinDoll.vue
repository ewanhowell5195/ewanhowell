<script setup>
  import { ref, onMounted, onBeforeUnmount } from "vue"

  const props = defineProps({
    uuid: String
  })

  const canvas = ref()
  const offset = ref(0)
  const ready = ref(false)
  const deg = Math.PI / 180
  const pose = {
    waist: [17.57, 4.7, 1.71],
    head: [-17.45, 1.29, 4.83],
    rightArm: [-18.18, -6.73, 20.03],
    leftArm: [-27.99, 11.53, -17.35],
    rightLeg: [6.94, -4.46, 14.34],
    leftLeg: [9.77, 2.15, -12.32]
  }
  let viewer
  let pointer

  // Blockbench skin poses face -Z and skinview3d faces +Z, so X and Z flip
  function rotate(object, [x, y, z]) {
    object.rotation.set(-x * deg, y * deg, -z * deg, "ZYX")
  }

  function onPointerMove(e) {
    pointer = { x: e.clientX, y: e.clientY }
  }

  function onPointerLeave() {
    pointer = null
  }

  async function loadTextures() {
    const profile = await fetch(`https://cors.ewanhowell.com/https://sessionserver.mojang.com/session/minecraft/profile/${props.uuid}`).then(r => r.json())
    const textures = JSON.parse(atob(profile.properties.find(p => p.name === "textures").value)).textures
    return {
      skin: textures.SKIN.url.replace("http:", "https:"),
      slim: textures.SKIN.metadata?.model === "slim",
      cape: textures.CAPE?.url.replace("http:", "https:")
    }
  }

  async function readFace(url, d2) {
    const image = new Image()
    image.crossOrigin = "anonymous"
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = reject
      image.src = url
    })
    const skinCanvas = document.createElement("canvas")
    skinCanvas.width = image.width
    skinCanvas.height = image.height
    const context = skinCanvas.getContext("2d")
    context.drawImage(image, 0, 0)
    const img = { width: image.width, height: image.height, scale: 1, rgba: context.getImageData(0, 0, image.width, image.height).data }
    function colour(x, y) {
      const i = (y * img.width + x) * 4
      return `rgb(${img.rgba[i]}, ${img.rgba[i + 1]}, ${img.rgba[i + 2]})`
    }
    const tone = d2.faceTone(img)
    const eyes = tone && d2.EYES.find(e => e.id === d2.suggestEyes(img, tone))
    const mouth = tone && d2.MOUTHS.find(m => m.id === d2.suggestMouth(img, tone, eyes))
    const pieces = []
    if (eyes) {
      const suffix = { 0: "_Up", 2: "_Low", 7: "_Low2" }[eyes.v] ?? ""
      const centre = eyes.rows.reduce((sum, y) => sum + y, 0) / eyes.rows.length
      for (const [index, columns] of d2.EYE_COLUMNS.entries()) {
        const side = index ? "L" : "R"
        const pupils = d2.pupilCells(img, eyes.rows, columns)
        for (const y of eyes.rows) {
          const pupil = pupils.find(cell => cell.y === y)?.x ?? pupils[0].x
          pieces.push({ colour: colour(columns.find(x => x !== pupil), y), x: (columns[0] + columns[1]) / 2, y, centre, width: 2, depth: 0, bone: `J_${side}_EyeIris${suffix}`, vertical: `J_${side}_EyeIris${suffix}` })
          pieces.push({ colour: colour(pupil, y), x: columns[1], y, centre, width: 1, depth: 0.05, bone: `J_${side}_EyePupil${suffix}`, vertical: `J_${side}_EyeIris${suffix}` })
        }
      }
    }
    if (mouth) {
      for (const [x, y] of mouth.cells) pieces.push({ colour: colour(x, y), x, y, centre: y, width: 1, depth: 0, bone: mouth.id === "row8" ? "J_Mouth_Low" : "J_Mouth", vertical: mouth.id === "row8" ? "J_Mouth_Low" : "J_Mouth" })
    }
    for (const region of (eyes?.drawn ?? []).concat(mouth?.drawn ?? [])) d2.fillFromSurroundings(img, region)
    context.putImageData(new ImageData(img.rgba, img.width, img.height), 0, 0)
    return { skinCanvas, pieces }
  }

  onMounted(async () => {
    window.addEventListener("pointermove", onPointerMove)
    document.documentElement.addEventListener("pointerleave", onPointerLeave)
    const [{ SkinViewer, FunctionAnimation }, { Vector2, Vector3, Quaternion, Euler, Raycaster, Plane, Group, Mesh, PlaneGeometry, MeshStandardMaterial, Color }, textures, d2, faceData] = await Promise.all([import("skinview3d"), import("three"), loadTextures(), import("../pages/tools/dungeons2skinconverter.js"), fetch("/assets/json/skin-doll-face.json").then(r => r.json())])
    const { skinCanvas, pieces } = await readFace(textures.skin, d2)
    if (!canvas.value) return
    viewer = new SkinViewer({
      canvas: canvas.value,
      width: canvas.value.clientWidth,
      height: canvas.value.clientHeight,
      pixelRatio: "match-device",
      enableControls: false,
      fov: 8
    })
    const target = viewer.composer.renderTarget1.clone()
    target.samples = 4
    viewer.composer.reset(target)
    viewer.controls.enabled = false
    viewer.controls.maxDistance = Infinity
    viewer.controls.target.set(0, 2, 0)
    const distance = 4.5 + 16.5 / Math.tan(4 * deg) / 0.6
    viewer.camera.position.set(0, 2 + distance * 0.13, distance)
    viewer.camera.near = distance - 60
    viewer.camera.far = distance + 60
    viewer.camera.updateProjectionMatrix()
    viewer.controls.update()
    await viewer.loadSkin(skinCanvas, { model: textures.slim ? "slim" : "default" })
    if (textures.cape) await viewer.loadCape(textures.cape)

    const player = viewer.playerObject
    const { skin } = player
    const rightLeg = skin.rightLeg.position.clone()
    const leftLeg = skin.leftLeg.position.clone()
    const raycaster = new Raycaster()
    const plane = new Plane(new Vector3(0, 0, 1))
    const waist = new Group()
    const xAxis = new Vector3(1, 0, 0)
    const restHead = new Quaternion().setFromEuler(new Euler(-pose.head[0] * deg, pose.head[1] * deg, -pose.head[2] * deg, "ZYX"))

    const meshes = pieces.map(piece => {
      const [track, vertical] = [piece.bone, piece.vertical].map(bone => {
        const index = faceData.bones.indexOf(bone)
        if (index < 0) throw new Error(`skin-doll-face.json has no track for ${bone}`)
        return index
      })
      const mesh = new Mesh(new PlaneGeometry(piece.width, 1), new MeshStandardMaterial({ color: new Color(piece.colour), polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 }))
      mesh.position.z = 4.02 + piece.depth
      skin.head.add(mesh)
      return Object.assign({}, piece, { mesh, track, vertical })
    })
    const clips = { index: 0, start: 0 }

    function faceFrame(t) {
      let frames = faceData.clips[clips.index]
      let length = (frames.length - 1) / faceData.fps
      if (t - clips.start > length) {
        clips.start += length
        clips.index = (clips.index + 1) % faceData.clips.length
        frames = faceData.clips[clips.index]
        length = (frames.length - 1) / faceData.fps
      }
      const position = Math.min((t - clips.start) * faceData.fps, frames.length - 1)
      const i = Math.floor(position)
      const next = frames[Math.min(i + 1, frames.length - 1)]
      const frame = frames[i].map((v, k) => v + (next[k] - v) * (position - i))
      const remaining = length - (t - clips.start)
      if (remaining >= 0.4) return frame
      const following = faceData.clips[(clips.index + 1) % faceData.clips.length][0]
      return frame.map((v, k) => v + (following[k] - v) * (1 - remaining / 0.4))
    }
    viewer.animation = new FunctionAnimation((player, t, delta) => {
      skin.rightLeg.position.set(rightLeg.x, rightLeg.y + 2, rightLeg.z + 2)
      skin.leftLeg.position.set(leftLeg.x, leftLeg.y + 2, leftLeg.z + 2)
      rotate(skin.rightLeg, pose.rightLeg)
      rotate(skin.leftLeg, pose.leftLeg)
      skin.rightLeg.quaternion.premultiply(new Quaternion().setFromAxisAngle(xAxis, Math.sin(t * 2) * 0.12))
      skin.leftLeg.quaternion.premultiply(new Quaternion().setFromAxisAngle(xAxis, Math.sin(t * 2 - 0.8) * 0.12))
      const head = new Vector3()
      skin.head.getWorldPosition(head)
      let target = viewer.camera.position
      if (pointer) {
        const rect = canvas.value.getBoundingClientRect()
        raycaster.setFromCamera(new Vector2((pointer.x - rect.left) / rect.width * 2 - 1, 1 - (pointer.y - rect.top) / rect.height * 2), viewer.camera)
        plane.constant = -(head.z + 40)
        target = raycaster.ray.intersectPlane(plane, new Vector3()) ?? target
      }
      const toPlayer = player.getWorldQuaternion(new Quaternion()).invert()
      const dir = target.clone().sub(head).applyQuaternion(toPlayer)
      const yaw = Math.atan2(dir.x, dir.z)
      const pitch = -Math.atan2(dir.y, Math.hypot(dir.x, dir.z))
      const aim = pointer ? new Quaternion().setFromEuler(new Euler(Math.max(-0.6, Math.min(0.6, pitch)), Math.max(-1.1, Math.min(1.1, yaw)), 0, "YXZ")).premultiply(waist.quaternion.clone().invert()) : restHead
      skin.head.quaternion.slerp(aim, Math.min(1, delta * 8))
      player.cape.rotation.x = 0.15

      const frame = faceFrame(t)
      for (const { mesh, track, vertical, x, y, centre } of meshes) {
        const dx = frame[track * 3]
        const [dy, sy] = frame.slice(vertical * 3 + 1, vertical * 3 + 3)
        mesh.position.x = x - 11.5 + dx
        mesh.position.y = 15.5 - centre + dy - (y - centre) * sy
        mesh.scale.y = Math.max(0.001, sy)
        mesh.visible = sy > 0.02
      }
    })

    player.rotation.y = -0.6
    waist.position.y = -12
    skin.add(waist)
    for (const part of [skin.head, skin.body, skin.rightArm, skin.leftArm]) {
      part.position.y += 12
      waist.add(part)
    }
    player.cape.position.set(0, 12, -2)
    waist.add(player.cape)
    rotate(waist, pose.waist)
    rotate(skin.rightArm, pose.rightArm)
    rotate(skin.leftArm, pose.leftArm)
    skin.head.quaternion.copy(restHead)

    const ledge = waist.getWorldPosition(new Vector3())
    const forward = player.getWorldDirection(new Vector3())
    const clippingPlanes = [new Plane(new Vector3(0, 1, 0), -ledge.y), new Plane().setFromNormalAndCoplanarPoint(forward, ledge.addScaledVector(forward, -0.2))]
    viewer.renderer.localClippingEnabled = true
    player.traverse(object => {
      if (!object.material) return
      object.material.clippingPlanes = clippingPlanes
      object.material.clipIntersection = true
    })

    viewer.render()
    const hip = new Vector3()
    skin.rightLeg.getWorldPosition(hip)
    hip.project(viewer.camera)
    offset.value = (1 - hip.y) / 2 * canvas.value.clientHeight
    ready.value = true
  })

  onBeforeUnmount(() => {
    window.removeEventListener("pointermove", onPointerMove)
    document.documentElement.removeEventListener("pointerleave", onPointerLeave)
    viewer?.dispose()
  })
</script>

<template>
  <canvas ref="canvas" class="doll" :class="{ ready }" :style="{ transform: `translateY(${-offset}px)` }"></canvas>
</template>

<style lang="stylus" scoped>
  .doll
    display: block
    width: 300px
    height: 400px
    opacity: 0
    transition: opacity .4s

    &.ready
      opacity: 1
</style>
