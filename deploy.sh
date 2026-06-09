#!/bin/bash
set -e

# ============================================
#  今天吃什么 - 一键部署脚本
#  服务器: Ubuntu 22.04
# ============================================

if [ $# -lt 1 ]; then
  echo "用法: bash deploy.sh YOUR_DEEPSEEK_API_KEY"
  echo "示例: bash deploy.sh sk-xxxxxxxxxxxxxxxxxxxxxxxxxx"
  exit 1
fi

DEEPSEEK_KEY="$1"

echo "========================================"
echo " 今天吃什么 - 部署开始"
echo "========================================"

# ===== 1. 系统更新 + 基础工具 =====
echo "[1/8] 更新系统包..."
apt update -y && apt upgrade -y
apt install -y curl git nginx

# ===== 2. 安装 Node.js 20 =====
echo "[2/8] 安装 Node.js 20..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
echo "Node.js $(node -v)"

# ===== 3. 安装 MySQL 8 =====
echo "[3/8] 安装 MySQL 8..."
if ! command -v mysql &> /dev/null; then
  DEBIAN_FRONTEND=noninteractive apt install -y mysql-server
  systemctl start mysql
  systemctl enable mysql
fi

MYSQL_PASS="REDACTED!"
echo "[3/8] 配置 MySQL 数据库..."

mysql -u root <<SQL
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_PASS}';
FLUSH PRIVILEGES;
CREATE DATABASE IF NOT EXISTS what_to_eat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SQL

# ===== 4. 拉取代码 =====
echo "[4/8] 拉取项目代码..."
PROJECT_DIR=/opt/what-to-eat-today
if [ -d "$PROJECT_DIR" ]; then
  cd "$PROJECT_DIR"
  git pull
else
  git clone https://github.com/gavigao/what-to-eat-today.git "$PROJECT_DIR"
  cd "$PROJECT_DIR"
fi

# ===== 5. 配置环境变量 =====
echo "[5/8] 配置环境变量..."
cat > "$PROJECT_DIR/backend/.env" <<ENV
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=${MYSQL_PASS}
DB_NAME=what_to_eat
DEEPSEEK_API_KEY=${DEEPSEEK_KEY}
PORT=3001
ENV

# ===== 6. 初始化数据库表 + 种子数据 =====
echo "[6/8] 初始化数据库..."
cd "$PROJECT_DIR/backend"
mysql -u root -p${MYSQL_PASS} what_to_eat < "$PROJECT_DIR/backend/schema.sql" 2>/dev/null
npm install
node seeds/foods_seed.js

# ===== 7. 构建前端 =====
echo "[7/8] 构建前端..."
cd "$PROJECT_DIR/frontend"
npm install
npm run build

# ===== 8. 配置 Nginx + PM2 =====
echo "[8/8] 配置 Nginx 和 PM2..."

if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
fi

cat > /etc/nginx/sites-available/what-to-eat <<NGINX
server {
    listen 80;
    server_name _;

    root /opt/what-to-eat-today/frontend/dist;
    index index.html;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/what-to-eat /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

cd "$PROJECT_DIR/backend"
pm2 delete what-to-eat 2>/dev/null || true
pm2 start src/app.js --name what-to-eat
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

ufw allow 80/tcp 2>/dev/null || true
ufw allow 22/tcp 2>/dev/null || true

echo ""
echo "========================================"
echo " 部署完成!"
echo ""
echo " 访问地址: http://$(curl -s ifconfig.me)"
echo "========================================"
