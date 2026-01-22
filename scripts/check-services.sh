#!/bin/bash
# 服务状态检查脚本

echo "========================================="
echo "  服务状态检查"
echo "========================================="
echo ""

echo "1. Next.js服务"
echo "-----------------------------------"
NEXTJS_STATUS=$(ss -lptn 2>/dev/null | grep 5000)
if [ -n "$NEXTJS_STATUS" ]; then
    echo "✅ Next.js运行中"
    echo "$NEXTJS_STATUS"
else
    echo "❌ Next.js未运行"
fi
echo ""

echo "2. Nginx服务"
echo "-----------------------------------"
NGINX_STATUS=$(ss -lptn 2>/dev/null | grep ":80")
if [ -n "$NGINX_STATUS" ]; then
    echo "✅ Nginx运行中"
    echo "$NGINX_STATUS"
else
    echo "❌ Nginx未运行"
fi
echo ""

echo "3. 本地访问测试"
echo "-----------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://127.0.0.1/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 本地访问正常 (HTTP 200)"
else
    echo "❌ 本地访问失败 (HTTP $HTTP_CODE)"
fi
echo ""

echo "4. 外网访问测试"
echo "-----------------------------------"
EXTERNAL_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://9.129.222.155/ 2>/dev/null || echo "000")
if [ "$EXTERNAL_CODE" = "200" ]; then
    echo "✅ 外网访问正常 (HTTP 200)"
else
    echo "❌ 外网访问失败 (HTTP $EXTERNAL_CODE)"
    echo "   请检查腾讯云安全组是否开放TCP 80端口"
fi
echo ""

echo "5. 访问地址"
echo "-----------------------------------"
echo "内网地址：http://127.0.0.1"
echo "外网地址：http://9.129.222.155"
echo ""

echo "========================================="
