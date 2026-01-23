# 儿童产品设计助手 V8.0.0 - 手机APP打包指南

## 📱 支持平台

- ✅ Android 7.0+ (APK)
- ✅ iOS 14.0+ (IPA)

## 🎯 三种打包方式

### 方式一：本地打包（推荐）

#### Android 打包

**准备工作：**
1. 安装 JDK 11 或更高版本
2. 安装 Android Studio（包含 Android SDK）
3. 配置 ANDROID_HOME 环境变量

**打包步骤：**

```bash
# 1. 下载并解压项目
tar -xzf child-product-design-assistant-v8.0.0-mobile.tar.gz
cd child-product-design-assistant

# 2. 运行打包脚本
./scripts/build-android.sh

# 3. 打开Android Studio
npx cap open android

# 4. 在Android Studio中：
#    - 选择 Build → Build Bundle(s) / APK(s) → Build APK(s)
#    - 或点击绿色三角形按钮直接运行

# 5. APK文件位置：
#    - Debug版本：android/app/build/outputs/apk/debug/
#    - Release版本：android/app/build/outputs/apk/release/
```

**命令行快速打包（可选）：**
```bash
cd android
./gradlew assembleDebug
# APK在：app/build/outputs/apk/debug/app-debug.apk
```

#### iOS 打包

**准备工作：**
1. 需要一台 Mac 电脑
2. 安装 Xcode（从 App Store 下载）
3. 安装 CocoaPods：`sudo gem install cocoapods`

**打包步骤：**

```bash
# 1. 下载并解压项目
tar -xzf child-product-design-assistant-v8.0.0-mobile.tar.gz
cd child-product-design-assistant

# 2. 运行打包脚本
./scripts/build-ios.sh

# 3. 打开Xcode
npx cap open ios

# 4. 在Xcode中：
#    - 选择设备或模拟器
#    - 点击 Product → Run (调试模式)
#    - 或 Product → Archive (发布模式)

# 5. Archive 后：
#    - 在Organizer中点击"Distribute App"
#    - 选择分发方式（Ad Hoc、App Store、Enterprise）
#    - 导出IPA文件
```

### 方式二：Capacitor Cloud（在线构建，最简单）

**优势：**
- ✅ 无需安装Android Studio或Xcode
- ✅ 自动配置签名
- ✅ 支持持续集成
- ✅ 免费额度：每月10次构建

**步骤：**

1. **注册 Capacitor Cloud**
   - 访问：https://cloud.capacitorjs.com/
   - 创建免费账号
   - 获取 API Key

2. **配置并上传代码**
   ```bash
   # 安装Capacitor Cloud CLI
   npx @capacitor/cloud-cli login

   # 构建并上传
   pnpm run build
   npx cap cloud:build android
   # 或
   npx cap cloud:build ios
   ```

3. **下载打包好的APP**
   - 在 Capacitor Cloud 控制台下载 APK/IPA

**详细文档：** https://capacitorjs.com/docs/guides/cloud-build

### 方式三：使用第三方打包服务

#### 1. AppCenter（微软）
- 网站：https://appcenter.ms/
- 免费用于开源项目

#### 2. Expo Application Services (EAS)
- 网站：https://docs.expo.dev/eas/
- 需要适配 Expo 配置

#### 3. Codemagic
- 网站：https://codemagic.io/
- 免费额度：每月500分钟

## 📦 快速安装APK到手机

### Android 直接安装

```bash
# 1. 通过USB连接手机
# 2. 启用开发者模式和USB调试

# 3. 使用adb安装
adb install android/app/build/outputs/apk/debug/app-debug.apk

# 或在手机上直接点击APK文件安装
```

### iOS 直接安装

**开发测试（无需证书）：**
```bash
# 1. 使用 Xcode 直接运行到设备
# 2. 选择你的iPhone/iPad
# 3. 点击 Run 按钮
```

**Ad Hoc 分发：**
```bash
# 1. 创建 .mobileprovision 配置文件
# 2. 打包时选择 Ad Hoc 选项
# 3. 使用 AltStore 或 TestFlight 安装
```

## 🏷️ 应用信息

- **应用名称**: 儿童产品设计助手
- **包名/Bundle ID**: com.childproductdesign.assistant
- **版本号**: 8.0.0
- **构建号**: 1

## 🎨 自定义配置

### 修改应用图标

1. 准备 1024x1024 像素的 PNG 图标
2. 使用在线工具生成多尺寸图标：
   - https://icon.kitchen/
   - https://www.favicon-generator.org/
3. 替换以下文件：
   - `android/app/src/main/res/mipmap-*/ic_launcher.png`
   - `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### 修改应用名称

编辑 `capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  appName: '你的应用名称',
  appId: 'com.yourcompany.app',
  // ...
};
```

### 修改应用图标颜色

编辑 `android/app/src/main/res/values/colors.xml`:
```xml
<color name="primary">#你的颜色</color>
```

## 📱 测试应用

### Android 模拟器

```bash
# 启动模拟器
npx cap open android

# 或使用命令行
emulator -avd Pixel_4_API_30
```

### iOS 模拟器

```bash
# 启动模拟器
npx cap open ios

# 或使用命令行
xcrun simctl boot "iPhone 12"
```

## 🚀 发布到应用商店

### Android - Google Play

1. **开发者账号**
   - 注册：https://play.google.com/console
   - 费用：$25（一次性）

2. **生成签名密钥**
   ```bash
   keytool -genkey -v -keystore my-release-key.keystore \
     -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

3. **配置签名**
   - 在 `android/gradle.properties` 中添加：
   ```properties
   MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
   MYAPP_RELEASE_KEY_ALIAS=my-key-alias
   MYAPP_RELEASE_STORE_PASSWORD=*****
   MYAPP_RELEASE_KEY_PASSWORD=*****
   ```

4. **上传APK**
   - 构建 Release 版本
   - 上传到 Google Play Console

### iOS - App Store

1. **开发者账号**
   - 注册：https://developer.apple.com/
   - 费用：$99/年

2. **配置证书和描述文件**
   - 在 Xcode 中配置签名
   - 或使用 Apple Developer 网站创建

3. **上传IPA**
   - 使用 Xcode Archive
   - 选择 Distribute App
   - 上传到 App Store Connect

4. **提交审核**
   - 填写应用信息
   - 提供截图
   - 等待审核（通常1-3天）

## 🐛 常见问题

### 构建失败

**问题：Gradle 构建失败**
```bash
# 清理缓存
cd android
./gradlew clean
./gradlew build
```

**问题：CocoaPods 安装失败**
```bash
cd ios
pod deintegrate
pod install
```

### 签名问题

**Android：未签名APK无法安装**
```bash
# 使用 debug keystore 签名
./gradlew assembleDebug
```

**iOS：无法安装到真机**
- 确保已配置开发者证书
- 检查 Bundle ID 是否唯一
- 检查 Provisioning Profile 是否有效

### 权限问题

**应用需要哪些权限？**
- INTERNET（访问网络）
- CAMERA（拍照功能）
- READ_EXTERNAL_STORAGE（读取文件）
- WRITE_EXTERNAL_STORAGE（保存文件）

**在 AndroidManifest.xml 中添加：**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
```

## 📊 应用大小优化

当前大小：约 30-40 MB

**优化建议：**
- 使用代码压缩：ProGuard/R8
- 启用资源压缩
- 分割架构（ABI Split）
- 使用 WebP 格式图片

## 🔐 安全建议

1. **代码混淆**
   - Android: ProGuard
   - iOS: 自动混淆

2. **网络安全**
   - 使用 HTTPS
   - 配置网络安全策略

3. **数据加密**
   - 敏感数据加密存储
   - 使用安全存储 API

## 📞 技术支持

如有问题，请参考：
- Capacitor文档：https://capacitorjs.com/docs
- Android开发：https://developer.android.com/
- iOS开发：https://developer.apple.com/

## 📄 许可证

MIT License

---

**版本**: V8.0.0
**更新日期**: 2026-01-23
