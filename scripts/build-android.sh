#!/bin/bash

# Android APK打包脚本
# 版本: V8.0.0

set -e

echo "========================================"
echo "儿童产品设计助手 - Android APK打包"
echo "版本: V8.0.0"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查必要的工具
echo -e "${YELLOW}🔍 检查环境...${NC}"

if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java 未安装！${NC}"
    echo "请安装 JDK 11 或更高版本"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装！${NC}"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm 未安装！${NC}"
    echo "请安装 pnpm: npm install -g pnpm"
    exit 1
fi

echo -e "${GREEN}✅ 环境检查通过${NC}"
echo ""

# 安装依赖
echo -e "${YELLOW}📦 安装依赖...${NC}"
pnpm install

# 构建Web应用
echo -e "${YELLOW}🏗️  构建Web应用...${NC}"
pnpm run build

# 初始化Capacitor（如果需要）
if [ ! -d "android" ]; then
    echo -e "${YELLOW}📱 初始化Android平台...${NC}"
    npx cap add android
fi

# 同步资源
echo -e "${YELLOW}🔄 同步资源到Android...${NC}"
npx cap sync android

echo ""
echo "========================================"
echo -e "${GREEN}✅ 准备完成！${NC}"
echo "========================================"
echo ""
echo "📱 下一步操作:"
echo ""
echo "方式一：使用Android Studio打包"
echo "  1. 运行: npx cap open android"
echo "  2. 在Android Studio中打开项目"
echo "  3. 点击 Build → Build Bundle(s) / APK(s) → Build APK(s)"
echo "  4. APK文件位置: android/app/build/outputs/apk/"
echo ""
echo "方式二：使用命令行打包"
echo "  1. 进入android目录: cd android"
echo "  2. 运行打包命令: ./gradlew assembleDebug"
echo "  3. APK文件位置: app/build/outputs/apk/debug/"
echo ""
echo "方式三：使用Capacitor Cloud (在线构建)"
echo "  1. 注册Capacitor Cloud: https://cloud.capacitorjs.com/"
echo "  2. 运行: npx cap cloud:build android"
echo ""
echo "========================================"
