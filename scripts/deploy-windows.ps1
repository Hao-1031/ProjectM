# Project M 2.0 - 阿里云 Windows Server 一键部署脚本
# 以管理员身份运行 PowerShell 后执行此脚本
# 可选传入 Domain 参数以启用 Nginx 反向代理与 HTTPS
param(
    [string]$Domain = "",
    [string]$Repo = "https://github.com/Hao-1031/Project-M.git",
    [string]$Branch = "main",
    [string]$InstallDir = "C:\www\project-m",
    [string]$AdminKey = ""
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n[+] $Message" -ForegroundColor Cyan
}

function Test-Command {
    param([string]$Command)
    return [bool](Get-Command -Name $Command -ErrorAction SilentlyContinue)
}

Write-Step "检查管理员权限"
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "请以管理员身份运行 PowerShell"
    exit 1
}

Write-Step "安装 Chocolatey"
if (-not (Test-Command choco)) {
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}

Write-Step "安装 Node.js LTS、Git、pnpm、PM2"
choco install nodejs-lts git -y
refreshenv
npm install -g pnpm pm2

$nodeVersion = node -v
$pnpmVersion = pnpm -v
$pm2Version = pm2 -v
Write-Host "Node: $nodeVersion, pnpm: $pnpmVersion, PM2: $pm2Version" -ForegroundColor Green

Write-Step "拉取代码到 $InstallDir"
New-Item -ItemType Directory -Force -Path (Split-Path $InstallDir) | Out-Null
if (Test-Path $InstallDir) {
    Set-Location $InstallDir
    git fetch origin
    git reset --hard origin/$Branch
} else {
    git clone -b $Branch $Repo $InstallDir
    Set-Location $InstallDir
}

Write-Step "配置环境变量"
if (-not (Test-Path ".env.local")) {
    Copy-Item .env.example .env.local
}
$envContent = Get-Content ".env.local" -Raw
if (-not ($envContent -match "NEXT_PUBLIC_SUPABASE_URL=")) {
    Add-Content -Path ".env.local" -Value "`nNEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
}
if (-not ($envContent -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=")) {
    Add-Content -Path ".env.local" -Value "`nNEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
}
if ($AdminKey -and -not ($envContent -match "ADMIN_KEY=")) {
    Add-Content -Path ".env.local" -Value "`nADMIN_KEY=$AdminKey"
}
Write-Host "请编辑 .env.local 填入 Supabase 与 ADMIN_KEY 等真实值后再启动" -ForegroundColor Yellow

Write-Step "安装依赖并构建"
pnpm install --frozen-lockfile
pnpm generate-icons
pnpm build

Write-Step "配置防火墙"
New-NetFirewallRule -DisplayName "Project-M-3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Project-M-HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Project-M-HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue

Write-Step "启动 PM2"
pm2 delete project-m -ErrorAction SilentlyContinue
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup windows

Write-Step "部署完成"
Write-Host "应用已运行在 http://localhost:3000" -ForegroundColor Green

if ($Domain) {
    Write-Step "配置 Nginx for Windows 反向代理与 HTTPS（域名: $Domain）"
    $nginxDir = "C:\nginx"
    if (-not (Test-Path $nginxDir)) {
        $nginxZip = "$env:TEMP\nginx.zip"
        Invoke-WebRequest -Uri "https://nginx.org/download/nginx-1.24.0.zip" -OutFile $nginxZip
        Expand-Archive -Path $nginxZip -DestinationPath C:\ -Force
        Rename-Item -Path "C:\nginx-1.24.0" -NewName "nginx" -Force
    }

    $nginxConf = @"
worker_processes 1;
events { worker_connections 1024; }
http {
    include mime.types;
    default_type application/octet-stream;
    sendfile on;
    keepalive_timeout 65;

    server {
        listen 80;
        server_name $Domain;
        location / {
            proxy_pass http://127.0.0.1:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade `$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
            proxy_cache_bypass `$http_upgrade;
        }
    }
}
"@
    Set-Content -Path "$nginxDir\conf\nginx.conf" -Value $nginxConf
    Start-Process -FilePath "$nginxDir\nginx.exe" -WorkingDirectory $nginxDir -WindowStyle Hidden
    Write-Host "Nginx 已启动，请自行配置 HTTPS 证书" -ForegroundColor Yellow
}
