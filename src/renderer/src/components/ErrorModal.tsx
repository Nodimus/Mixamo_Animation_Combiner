import React from 'react'
import { AlertTriangle, X, HelpCircle } from 'lucide-react'

export interface ErrorDetails {
  title: string
  message: string
  fileName?: string
  technicalDetails?: string
  suggestions?: string[]
}

interface ErrorModalProps {
  error: ErrorDetails | null
  onClose: () => void
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ error, onClose }) => {
  if (!error) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-dark-850 border border-red-500/40 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100 animate-slide-down">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700 bg-red-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-base text-red-200">{error.title}</h3>
              {error.fileName && (
                <p className="text-xs text-red-300/80 font-mono mt-0.5">
                  Arquivo: {error.fileName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-dark-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Descrição do Problema
            </label>
            <p className="text-sm text-slate-200 mt-1 leading-relaxed bg-dark-900/60 p-3 rounded-lg border border-dark-750">
              {error.message}
            </p>
          </div>

          {error.suggestions && error.suggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                <HelpCircle size={14} />
                <span>Como Resolver:</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 bg-amber-950/20 border border-amber-500/20 p-3 rounded-lg">
                {error.suggestions.map((sug, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error.technicalDetails && (
            <details className="text-xs text-slate-400 bg-dark-900 p-2.5 rounded-lg border border-dark-800">
              <summary className="cursor-pointer font-medium hover:text-slate-300">
                Ver detalhes técnicos do erro
              </summary>
              <pre className="mt-2 text-[11px] font-mono text-red-300/90 whitespace-pre-wrap overflow-x-auto bg-black/40 p-2 rounded">
                {error.technicalDetails}
              </pre>
            </details>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-5 py-3.5 bg-dark-900 border-t border-dark-750">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white text-xs font-medium rounded-lg transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorModal
