import { create } from 'zustand'
import * as THREE from 'three'

export interface AnimationItem {
  id: string
  name: string
  fileName: string
  clip: THREE.AnimationClip
  duration: number
  tracksCount: number
  inPlace?: boolean
}

export type GizmoMode = 'translate' | 'rotate' | null

export interface TransformState {
  position: [number, number, number]
  rotation: [number, number, number] // em graus para a UI
  scale: [number, number, number]
}

interface AnimationStoreState {
  // Animações
  animations: AnimationItem[]
  selectedAnimationId: string | null

  // Modelo 3D Base
  baseModel: THREE.Group | null
  baseModelName: string | null

  // Transformações do Modelo Base
  modelTransform: TransformState
  gizmoMode: GizmoMode
  isInspectorOpen: boolean

  // Controles de Reprodução
  isPlaying: boolean
  isLooping: boolean
  playbackSpeed: number

  // Ações de Animação
  addAnimation: (animation: AnimationItem) => void
  addAnimations: (animations: AnimationItem[]) => void
  removeAnimation: (id: string) => void
  renameAnimation: (id: string, newName: string) => void
  toggleInPlace: (id: string) => void
  reorderAnimations: (oldIndex: number, newIndex: number) => void
  setAnimations: (animations: AnimationItem[]) => void
  setSelectedAnimationId: (id: string | null) => void
  clearAnimations: () => void

  // Ações do Modelo Base
  setBaseModel: (model: THREE.Group | null, name?: string | null) => void

  // Ações do Inspector / Transform
  setModelTransform: (transform: Partial<TransformState>) => void
  setModelPosition: (x: number, y: number, z: number) => void
  setModelRotation: (x: number, y: number, z: number) => void
  setGizmoMode: (mode: GizmoMode) => void
  toggleInspector: () => void
  setIsInspectorOpen: (isOpen: boolean) => void
  resetModelTransform: () => void

  // Ações de Reprodução
  setIsPlaying: (playing: boolean) => void
  togglePlay: () => void
  setIsLooping: (looping: boolean) => void
  toggleLoop: () => void
  setPlaybackSpeed: (speed: number) => void
}

const initialTransform: TransformState = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1]
}

export const useAnimationStore = create<AnimationStoreState>((set) => ({
  animations: [],
  selectedAnimationId: null,

  baseModel: null,
  baseModelName: null,

  modelTransform: { ...initialTransform },
  gizmoMode: 'translate',
  isInspectorOpen: true,

  isPlaying: true,
  isLooping: true,
  playbackSpeed: 1.0,

  addAnimation: (animation) =>
    set((state) => ({
      animations: [...state.animations, { ...animation, inPlace: animation.inPlace ?? false }],
      selectedAnimationId: state.selectedAnimationId ?? animation.id
    })),

  addAnimations: (newAnimations) =>
    set((state) => {
      const formatted = newAnimations.map((a) => ({ ...a, inPlace: a.inPlace ?? false }))
      const updated = [...state.animations, ...formatted]
      return {
        animations: updated,
        selectedAnimationId: state.selectedAnimationId ?? updated[0]?.id ?? null
      }
    }),

  removeAnimation: (id) =>
    set((state) => {
      const filtered = state.animations.filter((item) => item.id !== id)
      let nextSelectedId = state.selectedAnimationId
      if (state.selectedAnimationId === id) {
        nextSelectedId = filtered.length > 0 ? filtered[0].id : null
      }
      return {
        animations: filtered,
        selectedAnimationId: nextSelectedId
      }
    }),

  renameAnimation: (id, newName) =>
    set((state) => ({
      animations: state.animations.map((item) => {
        if (item.id === id) {
          const trimmed = newName.trim() || item.name
          const updatedClip = item.clip.clone()
          updatedClip.name = trimmed
          return {
            ...item,
            name: trimmed,
            clip: updatedClip
          }
        }
        return item
      })
    })),

  toggleInPlace: (id) =>
    set((state) => ({
      animations: state.animations.map((item) =>
        item.id === id ? { ...item, inPlace: !item.inPlace } : item
      )
    })),

  reorderAnimations: (oldIndex, newIndex) =>
    set((state) => {
      const items = [...state.animations]
      const [removed] = items.splice(oldIndex, 1)
      items.splice(newIndex, 0, removed)
      return { animations: items }
    }),

  setAnimations: (animations) => set({ animations }),

  setSelectedAnimationId: (id) => set({ selectedAnimationId: id, isPlaying: true }),

  clearAnimations: () => set({ animations: [], selectedAnimationId: null }),

  setBaseModel: (model, name = null) => {
    if (model) {
      model.position.set(0, 0, 0)
      model.rotation.set(0, 0, 0)
      model.scale.set(1, 1, 1)
    }
    set({
      baseModel: model,
      baseModelName: name,
      modelTransform: { ...initialTransform }
    })
  },

  setModelTransform: (transform) =>
    set((state) => {
      const newTransform = { ...state.modelTransform, ...transform }
      if (state.baseModel) {
        state.baseModel.position.set(...newTransform.position)
        state.baseModel.rotation.set(
          THREE.MathUtils.degToRad(newTransform.rotation[0]),
          THREE.MathUtils.degToRad(newTransform.rotation[1]),
          THREE.MathUtils.degToRad(newTransform.rotation[2])
        )
      }
      return { modelTransform: newTransform }
    }),

  setModelPosition: (x, y, z) =>
    set((state) => {
      if (state.baseModel) {
        state.baseModel.position.set(x, y, z)
      }
      return {
        modelTransform: {
          ...state.modelTransform,
          position: [x, y, z]
        }
      }
    }),

  setModelRotation: (x, y, z) =>
    set((state) => {
      if (state.baseModel) {
        state.baseModel.rotation.set(
          THREE.MathUtils.degToRad(x),
          THREE.MathUtils.degToRad(y),
          THREE.MathUtils.degToRad(z)
        )
      }
      return {
        modelTransform: {
          ...state.modelTransform,
          rotation: [x, y, z]
        }
      }
    }),

  setGizmoMode: (mode) => set({ gizmoMode: mode }),

  toggleInspector: () => set((state) => ({ isInspectorOpen: !state.isInspectorOpen })),
  setIsInspectorOpen: (isOpen) => set({ isInspectorOpen: isOpen }),

  resetModelTransform: () =>
    set((state) => {
      if (state.baseModel) {
        state.baseModel.position.set(0, 0, 0)
        state.baseModel.rotation.set(0, 0, 0)
        state.baseModel.scale.set(1, 1, 1)
      }
      return { modelTransform: { ...initialTransform } }
    }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setIsLooping: (looping) => set({ isLooping: looping }),
  toggleLoop: () => set((state) => ({ isLooping: !state.isLooping })),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: Math.max(0.5, Math.min(2.0, speed)) })
}))
