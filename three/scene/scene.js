import * as THREE from 'three'

import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

let scene, camera, ambientLight, renderer, controls, stats
let gltf, mixer, clock

init()

function init() {

  clock = new THREE.Clock()

  const container = document.createElement('div')
  document.body.appendChild(container)

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20)
  camera.position.set(0, 1.5, 4.1)

  ambientLight = new THREE.AmbientLight(0xffffff, 0.3)

  scene = new THREE.Scene()

  new RGBELoader()
    .setPath('/three/textures/')
    .load('royal_esplanade_1k.pic', function (texture) {

      texture.mapping = THREE.EquirectangularReflectionMapping

      scene.background = new THREE.Color("#404040")

      scene.environment = texture

      render()

      let loader = new GLTFLoader().setPath('/three/glb/')
      loader.load('BelchiorRobot.glb', async function (gltfLoaded) {
        gltf = gltfLoaded

        mixer = new THREE.AnimationMixer(gltf.scene)
        mixer.clipAction(gltf.animations[0]).play()

        gltf.scene.position.set(0, -1.5, 0)

        scene.add(gltf.scene)
        scene.add(ambientLight)

        createPanel()

        render()

      })

    })

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setAnimationLoop(render)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableRotate = true
  controls.enableDamping = true
  controls.minDistance = 2
  controls.maxDistance = 8
  controls.target.set(0, 0.1, 0)
  controls.update()

  stats = new Stats()
  container.appendChild(stats.dom)

  window.addEventListener('resize', onWindowResize)

}

function createPanel() {

  const gui = new GUI({ width: 250 })

  const materialFolder = gui.addFolder('Color');
  materialFolder.addColor({ paint: '#e7b33f' }, 'paint').onChange((value) => changeMaterialColor(value));

  const cameraFolder = gui.addFolder('Camera')
  cameraFolder.add(camera.position, 'y', -3, 5)
  cameraFolder.add(camera.position, 'z', 1, 7)

  const animationFolder = gui.addFolder('Animations')
  animationFolder.add({ None: () => toggleAnimation(false) }, 'None')
  animationFolder.add({ Walk: () => toggleAnimation(true) }, 'Walk')

  const speedFolder = gui.addFolder('Velocity')
  speedFolder.add({ speed: 1 }, 'speed', 0.0, 5, 0.01).onChange(modifyTimeScale)

  function changeMaterialColor(color) {
    gltf.scene.traverse((child) => {
      child.isMesh && child.material.name === "Yellow" ? child.material.color.set(color) : null
    });
  }

  function toggleAnimation(playAnimation) {
    playAnimation ? mixer.clipAction(gltf.animations[0]).play() : mixer.clipAction(gltf.animations[0]).stop()
  }

  function modifyTimeScale(speed) {
    mixer.timeScale = speed
  }

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)

}

function render() {

  mixer && mixer.update(clock.getDelta());

  scene && scene.children.length > 0 ? scene.children[0] && (scene.children[0].rotation.y += 0.01) : null

  stats.update()

  controls.update()

  renderer.render(scene, camera)

}