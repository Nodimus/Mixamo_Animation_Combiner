import React, { useEffect, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { TransformControls } from '@react-three/drei'
import * as THREE from 'three'
import { useAnimationStore } from '../store/useAnimationStore'

export const AnimatedCharacter: React.FC = () => {
  const {
    baseModel,
    animations,
    selectedAnimationId,
    isPlaying,
    isLooping,
    playbackSpeed,
    gizmoMode,
    modelTransform,
    setModelTransform
  } = useAnimationStore()

  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const currentActionRef = useRef<THREE.AnimationAction | null>(null)
  const isDraggingGizmoRef = useRef<boolean>(false)

  // Encontra a animação selecionada
  const activeAnimation = useMemo(() => {
    return animations.find((a) => a.id === selectedAnimationId) || null
  }, [animations, selectedAnimationId])

  // Inicializa o AnimationMixer quando o modelo muda
  useEffect(() => {
    if (!baseModel) {
      mixerRef.current = null
      currentActionRef.current = null
      return
    }

    const mixer = new THREE.AnimationMixer(baseModel)
    mixerRef.current = mixer

    // Habilitar sombras e renderização de texturas e materiais
    baseModel.traverse((child: any) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.frustumCulled = false

        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material]
          mats.forEach((m: THREE.Material) => {
            m.side = THREE.DoubleSide
            m.needsUpdate = true
          })
        }
      }
    })

    return () => {
      mixer.stopAllAction()
      mixerRef.current = null
      currentActionRef.current = null
    }
  }, [baseModel])

  // Troca de animação (só 1 toca por vez)
  useEffect(() => {
    const mixer = mixerRef.current
    if (!mixer || !baseModel) return

    if (currentActionRef.current) {
      currentActionRef.current.stop()
      currentActionRef.current = null
    }

    if (activeAnimation && activeAnimation.clip) {
      try {
        const action = mixer.clipAction(activeAnimation.clip, baseModel)
        action.reset()
        action.setLoop(isLooping ? THREE.LoopRepeat : THREE.LoopOnce, Infinity)
        action.clampWhenFinished = true
        action.timeScale = playbackSpeed

        if (isPlaying) {
          action.play()
        } else {
          action.play()
          action.paused = true
        }

        currentActionRef.current = action
      } catch (err) {
        console.warn('Não foi possível tocar a animação no modelo:', err)
      }
    }
  }, [activeAnimation, baseModel])

  // Atualiza play/pause
  useEffect(() => {
    const action = currentActionRef.current
    if (action) {
      action.paused = !isPlaying
      if (isPlaying && !action.isRunning()) {
        action.play()
      }
    }
  }, [isPlaying])

  // Atualiza loop
  useEffect(() => {
    const action = currentActionRef.current
    if (action) {
      action.setLoop(isLooping ? THREE.LoopRepeat : THREE.LoopOnce, Infinity)
    }
  }, [isLooping])

  // Atualiza velocidade
  useEffect(() => {
    const action = currentActionRef.current
    if (action) {
      action.timeScale = playbackSpeed
    }
  }, [playbackSpeed])

  // useFrame para atualizar o AnimationMixer
  useFrame((_, delta) => {
    if (mixerRef.current && isPlaying) {
      mixerRef.current.update(delta)
    }
  })

  // Sincroniza transform do store quando os inputs numéricos mudam
  useEffect(() => {
    if (baseModel && !isDraggingGizmoRef.current) {
      baseModel.position.set(...modelTransform.position)
      baseModel.rotation.set(
        THREE.MathUtils.degToRad(modelTransform.rotation[0]),
        THREE.MathUtils.degToRad(modelTransform.rotation[1]),
        THREE.MathUtils.degToRad(modelTransform.rotation[2])
      )
    }
  }, [modelTransform, baseModel])

  if (!baseModel) {
    return null
  }

  return (
    <>
      <primitive object={baseModel} />
      {gizmoMode && (
        <TransformControls
          object={baseModel}
          mode={gizmoMode}
          size={0.75}
          onMouseDown={() => {
            isDraggingGizmoRef.current = true
          }}
          onMouseUp={() => {
            isDraggingGizmoRef.current = false
          }}
          onChange={() => {
            if (baseModel && isDraggingGizmoRef.current) {
              const px = parseFloat(baseModel.position.x.toFixed(3))
              const py = parseFloat(baseModel.position.y.toFixed(3))
              const pz = parseFloat(baseModel.position.z.toFixed(3))

              const rx = parseFloat(THREE.MathUtils.radToDeg(baseModel.rotation.x).toFixed(1))
              const ry = parseFloat(THREE.MathUtils.radToDeg(baseModel.rotation.y).toFixed(1))
              const rz = parseFloat(THREE.MathUtils.radToDeg(baseModel.rotation.z).toFixed(1))

              setModelTransform({
                position: [px, py, pz],
                rotation: [rx, ry, rz]
              })
            }
          }}
        />
      )}
    </>
  )
}

export default AnimatedCharacter
