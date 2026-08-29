import React, { useState, useRef, useMemo } from 'react'
import {
  Plus,
  FolderOpen,
  Layers,
  Trash,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { useAnimationStore, AnimationItem } from '../store/useAnimationStore'
import { extractAnimationsFromFile } from '../utils/animationExtractor'
import { getModelBoneNames, validateClipBones } from '../utils/skeletonValidator'
import AnimationItemRow from './AnimationItemRow'
import { ErrorDetails } from './ErrorModal'
import { LoadingState } from './LoadingModal'

interface SidebarProps {
  onShowError: (error: ErrorDetails) => void
  onSetLoading: (loading: LoadingState | null) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ onShowError, onSetLoading }) => {
  const {
    animations,
    selectedAnimationId,
    addAnimations,
    clearAnimations,
    reorderAnimations,
    baseModel
  } = useAnimationStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [showWarningSummary, setShowWarningSummary] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // Validação de skeleton de todas as animações
  const compatibilityReport = useMemo(() => {
    if (!baseModel || animations.length === 0) return null

    const modelBones = getModelBoneNames(baseModel)
    const incompatibleList: Array<{ item: AnimationItem; missingBones: string[] }> = []

    animations.forEach((item) => {
      const res = validateClipBones(item.clip, modelBones)
      if (!res.isCompatible) {
        incompatibleList.push({ item, missingBones: res.missingBones })
      }
    })

    return {
      total: animations.length,
      incompatibleCount: incompatibleList.length,
      incompatibleList,
      isAllCompatible: incompatibleList.length === 0
    }
  }, [baseModel, animations])

  // Filtro de busca na lista
  const filteredAnimations = useMemo(() => {
    if (!searchQuery.trim()) return animations
    const query = searchQuery.toLowerCase()
    return animations.filter(
      (a) => a.name.toLowerCase().includes(query) || a.fileName.toLowerCase().includes(query)
    )
  }, [animations, searchQuery])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = animations.findIndex((item) => item.id === active.id)
      const newIndex = animations.findIndex((item) => item.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderAnimations(oldIndex, newIndex)
      }
    }
  }

  const processFiles = async (files: Array<{ name: string; buffer: ArrayBuffer }>) => {
    if (files.length === 0) return

    onSetLoading({
      isOpen: true,
      title: 'Importando Animações',
      statusText: `Lendo ${files.length} arquivo(s)...`,
      progress: 10
    })

    const newItems: AnimationItem[] = []
    const failedFiles: Array<{ name: string; error: any }> = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const percent = Math.round(((i + 1) / files.length) * 100)

        onSetLoading({
          isOpen: true,
          title: 'Extraindo AnimationClips',
          statusText: `Processando ${file.name} (${i + 1}/${files.length})...`,
          progress: percent
        })

        try {
          const items = await extractAnimationsFromFile(file.buffer, file.name)
          if (items.length === 0) {
            failedFiles.push({
              name: file.name,
              error: new Error('Nenhum AnimationClip ou trilha de movimento esquelético encontrada.')
            })
          } else {
            newItems.push(...items)
          }
        } catch (err: any) {
          failedFiles.push({ name: file.name, error: err })
        }
      }

      if (newItems.length > 0) {
        addAnimations(newItems)
      }

      // Se houver arquivos com falha, exibe modal amigável com sugestões
      if (failedFiles.length > 0) {
        const firstFail = failedFiles[0]
        onShowError({
          title: `Falha ao carregar ${failedFiles.length} arquivo(s)`,
          fileName: failedFiles.map((f) => f.name).join(', '),
          message:
            firstFail.error?.message ||
            'Não foi possível extrair dados de animação válidos do arquivo selecionado.',
          technicalDetails: failedFiles
            .map((f) => `${f.name}: ${f.error?.stack || f.error?.message || f.error}`)
            .join('\n\n'),
          suggestions: [
            'Certifique-se de que o arquivo FBX/GLB foi exportado com animação ativada (Animation/Bake).',
            'No caso de FBX do Mixamo/GameLande, use a opção "FBX Binary (.fbx)" e "Without Skin" para arquivos de animação.',
            'Verifique se o arquivo não está corrompido ou truncado.',
            'Arquivos FBX em formato ASCII antigo podem necessitar de conversão para binário.'
          ]
        })
      }
    } finally {
      onSetLoading(null)
    }
  }

  const handleAddWithNativeDialog = async () => {
    try {
      if (window.api?.openAnimationFiles) {
        const filesData = await window.api.openAnimationFiles()
        if (filesData && filesData.length > 0) {
          const files = filesData.map((f) => ({
            name: f.fileName,
            buffer: f.buffer
          }))
          await processFiles(files)
          return
        }
      }
    } catch (err) {
      console.warn('Fallback para input padrão:', err)
    }

    fileInputRef.current?.click()
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return

    const files: Array<{ name: string; buffer: ArrayBuffer }> = []
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const buffer = await file.arrayBuffer()
      files.push({ name: file.name, buffer })
    }

    await processFiles(files)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => {
      const ext = f.name.toLowerCase()
      return ext.endsWith('.fbx') || ext.endsWith('.glb') || ext.endsWith('.gltf')
    })

    if (droppedFiles.length === 0) return

    const files: Array<{ name: string; buffer: ArrayBuffer }> = []
    for (const file of droppedFiles) {
      const buffer = await file.arrayBuffer()
      files.push({ name: file.name, buffer })
    }

    await processFiles(files)
  }

  return (
    <aside
      className="w-80 min-w-[280px] max-w-[340px] bg-dark-900 border-r border-dark-750 flex flex-col h-full z-10 flex-shrink-0"
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {/* Header do Painel */}
      <div className="p-3.5 border-b border-dark-750 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-100">
          <Layers size={17} className="text-brand-400" />
          <h2 className="font-semibold text-sm">Animações</h2>
          <span className="text-[11px] font-semibold bg-dark-750 text-brand-400 px-2 py-0.5 rounded-full border border-dark-700">
            {animations.length}
          </span>
        </div>

        {animations.length > 0 && (
          <button
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
            onClick={clearAnimations}
            title="Limpar lista completa"
          >
            <Trash size={14} />
          </button>
        )}
      </div>

      {/* Ações e Botão de Adicionar */}
      <div className="p-3 space-y-2 border-b border-dark-800">
        <button
          className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white py-2 px-3 rounded-lg text-xs font-semibold shadow-md shadow-brand-500/10 transition"
          onClick={handleAddWithNativeDialog}
        >
          <Plus size={15} />
          <span>Adicionar Animações (.fbx / .glb)</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".fbx,.glb,.gltf"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Input de Busca quando há mais de 3 animações */}
        {animations.length > 3 && (
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Filtrar animações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-950 border border-dark-750 focus:border-brand-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none transition"
            />
          </div>
        )}
      </div>

      {/* Alerta de Incompatibilidade de Skeleton */}
      {compatibilityReport && !compatibilityReport.isAllCompatible && (
        <div className="mx-3 mt-2.5 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowWarningSummary(!showWarningSummary)}
          >
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
              <AlertTriangle size={14} className="flex-shrink-0" />
              <span>
                {compatibilityReport.incompatibleCount} com ossos divergentes
              </span>
            </div>
            <button className="text-amber-400 hover:text-amber-300">
              {showWarningSummary ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          <p className="text-[11px] text-amber-300/80 mt-1 leading-snug">
            Alguns ossos não batem com a malha. A exportação continua liberada.
          </p>

          {showWarningSummary && (
            <div className="mt-2 pt-2 border-t border-amber-500/20 space-y-1.5 max-h-32 overflow-y-auto">
              {compatibilityReport.incompatibleList.map(({ item, missingBones }) => (
                <div key={item.id} className="text-[10px] text-slate-300">
                  <span className="font-semibold text-amber-300">{item.name}: </span>
                  <span className="font-mono text-slate-400">
                    {missingBones.slice(0, 2).join(', ')}
                    {missingBones.length > 2 ? ` (+${missingBones.length - 2})` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lista de Animações com Scroll */}
      <div className="flex-1 overflow-y-auto p-3">
        {animations.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-48 text-slate-500 p-4 border border-dashed border-dark-750 rounded-xl">
            <FolderOpen size={32} className="mb-2 text-slate-600" />
            <p className="font-medium text-xs text-slate-400">Nenhuma animação adicionada</p>
            <span className="text-[11px] text-slate-500 mt-1">
              Arraste arquivos .fbx ou .glb aqui ou clique no botão acima
            </span>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredAnimations.map((a) => a.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {filteredAnimations.map((item, index) => (
                  <AnimationItemRow
                    key={item.id}
                    item={item}
                    index={index}
                    isSelected={item.id === selectedAnimationId}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
