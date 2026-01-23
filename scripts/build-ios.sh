#!/bin/bash

# iOS APP打包脚本
# 版本: V8.0.0

set -e

echo "========================================"
echo "儿童产品设计助手 - iOS APP打包"
echo "版本: V8.0.0"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查操作系统
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ 此脚本只能在macOS上运行！${NC}"
    echo "iOS应用打包需要Xcode，只能在macOS上完成"
    exit 1
fi

# 检查必要的工具
echo -e "${YELLOW}🔍 检查环境...${NC}"

if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ Xcode 未安装！${NC}"
    echo "请从App Store安装Xcode"
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
if [ ! -d "ios" ]; then
    echo -e "${YELLOW}📱 初始化iOS平台...${NC}"
    npx cap add ios
fi

# 同步资源
echo -e "${YELLOW}🔄 同步资源到iOS...${NC}"
npx cap sync ios

echo ""
echo "========================================"
echo -e "${GREEN}✅ 准备完成！${NC}"
echo "========================================"
echo ""
echo "📱 下一步操作:"
echo ""
echo "方式一：使用Xcode打包"
echo "  1. 运行: npx cap open ios"
echo "  2. 在Xcode中打开项目"
echo "  3. 选择设备或模拟器"
echo "  4. 点击 Product → Archive 打包"
echo "  5. 在Organizer中导出IPA文件"
echo ""
echo "方式二：使用命令行打包"
echo "  1. 进入ios目录: cd ios"
echo "  2. 运行打包命令: xcodebuild -workspace App.xcworkspace -scheme App -configuration Release archive"
echo ""
echo "方式三：使用Capacitor Cloud (在线构建)"
echo "  1. 注册Capacitor Cloud: https://cloud.capacitorjs.com/"
echo "  2. 运行: npx cap cloud:build ios"
echo ""
echo "注意: 上传到App Store需要Apple开发者账号 ($99/年)"
echo "========================================"
