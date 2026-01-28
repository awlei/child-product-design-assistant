#!/bin/bash
# 验证构建准备状态

echo "=========================================="
echo "APK 构建准备验证"
echo "=========================================="

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PASS=0
FAIL=0

# 检查 Next.js 构建
echo -e "\n${YELLOW}[1] 检查 Next.js 构建...${NC}"
if [ -d "out" ] && [ -f "out/index.html" ]; then
    echo -e "${GREEN}✓ Next.js 构建完成${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ Next.js 构建未完成${NC}"
    ((FAIL++))
fi

# 检查 Capacitor 配置
echo -e "\n${YELLOW}[2] 检查 Capacitor 配置...${NC}"
if [ -f "capacitor.config.ts" ]; then
    echo -e "${GREEN}✓ Capacitor 配置文件存在${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ Capacitor 配置文件不存在${NC}"
    ((FAIL++))
fi

# 检查 Android 平台
echo -e "\n${YELLOW}[3] 检查 Android 平台...${NC}"
if [ -d "android" ] && [ -f "android/app/capacitor.build.gradle" ]; then
    echo -e "${GREEN}✓ Android 平台已初始化${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ Android 平台未初始化${NC}"
    echo -e "${YELLOW}  请运行: npx cap add android${NC}"
    ((FAIL++))
fi

# 检查静态资源同步
echo -e "\n${YELLOW}[4] 检查静态资源同步...${NC}"
if [ -d "android/app/src/main/assets/public" ]; then
    echo -e "${GREEN}✓ 静态资源已同步到 Android${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ 静态资源未同步${NC}"
    echo -e "${YELLOW}  请运行: npx cap sync android${NC}"
    ((FAIL++))
fi

# 检查数据文件
echo -e "\n${YELLOW}[5] 检查数据文件...${NC}"
DATA_FILES=(
    "out/data/test-matrix-data.json"
    "out/data/brand-data.json"
    "out/data/gps-anthro-data.json"
)
ALL_DATA_EXISTS=true
for file in "${DATA_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ 缺失: $file${NC}"
        ALL_DATA_EXISTS=false
    fi
done
if [ "$ALL_DATA_EXISTS" = true ]; then
    echo -e "${GREEN}✓ 所有数据文件已就位${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ 部分数据文件缺失${NC}"
    ((FAIL++))
fi

# 检查构建文档
echo -e "\n${YELLOW}[6] 检查构建文档...${NC}"
DOCS=(
    "QUICK_BUILD_GUIDE.md"
    "APK_BUILD_GUIDE.md"
    "BUILD_STATUS.md"
    "BUILD_README.md"
)
ALL_DOCS_EXISTS=true
for doc in "${DOCS[@]}"; do
    if [ ! -f "$doc" ]; then
        echo -e "${RED}✗ 缺失: $doc${NC}"
        ALL_DOCS_EXISTS=false
    fi
done
if [ "$ALL_DOCS_EXISTS" = true ]; then
    echo -e "${GREEN}✓ 所有构建文档已就位${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ 部分构建文档缺失${NC}"
    ((FAIL++))
fi

# 检查 GitHub Actions
echo -e "\n${YELLOW}[7] 检查 GitHub Actions...${NC}"
if [ -f ".github/workflows/build-android.yml" ]; then
    echo -e "${GREEN}✓ GitHub Actions 工作流已配置${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ GitHub Actions 工作流未配置${NC}"
    ((FAIL++))
fi

# 检查构建脚本
echo -e "\n${YELLOW}[8] 检查构建脚本...${NC}"
if [ -f "scripts/build-apk.sh" ]; then
    echo -e "${GREEN}✓ 本地构建脚本已准备${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ 本地构建脚本缺失${NC}"
    ((FAIL++))
fi

# 检查 pnpm-lock.yaml
echo -e "\n${YELLOW}[9] 检查依赖锁文件...${NC}"
if [ -f "pnpm-lock.yaml" ]; then
    echo -e "${GREEN}✓ pnpm-lock.yaml 存在${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ pnpm-lock.yaml 缺失${NC}"
    ((FAIL++))
fi

# 总结
echo -e "\n=========================================="
echo "验证结果"
echo "=========================================="
echo -e "${GREEN}通过: $PASS${NC}"
echo -e "${RED}失败: $FAIL${NC}"
echo "=========================================="

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ 所有检查通过！项目已准备好构建 APK${NC}"
    echo -e "\n${YELLOW}推荐构建方式：${NC}"
    echo "1. GitHub Actions（推荐）: git push origin main"
    echo "2. Capacitor Cloud: npx cap build android"
    echo "3. 本地构建: bash scripts/build-apk.sh"
    echo -e "\n${YELLOW}详细指南请查看: QUICK_BUILD_GUIDE.md${NC}"
    exit 0
else
    echo -e "${RED}✗ 部分检查未通过，请修复问题后再构建${NC}"
    exit 1
fi
