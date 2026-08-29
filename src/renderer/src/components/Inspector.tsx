import React, { useMemo } from 'react'
import {
  Move,
  RotateCw,
  EyeOff,
  Sliders,
  RotateCcw,
  Info,
  Box,
  Bone
} from 'lucide-react'
import { useAnimationStore } from '../store/useAnimationStore'
import { getModelBoneNames } from '../utils/skeletonValidator'

export const Inspector: React.FC = () => {
  const {
    baseModel,
    baseModelName,
    modelTransform,
    setModelPosition,
    setModelRotation,
    gizmoMode,
    setGizmoMode,
    isInspectorOpen,
    resetModelTransform,
    animations,
    selectedAnimationId
  } = useAnimationStore()

  if (!isInspectorOpen) return null

  const activeAnimation = animations.find((a) => a.id === selectedAnimationId)

  // Estatísticas da Malha/Skeleton
  const modelStats = useMemo(() => {
    if (!baseModel) return null

    let meshCount = 0
    let vertexCount = 0
    const bones = getModelBoneNames(baseModel)

    baseModel.traverse((child: any) => {
      if (child.isMesh || child.isSkinnedMesh) {
        meshCount++
        if (child.geometry?.attributes?.position) {
          vertexCount += child.geometry.attributes.position.count
        }
      }
    })

    return {
      meshCount,
      vertexCount,
      boneCount: bones.size
    }
  }, [baseModel])

  const handlePositionChange = (axisIndex: 0 | 1 | 2, value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return
    const newPos = [...modelTransform.position] as [number, number, number]
    newPos[axisIndex] = num
    setModelPosition(newPos[0], newPos[1], newPos[2])
  }

  const handleRotationChange = (axisIndex: 0 | 1 | 2, value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return
    const newRot = [...modelTransform.rotation] as [number, number, number]
    newRot[axisIndex] = num
    setModelRotation(newRot[0], newRot[1], newRot[2])
  }

  const handleRotateQuick = (axisIndex: 0 | 1 | 2, degrees: number) => {
    const newRot = [...modelTransform.rotation] as [number, number, number]
    newRot[axisIndex] = Math.round((newRot[axisIndex] + degrees) % 360)
    setModelRotation(newRot[0], newRot[1], newRot[2])
  }

  return (
    <aside className="w-80 min-w-[280px] max-w-[340px] bg-dark-900 border-l border-dark-750 flex flex-col h-full z-10 flex-shrink-0 overflow-y-auto">
      {/* Header do Inspector */}
      <div className="p-3.5 border-b border-dark-750 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-100">
          <Sliders size={17} className="text-brand-400" />
          <h3 className="font-semibold text-sm">Propriedades & Transform</h3>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Seletor de Modo Gizmo */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Modo do Gizmo 3D
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border text-xs font-medium transition ${
                gizmoMode === 'translate'
                  ? 'bg-brand-500/20 text-brand-300 border-brand-500/50 shadow-sm'
                  : 'bg-dark-800 text-slate-400 border-dark-700 hover:text-slate-200 hover:bg-dark-750'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              onClick={() => setGizmoMode('translate')}
              disabled={!baseModel}
              title="Modo Transladar (Mover posição)"
            >
              <Move size={15} />
              <span className="text-[10px]">Mover</span>
            </button>

            <button
              className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border text-xs font-medium transition ${
                gizmoMode === 'rotate'
                  ? 'bg-brand-500/20 text-brand-300 border-brand-500/50 shadow-sm'
                  : 'bg-dark-800 text-slate-400 border-dark-700 hover:text-slate-200 hover:bg-dark-750'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              onClick={() => setGizmoMode('rotate')}
              disabled={!baseModel}
              title="Modo Rotacionar"
            >
              <RotateCw size={15} />
              <span className="text-[10px]">Girar</span>
            </button>

            <button
              className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border text-xs font-medium transition ${
                gizmoMode === null
                  ? 'bg-brand-500/20 text-brand-300 border-brand-500/50 shadow-sm'
                  : 'bg-dark-800 text-slate-400 border-dark-700 hover:text-slate-200 hover:bg-dark-750'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              onClick={() => setGizmoMode(null)}
              disabled={!baseModel}
              title="Ocultar Gizmo"
            >
              <EyeOff size={15} />
              <span className="text-[10px]">Ocultar</span>
            </button>
          </div>
        </div>

        {/* Posição da Malha */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Posição da Malha
            </label>
            <button
              className="text-[11px] text-brand-400 hover:text-brand-300 font-medium disabled:opacity-40"
              onClick={() => setModelPosition(0, 0, 0)}
              disabled={!baseModel}
            >
              Centralizar
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center bg-dark-950 border border-dark-750 rounded-lg overflow-hidden focus-within:border-red-500">
              <span className="bg-red-500/15 text-red-400 font-bold text-[10px] px-2 py-1 border-r border-dark-750">
                X
              </span>
              <input
                type="number"
                step="0.05"
                value={modelTransform.position[0]}
                onChange={(e) => handlePositionChange(0, e.target.value)}
                disabled={!baseModel}
                className="w-full bg-transparent px-2 py-1 text-xs text-slate-100 outline-none"
              />
            </div>

            <div className="flex items-center bg-dark-950 border border-dark-750 rounded-lg overflow-hidden focus-within:border-emerald-500">
              <span className="bg-emerald-500/15 text-emerald-400 font-bold text-[10px] px-2 py-1 border-r border-dark-750">
                Y
              </span>
              <input
                type="number"
                step="0.05"
                value={modelTransform.position[1]}
                onChange={(e) => handlePositionChange(1, e.target.value)}
                disabled={!baseModel}
                className="w-full bg-transparent px-2 py-1 text-xs text-slate-100 outline-none"
              />
            </div>

            <div className="flex items-center bg-dark-950 border border-dark-750 rounded-lg overflow-hidden focus-within:border-blue-500">
              <span className="bg-blue-500/15 text-blue-400 font-bold text-[10px] px-2 py-1 border-r border-dark-750">
                Z
              </span>
              <input
                type="number"
                step="0.05"
                value={modelTransform.position[2]}
                onChange={(e) => handlePositionChange(2, e.target.value)}
                disabled={!baseModel}
                className="w-full bg-transparent px-2 py-1 text-xs text-slate-100 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Rotação da Malha */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Rotação da Malha (°)
            </label>
            <button
              className="text-[11px] text-brand-400 hover:text-brand-300 font-medium disabled:opacity-40"
              onClick={() => setModelRotation(0, 0, 0)}
              disabled={!baseModel}
            >
              Resetar
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center bg-dark-950 border border-dark-750 rounded-lg overflow-hidden focus-within:border-red-500">
              <span className="bg-red-500/15 text-red-400 font-bold text-[10px] px-2 py-1 border-r border-dark-750">
                X
              </span>
              <input
                type="number"
                step="5"
                value={modelTransform.rotation[0]}
                onChange={(e) => handleRotationChange(0, e.target.value)}
                disabled={!baseModel}
                className="w-full bg-transparent px-2 py-1 text-xs text-slate-100 outline-none"
              />
            </div>

            <div className="flex items-center bg-dark-950 border border-dark-750 rounded-lg overflow-hidden focus-within:border-emerald-500">
              <span className="bg-emerald-500/15 text-emerald-400 font-bold text-[10px] px-2 py-1 border-r border-dark-750">
                Y
              </span>
              <input
                type="number"
                step="5"
                value={modelTransform.rotation[1]}
                onChange={(e) => handleRotationChange(1, e.target.value)}
                disabled={!baseModel}
                className="w-full bg-transparent px-2 py-1 text-xs text-slate-100 outline-none"
              />
            </div>

            <div className="flex items-center bg-dark-950 border border-dark-750 rounded-lg overflow-hidden focus-within:border-blue-500">
              <span className="bg-blue-500/15 text-blue-400 font-bold text-[10px] px-2 py-1 border-r border-dark-750">
                Z
              </span>
              <input
                type="number"
                step="5"
                value={modelTransform.rotation[2]}
                onChange={(e) => handleRotationChange(2, e.target.value)}
                disabled={!baseModel}
                className="w-full bg-transparent px-2 py-1 text-xs text-slate-100 outline-none"
              />
            </div>
          </div>

          {/* Atalhos Rápidos de Rotação */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              className="py-1 px-2 bg-dark-800 hover:bg-dark-750 border border-dark-700 text-slate-300 rounded text-[11px] font-medium transition disabled:opacity-40"
              onClick={() => handleRotateQuick(1, 90)}
              disabled={!baseModel}
            >
              +90° Y
            </button>
            <button
              className="py-1 px-2 bg-dark-800 hover:bg-dark-750 border border-dark-700 text-slate-300 rounded text-[11px] font-medium transition disabled:opacity-40"
              onClick={() => handleRotateQuick(1, -90)}
              disabled={!baseModel}
            >
              -90° Y
            </button>
            <button
              className="py-1 px-2 bg-dark-800 hover:bg-dark-750 border border-dark-700 text-slate-300 rounded text-[11px] font-medium transition disabled:opacity-40"
              onClick={() => handleRotateQuick(0, 90)}
              disabled={!baseModel}
            >
              +90° X
            </button>
          </div>
        </div>

        {/* Reset Geral */}
        <button
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-dark-800 hover:bg-dark-750 border border-dark-700 text-slate-300 rounded-lg text-xs font-medium transition disabled:opacity-40"
          onClick={resetModelTransform}
          disabled={!baseModel}
        >
          <RotateCcw size={13} />
          <span>Restaurar Transform Padrão</span>
        </button>

        {/* Card Informativo */}
        <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl flex gap-2.5 text-xs text-slate-300">
          <Info size={16} className="text-brand-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-slate-300/90">
            Ajustes de orientação e posição alinham a malha base para o arquivo exportado sem afetar os dados das animações.
          </p>
        </div>

        {/* Estatísticas do Modelo e Animação */}
        <div className="border-t border-dark-750 pt-4 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Modelo:</span>
            <span className="font-medium text-slate-200 truncate max-w-[150px]">
              {baseModelName || 'Nenhum'}
            </span>
          </div>

          {modelStats && (
            <>
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1"><Box size={12} /> Vértices:</span>
                <span className="font-mono text-slate-300">{modelStats.vertexCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1"><Bone size={12} /> Ossos no Rig:</span>
                <span className="font-mono text-slate-300">{modelStats.boneCount}</span>
              </div>
            </>
          )}

          {activeAnimation && (
            <div className="flex items-center justify-between text-slate-400 border-t border-dark-800 pt-2">
              <span>Animação Ativa:</span>
              <span className="font-medium text-brand-300 truncate max-w-[150px]">
                {activeAnimation.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Inspector
