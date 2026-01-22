#!/bin/bash
# nginx快速部署脚本

set -e

echo "========================================="
echo "  nginx 反向代理快速部署"
echo "========================================="
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用root权限运行此脚本"
    echo "   sudo bash scripts/setup-nginx.sh"
    exit 1
fi

echo "1. 检查Next.js服务状态"
echo "-----------------------------------"
if ss -lptn | grep -q ":5000"; then
    echo "✅ Next.js服务运行中 (端口5000)"
else
    echo "❌ Next.js服务未运行，请先启动服务"
    echo "   coze dev"
    exit 1
fi
echo ""

echo "2. 安装nginx"
echo "-----------------------------------"
if command -v nginx &> /dev/null; then
    echo "✅ nginx已安装"
else
    echo "安装nginx中..."
    apt update
    apt install nginx -y
    echo "✅ nginx安装完成"
fi
echo ""

echo "3. 创建nginx配置文件"
echo "-----------------------------------"
NGINX_CONF="/etc/nginx/sites-available/child-safety-chair"

cat > "$NGINX_CONF" << 'EOF'
server {
    listen 80;
    server_name 9.129.222.155;

    # 日志
    access_log /var/log/nginx/child-safety-chair-access.log;
    error_log /var/log/nginx/child-safety-chair-error.log;

    # 反向代理到Next.js
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时配置
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;

        # WebSocket支持
        proxy_set_header Connection "";
        proxy_buffering off;
    }

    # 静态文件缓存（可选）
    location ~* \.(jpg|jpeg|png|gif|ico|svg|css|js)$ {
        proxy_pass http://127.0.0.1:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

echo "✅ 配置文件创建完成: $NGINX_CONF"
echo ""

echo "4. 启用配置"
echo "-----------------------------------"
# 删除默认配置（可选）
rm -f /etc/nginx/sites-enabled/default

# 创建软链接
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/

# 测试配置
if nginx -t 2>&1; then
    echo "✅ nginx配置测试通过"
else
    echo "❌ nginx配置测试失败"
    nginx -t
    exit 1
fi
echo ""

echo "5. 重启nginx服务"
echo "-----------------------------------"
systemctl restart nginx
systemctl enable nginx

# 检查nginx状态
if systemctl is-active --quiet nginx; then
    echo "✅ nginx服务运行中"
else
    echo "❌ nginx服务启动失败"
    systemctl status nginx
    exit 1
fi
echo ""

echo "6. 验证服务"
echo "-----------------------------------"
NGINX_STATUS=$(ss -lptn | grep ":80" | grep nginx)
if [ -n "$NGINX_STATUS" ]; then
    echo "✅ nginx监听80端口"
    echo "$NGINX_STATUS"
else
    echo "❌ nginx未监听80端口"
    exit 1
fi
echo ""

echo "7. 本地测试"
echo "-----------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://127.0.0.1/ 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 本地访问正常 (HTTP 200)"
else
    echo "⚠️  本地访问异常 (HTTP $HTTP_CODE)"
fi
echo ""

echo "========================================="
echo "  部署完成！"
echo "========================================="
echo ""
echo "下一步操作："
echo ""
echo "📋 在腾讯云控制台配置安全组："
echo "   1. 登录 https://console.cloud.tencent.com/"
echo "   2. 进入云服务器 → 安全组 → 配置规则"
echo "   3. 添加入站规则：TCP 80 来源 0.0.0.0/0"
echo "   4. 等待1-3分钟生效"
echo ""
echo "📱 配置完成后，访问："
echo "   http://9.129.222.155"
echo ""
echo "📖 详细文档："
echo "   docs/400错误解决方案.md"
echo ""
echo "========================================="
