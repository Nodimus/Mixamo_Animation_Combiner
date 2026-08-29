import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

const gltfLoader = new GLTFLoader()
const fbxLoader = new FBXLoader()

function configureModelMaterials(model: THREE.Object3D): void {
  model.traverse((child: any) => {
    if (child.isMesh || child.isSkinnedMesh) {
      child.castShadow = true
      child.receiveShadow = true
      child.frustumCulled = false // Evita que partes da malha sumam durante animações

      const materials = Array.isArray(child.material) ? child.material : [child.material]

      materials.forEach((mat: THREE.Material) => {
        if (!mat) return

        mat.side = THREE.DoubleSide
        mat.needsUpdate = true

        // Configuração de texturas PBR se for Standard ou Physical Material
        if ('map' in mat && (mat as any).map) {
          ;(mat as any).map.colorSpace = THREE.SRGBColorSpace
          ;(mat as any).map.needsUpdate = true
        }

        if ('emissiveMap' in mat && (mat as any).emissiveMap) {
          ;(mat as any).emissiveMap.colorSpace = THREE.SRGBColorSpace
          ;(mat as any).emissiveMap.needsUpdate = true
        }

        if ('roughnessMap' in mat && (mat as any).roughnessMap) {
          ;(mat as any).roughnessMap.needsUpdate = true
        }

        if ('metalnessMap' in mat && (mat as any).metalnessMap) {
          ;(mat as any).metalnessMap.needsUpdate = true
        }

        if ('normalMap' in mat && (mat as any).normalMap) {
          ;(mat as any).normalMap.needsUpdate = true
        }

        // Se for MeshStandardMaterial, garantir luminosidade adequada
        if (mat instanceof THREE.MeshStandardMaterial) {
          if (mat.roughness !== undefined) {
            mat.roughness = Math.min(mat.roughness, 0.85)
          }
        }
      })
    }
  })
}

export async function loadModelFromBuffer(
  buffer: ArrayBuffer,
  fileName: string
): Promise<{ model: THREE.Group; animations: THREE.AnimationClip[] }> {
  const isGltf = /\.(glb|gltf)$/i.test(fileName)

  if (isGltf) {
    return new Promise((resolve, reject) => {
      gltfLoader.parse(
        buffer,
        '',
        (gltf) => {
          const group = gltf.scene || new THREE.Group()
          configureModelMaterials(group)
          resolve({ model: group, animations: gltf.animations || [] })
        },
        (error) => reject(error)
      )
    })
  } else {
    // FBX
    const model = fbxLoader.parse(buffer, '')
    configureModelMaterials(model)
    return { model, animations: model.animations || [] }
  }
}
