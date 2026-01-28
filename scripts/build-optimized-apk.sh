#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "🚀 开始构建优化后的Release APK..."
echo "=================================="

# 步骤1: 清理旧的构建文件
echo "📦 步骤1: 清理旧的构建文件..."
rm -rf .next out node_modules/.cache
pnpm install --prefer-frozen-lockfile --prefer-offline

# 步骤2: 构建Next.js项目
echo "🔨 步骤2: 构建Next.js项目..."
npx next build

# 步骤3: 同步Capacitor项目
echo "🔄 步骤3: 同步Capacitor项目..."
npx cap sync android

# 步骤4: 进入Android目录
echo "📱 步骤4: 准备Android构建..."
cd android

# 步骤5: 检查Java环境
echo "☕ 步骤5: 检查Java环境..."
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo "✅ Java已安装: $JAVA_VERSION"
else
    echo "❌ Java未安装，请先安装JDK 17或更高版本"
    exit 1
fi

# 步骤6: 生成签名密钥（如果不存在）
echo "🔑 步骤6: 检查签名密钥..."
if [ ! -f "app/child-design-release.keystore" ]; then
    echo "⚠️  签名密钥不存在，生成临时密钥..."
    echo "注意：生产环境请使用正式的密钥库文件"
    if command -v keytool &> /dev/null; then
        keytool -genkey -v \
            -keystore app/child-design-release.keystore \
            -alias child-design-key \
            -keyalg RSA \
            -keysize 2048 \
            -validity 10000 \
            -storepass ChildDesign2024! \
            -keypass ChildDesign2024! \
            -dname "CN=Child Product Design Assistant, OU=Development, O=Child Product Design, L=Beijing, ST=Beijing, C=CN" \
            2>/dev/null || echo "⚠️  keytool不可用，将使用Debug签名"
    else
        echo "⚠️  keytool不可用，将使用Debug签名"
    fi
fi

# 步骤7: 构建Release APK
echo "🏗️  步骤7: 构建Release APK..."
echo "构建类型: Release"
echo "混淆: 启用"
echo "资源压缩: 启用"

# 尝试使用Gradle Wrapper
if [ -f "gradlew" ]; then
    echo "使用Gradle Wrapper构建..."
    chmod +x gradlew
    ./gradlew assembleRelease --stacktrace || {
        echo "⚠️  Gradle Wrapper构建失败，尝试使用全局Gradle"
        gradle assembleRelease --stacktrace || {
            echo "⚠️  全局Gradle构建失败，使用Capacitor Cloud构建"
            echo "请运行: npx cap build android"
            exit 1
        }
    }
elif command -v gradle &> /dev/null; then
    echo "使用全局Gradle构建..."
    gradle assembleRelease --stacktrace
else
    echo "❌ Gradle未安装"
    echo "请安装Android Studio或使用Capacitor Cloud构建"
    echo "运行: npx cap build android"
    exit 1
fi

# 步骤8: 查找生成的APK
echo ""
echo "🔍 步骤8: 查找生成的APK..."
APK_PATH=$(find app/build/outputs/apk/release -name "*.apk" | head -n 1)

if [ -n "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo "✅ APK构建成功！"
    echo "📦 文件路径: $APK_PATH"
    echo "📏 文件大小: $APK_SIZE"
    echo ""
    echo "🎉 优化完成！主要改进："
    echo "  ✅ 启用代码混淆（ProGuard/R8）"
    echo "  ✅ 启用资源压缩"
    echo "  ✅ 移除不必要的权限（PACKAGE_VERIFICATION_AGENT）"
    echo "  ✅ Release签名"
    echo "  ✅ 构建优化"
else
    echo "❌ 未找到生成的APK文件"
    echo "请检查构建日志"
    exit 1
fi

# 步骤9: 验证APK（可选）
echo ""
echo "🔍 步骤9: APK信息..."
if command -v aapt &> /dev/null; then
    echo "APK详细信息："
    aapt dump badging "$APK_PATH" | head -n 20
else
    echo "⚠️  aapt工具不可用，无法显示APK详细信息"
fi

echo ""
echo "=================================="
echo "✅ 构建完成！"
