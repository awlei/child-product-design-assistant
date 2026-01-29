# GitHub APK 构建指南

## 自动构建流程

本项目的APK构建已完全自动化，每次推送到`main`分支都会自动触发构建。

### 构建触发条件

**自动触发**：
- 每次向`main`分支推送代码
- 每次合并PR到`main`分支

**手动触发**：
1. 访问GitHub仓库的Actions页面
2. 选择"Build Android APK"工作流
3. 点击"Run workflow"按钮

## 查看构建状态

### 访问Actions页面
```
https://github.com/awlei/child-product-design-assistant/actions
```

### 构建步骤
构建过程包含以下步骤：
1. Checkout code - 检出代码
2. Setup Node.js - 设置Node.js环境
3. Install pnpm - 安装pnpm
4. Setup pnpm cache - 设置pnpm缓存
5. Cache Next.js build - 缓存Next.js构建
6. Cache Gradle packages - 缓存Gradle依赖
7. Install dependencies - 安装项目依赖
8. Build app - 构建Web应用
9. Setup Java - 设置Java环境
10. Setup Android SDK - 设置Android SDK
11. Build APK - 构建Android APK
12. Upload APK - 上传APK文件

### 构建时间
- 首次构建：约15-20分钟
- 后续构建（使用缓存）：约8-10分钟

## 下载APK

### 方法1：通过Actions页面下载（推荐）

1. 访问Actions页面：https://github.com/awlei/child-product-design-assistant/actions
2. 点击最近的构建任务（显示绿色✅表示成功）
3. 向下滚动到"Artifacts"部分
4. 点击下载APK文件（名称格式：`child-product-design-assistant-[commit-hash]`）

### 方法2：通过commit历史查看

1. 访问代码提交历史：https://github.com/awlei/child-product-design-assistant/commits/main
2. 点击commit旁边的Actions图标（✅或❌）
3. 在Actions页面下载APK

## APK文件说明

### 文件名格式
```
child-product-design-assistant-{commit-hash}.zip
```

### 解压后
```
app-debug.apk  # 实际的APK安装文件
```

### 保留期限
- APK文件在GitHub Artifacts中保留30天
- 30天后自动删除

## 安装APK

### Android手机安装

1. **下载APK**
   - 从GitHub Actions下载最新的APK文件
   - 解压zip文件，得到`app-debug.apk`

2. **允许安装未知来源应用**
   - 打开手机设置
   - 进入"安全"或"隐私"
   - 允许"从未知来源安装应用"

3. **安装APK**
   - 使用文件管理器找到`app-debug.apk`
   - 点击安装
   - 按照提示完成安装

### 注意事项
- ⚠️ APK是调试版本，首次安装时可能提示"未知应用"
- ⚠️ 需要开启"允许从未知来源安装"权限
- ✅ 安装后与Web版本功能完全一致

## 常见问题

### Q1: 构建失败了怎么办？

**解决步骤**：
1. 查看Actions页面的错误日志
2. 检查失败步骤的具体错误信息
3. 根据错误信息修复代码
4. 推送修复后的代码，会自动重新构建

### Q2: 构建时间太长怎么办？

**原因分析**：
- 首次构建需要下载所有依赖，时间较长
- 后续构建会使用缓存，时间会缩短

**优化建议**：
- 不要频繁推送小改动
- 合并多个改动后一次性推送

### Q3: APK无法安装怎么办？

**可能原因**：
1. Android版本过低（需要Android 5.0+）
2. 存储空间不足
3. 安装权限未开启

**解决步骤**：
1. 检查Android版本是否≥5.0
2. 清理手机存储空间
3. 确认已开启"允许从未知来源安装"权限

### Q4: 如何查看APK的功能版本？

**查看方法**：
- APK包名：`com.childproductdesign.app`
- 版本号：查看Settings → Apps → 儿童产品设计助手

## 版本管理

### 版本号规则
每次构建会自动生成唯一的APK（基于commit hash）。

### 推荐做法
- 保留最近3-5个版本的APK
- 删除旧版本以释放空间
- 在release页面发布正式版本（如有需要）

## 开发者工作流

### 推荐流程

```bash
# 1. 本地开发
git checkout -b feature/your-feature
# ... 开发代码 ...

# 2. 提交改动
git add .
git commit -m "feat: 添加新功能"

# 3. 推送到分支
git push origin feature/your-feature

# 4. 创建Pull Request
# 在GitHub上创建PR，等待代码审查

# 5. 合并到main分支
# 合并后自动触发APK构建

# 6. 下载并测试APK
# 从Actions页面下载最新的APK
```

### 快速测试（不推荐频繁使用）
```bash
# 直接推送到main分支（跳过代码审查）
git checkout main
git add .
git commit -m "fix: 修复bug"
git push origin main
# 自动触发APK构建
```

## 性能优化

### 已启用的缓存
- ✅ pnpm缓存
- ✅ Next.js构建缓存
- ✅ Gradle依赖缓存

### 构建优化
- ✅ 超时时间：60分钟
- ✅ 保留期限：30天
- ✅ 支持手动触发

## 联系支持

如遇到构建问题，请：
1. 查看Actions页面的详细日志
2. 检查`.github/workflows/build-android.yml`配置
3. 提交Issue到GitHub仓库

---

**最后更新**：2026年1月29日
**版本**：V8.5.0
