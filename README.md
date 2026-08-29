# Mixamo GLB Combiner

> Aplicativo desktop (Electron + React + Three.js) para importar múltiplas animações FBX/GLB, retargetá-las sobre uma malha base e exportar um único `.glb` combinado pronto para Godot, Unity ou Three.js.

MixamoGLBCombiner.jpg

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Requisitos](#requisitos)
- [Instalação de Desenvolvimento](#instalação-de-desenvolvimento)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Build Multiplataforma](#build-multiplataforma)
  - [Windows (.exe NSIS + .zip)](#windows-exe-nsis--zip)
  - [macOS (.dmg + .zip)](#macos-dmg--zip)
  - [Linux (.AppImage + .deb + .rpm)](#linux-appimage--deb--rpm)
  - [Build para todas as plataformas](#build-para-todas-as-plataformas)
- [CI/CD (GitHub Actions)](#cicd-github-actions)
  - [Workflow de Release](#workflow-de-release)
  - [Workflow de CI (validação)](#workflow-de-ci-validação)
- [Estrutura de Saída](#estrutura-de-saída)
- [Workflow de Release Local](#workflow-de-release-local)
- [Solução de Problemas](#solução-de-problemas)

---

## Funcionalidades

- 🦴 Carregue uma malha base (`.glb`, `.gltf`, `.fbx`) com skin e esqueleto.
- 🎞️ Importe múltiplas animações (`.fbx`/`.glb`/`.gltf`) com drag-and-drop ou diálogo nativo.
- 🔍 Validação automática de compatibilidade de ossos (skeleton validator).
- 🎬 Player integrado com play/pause, loop, controle de velocidade e gizmo de transformação 3D.
- 📦 Exportação de arquivo `.glb` único com todas as animações embutidas.
- 🌙 UI dark em 3 colunas (sidebar / viewer 3D / inspector) construída com Tailwind CSS.
- 🖥️ Multiplataforma: Windows, macOS e Linux.

---

## Requisitos

| Ferramenta | Versão  | Obrigatório para                    |
| ---------- | ------- | ----------------------------------- |
| Node.js    | ≥ 22.x  | Build e dev em todas as plataformas |
| npm        | ≥ 10.x  | Idem                                |
| Git        | qualquer| Versionamento (release script)      |
| Wine       | latest  | Build de Windows `.exe` no Linux    |
| dpkg-deb   | latest  | Gerar `.deb` no Linux               |
| rpmbuild   | latest  | Gerar `.rpm` no Linux               |

> **Nota:** Para gerar instaladores Windows a partir do Linux/macOS, o `electron-builder` usa o Wine. Caso não queira instalá-lo, rode `npm run dist:win` em uma máquina Windows.

---

## Instalação de Desenvolvimento

```bash
git clone <repo-url> Mixamo-GLB-Combiner
cd Mixamo-GLB-Combiner
npm install
npm run dev
```

A janela Electron abre automaticamente com HMR ativo no renderer.

---

## Scripts Disponíveis

| Script                       | O que faz                                                            |
| ---------------------------- | -------------------------------------------------------------------- |
| `npm run dev`                | Inicia o Vite dev server + Electron com hot-reload                   |
| `npm run build`              | Compila renderer/main/preload para `out/` (sem empacotar)            |
| `npm run icons`              | Regenera `build/icon.png` e `build/icon.ico` (PowerShell + .NET)     |
| `npm run prestage:wincode`   | Pré-extrai `winCodeSign` no cache do electron-builder (apenas Win)   |
| `npm run edit:exe`           | Aplica ícone + metadados ao `.exe` (chamado por `dist:win`)          |
| `npm run dist`               | Build + empacota para o SO atual                                     |
| `npm run dist:win`           | Build + empacota para Windows (`.exe` NSIS + `.zip`)                 |
| `npm run dist:mac`           | Build + empacota para macOS (`.dmg` + `.zip`, x64 + arm64)           |
| `npm run dist:linux`         | Build + empacota para Linux (`.AppImage` + `.deb` + `.rpm`)          |
| `npm run dist:all`           | Build + empacota para as 3 plataformas de uma vez (`-mwl`)           |
| `npm run release`            | Bump patch (ex: `1.0.0` → `1.0.1`), commit + tag no git              |
| `npm run release:patch`      | Idem, explícito                                                      |
| `npm run release:minor`      | Bump minor (ex: `1.0.0` → `1.1.0`)                                   |
| `npm run release:major`      | Bump major (ex: `1.0.0` → `2.0.0`)                                   |

---

## Build Multiplataforma

A pasta `build/` contém os recursos utilizados pelo `electron-builder`:

```
build/
├── icon.png              # Ícone base 1024×1024 (gerado por scripts/generate-icons.ps1)
├── icon.ico              # Ícone multi-resolução para Windows
├── entitlements.mac.plist  # Entitlements de sandbox para macOS
└── installer.nsh         # Customizações NSIS (registro, atalhos, desinstalador)
```

> 💡 Para trocar o ícone do app basta substituir `build/icon.png` (≥ 512×512, fundo transparente recomendado) e rodar `npm run icons`. O `electron-builder` gera o `.icns` para macOS automaticamente a partir do PNG.

### Windows (.exe NSIS + .zip)

**Em uma máquina Windows (recomendado):**

```powershell
npm install
npm run dist:win
```

Saída em `dist/`:

- `Mixamo GLB Combiner-Setup-1.0.0.exe` — instalador NSIS (escolha de pasta, atalhos no menu Iniciar e área de trabalho, registro de Uninstall).
- `Mixamo GLB Combiner-1.0.0-x64.zip` — versão portátil (extraia e rode `Mixamo GLB Combiner.exe`).

**Em Linux/macOS (requer Wine):**

```bash
npm install --save-dev wine   # ou use o gerenciador de pacotes do SO
npm run dist:win
```

### macOS (.dmg + .zip)

**Em uma máquina macOS:**

```bash
npm install
npm run dist:mac
```

Saída em `dist/`:

- `Mixamo GLB Combiner-1.0.0-x64.dmg` — instalador DMG (Intel).
- `Mixamo GLB Combiner-1.0.0-arm64.dmg` — instalador DMG (Apple Silicon).
- `Mixamo GLB Combiner-1.0.0-x64.zip` / `-arm64.zip` — versão portátil (extraia e arraste para `Applications`).

> ⚠️ O build macOS **só pode ser feito em macOS** (restrição do `electron-builder` por causa do `hdiutil`). Em outros SOs a build macOS é pulada silenciosamente.

### Linux (.AppImage + .deb + .rpm)

**Em uma máquina Linux:**

```bash
npm install
npm run dist:linux
```

Saída em `dist/`:

- `Mixamo GLB Combiner-1.0.0-x64.AppImage` — portable, executável após `chmod +x`.
- `mixamo-glb-combiner_1.0.0_amd64.deb` — instalador Debian/Ubuntu (`sudo dpkg -i ...`).
- `mixamo-glb-combiner-1.0.0.x86_64.rpm` — instalador Fedora/RHEL (`sudo rpm -i ...`).

### Build para todas as plataformas

O atalho `dist:all` tenta empacotar Windows + macOS + Linux no SO atual:

```bash
npm run dist:all
```

> ⚠️ O instalador macOS só será gerado se você estiver rodando em um Mac. Para gerar pacotes das 3 plataformas de forma confiável, use CI ou runners de cada SO (ver [CI/CD (GitHub Actions)](#cicd-github-actions)).

---

## CI/CD (GitHub Actions)

Dois workflows em `.github/workflows/` cuidam da pipeline automaticamente:

### Workflow de Release

**Arquivo:** `.github/workflows/release.yml` · **Trigger:** push de tag `v*` ou `workflow_dispatch` (manual).

O que ele faz:

1. Faz checkout do código na tag correspondente.
2. Roda `npm ci`, type-check, `npm run build` em **2 runners paralelos** (`windows-latest`, `ubuntu-latest`).
3. Em cada runner, executa o script de empacotamento nativo da plataforma (`npm run dist:win` ou `npm run dist:linux`).
4. Faz upload dos instaladores como artifacts nomeados `dist-<OS>` (retenção: 14 dias).
5. Job `release` (depende de `build`) baixa todos os artifacts, gera `SHA256SUMS.txt` e cria uma **GitHub Release** com notas geradas automaticamente, marcando `prerelease: true` quando a tag contém `-` (ex: `v1.2.0-beta.1`).

> 📦 **macOS** foi removido do CI automatizado — os instaladores `.dmg` continuam disponíveis via `npm run dist:mac` rodando localmente em uma máquina Mac (configuração em `package.json` preservada).

**Como usar:**

```bash
# 1. Garanta que está na main com tudo commitado
git checkout main
git pull

# 2. Rode o release script — bump + commit + tag
npm run release:minor      # 1.0.0 → 1.1.0, cria tag v1.1.0

# 3. Envie a tag
git push origin main --follow-tags

# 4. Acompanhe em github.com/<seu-user>/<seu-repo>/actions
# A Release aparece em github.com/<seu-user>/<seu-repo>//releases
```

Também é possível disparar manualmente em **Actions → Release → Run workflow**, informando a versão (opcional). O workflow usa `softprops/action-gh-release@v2` para publicar.

**Permissões necessárias:** nenhuma configuração extra. O `GITHUB_TOKEN` padrão já tem permissão `contents: write` declarada no workflow.

### Workflow de CI (validação)

**Arquivo:** `.github/workflows/ci.yml` · **Trigger:** push e pull_request para `main`, `master`, `develop`.

Roda em paralelo nos 3 sistemas operacionais:

- `npm ci` + type-check (`tsconfig.web.json` e `tsconfig.node.json`)
- `npm run build` (compila renderer/main/preload)
- `npm run dist:<os>` (gera instalador para o runner atual como smoke-test)
- Upload do instalador como artifact (`dist-<OS>-ci`, retenção 7 dias)

Use como gate de merge: **Settings → Branches → Branch protection rules → Require status checks → CI / Validate (windows-latest, ubuntu-latest)**.

---

## Estrutura de Saída

```
dist/
├── Mixamo GLB Combiner-Setup-1.0.0.exe         (Windows NSIS)
├── Mixamo GLB Combiner-1.0.0-x64.zip           (Windows portable)
├── Mixamo GLB Combiner-1.0.0-x64.dmg           (macOS Intel)
├── Mixamo GLB Combiner-1.0.0-arm64.dmg         (macOS Apple Silicon)
├── Mixamo GLB Combiner-1.0.0-x64.zip           (macOS portable)
├── Mixamo GLB Combiner-1.0.0-x64.AppImage      (Linux portable)
├── mixamo-glb-combiner_1.0.0_amd64.deb         (Debian/Ubuntu)
└── mixamo-glb-combiner-1.0.0.x86_64.rpm        (Fedora/RHEL)
```

> O `appId` usado para todos os pacotes é `com.gamelande.mixamoglbcombiner`. Altere-o em `package.json` → `build.appId` para publicar sob sua própria identidade.

---

## Workflow de Release Local

O script `scripts/release.js` automatiza o bump de versão + commit + tag git:

```bash
# 1. Garanta que tudo está commitado
git status

# 2. Escolha o tipo de bump
npm run release:patch   # 1.0.0 → 1.0.1
npm run release:minor   # 1.0.0 → 1.1.0
npm run release:major   # 1.0.0 → 2.0.0

# 3. Envie a tag para o remoto
git push origin main --follow-tags

# 4. O workflow do GitHub Actions cuida do resto
#    (build em 3 plataformas + Release automática)
```

A nova versão aparece em:

- Janela "Sobre" do app (via `app.getVersion()`).
- Nome de arquivo dos instaladores (`-1.0.1-x64.exe` etc.).
- `Info.plist` no macOS e `productName` em todos os pacotes.
- Tag git e Release no GitHub.

Se preferir buildar localmente sem CI:

```bash
npm run release:patch
git push origin main --follow-tags   # opcional, dispara o workflow
npm run dist                         # ou rode no seu próprio computador
```

---

## Solução de Problemas

### "Cannot find module 'electron-builder'"

Rode `npm install` — o `postinstall` deve instalar os binários nativos automaticamente.

### O instalador macOS não é gerado fora de um Mac

Por design. Use uma máquina macOS ou um runner GitHub com `macos-latest` (ver bloco de CI acima).

### Ícone não aparece no app

1. Confirme que `build/icon.png` (≥ 512×512) e `build/icon.ico` existem.
2. Rode `npm run icons` para regenerar a partir do PNG base.
3. Limpe o cache do electron-builder: `node_modules/.cache/electron-builder` e rebuild.

### "wine: command not found" durante `dist:win` em Linux

```bash
sudo apt install wine64    # Debian/Ubuntu
sudo dnf install wine      # Fedora
```

Ou rode `dist:win` em uma máquina Windows real.

### `npm run dist:win` falha com "Cannot create symbolic link" (Windows)

O `electron-builder` extrai o `winCodeSign-2.6.0.7z` com `7za -snld`, que tenta recriar symlinks para o `darwin/`. Em contas Windows sem privilégio `SeCreateSymbolicLinkPrivilege` (modo desenvolvedor desligado, usuário sem admin) isso falha.

Este repositório já contorna isso automaticamente:

- `scripts/prestage-wincode.cjs` baixa o `.7z` e extrai com `-snl-` (pula symlinks) diretamente no cache do `electron-builder`.
- `scripts/edit-exe.cjs` aplica ícone + metadados ao `.exe` via `rcedit-x64.exe`.
- O `npm run dist:win` chama os dois scripts automaticamente (não precisa rodar manualmente).

Se ainda assim quiser corrigir definitivamente o ambiente:

1. **Modo desenvolvedor** (recomendado): `Settings → Privacy & security → For developers → Developer Mode = On` (exige admin).
2. **Admin PowerShell**: clique com botão direito no terminal → "Run as Administrator" antes de rodar `npm run dist:win`.
3. **Política local** (avançado): `secpol.msc → Local Policies → User Rights Assignment → Create symbolic links` e adicione seu usuário (exige admin).

### Build falha com "code signing" no macOS

O `package.json` está configurado com `identity: null` e `gatekeeperAssess: false` para permitir builds locais sem certificado Apple. Para publicar na App Store, configure seu certificado e remova essas chaves.

---

## Licença

MIT © GameLande Tools
