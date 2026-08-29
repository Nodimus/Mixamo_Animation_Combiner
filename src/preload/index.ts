import { contextBridge, ipcRenderer } from 'electron'

export interface ModelFileData {
  fileName: string
  filePath: string
  buffer: ArrayBuffer
}

export interface SaveResult {
  success: boolean
  filePath?: string
  canceled?: boolean
}

// Custom APIs for renderer
export const api = {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  ping: () => ipcRenderer.invoke('ping'),
  openAnimationFiles: (): Promise<ModelFileData[]> => ipcRenderer.invoke('dialog:openAnimationFiles'),
  openFbxFiles: (): Promise<ModelFileData[]> => ipcRenderer.invoke('dialog:openAnimationFiles'),
  openBaseModel: (): Promise<ModelFileData | null> => ipcRenderer.invoke('dialog:openBaseModel'),
  saveGlbFile: (buffer: ArrayBuffer, defaultFileName?: string): Promise<SaveResult> =>
    ipcRenderer.invoke('dialog:saveGlbFile', { buffer, defaultFileName })
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
