<script setup>
  import { ref, onMounted, onBeforeUnmount } from "vue"

  const SUPERSAMPLE = 3

  const canvas = ref()
  const ready = ref(false)
  let renderer
  let buffer
  let frame
  let pointer
  let visible = false
  let observer
  let resizer

  function onPointerMove(e) {
    if (e.pointerType !== "mouse") return
    pointer = { x: e.clientX, y: e.clientY }
  }

  function onPointerLeave() {
    pointer = null
  }

  onMounted(async () => {
    const [THREE, { GLTFLoader }] = await Promise.all([import("three"), import("three/addons/loaders/GLTFLoader.js")])
    const gltf = await new GLTFLoader().loadAsync("/assets/models/title-generator.glb")
    if (!canvas.value) return

    const title = gltf.scene
    title.traverse(object => {
      if (object.material) object.material = new THREE.MeshBasicMaterial({ map: object.material.map, alphaTest: 0.5 })
    })
    const box = new THREE.Box3().setFromObject(title)
    title.position.sub(box.getCenter(new THREE.Vector3()))
    const pivot = new THREE.Group()
    pivot.add(title)
    const scene = new THREE.Scene()
    scene.add(pivot)

    const camera = new THREE.PerspectiveCamera(18, 1, 0.1, 2000)
    const direction = new THREE.Vector3(0, -170, -320).normalize()
    const size = box.getSize(new THREE.Vector3())

    renderer = new THREE.WebGLRenderer({ canvas: canvas.value, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)

    buffer = new THREE.WebGLRenderTarget(1, 1, { samples: 4 })
    const downsample = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: { map: { value: buffer.texture } },
      vertexShader: "void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: `
        uniform sampler2D map;
        void main() {
          ivec2 base = ivec2(gl_FragCoord.xy) * ${SUPERSAMPLE};
          vec4 sum = vec4(0.0);
          for (int y = 0; y < ${SUPERSAMPLE}; y++) for (int x = 0; x < ${SUPERSAMPLE}; x++) sum += texelFetch(map, base + ivec2(x, y), 0);
          gl_FragColor = sum / float(${SUPERSAMPLE * SUPERSAMPLE});
          #include <colorspace_fragment>
        }
      `
    }))
    const screen = new THREE.Scene()
    screen.add(downsample)
    const screenCamera = new THREE.Camera()

    function draw() {
      renderer.setRenderTarget(buffer)
      renderer.render(scene, camera)
      renderer.setRenderTarget(null)
      renderer.render(screen, screenCamera)
    }

    function resize() {
      const { clientWidth, clientHeight } = canvas.value
      renderer.setSize(clientWidth, clientHeight, false)
      const { width, height } = renderer.domElement
      buffer.setSize(width * SUPERSAMPLE, height * SUPERSAMPLE)
      camera.aspect = clientWidth / clientHeight
      const fit = Math.max(size.y / 2, size.x / 2 / camera.aspect) * 1.1
      camera.position.copy(direction).multiplyScalar(fit / Math.tan(camera.fov / 2 * Math.PI / 180) + size.z / 2)
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()
    }

    const target = new THREE.Euler()
    const clock = new THREE.Clock()

    function render() {
      frame = requestAnimationFrame(render)
      if (!visible) return
      const delta = Math.min(clock.getDelta(), 0.1)
      const t = clock.elapsedTime
      if (pointer) {
        const rect = canvas.value.getBoundingClientRect()
        const x = Math.max(-1, Math.min(1, (pointer.x - rect.left - rect.width / 2) / (window.innerWidth / 2)))
        const y = Math.max(-1, Math.min(1, (pointer.y - rect.top - rect.height / 2) / (window.innerHeight / 2)))
        target.set(-y * 0.25, x * 0.5, 0)
      } else {
        target.set(Math.sin(t * 0.7) * 0.08, Math.sin(t * 0.5) * 0.3, 0)
      }
      const ease = 1 - Math.exp(-delta * 4)
      pivot.rotation.x += (target.x - pivot.rotation.x) * ease
      pivot.rotation.y += (target.y - pivot.rotation.y) * ease
      draw()
    }

    resize()
    resizer = new ResizeObserver(resize)
    resizer.observe(canvas.value)
    observer = new IntersectionObserver(([entry]) => visible = entry.isIntersecting)
    observer.observe(canvas.value)
    window.addEventListener("pointermove", onPointerMove)
    document.documentElement.addEventListener("pointerleave", onPointerLeave)
    draw()
    ready.value = true
    render()
  })

  onBeforeUnmount(() => {
    cancelAnimationFrame(frame)
    observer?.disconnect()
    resizer?.disconnect()
    window.removeEventListener("pointermove", onPointerMove)
    document.documentElement.removeEventListener("pointerleave", onPointerLeave)
    buffer?.dispose()
    renderer?.dispose()
  })
</script>

<template>
  <canvas ref="canvas" class="title" :class="{ ready }"></canvas>
</template>

<style lang="stylus" scoped>
  .title
    display: block
    width: 100%
    aspect-ratio: 16 / 9
    opacity: 0
    transition: opacity .4s

    &.ready
      opacity: 1
</style>
