import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import * as THREE from 'three'
import AnimatedCharacter from './AnimatedCharacter'
import PlayerControls from './PlayerControls'
import { useAnimationStore } from '../store/useAnimationStore'
import { Box } from 'lucide-react'
import { ErrorDetails } from './ErrorModal'
import { LoadingState } from './LoadingModal'

export interface Viewer3DProps {
  className?: string
  onShowError: (error: ErrorDetails) => void
  onSetLoading: (loading: LoadingState | null) => void
}

export const Viewer3D: React.FC<Viewer3DProps> = ({
  className,
  onShowError,
  onSetLoading
}) => {
  const { baseModel } = useAnimationStore()

  return (
    <div className={`relative flex-1 h-full w-full bg-dark-950 overflow-hidden ${className || ''}`}>
      <Canvas
        camera={{ position: [0, 2, 4], fov: 50 }}
        shadows
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
          antialias: true
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#090a0f']} />

        {/* Iluminação PBR / Hemisférica 100% Offline */}
        <hemisphereLight
          args={['#ffffff', '#141824', 0.9]}
          position={[0, 50, 0]}
        />

        <ambientLight intensity={0.7} />

        {/* Luz Direcional Principal com Sombras */}
        <directionalLight
          position={[6, 12, 6]}
          intensity={1.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={30}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
          shadow-bias={-0.0001}
        />

        <directionalLight position={[-6, 6, -6]} intensity={0.9} />
        <directionalLight position={[0, 4, -8]} intensity={0.6} />
        <directionalLight position={[0, -1, 5]} intensity={0.4} />

        {/* Grid de Chão */}
        <Grid
          infiniteGrid
          cellSize={0.5}
          sectionSize={2.0}
          cellColor="#1f2638"
          sectionColor="#3b486a"
          fadeDistance={25}
          fadeStrength={1.5}
        />

        {/* Controles de Câmera Orbital */}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minDistance={0.5}
          maxDistance={50}
          target={[0, 1, 0]}
        />

        <Suspense fallback={null}>
          <AnimatedCharacter />
        </Suspense>
      </Canvas>

      {!baseModel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-6">
          <div className="p-4 rounded-2xl bg-dark-900/60 border border-dark-750/70 backdrop-blur-sm max-w-sm flex flex-col items-center shadow-xl">
            <Box size={36} className="text-slate-500 mb-2" />
            <p className="font-semibold text-sm text-slate-200">Nenhum modelo 3D carregado</p>
            <span className="text-xs text-slate-400 mt-1 leading-relaxed">
              Carregue um arquivo .glb, .gltf ou .fbx com malha e texturas para pré-visualizar as animações combinadas
            </span>
          </div>
        </div>
      )}

      {/* Controles de Reprodução e Carregamento */}
      <PlayerControls onShowError={onShowError} onSetLoading={onSetLoading} />
    </div>
  )
}

export default Viewer3D
