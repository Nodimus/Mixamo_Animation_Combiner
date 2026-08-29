import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { AnimationItem } from '../store/useAnimationStore'

const loader = new FBXLoader()

/**
 * Extrai AnimationClips de um arquivo FBX (buffer binário), ignorando meshes e hierarquias 3D.
 */
export function extractAnimationsFromFbx(
  buffer: ArrayBuffer,
  fileName: string
): AnimationItem[] {
  try {
    const fbxGroup = loader.parse(buffer, '')
    const animations = fbxGroup.animations || []

    if (animations.length === 0) {
      console.warn(`Nenhum AnimationClip encontrado no arquivo: ${fileName}`)
      return []
    }

    const baseName = fileName.replace(/\.fbx$/i, '')

    const extractedClips: AnimationItem[] = animations.map((rawClip, index) => {
      const clip = rawClip.clone()
      const clipName =
        animations.length === 1
          ? baseName
          : `${baseName}_${index + 1}`

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

    // Limpeza de recursos para evitar vazamento de memória
    fbxGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose())
        } else if (child.material) {
          child.material.dispose()
        }
      }
    })

    return extractedClips
  } catch (error) {
    console.error(`Erro ao processar FBX (${fileName}):`, error)
    throw error
  }
}
