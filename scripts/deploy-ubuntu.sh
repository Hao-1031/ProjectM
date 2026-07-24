#!/usr/bin/env bash
set -euo pipefail

# Project-M Ubuntu 22.04 一键部署脚本
# 用法：以 root 或具有 sudo 权限的用户在服务器上执行
# chmod +x scripts/deploy-ubuntu.sh
# ./scripts/deploy-ubuntu.sh

APP_NAME="project-m"
APP_DIR="/var/www/${APP_NAME}"
REPO_URL="https://github.com/Hao-1031/ProjectM.git"
BRANCH="main"
NODE_VERSION="20"

log() {
  echo -e "\033[1;36m[deploy]\033[0m $1"
}

error() {
  echo -e "\033[1;31m[error]\033[0m $1" >&2
  exit 1
}

# 1. 系统依赖
log "更新系统并安装依赖..."
apt-get update -y
apt-get install -y curl wget git nginx ufw certbot python3-certbot-nginx

# 2. Node.js (NodeSource)
if ! command -v node &> /dev/null || [[ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" != "${NODE_VERSION}" ]]; then
  log "安装 Node.js ${NODE_VERSION} ..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash -
  apt-get install -y nodejs
fi

# 3. pnpm
if ! command -v pnpm &> /dev/null; then
  log "安装 pnpm ..."
  npm install -g pnpm@11
fi

# 4. PM2
if ! command -v pm2 &> /dev/null; then
  log "安装 PM2 ..."
  npm install -g pm2
fi

# 5. 防火墙
log "配置 UFW ..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw --force enable

# 6. 代码目录
log "拉取代码..."
mkdir -p "${APP_DIR}"
if [ -d "${APP_DIR}/.git" ]; then
  cd "${APP_DIR}"
  git fetch origin
  git reset --hard "origin/${BRANCH}"
else
  git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
  cd "${APP_DIR}"
fi

# 7. 日志目录（PM2 以普通用户运行时，项目目录下更易写入）
mkdir -p "${APP_DIR}/logs"

# 8. 环境变量
log "检查环境变量..."
if [ ! -f "${APP_DIR}/.env.local" ]; then
  cat > "${APP_DIR}/.env.local" <<EOF
# Sentry 配置（可选）
# 未配置 SENTRY_AUTH_TOKEN 时构建会自动跳过 sourcemap 上传
# SENTRY_ORG=your-org
# SENTRY_PROJECT=project-m
# SENTRY_AUTH_TOKEN=your-token
# NEXT_PUBLIC_SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
EOF
fi

# 9. 构建
log "安装依赖并构建..."
cd "${APP_DIR}"
pnpm install --frozen-lockfile
pnpm generate-icons
pnpm build

# 10. PM2 启动/重启
log "重启 PM2 服务..."
pm2 startOrRestart ecosystem.config.cjs --env production
pm2 save

# 11. Nginx 反向代理（可选，仅当存在域名时启用）
# 如需自动配置，请将 DOMAIN 环境变量传入脚本
if [ -n "${DOMAIN:-}" ]; then
  log "配置 Nginx + Certbot for ${DOMAIN} ..."
  cat > "/etc/nginx/sites-available/${APP_NAME}" <<EOF
server {
  listen 80;
  server_name ${DOMAIN};

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_cache_bypass \$http_upgrade;
  }
}
EOF
  ln -sf "/etc/nginx/sites-available/${APP_NAME}" "/etc/nginx/sites-enabled/${APP_NAME}"
  nginx -t && systemctl reload nginx
  certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "admin@${DOMAIN}" || true
fi

log "部署完成。"
log "查看日志：pm2 logs ${APP_NAME}"
log "管理服务：pm2 stop/start/restart ${APP_NAME}"
