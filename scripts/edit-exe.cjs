'use strict'
const { existsSync, readdirSync, statSync } = require('node:fs')
const { join } = require('node:path')
const { execFileSync } = require('node:child_process')

const productName = 'Mixamo GLB Combiner'
const companyName = 'GameLande Tools'
const fileDescription = 'Mixamo GLB Animation Combiner'
const version = require('../package.json').version
const arch = 'x64'

const cacheRoot = process.env.LOCALAPPDATA
  ? join(process.env.LOCALAPPDATA, 'electron-builder', 'Cache', 'winCodeSign', '2.6.0')
  : null

const rcedit = cacheRoot && existsSync(join(cacheRoot, 'rcedit-x64.exe'))
  ? join(cacheRoot, 'rcedit-x64.exe')
  : join(process.cwd(), 'node_modules', 'rcedit', 'bin', 'rcedit-x64.exe')

function findExe(root) {
  const entries = readdirSync(root, { withFileTypes: true })
  for (const e of entries) {
    const full = join(root, e.name)
    if (e.isDirectory()) {
      const found = findExe(full)
      if (found) return found
    } else if (e.isFile() && e.name.endsWith('.exe') && !e.name.startsWith('Uninstall')) {
      return full
    }
  }
  return null
}

const distUnpacked = join(process.cwd(), 'dist', 'win-unpacked')
if (!existsSync(distUnpacked)) {
  console.error(`[edit-exe] Pasta ${distUnpacked} não encontrada. Rode 'npm run dist:win' primeiro.`)
  process.exit(1)
}

const exePath = findExe(distUnpacked)
if (!exePath) {
  console.error(`[edit-exe] Nenhum .exe encontrado em ${distUnpacked}`)
  process.exit(1)
}

const iconPath = join(process.cwd(), 'build', 'icon.ico')
if (!existsSync(iconPath)) {
  console.error(`[edit-exe] Ícone ${iconPath} não encontrado. Rode 'npm run icons' primeiro.`)
  process.exit(1)
}

if (!existsSync(rcedit)) {
  console.error(`[edit-exe] rcedit-x64.exe não encontrado em ${rcedit}`)
  process.exit(1)
}

console.log(`[edit-exe] Aplicando ícone e metadados a: ${exePath}`)
console.log(`[edit-exe] Usando rcedit: ${rcedit}`)

const fileVersionStr = `${version}.0`
const productVersionStr = `${version}.0`

execFileSync(rcedit, [exePath,
  '--set-icon', iconPath,
  '--set-version-string', 'ProductName', productName,
  '--set-version-string', 'CompanyName', companyName,
  '--set-version-string', 'FileDescription', fileDescription,
  '--set-version-string', 'LegalCopyright', `Copyright © ${new Date().getFullYear()} ${companyName}`,
  '--set-file-version', fileVersionStr,
  '--set-product-version', productVersionStr
], { stdio: 'inherit' })

console.log(`[edit-exe] ✔ Executável atualizado com sucesso`)
