# 🚀 GitHub Actions 构建Android APK超详细教程

## 📚 目录
1. [GitHub Actions 简介](#github-actions-简介)
2. [准备工作](#准备工作)
3. [创建GitHub仓库](#创建github仓库)
4. [上传代码到GitHub](#上传代码到github)
5. [配置GitHub Actions工作流](#配置github-actions工作流)
6. [触发构建](#触发构建)
7. [下载APK](#下载apk)
8. [高级配置](#高级配置)
9. [常见问题解决](#常见问题解决)
10. [优化构建速度](#优化构建速度)

---

## 🎯 GitHub Actions 简介

### 什么是GitHub Actions？

**GitHub Actions** 是GitHub提供的**免费CI/CD（持续集成/持续部署）服务**，可以：

- ✅ **自动构建应用**
- ✅ **自动运行测试**
- ✅ **自动部署到服务器**
- ✅ **完全免费**（公开仓库）
- ✅ **无需本地开发环境**

### 为什么使用GitHub Actions构建APK？

| 优势 | 说明 |
|------|------|
| 🆓 完全免费 | 公开仓库无限制，私有仓库每月2000分钟 |
| 🚀 自动化 | 推送代码自动构建，无需手动操作 |
| 💻 无需本地环境 | 不需要安装Android Studio、JDK等 |
| 📦 可下载 | 构建完成后直接下载APK文件 |
| 🔄 可重复 | 每次推送代码都会重新构建 |
| 📊 可追踪 | 在GitHub上查看构建历史和日志 |
| 🌐 跨平台 | 可以在任何地方（Windows/Mac/Linux）操作 |

### 费用说明

| 仓库类型 | 免费额度 |
|---------|---------|
| 公开仓库 | 无限免费 |
| 私有仓库 | 每月2000分钟 |
| 超出后 | $0.008/分钟 |

**构建一次APK大约需要10-15分钟，私有仓库每月可以构建约130-200次！**

---

## 🔧 准备工作

### 1. 注册GitHub账号（如果还没有）

**步骤：**

1. **访问GitHub**
   ```
   https://github.com/
   ```

2. **点击"Sign up"**
   - 输入邮箱（推荐Gmail）
   - 创建密码
   - 输入用户名（建议使用英文，如：zhangsan123）
   - 等待邮箱验证

3. **完善个人信息**
   - 上传头像（可选）
   - 填写个人简介（可选）

**注意事项：**
- ✅ 记住你的**用户名**（后面会用到）
- ✅ 记住你的**邮箱和密码**
- ✅ 建议**开启两步验证**（更安全）

### 2. 安装Git工具（如果还没有）

**Windows：**
```bash
# 下载Git
https://git-scm.com/download/win

# 运行安装程序
# 全部选择默认，一路"下一步"
```

**macOS：**
```bash
# macOS通常已预装Git
git --version

# 如果没有，使用Homebrew安装
brew install git
```

**Linux (Ubuntu/Debian)：**
```bash
sudo apt update
sudo apt install git
```

**验证安装：**
```bash
git --version
# 应该显示：git version 2.x.x
```

### 3. 配置Git用户信息

```bash
# 配置用户名（使用你的GitHub用户名）
git config --global user.name "你的GitHub用户名"

# 配置邮箱（使用你的GitHub邮箱）
git config --global user.email "your-email@example.com"
```

### 4. 下载项目文件

**如果还没有下载，先下载：**

```
https://coze-coding-project.tos.coze.site/coze_storage_7598078310014550031/child-product-design-assistant-v8.0.0-no-cloud.tar_95fa6d45.gz?sign=1769742852-2cdd89132d-0-1ae77fd17d8b4c295bafd575bcd45906b8db8a9f68c953529582ca3c0f52e742
```

**解压项目：**
```bash
tar -xzf child-product-design-assistant-v8.0.0-no-cloud.tar.gz
cd child-product-design-assistant
```

---

## 📦 创建GitHub仓库

### 步骤1：登录GitHub

访问：https://github.com/login

### 步骤2：创建新仓库

1. **点击右上角的"+"号**
   - 选择"New repository"

2. **填写仓库信息**

   **Repository name（仓库名称）：**
   ```
   child-product-design-assistant
   ```
   （建议使用小写字母和连字符）

   **Description（描述）：**
   ```
   儿童产品设计助手 - Android应用
   ```

   **Public/Private（公开/私有）：**
   - 选择 **Public**（推荐，完全免费）
   - 或选择 **Private**（私有，每月2000分钟免费）

3. **其他设置**

   ☐ Add a README file - **不勾选**（我们手动创建）
   ☐ Add .gitignore - **不勾选**
   ☐ Choose a license - **不勾选**

4. **点击"Create repository"**

5. **保存仓库地址**
   ```
   https://github.com/你的用户名/child-product-design-assistant.git
   ```
   复制这个地址，后面会用到！

### 示例

如果你的用户名是 `zhangsan123`，仓库地址就是：
```
https://github.com/zhangsan123/child-product-design-assistant.git
```

---

## 📤 上传代码到GitHub

### 方法A：使用命令行（推荐）

#### 步骤1：初始化Git仓库

```bash
# 进入项目目录
cd child-product-design-assistant

# 初始化Git仓库
git init
```

**看到提示：**
```
Initialized empty Git repository in /path/to/child-product-design-assistant/.git/
```

#### 步骤2：添加所有文件

```bash
# 添加所有文件到暂存区
git add .
```

**说明：**
- `.` 表示当前目录下的所有文件
- `git add` 将文件添加到暂存区
- 可能会看到一些警告，忽略即可

#### 步骤3：创建首次提交

```bash
# 提交文件
git commit -m "Initial commit"
```

**看到提示：**
```
[main (root-commit) abc1234] Initial commit
 X files changed, Y insertions(+), Z deletions(-)
```

**说明：**
- `-m` 后面是提交信息（描述这次提交的内容）
- `Initial commit` 表示首次提交

#### 步骤4：添加远程仓库

```bash
# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/child-product-design-assistant.git
```

**示例：**
```bash
git remote add origin https://github.com/zhangsan123/child-product-design-assistant.git
```

**验证远程仓库：**
```bash
git remote -v
```

**应该看到：**
```
origin  https://github.com/你的用户名/child-product-design-assistant.git (fetch)
origin  https://github.com/你的用户名/child-product-design-assistant.git (push)
```

#### 步骤5：重命名主分支为main

```bash
# Git 2.28+默认使用main分支
# 如果你的Git版本较老，使用master分支
git branch -M main
```

#### 步骤6：推送代码到GitHub

```bash
# 推送到远程仓库
git push -u origin main
```

**如果第一次推送，GitHub会要求你登录：**

**选项1：使用Personal Access Token（推荐）**

1. **生成Token**
   - 访问：https://github.com/settings/tokens
   - 点击"Generate new token" → "Generate new token (classic)"
   - Note填写：`git-push`
   - Expiration选择：`No expiration`（永不过期）或选择有效时间
   - 勾选权限：`repo`（完整的仓库访问权限）
   - 点击"Generate token"
   - 复制生成的token（只显示一次，立即复制！）

2. **使用Token登录**
   ```bash
   Username: 你的GitHub用户名
   Password: 刚才复制的token
   ```

**选项2：使用SSH密钥（更安全，但配置复杂）**

```bash
# 生成SSH密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 复制公钥
cat ~/.ssh/id_ed25519.pub

# 添加到GitHub
# 访问：https://github.com/settings/keys
# 点击"New SSH key"
# 粘贴公钥，点击"Add SSH key"
```

**推送成功后看到：**
```
Enumerating objects: X, done.
Counting objects: 100% (X/Y), done.
...
To https://github.com/你的用户名/child-product-design-assistant.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

#### 步骤7：验证上传成功

1. **访问你的GitHub仓库**
   ```
   https://github.com/你的用户名/child-product-design-assistant
   ```

2. **检查文件列表**
   - 应该能看到所有项目文件
   - 包括：`package.json`, `capacitor.config.ts`, `src/`, `public/` 等

### 方法B：使用GitHub网页上传（文件少时可用）

**如果项目文件较少（<100个文件），可以直接在网页上传：**

1. **访问你的仓库**
   ```
   https://github.com/你的用户名/child-product-design-assistant
   ```

2. **点击"uploading an existing file"**

3. **拖拽或选择文件**
   - 将项目文件夹拖到上传区域
   - 或点击"choose your files"选择文件

4. **填写提交信息**
   - 在"Commit changes"框中输入：`Initial commit`

5. **点击"Commit changes"**

**⚠️ 注意：**
- 如果文件很多（>100个），建议使用方法A（命令行）
- 网页上传有大小限制（每个文件≤25MB）

---

## ⚙️ 配置GitHub Actions工作流

### 步骤1：创建工作流目录

```bash
# 进入项目目录
cd child-product-design-assistant

# 创建工作流目录
mkdir -p .github/workflows
```

### 步骤2：创建工作流文件

创建文件 `.github/workflows/build-android.yml`：

```bash
# 使用文本编辑器创建
nano .github/workflows/build-android.yml

# 或使用其他编辑器
vim .github/workflows/build-android.yml
# Windows用记事本或VS Code
```

### 步骤3：粘贴工作流配置

**复制以下完整配置：**

```yaml
# 工作流名称
name: Build Android APK

# 触发条件：推送到main分支时自动触发，或手动触发
on:
  push:
    branches: [ main ]
  workflow_dispatch:  # 允许在GitHub网页上手动触发

# 定义构建任务
jobs:
  build:
    # 运行环境：最新版Ubuntu
    runs-on: ubuntu-latest

    # 定义步骤
    steps:
      # 步骤1：检出代码
      - name: Checkout code
        uses: actions/checkout@v4

      # 步骤2：设置Node.js环境
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'  # 使用Node.js 20版本

      # 步骤3：安装pnpm包管理器
      - name: Install pnpm
        run: npm install -g pnpm

      # 步骤4：安装项目依赖
      - name: Install dependencies
        run: pnpm install

      # 步骤5：构建Web应用
      - name: Build app
        run: pnpm run build

      # 步骤6：设置Java环境（用于Android构建）
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'  # 使用Eclipse Temurin发行版
          java-version: '17'      # Java 17版本

      # 步骤7：设置Android SDK
      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      # 步骤8：构建Android APK
      - name: Build APK
        run: |
          # 添加Android平台（如果还没有）
          npx cap add android

          # 同步Web代码到Android
          npx cap sync android

          # 进入Android目录
          cd android

          # 使用Gradle构建Debug版本的APK
          ./gradlew assembleDebug

          # 如果需要构建Release版本，取消下面的注释
          # ./gradlew assembleRelease

      # 步骤9：上传APK文件
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: app-debug-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
          retention-days: 7  # 保留7天
```

### 步骤4：保存文件

**nano编辑器：**
- 按 `Ctrl + O` 保存
- 按 `Enter` 确认
- 按 `Ctrl + X` 退出

**vim编辑器：**
- 按 `Esc`
- 输入 `:wq`
- 按 `Enter`

**Windows记事本/VS Code：**
- 文件 → 保存
- 文件名：`build-android.yml`
- 位置：`.github/workflows/`

### 步骤5：提交工作流文件

```bash
# 添加工作流文件
git add .github/workflows/build-android.yml

# 提交
git commit -m "Add GitHub Actions workflow for Android build"

# 推送到GitHub
git push
```

### 步骤6：验证工作流文件

1. **访问GitHub仓库**
   ```
   https://github.com/你的用户名/child-product-design-assistant
   ```

2. **点击"Actions"标签**
   - 应该能看到"Build Android APK"工作流
   - 状态显示：✓（绿色对勾）表示成功

3. **查看工作流详情**
   - 点击"Build Android APK"
   - 可以看到所有的运行记录

---

## 🚀 触发构建

### 方法A：自动触发（代码推送时）

**推送代码后自动触发：**

```bash
# 修改任意文件（例如修改README）
echo "# 儿童产品设计助手" >> README.md

# 提交并推送
git add .
git commit -m "Update README"
git push
```

**自动触发后：**

1. 访问仓库的Actions页面
2. 看到新的构建任务正在运行
3. 等待10-15分钟完成

### 方法B：手动触发（无需修改代码）

**步骤：**

1. **访问Actions页面**
   ```
   https://github.com/你的用户名/child-product-design-assistant/actions
   ```

2. **选择工作流**
   - 在左侧边栏选择"Build Android APK"

3. **点击"Run workflow"**
   - 右上角有一个"Run workflow"按钮

4. **选择分支**
   - 选择"main"分支

5. **点击"Run workflow"（绿色按钮）**
   - 构建立即开始

### 方法C：通过GitHub API触发（高级用户）

**使用curl命令：**

```bash
# 替换为你的token和仓库信息
curl -X POST \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/你的用户名/child-product-design-assistant/actions/workflows/build-android.yml/dispatches \
  -d '{"ref":"main"}'
```

---

## 📥 下载APK

### 步骤1：等待构建完成

**访问Actions页面：**
```
https://github.com/你的用户名/child-product-design-assistant/actions
```

**查看构建状态：**
- 🔵 蓝色圆圈 → 运行中
- 🟢 绿色对勾 → 成功
- 🔴 红色叉号 → 失败

**构建时间：**
- 首次构建：15-20分钟（下载Android SDK）
- 后续构建：8-12分钟

### 步骤2：查看构建详情

1. **点击成功的构建任务**
   - 点击绿色的对勾或任务名称

2. **查看构建步骤**
   - 可以看到每个步骤的执行情况
   - 点击步骤可以查看详细日志

3. **检查是否成功**
   - 所有步骤都显示绿色✓
   - 最后一个步骤"Upload APK"应该是成功的

### 步骤3：下载APK文件

**方法A：在GitHub网页下载（推荐）**

1. **在构建详情页面，滚动到底部**
   - 找到"Artifacts"部分

2. **点击"app-debug-apk"**
   - 会自动下载一个ZIP文件

3. **解压ZIP文件**
   - 里面包含：`app-debug.apk`

4. **重命名（可选）**
   - 重命名为：`儿童产品设计助手-v8.0.0.apk`

**方法B：使用GitHub API下载（高级用户）**

```bash
# 需要先获取artifact ID
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/你的用户名/child-product-design-assistant/actions/runs/RUN_ID/artifacts

# 使用artifact ID下载
curl -L -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -O https://api.github.com/repos/你的用户名/child-product-design-assistant/actions/artifacts/ARTIFACT_ID/zip
```

**方法C：使用GitHub CLI（命令行工具）**

```bash
# 安装GitHub CLI
# macOS: brew install gh
# Windows: https://cli.github.com/

# 登录
gh auth login

# 下载最新的artifact
gh run download --name app-debug-apk
```

---

## 🎨 高级配置

### 1. 同时构建Debug和Release版本

修改 `.github/workflows/build-android.yml`：

```yaml
      # 步骤8：构建Android APK
      - name: Build APK
        run: |
          npx cap add android
          npx cap sync android
          cd android

          # 构建Debug版本
          ./gradlew assembleDebug

          # 构建Release版本（需要签名）
          ./gradlew assembleRelease

      # 步骤9：上传Debug APK
      - name: Upload Debug APK
        uses: actions/upload-artifact@v4
        with:
          name: app-debug
          path: android/app/build/outputs/apk/debug/app-debug.apk

      # 步骤10：上传Release APK
      - name: Upload Release APK
        uses: actions/upload-artifact@v4
        with:
          name: app-release
          path: android/app/build/outputs/apk/release/app-release.apk
```

### 2. 自动发布到GitHub Releases

```yaml
# 添加release步骤
      - name: Create Release
        if: startsWith(github.ref, 'refs/tags/')
        uses: softprops/action-gh-release@v1
        with:
          files: |
            android/app/build/outputs/apk/debug/app-debug.apk
            android/app/build/outputs/apk/release/app-release.apk
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**使用方法：**
```bash
# 创建标签并推送
git tag v8.0.0
git push origin v8.0.0
```

### 3. 发送构建通知

**通过Email通知：**

```yaml
      - name: Send email notification
        if: failure()
        uses: dawidd6/action-send-mail@v3
        with:
          server_address: smtp.gmail.com
          server_port: 465
          username: ${{ secrets.EMAIL_USERNAME }}
          password: ${{ secrets.EMAIL_PASSWORD }}
          subject: Android build failed
          body: Build failed, check logs.
          to: your-email@example.com
          from: github-actions@example.com
```

**通过Slack通知：**

```yaml
      - name: Slack Notification
        if: failure()
        uses: rtCamp/action-slack-notify@v2
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
          SLACK_MESSAGE: Android build failed
```

### 4. 缓存依赖，加速构建

```yaml
      # 在"Install dependencies"步骤之前添加
      - name: Cache pnpm modules
        uses: actions/cache@v3
        with:
          path: ~/.pnpm-store
          key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-

      - name: Cache Gradle packages
        uses: actions/cache@v3
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
```

**优势：**
- 首次构建：15-20分钟
- 缓存后：5-8分钟（加速50%！）

### 5. 矩阵构建（多版本测试）

```yaml
jobs:
  build:
    strategy:
      matrix:
        api-level: [30, 31, 32, 33]  # 测试多个Android版本
    runs-on: ubuntu-latest
    steps:
      # ... 其他步骤
      - name: Build APK
        run: |
          # 构建
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: app-debug-api-${{ matrix.api-level }}
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

### 6. 定时构建

```yaml
on:
  schedule:
    # 每天凌晨2点（UTC时间）自动构建
    - cron: '0 2 * * *'
  workflow_dispatch:  # 同时也支持手动触发
```

---

## ❓ 常见问题解决

### Q1：构建失败，提示"Gradle sync failed"

**原因：** Gradle下载依赖失败

**解决方法：**
1. 检查网络连接
2. 增加超时时间
3. 配置Gradle镜像

**配置镜像（在 `android/build.gradle` 中）：**
```gradle
allprojects {
    repositories {
        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/jcenter' }
        maven { url 'https://maven.aliyun.com/repository/central' }
        google()
        mavenCentral()
    }
}
```

### Q2：构建超时

**原因：** 构建时间超过默认的6小时限制

**解决方法：**

```yaml
jobs:
  build:
    timeout-minutes: 60  # 设置超时时间为60分钟
    runs-on: ubuntu-latest
```

### Q3：APK下载失败

**原因：** Artifact已过期（默认90天）

**解决方法：**

```yaml
- name: Upload APK
  uses: actions/upload-artifact@v4
  with:
    name: app-debug-apk
    path: android/app/build/outputs/apk/debug/app-debug.apk
    retention-days: 30  # 保留30天（默认90天）
```

### Q4：私有仓库构建失败

**原因：** 超出免费额度

**解决方法：**

1. **查看使用情况**
   - 访问：https://github.com/settings/billing
   - 查看"Actions minutes"使用情况

2. **升级账号（可选）**
   - Pro：$4/月，3000分钟/月
   - Team：$4/人/月，10000分钟/月

3. **优化构建**
   - 启用缓存
   - 并行构建

### Q5：Token过期或无效

**解决方法：**

1. **重新生成Token**
   - 访问：https://github.com/settings/tokens
   - 删除旧token
   - 生成新token

2. **更新Git配置**
   ```bash
   # Windows凭据管理器
   # 控制面板 → 用户账户 → 凭据管理器 → Windows凭据
   # 找到github.com，删除旧凭据
   ```

### Q6：权限问题

**错误提示：** `Permission denied (publickey)`

**解决方法：**

**选项1：使用HTTPS（推荐）**
```bash
# 切换到HTTPS
git remote set-url origin https://github.com/你的用户名/child-product-design-assistant.git
```

**选项2：配置SSH密钥**
```bash
# 生成SSH密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 启动SSH代理
eval "$(ssh-agent -s)"

# 添加密钥
ssh-add ~/.ssh/id_ed25519

# 复制公钥
cat ~/.ssh/id_ed25519.pub

# 添加到GitHub
# https://github.com/settings/keys
```

### Q7：仓库是私有的，其他人无法下载APK

**解决方法：**

**选项1：公开仓库（推荐）**
- 将仓库改为Public
- 免费且无限额度

**选项2：提供APK直接下载**
- 下载APK后上传到网盘
- 分享下载链接

**选项3：创建Releases**
- 使用GitHub Releases发布APK
- Releases对私有仓库也可见

---

## ⚡ 优化构建速度

### 1. 启用依赖缓存

```yaml
- name: Cache pnpm modules
  uses: actions/cache@v3
  with:
    path: ~/.pnpm-store
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-
```

**效果：**
- 首次：15分钟
- 缓存后：5分钟（**加速66%！**）

### 2. 使用自托管Runner（高级）

**适合企业用户：**

1. **创建自托管Runner**
   - 访问：https://github.com/你的用户名/child-product-design-assistant/settings/actions
   - 点击"Add runner" → "New self-hosted runner"

2. **安装Runner**
   - 下载并运行安装脚本
   - Runner会连接到GitHub

3. **修改工作流**
   ```yaml
   jobs:
     build:
       runs-on: self-hosted  # 使用自托管Runner
   ```

**优势：**
- 完全免费
- 更快的构建速度
- 可以自定义环境

### 3. 并行构建

```yaml
jobs:
  build:
    strategy:
      matrix:
        include:
          - variant: debug
            path: app/build/outputs/apk/debug/app-debug.apk
          - variant: release
            path: app/build/outputs/apk/release/app-release.apk
    runs-on: ubuntu-latest
    steps:
      # ... 构建步骤
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: app-${{ matrix.variant }}
          path: android/${{ matrix.path }}
```

### 4. 减少不必要的步骤

```yaml
# 只在特定文件变化时运行
on:
  push:
    branches: [ main ]
    paths:
      - 'src/**'      # 源代码变化时运行
      - 'package.json'
      - 'capacitor.config.ts'
```

---

## 📊 查看构建统计

### 查看构建历史

访问：https://github.com/你的用户名/child-product-design-assistant/actions

可以看到：
- ✅ 成功的构建次数
- ❌ 失败的构建次数
- ⏱️ 每次构建的耗时
- 📈 趋势图

### 查看构建日志

1. 点击任意构建任务
2. 点击任意步骤
3. 查看详细日志

**查找错误：**
- 搜索关键词：`error`, `failed`, `Exception`
- 查看红色文字
- 检查堆栈信息

### 导出日志

```bash
# 使用GitHub CLI
gh run view RUN_ID --log

# 保存到文件
gh run view RUN_ID --log > build.log
```

---

## 🎓 最佳实践

### 1. 使用语义化版本

```bash
# 创建版本标签
git tag v8.0.0
git tag v8.0.1
git tag v8.1.0

# 推送标签
git push origin --tags
```

### 2. 编写详细的提交信息

```bash
# 好的提交信息
git commit -m "feat: 添加产品类型选择器"

# 不好的提交信息
git commit -m "update"
```

### 3. 定期清理Artifacts

```yaml
# 设置较短保留时间
- name: Upload APK
  uses: actions/upload-artifact@v4
  with:
    name: app-debug-apk
    path: android/app/build/outputs/apk/debug/app-debug.apk
    retention-days: 7  # 只保留7天
```

### 4. 使用环境变量

```yaml
env:
  NODE_VERSION: '20'
  JAVA_VERSION: '17'
  ANDROID_API_LEVEL: '33'

steps:
  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: ${{ env.NODE_VERSION }}
```

---

## 🎉 总结

### GitHub Actions构建流程

```
1. 注册GitHub账号 ✅
2. 创建仓库 ✅
3. 上传代码 ✅
4. 配置工作流 ✅
5. 触发构建 ✅
6. 下载APK ✅
```

### 关键要点

- ✅ **公开仓库完全免费**
- ✅ **无需本地开发环境**
- ✅ **自动化，推送即构建**
- ✅ **可下载生成的APK**
- ✅ **可追踪构建历史**

### 下一步

1. **按照本教程创建GitHub Actions工作流**
2. **触发第一次构建**
3. **下载并测试APK**
4. **优化构建配置**

---

## 📞 需要帮助？

### 官方文档
- GitHub Actions文档：https://docs.github.com/en/actions
- Android构建：https://docs.github.com/en/actions/guides/building-and-testing-android

### 常用命令速查

```bash
# Git命令
git init                          # 初始化仓库
git add .                         # 添加所有文件
git commit -m "message"           # 提交
git push                          # 推送到远程
git pull                          # 拉取更新

# GitHub CLI
gh auth login                     # 登录
gh run list                       # 查看构建列表
gh run view RUN_ID                # 查看构建详情
gh run download                   # 下载Artifacts
```

---

**祝你构建成功！🎉**

有任何问题请查看本文档的[常见问题解决](#常见问题解决)章节！
