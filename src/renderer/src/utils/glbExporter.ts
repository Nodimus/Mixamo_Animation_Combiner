import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { AnimationItem } from '../store/useAnimationStore'
import { applyInPlaceToClip } from './inPlaceProcessor'

const exporter = new GLTFExporter()

/**
 * Combina o modelo base com todos os AnimationClips da lista e exporta como GLB binário com texturas embutidas.
 */
export async function exportCombinedGlb(
  baseModel: THREE.Group,
  animations: AnimationItem[]
): Promise<ArrayBuffer> {
  // Prepara os AnimationClips na ordem definida, aplicando In-Place quando selecionado
  const processedClips: THREE.AnimationClip[] = animations.map((item) => {
    let clip = item.clip.clone()
    clip.name = item.name

    if (item.inPlace) {
      clip = applyInPlaceToClip(clip)
      clip.name = item.name
    }

    return clip
  })

  // Garante que materiais e texturas estão visíveis e configurados
  baseModel.traverse((child: any) => {
    if (child.isMesh || child.isSkinnedMesh) {
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach((m: THREE.Material) => {
          m.needsUpdate = true
        })
      }
    }
  })

  return new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      baseModel,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result)
        } else {
          const jsonStr = JSON.stringify(result)
          const encoder = new TextEncoder()
          resolve(encoder.encode(jsonStr).buffer as ArrayBuffer)
        }
      },
      (error) => {
        console.error('Erro durante exportação com GLTFExporter:', error)
        reject(error)
      },
      {
        binary: true,
        animations: processedClips,
        embedImages: true,
        onlyVisible: false,
        includeCustomExtensions: true
      }
    )
  })
}
