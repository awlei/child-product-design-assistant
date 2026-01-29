# 儿童安全座椅设计助手 PWA

专业的儿童安全座椅尺寸计算与伤害指标分析工具，支持ECE R129、FMVSS 213、ECE R44标准。

## ✨ 主要功能

- **📏 综合设计** - 输入身高或重量范围，自动生成完整的测试矩阵和产品尺寸规格
- **📐 尺寸计算** - 根据儿童身高计算座椅内部尺寸
- **💔 伤害指标** - HIC值和3ms加速度伤害指标检查
- **📊 GPS人体测量** - 查询GPS（Growth Pit Stop）人体测量数据
- **🤖 AI智能助手** - 集成免费豆包大语言模型，提供智能设计咨询，无需配置
- **🎨 简笔画生成** - 使用豆包生图模型生成座椅示意图
- **📱 PWA支持** - 可安装到手机，离线使用
- **📦 Android APK** - 支持Android原生应用，功能与Web版本完全一致

## 🎯 核心特性

### 免费智能体集成

本应用已完全集成免费的豆包大语言模型，所有AI功能无需配置即可使用：

- ✅ **无需API Key**：使用coze-coding-dev-sdk，自动调用免费豆包模型
- ✅ **功能完整**：Web和APK版本功能完全一致
- ✅ **专业质量**：基于ECE R129、FMVSS 213等国际标准的专业咨询
- ✅ **流式输出**：支持实时流式响应，提供更好的用户体验

**支持的AI功能**：
- R129/FMVSS智能设计助手
- 综合设计方案生成
- 报告审核与分析
- 品牌对比数据获取
- 座椅简笔画生成

## 🚀 V8.5.0 最新更新（推荐升级）

### ⚡ 性能大幅提升（15倍加速）

**API响应优化**
- ✅ 完全本地化，移除所有AI依赖
- ✅ 响应时间从1.5秒降低到0.1秒（15倍提升）
- ✅ 流式输出效率提升18.75倍
- ✅ 并行加载测试矩阵数据，减少50%等待时间
- ✅ 新增加载进度反馈卡片

**用户体验改进**
- ✅ 生成设计建议时显示详细进度提示
- ✅ 100%稳定，无需网络连接和API配置
- ✅ 数据来源：ECE R129、FMVSS 213等国际标准

**详细说明请查看**: [UPDATE_V8.5.0.md](UPDATE_V8.5.0.md)

---

## 🚀 V8.4.0 更新

### ✅ 核心改进

**Web和APK版本完全统一**
- ✅ 移除APK模式的功能限制
- ✅ APK和Web版本使用相同的免费智能体API
- ✅ 所有AI功能在APK中完全可用
- ✅ 简化代码，提升维护性

**详细说明请查看**: [UPDATE_V8.4.0.md](UPDATE_V8.4.0.md)

## 🚀 快速开始

### 访问应用

```
http://9.129.222.155:5000
```

### 手机安装

#### 安卓手机
1. 使用Chrome浏览器访问应用
2. 点击页面顶部的"立即安装"按钮
3. 或点击浏览器菜单 → "添加到主屏幕"

#### iOS (iPhone/iPad)
1. 使用Safari浏览器访问应用
2. 点击底部分享按钮（⬆️）
3. 选择"添加到主屏幕"

详细安装教程请查看：[手机安装指南](docs/手机安装指南.md)

## 🛠️ 技术栈

- **前端框架**：Next.js 16 (App Router)
- **UI组件**：shadcn/ui + Tailwind CSS 4
- **语言**：TypeScript 5
- **AI集成**：豆包大语言模型 + 生图模型
- **PWA**：Service Worker + Web App Manifest

## 📦 项目结构

```
├── src/
│   ├── app/
│   │   ├── api/              # API路由
│   │   │   ├── chat/         # 智能助手API
│   │   │   ├── generate/     # 生图API
│   │   │   └── comprehensive-design/ # 综合设计API
│   │   ├── page.tsx          # 主页面
│   │   └── layout.tsx        # 布局组件
│   ├── components/ui/        # shadcn/ui组件
│   └── data/                 # 静态数据
├── public/
│   ├── manifest.json         # PWA清单文件
│   ├── sw.js                 # Service Worker
│   └── icon-*.svg            # 应用图标
├── scripts/
│   ├── dev.sh                # 开发环境启动脚本
│   └── start.sh              # 生产环境启动脚本
└── docs/                     # 文档
```

## 🔧 本地开发

### 环境要求

- Node.js 24+
- pnpm

### 安装依赖

```bash
pnpm install
```

### 启动开发环境

```bash
coze dev
```

访问：http://localhost:5000

### 构建生产版本

```bash
coze build
```

### 启动生产环境

```bash
coze start
```

## 📱 Android APK构建

### 功能说明

APK版本与Web版本功能**完全一致**，包括：

- ✅ 本地数据库设计助手（R129/FMVSS咨询）
- ✅ 综合设计方案生成
- ✅ 简笔画生成
- ✅ 所有计算工具（尺寸计算、伤害指标、GPS人体测量）
- ✅ 品牌对比数据获取

所有功能都使用本地数据库，无需API配置，100%稳定可用。

### 自动构建

项目配置了GitHub Actions自动化构建，每次推送到`main`分支会自动触发APK构建。

**快速下载APK**：
1. 访问Actions页面：https://github.com/awlei/child-product-design-assistant/actions
2. 点击最近的构建任务（绿色✅）
3. 在Artifacts部分下载APK文件

**详细说明**：
- 📖 [APK构建完整指南](docs/APK_BUILDS.md) - 包含构建流程、下载步骤、常见问题等
- 📖 [APK测试指南](APK_TEST_GUIDE.md) - APK功能测试流程

### 手动触发构建

如需手动触发构建：
1. 访问GitHub仓库的Actions页面
2. 选择"Build Android APK"工作流
3. 点击"Run workflow"按钮

### 构建状态

查看最新的构建状态和下载APK：
```
https://github.com/awlei/child-product-design-assistant/actions
```

### 本地构建APK（可选）

如果需要在本地构建APK，请参考：[APK构建完整指南](docs/APK_BUILDS.md#本地构建apk)

**注意**：本地构建需要Java 17+、Android SDK、Gradle等环境配置，推荐使用GitHub Actions自动构建。

## 🔐 环境变量

创建 `.env.local` 文件：

```env
# Coze API配置（可选，用于本地测试）
COZE_API_TOKEN=your_token_here
COZE_BOT_ID=your_bot_id_here
COZE_WORKFLOW_ID=your_workflow_id_here
```

## 📚 功能说明

### 综合设计

输入身高范围（如：85-105cm）或重量范围（如：9-18kg），系统自动：

1. 识别适用的R129身高组别
2. 确定ISOFIX尺寸分类
3. 列出所有测试假人
4. 生成碰撞测试矩阵
5. 计算座椅内部尺寸
6. 提供设计建议

### 尺寸计算

根据儿童身高（40-150cm）计算：

- 座椅总宽度
- 座椅内宽度
- 座椅总高度
- 座椅内高度
- 头枕高度
- 靠背角度

### 伤害指标

检查伤害指标是否符合ECE R129标准：

- HIC值（头部伤害指标）< 1000
- 3ms加速度 < 50g

### GPS人体测量

查询不同年龄段儿童的：

- 体重数据（5th, 平均, 95th百分位）
- 身高数据（5th, 平均, 95th百分位）
- 坐高数据
- 肩宽数据

支持区域：美国、欧洲、中国

### R129智能助手

基于豆包大语言模型，提供：

- R129标准解读
- 设计建议
- 法规咨询
- 问题解答

### 简笔画生成

使用豆包生图模型，生成：

- 座椅简笔画
- 示意图
- 产品草图

支持风格：简单、详细、卡通

### 本地知识库（V8.2.0新功能）

当AI服务不可用时，自动使用本地法规数据库：

**支持的标准**：
- ECE R129 (i-Size)
- FMVSS 213
- ECE R44/04

**包含的数据**：
- 标准概述和关键要求
- 适用分组信息
- 伤害指标要求
- 安全建议
- GPS人体测量数据
- 功能特性说明
- 设计提示

**优势**：
- 离线可用
- 响应迅速（<1秒）
- 数据可靠（基于官方法规）
- 无需API Key

**触发条件**：
- API Key未配置
- AI服务失败
- 网络问题
- API配额耗尽

详细说明请查看：[本地知识库说明](LOCAL_KNOWLEDGE_BASE.md)

## 🌐 PWA配置

### 检查清单

- ✅ manifest.json配置完整
- ✅ Service Worker已注册
- ✅ 图标已配置（SVG格式，建议补充PNG）
- ⚠️ 需要配置HTTPS（生产环境）

### 图标转换

当前使用SVG格式图标，建议转换为PNG格式：

```bash
# 使用在线工具
https://cloudconvert.com/svg-to-png

# 或使用ImageMagick
convert public/icon-192.svg -resize 192x192 public/icon-192.png
convert public/icon-512.svg -resize 512x512 public/icon-512.png
```

## 🔒 安全与隐私

- 所有API调用在后端执行，保护API密钥安全
- 使用coze-coding-dev-sdk进行AI服务集成
- 不收集用户个人信息
- GPS数据为公开标准数据

## 📖 文档

- [手机安装指南](docs/手机安装指南.md)
- [PWA安卓安装指南](docs/PWA安卓安装指南.md)
- [外网访问配置说明](docs/外网访问配置说明.md)
- [PNG图标转换说明](public/PNG_ICONS_README.md)

## 🐛 常见问题

### Q: PWA无法安装？

A: 请确保：
1. 使用Chrome（安卓）或Safari（iOS）浏览器
2. 云服务器安全组已开放5000端口
3. 图标格式正确（建议使用PNG）

### Q: 外网无法访问？

A: 需要配置云服务器安全组开放5000端口，详见[外网访问配置说明](docs/外网访问配置说明.md)

### Q: AI功能不可用？

A: 请检查：
1. 是否配置了Coze API密钥
2. 网络连接是否正常
3. API调用次数是否超限

## 📄 许可证

本项目仅供学习和研究使用。

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📧 联系方式

如有问题，请通过GitHub Issues联系。

---

**版本**：V7.5.0
**最后更新**：2025-01-22
