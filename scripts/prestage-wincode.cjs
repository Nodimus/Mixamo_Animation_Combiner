'use strict'
const { existsSync, mkdirSync, rmSync, readdirSync, statSync, renameSync } = require('node:fs')
const { join } = require('node:path')
const { tmpdir } = require('node:os')
const { execFileSync } = require('node:child_process')

const cacheRoot = process.env.LOCALAPPDATA
  ? join(process.env.LOCALAPPDATA, 'electron-builder', 'Cache')
  : join(tmpdir(), 'electron-builder', 'Cache')

const winCodeSignDir = join(cacheRoot, 'winCodeSign')
const targetVersionDir = join(winCodeSignDir, '2.6.0')
const sevenZipUrl = 'https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-2.6.0/winCodeSign-2.6.0.7z'
const sevenZipLocal = join(winCodeSignDir, 'winCodeSign-2.6.0.7z')

const sevenZipExe = join(
  process.cwd(),
  'node_modules',
  '7zip-bin',
  'win',
  'x64',
  '7za.exe'
)

function log(msg) {
  console.log(`[prestage-wincode] ${msg}`)
}

if (!existsSync(sevenZipExe)) {
  log(`7za.exe não encontrado em ${sevenZipExe} — execute npm install primeiro.`)
  process.exit(0)
}

if (existsSync(targetVersionDir)) {
  const rcedit = join(targetVersionDir, 'rcedit-x64.exe')
  if (existsSync(rcedit)) {
    log(`winCodeSign já está pré-extraído em ${targetVersionDir} — pulando.`)
    process.exit(0)
  }
}

mkdirSync(winCodeSignDir, { recursive: true })

if (!existsSync(sevenZipLocal)) {
  log(`Baixando winCodeSign-2.6.0.7z...`)
  execFileSync('powershell', [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-Command',
    `(New-Object System.Net.WebClient).DownloadFile('${sevenZipUrl}', '${sevenZipLocal.replace(/\\/g, '\\\\')}');`
  ], { stdio: 'inherit' })
} else {
  log(`winCodeSign-2.6.0.7z já presente — reutilizando.`)
}

log(`Extraindo sem symlinks (-snl-) para contornar limitação de privilégios do Windows...`)
rmSync(targetVersionDir, { recursive: true, force: true })
mkdirSync(targetVersionDir, { recursive: true })

const stagingDir = join(winCodeSignDir, '_staging')
rmSync(stagingDir, { recursive: true, force: true })
mkdirSync(stagingDir, { recursive: true })

execFileSync(sevenZipExe, [
  'x',
  '-snl-',
  '-bd',
  '-y',
  sevenZipLocal,
  `-o${stagingDir}`
], { stdio: 'inherit' })

function moveContents(from, to) {
  for (const name of readdirSync(from)) {
    const src = join(from, name)
    const dst = join(to, name)
    const st = statSync(src)
    if (st.isDirectory()) {
      mkdirSync(dst, { recursive: true })
      moveContents(src, dst)
      rmSync(src, { recursive: true, force: true })
    } else {
      rmSync(dst, { force: true })
      renameSync(src, dst)
    }
  }
}

const extracted = readdirSync(stagingDir)
if (extracted.length === 1 && statSync(join(stagingDir, extracted[0])).isDirectory()) {
  const topLevel = join(stagingDir, extracted[0])
  log(`Reorganizando estrutura final em ${targetVersionDir}...`)
  moveContents(topLevel, targetVersionDir)
} else {
  log(`Reorganizando estrutura final em ${targetVersionDir} (sem pasta intermediária)...`)
  moveContents(stagingDir, targetVersionDir)
}

rmSync(stagingDir, { recursive: true, force: true })

log(`✔ winCodeSign pré-extraído em ${targetVersionDir}`)
