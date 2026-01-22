#!/bin/bash
# 外网访问检查脚本

echo "========================================="
echo "  外网访问状态检查"
echo "========================================="
echo ""

echo "1. 检查服务状态"
echo "-----------------------------------"
SERVICE_STATUS=$(ss -lptn 2>/dev/null | grep 5000)
if [ -n "$SERVICE_STATUS" ]; then
    echo "✅ 服务运行中："
    echo "$SERVICE_STATUS"
else
    echo "❌ 服务未运行"
    exit 1
fi
echo ""

echo "2. 检查本地访问"
echo "-----------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://127.0.0.1:5000)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 本地访问正常 (HTTP 200)"
else
    echo "❌ 本地访问失败 (HTTP $HTTP_CODE)"
fi
echo ""

echo "3. 检查监听地址"
echo "-----------------------------------"
LISTEN_ADDR=$(ss -lptn 2>/dev/null | grep 5000 | awk '{print $4}')
if [[ "$LISTEN_ADDR" == *"0.0.0.0:5000"* ]]; then
    echo "✅ 监听所有网络接口 (0.0.0.0:5000)"
else
    echo "⚠️  仅监听本地 ($LISTEN_ADDR)"
fi
echo ""

echo "4. 服务器信息"
echo "-----------------------------------"
echo "公网IP：9.129.222.155"
echo "服务端口：5000"
echo "访问地址：http://9.129.222.155:5000"
echo ""

echo "5. 下一步操作"
echo "-----------------------------------"
echo "📋 请在腾讯云控制台配置安全组："
echo "   1. 登录 https://console.cloud.tencent.com/"
echo "   2. 进入云服务器控制台"
echo "   3. 找到IP为 9.129.222.155 的实例"
echo "   4. 进入安全组 → 配置规则"
echo "   5. 添加入站规则：TCP:5000 来源:0.0.0.0/0"
echo "   6. 等待3-5分钟生效"
echo ""
echo "📱 配置完成后，访问："
echo "   http://9.129.222.155:5000"
echo ""
echo "📖 详细文档："
echo "   docs/腾讯云安全组配置指南.md"
echo ""
echo "========================================="
