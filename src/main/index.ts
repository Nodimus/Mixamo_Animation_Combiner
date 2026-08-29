import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { existsSync, promises as fs } from 'fs'

function createWindow(): void {
  const preloadPath = existsSync(join(__dirname, '../preload/index.mjs'))
    ? join(__dirname, '../preload/index.mjs')
    : join(__dirname, '../preload/index.js')

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // IPC handler para selecionar arquivos de animação (FBX, GLB, GLTF)
  const handleOpenAnimationFiles = async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Selecionar Animações (FBX / GLB / GLTF)',
      filters: [
        { name: 'Animações 3D (*.fbx, *.glb, *.gltf)', extensions: ['fbx', 'glb', 'gltf'] }
      ],
      properties: ['openFile', 'multiSelections']
    })

    if (canceled || filePaths.length === 0) {
      return []
    }

    const filesData = await Promise.all(
      filePaths.map(async (filePath) => {
        const buffer = await fs.readFile(filePath)
        const pathParts = filePath.split(/[\\/]/)
        const fileName = pathParts[pathParts.length - 1]
        return {
          fileName,
          filePath,
          buffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
        }
      })
    )

    return filesData
  }

  ipcMain.handle('dialog:openAnimationFiles', handleOpenAnimationFiles)
  ipcMain.handle('dialog:openFbxFiles', handleOpenAnimationFiles)

  // IPC handler para selecionar modelo base (GLB/GLTF/FBX)
  ipcMain.handle('dialog:openBaseModel', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Selecionar Modelo 3D Base com Texturas/Skin',
      filters: [
        { name: 'Modelos 3D (*.glb, *.gltf, *.fbx)', extensions: ['glb', 'gltf', 'fbx'] }
      ],
      properties: ['openFile']
    })

    if (canceled || filePaths.length === 0) {
      return null
    }

    const filePath = filePaths[0]
    const buffer = await fs.readFile(filePath)
    const pathParts = filePath.split(/[\\/]/)
    const fileName = pathParts[pathParts.length - 1]

    return {
      fileName,
      filePath,
      buffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    }
  })

  // IPC handler para salvar arquivo GLB exportado
  ipcMain.handle(
    'dialog:saveGlbFile',
    async (_event, { buffer, defaultFileName }: { buffer: ArrayBuffer; defaultFileName?: string }) => {
      const defaultName = defaultFileName
        ? defaultFileName.replace(/\.(glb|gltf|fbx)$/i, '') + '_combined.glb'
        : 'character_combined.glb'

      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Salvar Modelo GLB Combinado',
        defaultPath: defaultName,
        filters: [{ name: 'GLB 3D Model (*.glb)', extensions: ['glb'] }]
      })

      if (canceled || !filePath) {
        return { success: false, canceled: true }
      }

      await fs.writeFile(filePath, Buffer.from(buffer))

      return { success: true, filePath }
    }
  )

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
