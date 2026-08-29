import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { AnimationItem } from '../store/useAnimationStore'

const fbxLoader = new FBXLoader()
const gltfLoader = new GLTFLoader()

/**
 * Extrai AnimationClips de arquivos FBX ou GLB/GLTF, ignorando meshes/geometrias para economizar memória.
 */
export async function extractAnimationsFromFile(
  buffer: ArrayBuffer,
  fileName: string
): Promise<AnimationItem[]> {
  const isGltf = /\.(glb|gltf)$/i.test(fileName)
  let rawAnimations: THREE.AnimationClip[] = []

  if (isGltf) {
    // Carrega animações de GLB / GLTF
    const gltf = await new Promise<any>((resolve, reject) => {
      gltfLoader.parse(
        buffer,
        '',
        (result) => resolve(result),
        (error) => reject(error)
      )
    })

    rawAnimations = gltf.animations || []

    // Limpa meshes/geometrias para liberar memória
    if (gltf.scene) {
      gltf.scene.traverse((child: any) => {
        if (child.isMesh) {
          child.geometry?.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: any) => mat.dispose())
          } else if (child.material) {
            child.material.dispose()
          }
        }
      })
    }
  } else {
    // Carrega animações de FBX
    const fbxGroup = fbxLoader.parse(buffer, '')
    rawAnimations = fbxGroup.animations || []

    // Limpa recursos do FBX
    fbxGroup.traverse((child: any) => {
      if (child.isMesh) {
        child.geometry?.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach((mat: any) => mat.dispose())
        } else if (child.material) {
          child.material.dispose()
        }
      }
    })
  }

  if (rawAnimations.length === 0) {
    console.warn(`Nenhum AnimationClip encontrado no arquivo: ${fileName}`)
    return []
  }

  const baseName = fileName.replace(/\.(fbx|glb|gltf)$/i, '')

  return rawAnimations.map((rawClip, index) => {
    const clip = rawClip.clone()
    let clipName = baseName

    if (rawAnimations.length > 1) {
      const originalName = clip.name && clip.name !== 'Armature' && clip.name !== 'Take 001' ? clip.name : null
      clipName = originalName ? `${baseName}_${originalName}` : `${baseName}_${index + 1}`
    }

    clip.name = clipName

    return {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${index}`,
      name: clipName,
      fileName,
      clip,
      duration: Math.round(clip.duration * 100) / 100,
      tracksCount: clip.tracks.length
    }
  })
}

// Retrocompatibilidade
export const extractAnimationsFromFbx = extractAnimationsFromFile
