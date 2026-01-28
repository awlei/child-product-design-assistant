# 快速构建 APK 指南

## 方式一：GitHub Actions（最推荐）⭐

### 步骤：

1. **推送到 GitHub**
   ```bash
   git add .
   git commit -m "chore: prepare for APK build v1.3.0"
   git push origin main
   ```

2. **查看构建状态**
   - 访问 GitHub 仓库
   - 点击 "Actions" 标签
   - 查看 "Build Android APK" 工作流

3. **下载 APK**
   - 构建完成后，在 Actions 页面找到工作流运行记录
   - 滚动到 "Artifacts" 部分
   - 下载 `child-product-design-assistant-xxx.zip`
   - 解压后获得 `app-debug.apk`

### 优点：
- ✅ 无需本地安装 Android 环境
- ✅ 自动化构建，一键完成
- ✅ 免费使用 GitHub 托管

---

## 方式二：Capacitor Cloud（快速）🚀

### 步骤：

1. **安装 Capacitor CLI**
   ```bash
   npm install -g @capacitor/cli
   ```

2. **同步到 Android**
   ```bash
   cd /workspace/projects
   npx cap sync android
   ```

3. **上传到 Capacitor Cloud 构建**
   ```bash
   npx cap build android
   ```

4. **登录并等待构建**
   - 使用 Capacitor Cloud 账号登录
   - 等待云端构建完成（约 5-10 分钟）
   - 下载生成的 APK

### 优点：
- ✅ 速度快，无需本地配置
- ✅ 支持 iOS 和 Android
- ✅ 可选发布到应用商店

---

## 方式三：本地构建（需要环境）💻

### 环境要求：

- **Java**：JDK 17 或更高版本
- **Android SDK**：API 33 或更高版本
- **Node.js**：v20 或更高版本
- **pnpm**：v9.0.0 或更高版本

### 快速开始：

#### 1. 使用构建脚本（推荐）

```bash
cd /workspace/projects
bash scripts/build-apk.sh
```

#### 2. 手动构建

```bash
# 进入项目目录
cd /workspace/projects

# 安装依赖
pnpm install

# 构建 Next.js 项目
pnpm run build

# 同步到 Android
npx cap sync android

# 构建 APK
cd android
chmod +x gradlew
./gradlew assembleDebug
```

#### 3. 查找 APK

构建完成后，APK 文件位于：
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 安装到设备：

```bash
# 通过 ADB 安装
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# 或者手动传输到手机安装
```

---

## 构建方式对比

| 方式 | 速度 | 难度 | 需要环境 | 推荐 |
|------|------|------|----------|------|
| GitHub Actions | 10-15 分钟 | 简单 | 无 | ⭐⭐⭐⭐⭐ |
| Capacitor Cloud | 5-10 分钟 | 简单 | 无 | ⭐⭐⭐⭐ |
| 本地构建 | 5-10 分钟 | 中等 | Android 环境 | ⭐⭐⭐ |

---

## 常见问题

### Q1: GitHub Actions 构建失败？
**A**: 检查以下几点：
- 确保 `pnpm-lock.yaml` 文件存在
- 确保所有依赖都已提交
- 查看 Actions 日志定位具体错误

### Q2: 本地构建报错 "Gradle not found"？
**A**: 安装 Gradle 或使用 Android 项目自带的 gradlew：
```bash
cd android
chmod +x gradlew
./gradlew assembleDebug
```

### Q3: 本地构建报错 "SDK not found"？
**A**: 设置环境变量：
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Q4: APK 安装失败？
**A**:
- 确保手机已开启 "允许安装未知来源应用"
- 如果是旧版本，先卸载再安装
- 检查 APK 签名是否匹配

### Q5: 如何生成签名版本的 APK？
**A**: 使用以下命令：
```bash
cd android
./gradlew assembleRelease
```

---

## 当前项目状态

✅ 项目已成功构建
✅ Next.js 静态文件已生成
✅ Capacitor 已同步到 Android
✅ GitHub Actions 工作流已配置
✅ 本地构建脚本已创建

**推荐**：使用 GitHub Actions 方式构建，无需配置本地环境！

---

## 快速命令参考

```bash
# GitHub Actions 构建
git add .
git commit -m "chore: prepare for APK build"
git push origin main

# Capacitor Cloud 构建
npx cap sync android
npx cap build android

# 本地构建（使用脚本）
bash scripts/build-apk.sh

# 本地构建（手动）
pnpm run build
npx cap sync android
cd android && ./gradlew assembleDebug

# 安装到设备
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```
