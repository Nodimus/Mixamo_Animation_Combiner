#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const VALID_TYPES = ['patch', 'minor', 'major']
const type = (process.argv[2] || 'patch').toLowerCase()

if (!VALID_TYPES.includes(type)) {
  console.error(`Tipo de bump inválido: "${type}". Use: ${VALID_TYPES.join(', ')}`)
  process.exit(1)
}

const bump = process.argv[3]
const pkgPath = resolve(root, 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))

const current = pkg.version
const match = /^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/.exec(current)
if (!match) {
  console.error(`Versão atual inválida em package.json: ${current}`)
  process.exit(1)
}

let major = Number(match[1])
let minor = Number(match[2])
let patch = Number(match[3])
const pre = match[4] || ''

if (type === 'major') {
  major += 1
  minor = 0
  patch = 0
} else if (type === 'minor') {
  minor += 1
  patch = 0
} else {
  patch += 1
}

const finalBump = bump && /^\d+\.\d+\.\d+(?:-.+)?$/.test(bump) ? bump : null
const next = finalBump || `${major}.${minor}.${patch}${pre ? '-' + pre : ''}`

pkg.version = next
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

console.log(`✔ Versão atualizada: ${current} → ${next}`)

try {
  execSync(`git rev-parse --is-inside-work-tree`, { cwd: root, stdio: 'pipe' })
  execSync('git add package.json', { cwd: root, stdio: 'inherit' })
  execSync(`git commit -m "chore(release): v${next}"`, { cwd: root, stdio: 'inherit' })
  const tagName = `v${next}`
  execSync(`git tag -a ${tagName} -m "Release ${tagName}"`, { cwd: root, stdio: 'inherit' })
  console.log(`✔ Tag ${tagName} criada.`)
  console.log('\nPróximos passos:')
  console.log(`  git push origin main --follow-tags`)
  console.log(`  npm run dist            (gera os instaladores em ./dist/)`)
} catch {
  console.log('\n⚠ Repositório git não inicializado aqui; commit/tag pulados.')
  console.log('\nPróximos passos:')
  console.log(`  npm run dist            (gera os instaladores em ./dist/)`)
}
