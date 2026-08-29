import React, { useState } from 'react'
import {
  Sliders,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react'
import Sidebar from './components/Sidebar'
import Viewer3D from './components/Viewer3D'
import Inspector from './components/Inspector'
import ErrorModal, { ErrorDetails } from './components/ErrorModal'
import LoadingModal, { LoadingState } from './components/LoadingModal'
import { useAnimationStore } from './store/useAnimationStore'
import { exportCombinedGlb } from './utils/glbExporter'

export const App: React.FC = () => {
  const {
    isInspectorOpen,
    toggleInspector,
    baseModel,
    baseModelName,
    animations
  } = useAnimationStore()

  const [loadingState, setLoadingState] = useState<LoadingState | null>(null)
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null)
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'warning'
    title: string
    message: string
  } | null>(null)

  const handleExportGLB = async () => {
    if (!baseModel) {
      setErrorDetails({
        title: 'Modelo Base Necessário',
        message: 'Para combinar e exportar animações em formato GLB, é necessário carregar primeiro uma malha 3D base (.glb / .fbx).',
        suggestions: [
          'Clique no botão "Carregar Modelo Base" no canto inferior do visualizador 3D.',
          'Selecione seu modelo de personagem exportado do Mixamo ou GameLande.'
        ]
      })
      return
    }

    if (animations.length === 0) {
      setErrorDetails({
        title: 'Nenhuma Animação na Lista',
        message: 'Adicione pelo menos um arquivo de animação (.fbx ou .glb) na barra lateral esquerda antes de exportar.',
        suggestions: [
          'Clique em "Adicionar Animações" ou arraste seus arquivos para o painel lateral.'
        ]
      })
      return
    }

    setLoadingState({
      isOpen: true,
      title: 'Gerando Arquivo GLB Binário',
      statusText: `Combinando malha, texturas e ${animations.length} animações...`,
      progress: 30
    })
    setToast(null)

    try {
      // 1. Gera o buffer GLB binário com todas as animações e texturas embutidas
      const glbBuffer = await exportCombinedGlb(baseModel, animations)

      setLoadingState({
        isOpen: true,
        title: 'Salvando Arquivo',
        statusText: 'Aguardando seleção do local de gravação...',
        progress: 85
      })

      // 2. Abre diálogo nativo do Electron para salvar o arquivo
      if (window.api?.saveGlbFile) {
        const result = await window.api.saveGlbFile(
          glbBuffer,
          baseModelName || 'character_combined.glb'
        )

        if (result.success && result.filePath) {
          const sizeMb = (glbBuffer.byteLength / (1024 * 1024)).toFixed(2)
          setToast({
            type: 'success',
            title: 'GLB Exportado com Sucesso!',
            message: `Arquivo salvo (${sizeMb} MB, ${animations.length} animações) em: ${result.filePath}`
          })
        }
      } else {
        // Fallback navegador: download via blob
        const blob = new Blob([glbBuffer], { type: 'model/gltf-binary' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${baseModelName || 'character'}_combined.glb`
        a.click()
        URL.revokeObjectURL(url)

        setToast({
          type: 'success',
          title: 'GLB Exportado!',
          message: `Download iniciado com ${animations.length} animações combinadas.`
        })
      }
    } catch (err: any) {
      console.error('Erro ao exportar GLB:', err)
      setErrorDetails({
        title: 'Falha na Exportação do GLB',
        message: err?.message || 'Ocorreu um erro ao converter a malha e animações para o formato GLB.',
        technicalDetails: err?.stack || String(err),
        suggestions: [
          'Verifique se a malha base contém geometrias válidas.',
          'Caso haja incompatibilidade severa de skeleton, verifique as trilhas de animação.',
          'Tente reduzir o número de animações se o tamanho do arquivo exceder a memória.'
        ]
      })
    } finally {
      setLoadingState(null)
    }
  }

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-dark-950 text-slate-100 select-none">
      {/* Barra de Cabeçalho */}
      <header className="h-12 bg-dark-900 border-b border-dark-750 flex items-center justify-between px-4 z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <Sparkles size={16} />
            </div>
            <h1 className="text-sm font-bold text-slate-100 tracking-wide">
              Mixamo GLB Combiner
            </h1>
          </div>
          <span className="text-[10px] font-semibold bg-dark-800 text-slate-400 px-2 py-0.5 rounded border border-dark-700">
            GameLande Tools
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Botão de Exportar GLB */}
          <button
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-emerald-900/30 border border-emerald-400/40 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-dark-800 disabled:border-dark-700 disabled:text-slate-500"
            onClick={handleExportGLB}
            disabled={!baseModel || animations.length === 0}
            title={
              !baseModel
                ? 'Carregue um modelo base para exportar'
                : animations.length === 0
                ? 'Adicione animações para combinar'
                : `Exportar modelo com ${animations.length} animações embutidas`
            }
          >
            <Download size={14} />
            <span>Exportar GLB {animations.length > 0 ? `(${animations.length})` : ''}</span>
          </button>

          {/* Toggle Inspector */}
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
              isInspectorOpen
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/50'
                : 'bg-dark-800 text-slate-400 border-dark-700 hover:text-slate-200 hover:bg-dark-750'
            }`}
            onClick={toggleInspector}
            title={isInspectorOpen ? 'Ocultar Inspector' : 'Exibir Inspector'}
          >
            <Sliders size={14} />
            <span>Inspector</span>
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`absolute top-14 right-5 z-40 flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl max-w-md animate-slide-down ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100'
              : toast.type === 'error'
              ? 'bg-red-950/95 border-red-500/50 text-red-100'
              : 'bg-amber-950/95 border-amber-500/50 text-amber-100'
          }`}
        >
          <div className="mt-0.5 flex-shrink-0">
            {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle size={18} className="text-red-400" />}
            {toast.type === 'warning' && <AlertCircle size={18} className="text-amber-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-xs mb-0.5">{toast.title}</h4>
            <p className="text-[11px] opacity-90 leading-relaxed break-all">{toast.message}</p>
          </div>
          <button
            className="text-slate-400 hover:text-white p-0.5 transition"
            onClick={() => setToast(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Layout de 3 Colunas */}
      <main className="flex-1 flex w-full h-[calc(100vh-48px)] overflow-hidden relative">
        {/* Coluna 1: Lista Lateral de Animações (Esquerda) */}
        <Sidebar onShowError={setErrorDetails} onSetLoading={setLoadingState} />

        {/* Coluna 2: Visualizador 3D com Controles de Reprodução (Centro) */}
        <Viewer3D onShowError={setErrorDetails} onSetLoading={setLoadingState} />

        {/* Coluna 3: Painel Inspector & Propriedades (Direita) */}
        <Inspector />
      </main>

      {/* Modais Globais de Feedback e Erro */}
      <LoadingModal loading={loadingState} />
      <ErrorModal error={errorDetails} onClose={() => setErrorDetails(null)} />
    </div>
  )
}

export default App
