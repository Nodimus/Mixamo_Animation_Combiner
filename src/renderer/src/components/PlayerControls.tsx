import React, { useRef } from 'react'
import { Play, Pause, Repeat, FastForward, Upload, Box, CheckCircle2 } from 'lucide-react'
import { useAnimationStore } from '../store/useAnimationStore'
import { loadModelFromBuffer } from '../utils/modelLoader'
import { ErrorDetails } from './ErrorModal'
import { LoadingState } from './LoadingModal'

interface PlayerControlsProps {
  onShowError: (error: ErrorDetails) => void
  onSetLoading: (loading: LoadingState | null) => void
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  onShowError,
  onSetLoading
}) => {
  const {
    animations,
    selectedAnimationId,
    isPlaying,
    togglePlay,
    isLooping,
    toggleLoop,
    playbackSpeed,
    setPlaybackSpeed,
    baseModel,
    baseModelName,
    setBaseModel
  } = useAnimationStore()

  const modelInputRef = useRef<HTMLInputElement>(null)
  const activeAnimation = animations.find((a) => a.id === selectedAnimationId)

  const processModelFile = async (buffer: ArrayBuffer, fileName: string) => {
    onSetLoading({
      isOpen: true,
      title: 'Carregando Modelo 3D',
      statusText: `Lendo geometrias e texturas de ${fileName}...`
    })

    try {
      const { model } = await loadModelFromBuffer(buffer, fileName)
      setBaseModel(model, fileName)
    } catch (err: any) {
      console.error('Erro ao processar modelo:', err)
      onShowError({
        title: 'Erro ao Carregar Modelo 3D',
        fileName,
        message: err?.message || 'Falha ao analisar a estrutura 3D e texturas do arquivo.',
        technicalDetails: err?.stack || String(err),
        suggestions: [
          'Verifique se o modelo contém uma malha (Mesh/SkinnedMesh) válida.',
          'Formatos recomendados: .glb com texturas embutidas ou .fbx com skin e esqueleto associado.',
          'Se for FBX, certifique-se de que foi exportado no formato binário.'
        ]
      })
    } finally {
      onSetLoading(null)
    }
  }

  const handleOpenModelDialog = async () => {
    try {
      if (window.api?.openBaseModel) {
        const fileData = await window.api.openBaseModel()
        if (fileData) {
          await processModelFile(fileData.buffer, fileData.fileName)
          return
        }
      }
    } catch (err) {
      console.warn('Fallback para input padrão:', err)
    }

    modelInputRef.current?.click()
  }

  const handleModelInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const buffer = await file.arrayBuffer()
    await processModelFile(buffer, file.name)
    if (modelInputRef.current) modelInputRef.current.value = ''
  }

  return (
    <div className="absolute bottom-4 inset-x-4 flex flex-col gap-2.5 pointer-events-none z-20">
      {/* Botão de Modelo Base (Flutuante no topo dos controles) */}
      <div className="flex justify-start pointer-events-auto">
        <button
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-md border shadow-lg transition-all ${
            baseModel
              ? 'bg-dark-850/90 border-brand-500/50 text-brand-300 hover:bg-dark-800'
              : 'bg-dark-850/90 border-dark-700 text-slate-300 hover:text-white hover:border-slate-500'
          }`}
          onClick={handleOpenModelDialog}
          title="Carregar malha de personagem (.glb / .fbx)"
        >
          <Box size={15} className={baseModel ? 'text-brand-400' : 'text-slate-400'} />
          <span className="max-w-[220px] truncate">
            {baseModelName ? baseModelName : 'Carregar Modelo Base (GLB / FBX)'}
          </span>
          {baseModel ? (
            <CheckCircle2 size={13} className="text-emerald-400 ml-1" />
          ) : (
            <Upload size={13} className="text-slate-400 ml-1" />
          )}
        </button>

        <input
          ref={modelInputRef}
          type="file"
          accept=".glb,.gltf,.fbx"
          className="hidden"
          onChange={handleModelInputChange}
        />
      </div>

      {/* Barra de Controles de Reprodução */}
      <div className="pointer-events-auto flex items-center justify-between bg-dark-900/90 backdrop-blur-md border border-dark-750 p-2.5 px-4 rounded-xl shadow-2xl">
        <div className="flex items-center gap-3">
          {/* Botão Play / Pause */}
          <button
            className={`p-2 rounded-lg text-white font-semibold transition shadow-sm ${
              isPlaying
                ? 'bg-brand-500 hover:bg-brand-600 active:bg-brand-700'
                : 'bg-dark-750 hover:bg-dark-700 text-slate-300'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            onClick={togglePlay}
            disabled={!activeAnimation || !baseModel}
            title={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} />}
          </button>

          {/* Botão Loop */}
          <button
            className={`p-2 rounded-lg border text-xs font-medium transition ${
              isLooping
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/50'
                : 'bg-dark-800 text-slate-400 border-dark-700 hover:text-slate-200'
            }`}
            onClick={toggleLoop}
            title={isLooping ? 'Loop Ativado' : 'Loop Desativado'}
          >
            <Repeat size={15} />
          </button>

          {/* Nome da Animação em Reprodução */}
          <div className="pl-3 border-l border-dark-750 max-w-xs">
            {activeAnimation ? (
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-100 truncate" title={activeAnimation.name}>
                  {activeAnimation.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  {activeAnimation.duration}s • {activeAnimation.tracksCount} trilhas
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-500 font-medium">Nenhuma animação selecionada</span>
            )}
          </div>
        </div>

        {/* Controle de Velocidade */}
        <div className="flex items-center gap-2 bg-dark-950/80 border border-dark-750 py-1.5 px-3 rounded-lg">
          <FastForward size={13} className="text-brand-400" />
          <span className="text-xs font-mono font-semibold text-slate-300 min-w-[28px]">
            {playbackSpeed.toFixed(1)}x
          </span>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="w-20 cursor-pointer"
            title="Velocidade de Reprodução"
          />
        </div>
      </div>
    </div>
  )
}

export default PlayerControls
