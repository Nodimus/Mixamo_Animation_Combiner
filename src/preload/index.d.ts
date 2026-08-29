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

export interface WindowApi {
  platform: string
  versions: {
    node: string
    chrome: string
    electron: string
  }
  ping: () => Promise<string>
  openAnimationFiles: () => Promise<ModelFileData[]>
  openFbxFiles: () => Promise<ModelFileData[]>
  openBaseModel: () => Promise<ModelFileData | null>
  saveGlbFile: (buffer: ArrayBuffer, defaultFileName?: string) => Promise<SaveResult>
}

declare global {
  interface Window {
    api: WindowApi
  }
}

export {}
