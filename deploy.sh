#!/bin/bash

# 儿童产品设计助手 - 快速部署脚本
# 版本: V8.0.0

set -e

echo "========================================"
echo "儿童产品设计助手 - 部署脚本"
echo "版本: V8.0.0"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装！${NC}"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose 未安装！${NC}"
    echo "请先安装 Docker Compose"
    exit 1
fi

echo -e "${GREEN}✅ Docker 环境检查通过${NC}"
echo ""

# 停止并删除旧容器
echo -e "${YELLOW}🔄 停止旧容器...${NC}"
docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true

# 清理旧镜像（可选）
echo -e "${YELLOW}🧹 清理旧镜像...${NC}"
docker rmi child-product-design-assistant 2>/dev/null || true

# 构建新镜像
echo -e "${YELLOW}🏗️  构建Docker镜像...${NC}"
if docker compose build; then
    echo -e "${GREEN}✅ 镜像构建成功${NC}"
else
    echo -e "${RED}❌ 镜像构建失败${NC}"
    exit 1
fi

# 启动容器
echo -e "${YELLOW}🚀 启动容器...${NC}"
if docker compose up -d; then
    echo -e "${GREEN}✅ 容器启动成功${NC}"
else
    echo -e "${RED}❌ 容器启动失败${NC}"
    exit 1
fi

echo ""
echo "========================================"
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "========================================"
echo ""
echo "📱 访问地址:"
echo "   本地: http://localhost:5000"
echo "   外网: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP'):5000"
echo ""
echo "📱 手机访问步骤:"
echo "   1. 确保手机和服务器在同一网络，或配置云服务器安全组"
echo "   2. 在手机浏览器中输入服务器IP地址"
echo "   3. 例如: http://192.168.1.100:5000"
echo ""
echo "🔧 管理命令:"
echo "   查看日志: docker-compose logs -f"
echo "   停止服务: docker-compose down"
echo "   重启服务: docker-compose restart"
echo "   更新代码: git pull && docker-compose up -d --build"
echo ""
echo "========================================"
