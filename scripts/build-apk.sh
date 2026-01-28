#!/bin/bash
# 本地 APK 构建脚本
# 使用说明：
# 1. 确保已安装 Java 17+
# 2. 确保已安装 Android SDK（API 33 或更高版本）
# 3. 确保已配置 JAVA_HOME 和 ANDROID_HOME 环境变量
# 4. 运行此脚本：bash scripts/build-apk.sh

set -e

echo "=========================================="
echo "儿童产品设计助手 - 本地 APK 构建"
echo "=========================================="

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 Java
echo -e "${YELLOW}[1/6] 检查 Java 环境...${NC}"
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
    echo -e "${GREEN}✓ Java 已安装: $(java -version 2>&1 | head -n 1)${NC}"
    if [ "$JAVA_VERSION" -lt 17 ]; then
        echo -e "${RED}✗ Java 版本过低，需要 Java 17+${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Java 未安装${NC}"
    echo -e "${YELLOW}请安装 Java 17 或更高版本${NC}"
    exit 1
fi

# 检查 JAVA_HOME
if [ -z "$JAVA_HOME" ]; then
    echo -e "${YELLOW}⚠ JAVA_HOME 环境变量未设置${NC}"
    echo -e "${YELLOW}建议设置 JAVA_HOME 环境变量${NC}"
else
    echo -e "${GREEN}✓ JAVA_HOME: $JAVA_HOME${NC}"
fi

# 检查 Android SDK
echo -e "${YELLOW}[2/6] 检查 Android SDK...${NC}"
if [ -z "$ANDROID_HOME" ]; then
    if [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
        echo -e "${GREEN}✓ 自动检测到 Android SDK: $ANDROID_HOME${NC}"
    else
        echo -e "${RED}✗ Android SDK 未找到${NC}"
        echo -e "${YELLOW}请设置 ANDROID_HOME 环境变量或安装 Android SDK${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Android SDK: $ANDROID_HOME${NC}"
fi

# 进入项目目录
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
echo -e "${GREEN}✓ 项目目录: $PROJECT_ROOT${NC}"

# 安装依赖
echo -e "${YELLOW}[3/6] 安装项目依赖...${NC}"
pnpm install --prefer-frozen-lockfile

# 构建 Next.js 项目
echo -e "${YELLOW}[4/6] 构建 Next.js 项目...${NC}"
pnpm run build

# 同步到 Android
echo -e "${YELLOW}[5/6] 同步到 Android 平台...${NC}"
npx cap sync android

# 构建 APK
echo -e "${YELLOW}[6/6] 构建 Android APK...${NC}"
cd android

# 检查 gradlew 是否存在
if [ ! -f "gradlew" ]; then
    echo -e "${RED}✗ gradlew 文件不存在${NC}"
    exit 1
fi

# 设置执行权限
chmod +x gradlew

# 构建 Debug APK
echo -e "${GREEN}正在构建 Debug APK...${NC}"
./gradlew assembleDebug --no-daemon

# 检查构建结果
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}✓ APK 构建成功！${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo -e "APK 路径: $PROJECT_ROOT/android/$APK_PATH"
    echo -e "APK 大小: $APK_SIZE"
    echo -e ""
    echo -e "${YELLOW}安装到设备：${NC}"
    echo -e "adb install -r $PROJECT_ROOT/android/$APK_PATH"
    echo -e ""
    echo -e "${YELLOW}或者手动传输到手机安装${NC}"
else
    echo -e "${RED}✗ APK 构建失败${NC}"
    exit 1
fi

# 返回项目根目录
cd "$PROJECT_ROOT"
