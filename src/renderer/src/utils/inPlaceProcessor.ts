import * as THREE from 'three'

/**
 * Aplica trava de translação horizontal (In-Place) mantendo a altura Y e as rotações intactas.
 * Identifica trilhas de posição aplicadas ao osso raiz/quadril (ex: Hips, mixamorig:Hips, root).
 */
export function applyInPlaceToClip(clip: THREE.AnimationClip): THREE.AnimationClip {
  const clonedClip = clip.clone()

  const modifiedTracks: THREE.KeyframeTrack[] = clonedClip.tracks.map((track) => {
    const isPositionTrack = track.name.endsWith('.position')
    const trackLower = track.name.toLowerCase()
    const isRootOrHips =
      trackLower.includes('hips') ||
      trackLower.includes('root') ||
      trackLower.includes('pelvis') ||
      trackLower.includes('bip01')

    if (isPositionTrack && isRootOrHips && track instanceof THREE.VectorKeyframeTrack) {
      const values = track.values.slice()
      const initialX = values[0] || 0
      const initialZ = values[2] || 0

      // Itera por cada quadro (x, y, z)
      for (let i = 0; i < values.length; i += 3) {
        values[i] = initialX     // Trava deslocamento X
        // values[i + 1] mantém o Y (altura / pulo)
        values[i + 2] = initialZ // Trava deslocamento Z
      }

      return new THREE.VectorKeyframeTrack(track.name, track.times, values, track.getInterpolation())
    }

    return track
  })

  clonedClip.tracks = modifiedTracks
  return clonedClip
}
