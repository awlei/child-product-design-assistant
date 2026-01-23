# 📱 儿童产品设计助手 V8.0.0 - Android手机安装方案（无需在线服务）

## 🎯 为什么无法使用Capacitor Cloud？

**可能原因：**
- 网络连接问题
- Capacitor Cloud服务暂时不可用
- 地区访问限制

**无需担心！我们有3种替代方案：**

---

## 🚀 方案一：Docker部署 + 手机浏览器访问（推荐，最简单）

### ⏱️ 所需时间：5-10分钟
### 🎯 适合：所有用户，无需任何开发环境

### 优势
- ✅ 无需安装任何开发工具
- ✅ 无需构建APK
- ✅ 一键部署
- ✅ 支持所有手机（Android/iOS）
- ✅ 自动更新

### 详细步骤

#### 第1步：准备服务器

**选择A：使用你现有的云服务器**
- 阿里云、腾讯云、华为云等
- 系统要求：Ubuntu 20.04+ / CentOS 7+
- 内存要求：≥2GB

**选择B：使用本地电脑**
- Windows 10/11 + Docker Desktop
- macOS + Docker Desktop
- Linux + Docker

#### 第2步：下载并部署

1. **下载Docker版本**
   ```
   https://coze-coding-project.tos.coze.site/coze_storage_7598078310014550031/child-product-design-assistant-v8.0.0-docker.tar_4677b77b.gz?sign=1769736706-69a0006ab2-0-3b70f8ec39280177e281cf5db9ac1d5c3c71354cb1024c8f1f54dd60887047ee
   ```

2. **上传到服务器**
   ```bash
   # 使用SCP上传
   scp child-product-design-assistant-v8.0.0-docker.tar.gz user@your-server:/home/user/

   # 或使用其他方式上传
   ```

3. **解压并部署**
   ```bash
   # SSH连接到服务器
   ssh user@your-server

   # 解压
   tar -xzf child-product-design-assistant-v8.0.0-docker.tar.gz
   cd child-product-design-assistant

   # 一键部署
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **开放端口**
   ```bash
   # 云服务器需要在安全组中开放5000端口
   # 本地电脑Docker会自动开放
   ```

#### 第3步：手机访问

**本地WiFi访问（同一网络）**
```bash
# 查看服务器IP
ip addr show

# 在手机浏览器输入
http://服务器IP:5000
# 例如：http://192.168.1.100:5000
```

**云服务器访问**
```bash
# 在手机浏览器输入
http://云服务器公网IP:5000
```

#### 第4步：添加到主屏幕（类似APP体验）

**Android:**
1. Chrome浏览器打开应用
2. 点击右上角菜单（三个点）
3. 选择"添加到主屏幕"
4. 点击"添加"

**iOS:**
1. Safari浏览器打开应用
2. 点击底部的"分享"按钮
3. 选择"添加到主屏幕"
4. 点击"添加"

### 结果
- 🎉 可以像使用APP一样使用
- ✅ 支持离线缓存
- ✅ 全屏显示
- ✅ 自动更新

---

## 🛠️ 方案二：Android Studio本地构建（需要开发环境）

### ⏱️ 所需时间：30-60分钟
### 🎯 适合：愿意安装开发环境的用户

### 优势
- ✅ 生成原生APK
- ✅ 可以发布到应用商店
- ✅ 完全控制
- ✅ 无需服务器

### 详细步骤

#### 第1步：安装JDK 11+

**Windows:**
1. 下载 JDK 11
   ```
   https://www.oracle.com/java/technologies/downloads/#java11
   ```
2. 运行安装程序
3. 配置环境变量：
   - 新建系统变量：`JAVA_HOME=C:\Program Files\Java\jdk-11`
   - 编辑Path：添加`%JAVA_HOME%\bin`

**macOS:**
```bash
# 使用Homebrew安装
brew install openjdk@11

# 配置环境变量（添加到 ~/.zshrc）
export JAVA_HOME=$(/usr/libexec/java_home -v 11)
```

**验证安装：**
```bash
java -version
# 应该显示：java version "11.x.x"
```

#### 第2步：安装Android Studio

1. **下载**
   ```
   https://developer.android.com/studio
   ```
   - Windows: `android-studio-windows.exe`
   - macOS: `android-studio-mac.dmg`
   - Linux: `android-studio-linux.tar.gz`

2. **安装**
   - 双击安装程序
   - 按照向导完成安装

3. **配置SDK**
   - 打开 Android Studio
   - 等待初始设置完成
   - 打开 Tools → SDK Manager
   - 安装：
     - Android SDK Platform-Tools
     - Android SDK Build-Tools 33.0.0
     - Android 13.0 (API 33)
   - 点击 Apply 安装

4. **配置环境变量**

   **Windows:**
   - 新建系统变量：`ANDROID_HOME=C:\Users\你的用户名\AppData\Local\Android\Sdk`
   - 编辑Path，添加：
     ```
     %ANDROID_HOME%\platform-tools
     %ANDROID_HOME%\emulator
     ```

   **macOS/Linux:**
   ```bash
   # 添加到 ~/.zshrc 或 ~/.bashrc
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/emulator
   ```

5. **验证安装**
   ```bash
   adb --version
   # 应该显示：Android Debug Bridge version x.x.x
   ```

#### 第3步：下载项目

1. **下载项目文件**
   ```
   https://coze-coding-project.tos.coze.site/coze_storage_7598078310014550031/child-product-design-assistant-v8.0.0-android-complete.tar_957ac06a.gz?sign=1769738241-7ffcb81468-0-3d4c3da2bec34bc4f59c4443dbf4bb004e1a25be697b5d9f2261a1932682549a
   ```

2. **解压项目**
   ```bash
   tar -xzf child-product-design-assistant-v8.0.0-android-complete.tar.gz
   cd child-product-design-assistant
   ```

#### 第4步：安装Node.js和pnpm

**如果还没有安装Node.js：**

1. **下载 Node.js**
   ```
   https://nodejs.org/
   ```
   - 下载 LTS 版本
   - 安装（一路"下一步"）

2. **验证安装**
   ```bash
   node -v
   # 应该显示：v20.x.x
   ```

**安装pnpm：**
```bash
npm install -g pnpm
```

#### 第5步：安装项目依赖并构建

```bash
# 安装依赖
pnpm install

# 构建Web应用（等待2-3分钟）
pnpm run build
```

#### 第6步：同步到Android

```bash
# 初始化Android平台（如果还没有）
npx cap add android

# 同步资源
npx cap sync android

# 打开Android Studio
npx cap open android
```

#### 第7步：在Android Studio中构建APK

1. **等待Gradle同步完成**
   - 第一次运行会下载依赖，需要5-10分钟
   - 等待底部进度条完成

2. **构建Debug APK**
   - 点击菜单：Build → Build Bundle(s) / APK(s) → Build APK(s)
   - 等待构建完成（1-2分钟）

3. **找到APK文件**
   - 构建完成后会弹出通知
   - 点击"locate"查看位置
   - 或手动找到：`android/app/build/outputs/apk/debug/app-debug.apk`

4. **构建Release APK（可选，用于发布）**
   - Build → Generate Signed Bundle / APK
   - 选择 APK
   - 创建或选择密钥库
   - 选择 release 构建类型

#### 第8步：安装到手机

**方法A：通过Android Studio直接安装**

1. **连接手机**
   - USB连接手机到电脑
   - 手机开启"USB调试"
   - 在Android Studio顶部选择你的设备

2. **点击运行**
   - 点击绿色三角形按钮
   - 应用会自动安装到手机并启动

**方法B：手动安装APK**

1. **复制APK到手机**
   - USB连接手机
   - 复制 `app-debug.apk` 到手机

2. **在手机上安装**
   - 打开手机的"文件管理"
   - 找到APK文件
   - 点击"安装"

3. **允许安装未知来源**
   - 如果提示，按照引导允许安装

---

## 🔄 方案三：GitHub Actions自动构建（需要GitHub账号）

### ⏱️ 所需时间：15-20分钟
### 🎯 适合：有GitHub账号的用户

### 优势
- ✅ 完全免费
- ✅ 无需本地安装Android Studio
- ✅ 自动构建
- ✅ 可以下载生成的APK

### 详细步骤

#### 第1步：上传代码到GitHub

1. **创建GitHub仓库**
   - 访问：https://github.com/new
   - 创建新仓库

2. **上传项目代码**
   ```bash
   cd child-product-design-assistant

   # 初始化Git（如果还没有）
   git init
   git add .
   git commit -m "Initial commit"

   # 添加远程仓库
   git remote add origin https://github.com/你的用户名/你的仓库名.git

   # 推送到GitHub
   git branch -M main
   git push -u origin main
   ```

#### 第2步：创建GitHub Actions工作流

1. **创建工作流文件**
   ```bash
   mkdir -p .github/workflows
   ```

2. **创建构建脚本**
   创建文件 `.github/workflows/build-android.yml`：

   ```yaml
   name: Build Android APK

   on:
     push:
       branches: [ main ]
     workflow_dispatch:

   jobs:
     build:
       runs-on: ubuntu-latest

       steps:
         - name: Checkout code
           uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '20'

         - name: Install pnpm
           run: npm install -g pnpm

         - name: Install dependencies
           run: pnpm install

         - name: Build app
           run: pnpm run build

         - name: Setup Java
           uses: actions/setup-java@v4
           with:
             distribution: 'temurin'
             java-version: '17'

         - name: Setup Android SDK
           uses: android-actions/setup-android@v3

         - name: Build APK
           run: |
             npx cap add android
             npx cap sync android
             cd android
             ./gradlew assembleDebug

         - name: Upload APK
           uses: actions/upload-artifact@v4
           with:
             name: app-debug
             path: android/app/build/outputs/apk/debug/app-debug.apk
   ```

3. **提交并推送**
   ```bash
   git add .github/workflows/build-android.yml
   git commit -m "Add GitHub Actions workflow"
   git push
   ```

#### 第3步：触发构建

1. **自动构建**
   - 代码推送后自动触发
   - 访问：https://github.com/你的用户名/你的仓库名/actions

2. **手动触发**
   - 进入 Actions 页面
   - 选择 "Build Android APK"
   - 点击 "Run workflow"

#### 第4步：下载APK

1. **等待构建完成**
   - 通常需要10-15分钟
   - 状态显示绿色 ✓ 表示成功

2. **下载APK**
   - 点击构建任务
   - 滚动到底部
   - 在 "Artifacts" 部分找到 `app-debug`
   - 点击下载

3. **安装到手机**
   - 按照方案二的步骤安装

---

## 📊 三种方案对比

| 方案 | 时间 | 难度 | 需要服务器 | 需要开发环境 | 是否生成APK |
|------|------|------|-----------|------------|------------|
| Docker部署 | 5-10分钟 | ⭐⭐ | ✅ 可选 | ❌ 不需要 | ❌ 不需要 |
| Android Studio | 30-60分钟 | ⭐⭐⭐⭐ | ❌ 不需要 | ✅ 需要 | ✅ 是 |
| GitHub Actions | 15-20分钟 | ⭐⭐⭐ | ❌ 不需要 | ❌ 不需要 | ✅ 是 |

---

## 🎯 推荐选择

### 如果你是普通用户
**→ 选择方案一（Docker部署）**
- 最简单
- 最快速
- 可以直接在手机浏览器使用
- 无需任何技术背景

### 如果你有开发经验
**→ 选择方案二（Android Studio）**
- 完全控制
- 可以定制
- 可以发布到应用商店

### 如果你有GitHub账号
**→ 选择方案三（GitHub Actions）**
- 无需本地环境
- 免费自动构建
- 可以生成APK

---

## ❓ 常见问题

### Q1：不想配置开发环境，又没有服务器怎么办？
**A：** 使用免费云服务
- Render（https://render.com/）
- Railway（https://railway.app/）
- Vercel（https://vercel.com/）
- 这些都提供免费额度，可以部署Web应用

### Q2：Docker部署后，手机能离线使用吗？
**A：** 可以！
- 第一次访问后，PWA会缓存资源
- 以后可以离线使用（大部分功能）
- AI功能需要网络

### Q3：Android Studio构建需要多长时间？
**A：**
- 首次构建：30-60分钟（包括下载依赖）
- 后续构建：5-10分钟

### Q4：GitHub Actions构建免费吗？
**A：** 是的！
- 公开仓库：完全免费
- 私有仓库：每月2000分钟免费额度

---

## 📚 需要帮助？

### 方案一问题
- 查看 `DEPLOY.md` 文档
- 检查Docker是否安装成功
- 确保端口5000已开放

### 方案二问题
- 查看本文档的详细步骤
- 确保JDK和Android SDK配置正确
- 检查环境变量

### 方案三问题
- 访问 GitHub Actions 页面查看日志
- 确保GitHub仓库为公开（免费）
- 检查工作流文件格式是否正确

---

## ✅ 开始使用

**现在就选择一个方案开始吧！**

1. **最快方案** → 方案一（Docker部署）
2. **最完整方案** → 方案二（Android Studio）
3. **最省心方案** → 方案三（GitHub Actions）

祝你成功！🎉

---

**版本**: V8.0.0
**更新日期**: 2026-01-23
