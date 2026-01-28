# GitHub Actions 构建指南

## 推送成功 ✅

代码已成功推送到 GitHub，GitHub Actions 工作流已自动触发！

```
✓ 推送 2 个提交到 origin/main
  - chore: 准备APK构建 - 完成所有准备工作，提供三种构建方案
  - chore: 全面优化APK - 移动端体验、AI准确性、数据版本、品牌搜索
```

## 查看构建进度

### 方法一：通过 GitHub 网站（推荐）

1. **访问 GitHub 仓库**
   ```
   https://github.com/awlei/child-product-design-assistant
   ```

2. **查看 Actions**
   - 点击页面顶部的 **"Actions"** 标签
   - 你会看到正在运行的工作流：**"Build Android APK"**
   - 点击最新的工作流运行记录查看详细进度

3. **查看构建状态**
   - 🟡 黄色图标：构建进行中
   - 🟢 绿色图标：构建成功
   - 🔴 红色图标：构建失败

4. **查看构建日志**
   - 点击工作流运行记录
   - 展开各个步骤查看详细日志
   - 如果构建失败，可以在这里查看错误信息

### 方法二：通过 GitHub CLI（需要安装 gh）

```bash
# 查看最近的工作流运行
gh run list

# 查看特定工作流的详情
gh run view <run-id>

# 实时查看运行日志
gh run watch <run-id>
```

## 构建时间

预计构建时间：**10-15 分钟**

构建过程包括：
1. 检出代码（约 30 秒）
2. 设置 Node.js 环境（约 30 秒）
3. 安装依赖（约 1-2 分钟）
4. 构建 Next.js 项目（约 2-3 分钟）
5. 设置 Java 和 Android SDK（约 1-2 分钟）
6. 构建 Android APK（约 5-8 分钟）

## 下载 APK

### 构建成功后下载

1. **进入 Actions 页面**
   ```
   https://github.com/awlei/child-product-design-assistant/actions
   ```

2. **找到成功的工作流运行**
   - 查找绿色的 ✓ 标记
   - 点击最新的成功运行记录

3. **下载 Artifacts**
   - 滚动到页面底部的 **"Artifacts"** 部分
   - 你会看到类似这样的文件名：
     ```
     child-product-design-assistant-655b96bxxxxxxxxxxxxxxx.zip
     ```
   - 点击文件名开始下载

4. **解压获取 APK**
   - 下载的文件是一个 ZIP 压缩包
   - 解压后你会得到：
     ```
     app-debug.apk
     ```
   - 这就是最终的 APK 文件

## APK 文件信息

- **文件名**：`app-debug.apk`
- **包名**：`com.childproductdesign.assistant`
- **应用名称**：儿童产品设计助手
- **版本**：v1.3.0
- **签名类型**：Debug（调试签名）

## 安装 APK

### 方法一：通过 ADB 安装（推荐）

```bash
# 确保手机已通过 USB 连接并开启开发者模式
adb install -r app-debug.apk

# -r 参数表示覆盖安装（如果已安装旧版本）
```

### 方法二：通过文件传输

1. 将 APK 文件传输到手机
2. 在手机上找到 APK 文件
3. 点击安装
4. 如果提示"允许安装未知来源应用"，请前往设置开启

### 方法三：通过邮件或云存储

1. 将 APK 文件上传到云存储（如 Google Drive、OneDrive）
2. 在手机上下载并安装

## 构建失败怎么办？

### 查看错误日志

1. 进入 Actions 页面
2. 找到失败的工作流运行
3. 点击展开失败的步骤
4. 查看红色错误信息

### 常见错误及解决方法

#### 1. 依赖安装失败
**错误**：`pnpm install` 失败
**解决**：检查 `pnpm-lock.yaml` 文件是否正确提交

#### 2. Next.js 构建失败
**错误**：`pnpm run build` 失败
**解决**：检查 TypeScript 错误，在本地运行 `pnpm run build` 排查问题

#### 3. Android 构建失败
**错误**：`./gradlew assembleDebug` 失败
**解决**：
- 检查 Android SDK 版本
- 检查 Gradle 配置
- 查看详细的错误日志

#### 4. 超时错误
**错误**：构建超时（60 分钟）
**解决**：
- 网络问题：重新推送代码触发构建
- 构建时间过长：检查代码是否有性能问题

## 下次构建

如果需要重新构建，只需：

```bash
# 做一些更改
# 提交更改
git add .
git commit -m "chore: update something"

# 推送到 GitHub，自动触发构建
git push origin main
```

## 手动触发构建

你也可以手动触发构建，而不需要推送代码：

1. 访问 GitHub 仓库
2. 点击 **"Actions"** 标签
3. 选择 **"Build Android APK"** 工作流
4. 点击 **"Run workflow"** 按钮
5. 选择分支并点击运行

## 构建历史

GitHub 会保存最近 90 天的构建历史。你可以：
- 查看所有历史构建记录
- 下载任何历史版本的 APK
- 对比不同版本的构建结果

## 需要帮助？

如果遇到问题：

1. **查看 Actions 日志**：在 GitHub Actions 页面查看详细日志
2. **查看项目文档**：`QUICK_BUILD_GUIDE.md`、`APK_BUILD_GUIDE.md`
3. **提交 Issue**：在 GitHub 仓库提交 Issue
4. **查看 Capacitor 文档**：https://capacitorjs.com/

---

**当前状态**：✅ 代码已推送，GitHub Actions 正在构建中
**预计完成时间**：10-15 分钟后
**仓库地址**：https://github.com/awlei/child-product-design-assistant/actions
