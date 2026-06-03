


import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import vertexShader from './vertex.js'
import fragmentShader from './fragment.js'

let bloomLayer = null
let darkMaterial = null
let materials = null

export default class PostProcessing {
  constructor(experience) {
    this.renderer = experience.renderer
    this.scene = experience.scene
    this.camera = experience.camera
    this.sizes = experience.sizes
    this.meshList = experience.meshList

    this.update = null

    this.setBloomConfig()
    this.setBloomObjects()
    // this.setRenderTarget()
    this.setPasses()
    this.setUpBloom()
  }

  setBloomConfig() {
    this.BLOOM_SCENE = 1
    bloomLayer = new THREE.Layers()
    bloomLayer.set(this.BLOOM_SCENE)

    this.bloomParams = {}
    this.bloomParams.bloomStrength = 0.7
    this.bloomParams.bloomThreshold = 0
    this.bloomParams.bloomRadius = 0.2

    darkMaterial = new THREE.MeshBasicMaterial({ color: "black" })
    materials = {}
  }

  addMesh(list) {
    this.meshList.push(...list)
    this.setBloomObjects()
  }
  removeMesh(list) {
    list.forEach(item => {
      item.layers.disable(this.BLOOM_SCENE)
      const index = this.meshList.findIndex(i => i === item)
      if (index > -1) {
        this.meshList.splice(index, 1)
      }
    })
  }
  clearMesh() {
    this.meshList.forEach(mesh => {
      mesh.layers.disable(this.BLOOM_SCENE)
    })
    this.meshList = []
  }

  setBloomObjects() {
    this.meshList.forEach(mesh => {
      mesh.layers.enable(this.BLOOM_SCENE)
    })
  }

  setRenderTarget() {
    this.renderTarget = new THREE.WebGLRenderTarget
      (
        800,
        600,
        {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
          encoding: THREE.sRGBEncoding
        }
      )

    // Currently not working on metal (ios)

    // if(this.renderer.capabilities.isWebGL2)
    // {
    //     this.renderTarget.samples = 4
    //     console.log('using WebGLMultiSampleRenderTarget')
    // }
    // else
    // {
    //     console.log('using WebGLRenderTarget')
    // }
  }

  setPasses() {
    this.renderPass = new RenderPass(this.scene, this.camera)

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(this.sizes.width, this.sizes.height), 1.5, 0.4, 0.85)
    this.bloomPass.threshold = this.bloomParams.bloomThreshold
    this.bloomPass.strength = this.bloomParams.bloomStrength
    this.bloomPass.radius = this.bloomParams.bloomRadius

    this.bloomComposer = new EffectComposer(this.renderer)
    this.bloomComposer.renderToScreen = false
    this.bloomComposer.addPass(this.renderPass)
    this.bloomComposer.addPass(this.bloomPass)


    this.finalPass = new ShaderPass
      (
        new THREE.ShaderMaterial
          ({
            uniforms:
            {
              baseTexture: { value: null },
              bloomTexture: { value: this.bloomComposer.renderTarget2.texture }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            defines: {},
            precision: 'lowp'
          }),
        "baseTexture"
      )

    this.finalPass.needsSwap = true
    this.finalComposer = new EffectComposer(this.renderer)

    this.finalComposer.setSize(this.sizes.width, this.sizes.height)
    this.finalComposer.setPixelRatio(Math.min(this.sizes.pixelRatio, 2))

    this.finalComposer.addPass(this.renderPass)
    this.finalComposer.addPass(this.finalPass)
    // const outputPass = new OutputPass();
    // this.finalComposer.addPass(outputPass)

    // SMAA pass if WebGL2 is not available

    // if(!this.renderer.capabilities.isWebGL2)
    // {
    //     this.smaaPass = new SMAAPass()
    //     this.finalComposer.addPass(this.smaaPass)
    //     console.log('Using SMAA')
    // }

    this.smaaPass = new SMAAPass()
    this.finalComposer.addPass(this.smaaPass)


    this.enableUpdate()

  }

  setUpBloom() {
    this.renderBloom = function renderBloom() {
      this.scene.traverse(this.darkenNonBloomed)
      this.bloomComposer.render()
      this.scene.traverse(this.restoreMaterial)
    }
  }

  darkenNonBloomed(obj) {
    // obj.isMesh && 
    if (bloomLayer.test(obj.layers) === false) {
      materials[obj.uuid] = obj.material;
      obj.material = darkMaterial;
    }
  }

  restoreMaterial(obj) {
    if (materials[obj.uuid]) {
      obj.material = materials[obj.uuid];
      delete materials[obj.uuid];
    }
  }

  enableUpdate() {
    this.update = function update() {
      { this.renderBloom() }
      { this.finalComposer.render() }
    }
  }

  resize() {
    if (this.bloomComposer) { this.bloomComposer.setSize(this.sizes.width, this.sizes.height) }
    if (this.bloomComposer) { this.bloomComposer.setPixelRatio(Math.min(this.sizes.pixelRatio, 2)) }
    if (this.finalComposer) { this.finalComposer.setSize(this.sizes.width, this.sizes.height) }
    if (this.finalComposer) { this.finalComposer.setPixelRatio(Math.min(this.sizes.pixelRatio, 2)) }
  }
}

