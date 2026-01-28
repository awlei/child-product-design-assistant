# APK 构建指南

本文档指导如何构建儿童产品设计助手的 Android APK 文件。

## 构建方式

### 方式一：使用 GitHub Actions 自动构建（推荐）

项目已配置 GitHub Actions 工作流，自动构建 Android APK。

1. **推送到 GitHub 仓库**：
   ```bash
   git add .
   git commit -m "chore: prepare for APK build"
   git push origin main
   ```

2. **在 GitHub 上查看构建状态**：
   - 访问仓库的 Actions 页面
   - 查看 `Build Android APK` 工作流
   - 等待构建完成（约 10-15 分钟）

3. **下载 APK**：
   - 构建完成后，在 Actions 页面下载 `app-release.apk`
   - 或者在 GitHub Releases 页面下载最新版本

### 方式二：使用 Capacitor 云构建（快速）

使用 Capacitor 云服务构建 APK，无需配置本地环境。

1. **安装 Capacitor CLI**：
   ```bash
   npm install -g @capacitor/cli
   ```

2. **同步代码到 Capacitor**：
   ```bash
   cd /workspace/projects
   npx cap sync android
   ```

3. **上传到 Capacitor Cloud 构建**：
   ```bash
   npx cap build android
   ```
   - 登录 Capacitor Cloud 账号
   - 等待云端构建完成（约 5-10 分钟）
   - 下载生成的 APK 文件

### 方式三：本地构建（需要 Android Studio）

如果需要在本地构建 APK，需要配置 Android 开发环境。

#### 1. 安装 Android Studio
- 下载并安装 [Android Studio](https://developer.android.com/studio)
- 安装 Android SDK（API 33 或更高版本）
- 配置环境变量：
  ```bash
  export ANDROID_HOME=$HOME/Android/Sdk
  export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
  ```

#### 2. 安装 Java JDK
- 安装 JDK 17 或更高版本
- 配置 JAVA_HOME 环境变量

#### 3. 同步 Capacitor 项目
```bash
cd /workspace/projects
npx cap sync android
npx cap open android
```

#### 4. 在 Android Studio 中构建
1. 打开 Android Studio 后，会自动打开 `android` 项目
2. 选择 Build > Generate Signed Bundle / APK
3. 选择 APK，点击 Next
4. 创建或选择密钥库（KeyStore）
5. 选择 release 构建变体
6. 点击 Finish 开始构建

#### 5. 签名 APK
如果要发布到应用商店，需要使用密钥签名：

```bash
keytool -genkey -v -keystore child-design-key.keystore -alias child-design-key -keyalg RSA -keysize 2048 -validity 10000
```

在 Android Studio 中：
- 使用上面的 keystore 文件签名
- 设置密钥库密码和别名密码
- 勾选 "V1 (Jar Signature)" 和 "V2 (Full APK Signature)"

## 验证 APK

构建完成后，验证 APK 的功能：

### 1. 基础功能测试
- [ ] 应用正常启动
- [ ] 所有页面（首页、GPS人体测量、婴儿推车、儿童安全座椅、高脚椅、婴儿床）可正常访问
- [ ] 标准切换（ECE R129 / FMVSS 213）正常工作
- [ ] 产品类型切换正常工作

### 2. AI 功能测试
- [ ] GPS 人体测量数据查询正常
- [ ] 简笔画生成功能正常
- [ ] R129/FMVSS 智能设计助手生成报告正常
- [ ] 品牌搜索功能正常（包括本地数据 fallback）

### 3. 移动端体验测试
- [ ] 快速选择按钮（新生儿、幼儿、学龄前）正常工作
- [ ] 输入框和按钮尺寸适合触控
- [ ] 页面加载流畅，无卡顿

### 4. 性能测试
- [ ] 首次启动时间 < 5 秒
- [ ] 页面切换流畅
- [ ] AI 生成报告在 120 秒内完成

## 常见问题

### 1. 构建失败：依赖冲突
**问题**：构建时出现依赖冲突错误

**解决方案**：
```bash
cd /workspace/projects
rm -rf node_modules .next
pnpm install
pnpm run build
npx cap sync android
```

### 2. 构建失败：资源路径问题
**问题**：Capacitor 构建时找不到静态资源

**解决方案**：
- 确认 `next.config.mjs` 中 `output: 'export'` 已启用
- 确认 `capacitor.config.ts` 中 `webDir: 'out'` 配置正确
- 重新同步：`npx cap sync android`

### 3. APK 安装失败：签名问题
**问题**：APK 安装时提示签名不匹配

**解决方案**：
- 如果是同一应用的不同版本，使用相同的 keystore 签名
- 如果是全新安装，卸载旧版本后再安装新版本

### 4. 网络请求失败：HTTPS 问题
**问题**：APK 中网络请求失败，提示证书错误

**解决方案**：
- 项目已配置 `androidScheme: 'https'`
- 确保后端 API 支持 HTTPS
- 如果使用 HTTP，需要在 AndroidManifest.xml 中添加网络安全配置

### 5. AI 功能超时
**问题**：生成报告时超时

**解决方案**：
- 前端已配置 120 秒超时
- 检查网络连接是否稳定
- 如果超时，会自动使用本地数据 fallback

## 发布到应用商店

### Google Play Store

1. **创建开发者账号**：
   - 注册 Google Play 开发者账号（$25 一次性费用）
   - 完成身份验证

2. **准备应用资料**：
   - 应用图标（512x512）
   - 应用截图（至少 2 张，手机和平板）
   - 应用描述
   - 隐私政策链接
   - 内容评级问卷

3. **上传 APK**：
   - 在 Google Play Console 中创建新应用
   - 上传签名的 APK 或 AAB（Android App Bundle）
   - 填写应用信息和商店列表

4. **提交审核**：
   - 完成内容评级
   - 提交应用审核
   - 等待审核通过（通常 1-3 天）

### 其他应用商店
- **华为应用市场**：需要华为开发者账号
- **小米应用商店**：需要小米开发者账号
- **腾讯应用宝**：需要腾讯开发者账号

## 版本管理

### 版本号规则
- 版本号格式：`major.minor.patch`（如 1.2.3）
- major：重大功能更新
- minor：新增功能
- patch：bug 修复

### 更新版本号
每次发布新版本时，更新以下文件：

1. `package.json`：
   ```json
   {
     "version": "1.3.0"
   }
   ```

2. `capacitor.config.ts`：
   ```typescript
   {
     android: {
       buildOptions: {
         signingType: 'apksigner'
       },
       version: '1.3.0'
     }
   }
   ```

3. `public/data/*.json`：
   - 更新数据文件版本号（如 v1.3.0）

## 联系与支持

如有问题，请查看：
- 项目文档：`README.md`
- Capacitor 官方文档：https://capacitorjs.com/
- Next.js 官方文档：https://nextjs.org/
- GitHub Issues：提交问题到项目仓库

## 附录：快速命令参考

```bash
# 构建项目
pnpm run build

# 同步到 Android
npx cap sync android

# 打开 Android Studio
npx cap open android

# 使用 Capacitor Cloud 构建
npx cap build android

# 本地构建 APK（需要 Android Studio）
cd android
./gradlew assembleRelease

# 清理构建缓存
rm -rf .next out node_modules
pnpm install
pnpm run build
```
