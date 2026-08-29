import * as THREE from 'three'

export interface BoneValidationResult {
  isCompatible: boolean
  hasModel: boolean
  totalTracks: number
  matchedTracks: number
  missingBones: string[]
  matchPercentage: number
}

/**
 * Obtém todos os nomes de ossos e nós do skeleton do modelo base
 */
export function getModelBoneNames(model: THREE.Object3D | null): Set<string> {
  const boneNames = new Set<string>()
  if (!model) return boneNames

  model.traverse((child: any) => {
    if (child.isBone) {
      boneNames.add(child.name)
    }
    if (child.isSkinnedMesh && child.skeleton) {
      child.skeleton.bones.forEach((b: THREE.Bone) => {
        if (b.name) boneNames.add(b.name)
      })
    }
    // Alguns rigs também animam nós pais do Armature
    if (child.name) {
      boneNames.add(child.name)
    }
  })

  return boneNames
}

/**
 * Valida a compatibilidade de um AnimationClip com os ossos do modelo
 */
export function validateClipBones(
  clip: THREE.AnimationClip,
  modelBoneNames: Set<string>
): BoneValidationResult {
  if (modelBoneNames.size === 0) {
    return {
      isCompatible: true,
      hasModel: false,
      totalTracks: clip.tracks.length,
      matchedTracks: clip.tracks.length,
      missingBones: [],
      matchPercentage: 100
    }
  }

  const clipBones = new Set<string>()
  clip.tracks.forEach((track) => {
    // Trilha no Three.js tem formato "nome_do_osso.propriedade"
    const dotIndex = track.name.indexOf('.')
    const boneName = dotIndex !== -1 ? track.name.substring(0, dotIndex) : track.name
    if (boneName) {
      clipBones.add(boneName)
    }
  })

  const missingBones: string[] = []
  let matchedCount = 0

  clipBones.forEach((boneName) => {
    if (modelBoneNames.has(boneName)) {
      matchedCount++
    } else {
      missingBones.push(boneName)
    }
  })

  const total = clipBones.size
  const matchPercentage = total > 0 ? Math.round((matchedCount / total) * 100) : 100
  const isCompatible = missingBones.length === 0

  return {
    isCompatible,
    hasModel: true,
    totalTracks: total,
    matchedTracks: matchedCount,
    missingBones,
    matchPercentage
  }
}
