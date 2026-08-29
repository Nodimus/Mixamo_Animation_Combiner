import React from 'react'
import { Loader2 } from 'lucide-react'

export interface LoadingState {
  isOpen: boolean
  title: string
  statusText?: string
  progress?: number // 0 to 100
}

interface LoadingModalProps {
  loading: LoadingState | null
}

export const LoadingModal: React.FC<LoadingModalProps> = ({ loading }) => {
  if (!loading || !loading.isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-dark-850 border border-brand-500/30 rounded-2xl shadow-2xl p-6 max-w-sm w-full flex flex-col items-center text-center animate-slide-down">
        {/* Animated Glow Spinner */}
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-full blur-md bg-brand-500/30 animate-pulse" />
          <div className="relative p-4 rounded-full bg-dark-800 border border-brand-500/40 text-brand-400">
            <Loader2 size={32} className="spin" />
          </div>
        </div>

        <h3 className="font-semibold text-base text-slate-100 mb-1">{loading.title}</h3>
        <p className="text-xs text-slate-400 mb-4">{loading.statusText || 'Aguarde um momento...'}</p>

        {loading.progress !== undefined && (
          <div className="w-full space-y-1.5">
            <div className="w-full bg-dark-750 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-500 h-full rounded-full transition-all duration-200"
                style={{ width: `${Math.max(0, Math.min(100, loading.progress))}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {Math.round(loading.progress)}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default LoadingModal
