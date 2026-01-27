# APK构建指南

## 概述

本指南说明如何构建"儿童产品设计助手"的Android APK。本项目使用Capacitor 6框架将Next.js应用打包为原生Android应用。

## 前置要求

### 方法1：使用GitHub Actions自动构建（推荐）

**优点**：
- 无需本地配置Android SDK
- 自动化流程，一键构建
- 云端环境稳定可靠

**步骤**：
1. 将代码推送到GitHub仓库
2. 进入仓库的Actions标签页
3. 选择"Build Android APK"工作流
4. 点击"Run workflow"按钮
5. 等待构建完成（约5-10分钟）
6. 下载生成的APK文件

### 方法2：本地构建

**要求**：
- Node.js 20+
- pnpm
- Java 17+
- Android SDK (API Level 33+)
- Gradle 8.0+

**步骤**：
```bash
# 1. 安装依赖
pnpm install

# 2. 构建Web应用
pnpm run build

# 3. 添加Android平台（首次构建）
npx cap add android

# 4. 同步资源
npx cap sync android

# 5. 构建APK
cd android
./gradlew assembleDebug

# 6. 查找APK文件
ls -la app/build/outputs/apk/debug/app-debug.apk
```

## APK文件位置

构建成功后，APK文件位于：
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## GitHub Actions自动构建

### 工作流文件位置
`.github/workflows/build-android.yml`

### 触发方式

1. **自动触发**：推送到main分支
2. **手动触发**：
   - 进入GitHub仓库
   - 点击"Actions"标签页
   - 选择"Build Android APK"工作流
   - 点击"Run workflow"

### 构建产物

APK文件会自动上传到Actions Artifacts，保留7天。

### 访问下载

1. 进入对应的构建记录
2. 滚动到底部的"Artifacts"部分
3. 下载"app-debug-apk"

## 本地知识库说明

### 功能描述

当AI服务不可用时（如API Key未配置或网络问题），应用会自动使用本地知识库生成设计建议。

### 本地知识库内容

本地知识库包含以下数据：
- ECE R129 (i-Size)标准
- FMVSS 213标准
- ECE R44/04标准
- GPS人体测量数据
- 通用功能特性
- 设计提示

### 数据文件

`public/data/local-knowledge-base.json`

### 使用方式

1. 应用自动检测AI服务可用性
2. 如果不可用，自动切换到本地知识库
3. 用户在界面上会看到"本地知识库"标签
4. 流式输出（模拟AI打字效果）

### 优势

- 离线可用（首次加载后）
- 响应速度快
- 数据可靠（基于官方标准）
- 无需API Key

### 局限性

- 内容固定，不包含最新标准更新
- 无法联网搜索品牌参数
- 无法进行法规审核

## 新功能（V8.2.0）

### 本地知识库Fallback机制

- **自动切换**：AI服务失败时自动使用本地知识库
- **流式输出**：模拟AI打字效果，用户体验一致
- **数据来源标识**：界面显示"本地知识库"标签
- **详细日志**：便于诊断问题

### 支持的标准

- **ECE R129 (i-Size)**：基于身高的先进标准
- **FMVSS 213**：美国联邦标准（含213a侧撞保护）
- **ECE R44/04**：基于体重的旧标准

### 包含的数据

1. **标准概述**：标准名称、描述、生效日期、状态
2. **关键要求**：强制性技术参数
3. **适用分组**：根据身高/体重匹配的分组信息
4. **伤害指标**：HIC、Nij、胸部加速度等
5. **安全建议**：实际使用注意事项
6. **人体测量数据**：GPS R016标准的人体尺寸
7. **功能特性**：推荐的安全功能
8. **设计提示**：专业设计建议

## 测试指南

### 功能测试清单

1. **本地知识库测试**
   - [ ] 不配置API Key，测试是否能生成报告
   - [ ] 检查报告内容是否完整
   - [ ] 检查数据来源标识是否正确
   - [ ] 测试三种标准（R129、FMVSS 213、R44）

2. **AI服务测试**
   - [ ] 配置API Key后测试AI生成
   - [ ] 检查流式输出是否正常
   - [ ] 检查品牌参数对比功能

3. **UI测试**
   - [ ] 检查界面响应速度
   - [ ] 检查错误提示是否友好
   - [ ] 检查移动端适配

### 测试设备

推荐测试设备：
- Android 10+
- 分辨率：1080x1920及以上
- RAM：4GB及以上

## 常见问题

### Q1: 构建失败，提示"Gradle command not found"

**解决方案**：
- 检查是否安装了Android SDK
- 设置ANDROID_HOME环境变量
- 确保`$ANDROID_HOME/build-tools`在PATH中

### Q2: APK无法安装

**可能原因**：
- APK签名问题
- 目标设备API版本过低
- 安装来源限制

**解决方案**：
- 使用`adb install -r app-debug.apk`强制安装
- 检查设备Android版本（需≥5.0）
- 在设备设置中允许未知来源安装

### Q3: 应用启动后白屏

**可能原因**：
- Web资源加载失败
- JavaScript错误
- 权限问题

**解决方案**：
- 检查`capacitor.config.json`配置
- 使用Chrome DevTools调试
- 查看adb logcat日志

### Q4: 本地知识库无法加载

**可能原因**：
- JSON文件路径错误
- 文件格式错误
- 代码逻辑错误

**解决方案**：
- 检查`public/data/local-knowledge-base.json`是否存在
- 验证JSON格式（使用在线JSON验证器）
- 查看服务器日志

## 调试技巧

### 使用Chrome DevTools调试

```bash
# 连接设备
adb devices

# 开启调试
adb shell webviewdebug enable
adb forward tcp:9222 localabstract:chrome_devtools_remote

# 在Chrome中打开
chrome://inspect
```

### 查看日志

```bash
# 查看Android日志
adb logcat | grep Capa

# 过滤错误
adb logcat *:E
```

### 测试API

```bash
# 测试本地知识库API
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"standard":"R129","heightRange":"40-105cm"}' \
  http://localhost:5000/api/design-assistant
```

## 性能优化

### 减小APK体积

1. 启用代码压缩
2. 移除未使用的依赖
3. 使用WebP格式图片
4. 启用ProGuard

### 提升启动速度

1. 预加载关键资源
2. 优化JavaScript执行
3. 减少初始加载数据
4. 使用Service Worker缓存

## 版本历史

### V8.2.0 (2026-01-27)
- 新增本地知识库fallback机制
- 支持三种标准（R129、FMVSS 213、R44）
- 优化流式响应处理逻辑
- 添加详细调试日志

### V8.1.0 (2026-01-20)
- 新增FMVSS 213标准支持
- 优化APK界面布局
- 修复流式响应解析问题

### V8.0.0 (2026-01-10)
- 基于Next.js 16重构
- 集成Capacitor 6
- 支持PWA和APK双模式
- 新增法规审核功能

## 技术支持

如有问题，请联系开发团队或提交Issue到GitHub仓库。

---

**最后更新**: 2026-01-27
