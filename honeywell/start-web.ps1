# Honeywell Monorepo 一键启动脚本
# 用法: .\start-web.ps1

param(
    [switch]$SkipInstall,
    [switch]$BuildOnly
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

function Write-Step($msg) {
    Write-Host "`n==> $msg" -ForegroundColor Cyan
}

function Write-Success($msg) {
    Write-Host "[OK] $msg" -ForegroundColor Green
}

Write-Host @"

  ____          _    _      _               
 |  _ \        | |  | |    (_)              
 | |_) |_   _  | |  | |     _ _ __  _   _ 
 |  _ <| | | | | |  | |    | | '_ \| | | |
 | |_) | |_| | | |__| |____| | | | | |_| |
 |____/ \__, | |____|______|_|_| |_|\__,_|
         __/ |                          
        |___/                           

"@ -ForegroundColor Yellow

Write-Host "Monorepo 一键启动脚本" -ForegroundColor White
Write-Host "项目: 秘鲁市场理财投资平台" -ForegroundColor Gray

# 检查 Node.js
Write-Step "检查环境..."
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "[ERROR] Node.js 未安装，请先安装 Node.js 20+" -ForegroundColor Red
    exit 1
}
Write-Success "Node.js: $nodeVersion"

# 检查 pnpm
$pnpmVersion = pnpm --version 2>$null
if (-not $pnpmVersion) {
    Write-Host "[ERROR] pnpm 未安装，请先安装 pnpm (npm install -g pnpm)" -ForegroundColor Red
    exit 1
}
Write-Success "pnpm: $pnpmVersion"

# 检查是否是 monorepo 根目录
if (-not (Test-Path "pnpm-workspace.yaml")) {
    Write-Host "[ERROR] 请在 monorepo 根目录运行此脚本" -ForegroundColor Red
    exit 1
}
Write-Success "Monorepo 目录结构正确"

if (-not $SkipInstall) {
    Write-Step "安装依赖 (pnpm install)..."
    
    # 清理旧的 node_modules (可选)
    # if (Test-Path "node_modules") {
    #     Write-Host "  清理旧的 node_modules..." -ForegroundColor Gray
    #     Remove-Item -Recurse -Force "node_modules"
    # }
    
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] 依赖安装失败" -ForegroundColor Red
        exit 1
    }
    Write-Success "依赖安装完成"
}

if ($BuildOnly) {
    Write-Step "构建 web 应用..."
    pnpm --filter @honeywell/web build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] 构建失败" -ForegroundColor Red
        exit 1
    }
    Write-Success "构建完成"
    exit 0
}

Write-Step "启动 web 开发服务器..."
Write-Host ""
Write-Host "  访问: http://localhost:3000" -ForegroundColor Green
Write-Host "  停止: Ctrl + C" -ForegroundColor Gray
Write-Host ""

cd "$ProjectRoot\apps\web"
pnpm dev
