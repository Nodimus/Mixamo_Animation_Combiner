import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Trash2,
  Film,
  Edit2,
  Check,
  GripVertical,
  AlertTriangle,
  CheckCircle2,
  LocateFixed
} from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimationItem, useAnimationStore } from '../store/useAnimationStore'
import { getModelBoneNames, validateClipBones } from '../utils/skeletonValidator'

interface AnimationItemRowProps {
  item: AnimationItem
  isSelected: boolean
  index: number
}

export const AnimationItemRow: React.FC<AnimationItemRowProps> = ({
  item,
  isSelected,
  index
}) => {
  const {
    renameAnimation,
    removeAnimation,
    toggleInPlace,
    setSelectedAnimationId,
    baseModel
  } = useAnimationStore()

  const [isEditing, setIsEditing] = useState(false)
  const [showBoneDetails, setShowBoneDetails] = useState(false)
  const [editValue, setEditValue] = useState(item.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id })

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined
  }

  // Validação de ossos do skeleton
  const validation = useMemo(() => {
    if (!baseModel) return null
    const modelBones = getModelBoneNames(baseModel)
    return validateClipBones(item.clip, modelBones)
  }, [baseModel, item.clip])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const handleSave = () => {
    if (editValue.trim()) {
      renameAnimation(item.id, editValue.trim())
    } else {
      setEditValue(item.name)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(item.name)
      setIsEditing(false)
    }
  }

  return (
    <div ref={setNodeRef} style={sortableStyle} className="group flex flex-col mb-1.5">
      <div
        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
          isDragging
            ? 'bg-dark-700/80 border-brand-500 shadow-xl opacity-75'
            : isSelected
            ? 'bg-dark-750 border-brand-500 shadow-md ring-1 ring-brand-500/20'
            : 'bg-dark-800/90 border-dark-700/70 hover:bg-dark-750/70 hover:border-dark-600'
        } ${validation && !validation.isCompatible ? 'border-l-4 border-l-amber-500' : ''}`}
        onClick={() => setSelectedAnimationId(item.id)}
        onDoubleClick={() => setIsEditing(true)}
      >
        {/* Handle de Arrastar com dnd-kit */}
        <div
          className="text-slate-500 hover:text-slate-300 p-0.5 cursor-grab active:cursor-grabbing transition"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          title="Arrastar para reordenar"
        >
          <GripVertical size={14} />
        </div>

        {/* Badge Numérico */}
        <span className="text-[10px] font-mono font-semibold text-slate-500 w-4 text-center">
          {index + 1}
        </span>

        {/* Ícone */}
        <div className={`flex-shrink-0 ${isSelected ? 'text-brand-400' : 'text-slate-400'}`}>
          <Film size={14} />
        </div>

        {/* Informações da Animação */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRef}
                type="text"
                className="w-full bg-dark-900 border border-brand-500 rounded px-2 py-0.5 text-xs text-white outline-none"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
              />
              <button
                className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition"
                onClick={handleSave}
                title="Salvar"
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <div>
              <div className="font-medium text-slate-200 truncate pr-1" title={item.name}>
                {item.name}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[11px] text-slate-500">
                  {item.duration}s • {item.tracksCount} tracks
                </span>

                {/* Opção In-Place */}
                <button
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border transition ${
                    item.inPlace
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                      : 'bg-dark-900/80 text-slate-400 border-dark-700 hover:text-slate-200 hover:border-slate-600'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleInPlace(item.id)
                  }}
                  title={
                    item.inPlace
                      ? 'In-Place ativado: travamento de root motion horizontal'
                      : 'Clique para ativar In-Place (travar deslocamento horizontal do quadril)'
                  }
                >
                  <LocateFixed size={10} />
                  <span>In-Place</span>
                </button>

                {/* Badge de Skeleton */}
                {validation && validation.hasModel && (
                  <>
                    {validation.isCompatible ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle2 size={10} />
                        <span>Rig OK</span>
                      </span>
                    ) : (
                      <button
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 px-1.5 py-0.5 rounded border border-amber-500/30 transition"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowBoneDetails(!showBoneDetails)
                        }}
                        title={`${validation.missingBones.length} ossos não encontrados no modelo. Clique para detalhes.`}
                      >
                        <AlertTriangle size={10} />
                        <span>{validation.missingBones.length} divergentes</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          {!isEditing && (
            <button
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-dark-700 transition"
              onClick={() => setIsEditing(true)}
              title="Renomear"
            >
              <Edit2 size={12} />
            </button>
          )}
          <button
            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
            onClick={() => removeAnimation(item.id)}
            title="Remover animação"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Detalhes dos Ossos Não Encontrados */}
      {showBoneDetails && validation && !validation.isCompatible && (
        <div
          className="mt-1 ml-5 p-2 bg-dark-900 border border-amber-500/30 rounded-lg text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px] mb-1.5">
            <AlertTriangle size={12} />
            <span>Ossos ausentes na malha ({validation.missingBones.length}):</span>
          </div>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {validation.missingBones.map((bone) => (
              <span
                key={bone}
                className="text-[10px] font-mono bg-dark-800 text-slate-300 px-1.5 py-0.5 rounded border border-dark-700"
              >
                {bone}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AnimationItemRow
