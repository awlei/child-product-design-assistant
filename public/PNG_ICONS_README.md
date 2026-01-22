# PWA图标转换说明

## 为什么需要PNG图标？

安卓Chrome浏览器对SVG格式的PWA图标支持不完整，可能导致以下问题：
- PWA安装按钮不显示
- 应用图标在主屏幕显示不正确
- 某些设备无法识别应用

## 如何生成PNG图标？

### 方法1：使用在线工具（推荐）
1. 访问 https://cloudconvert.com/svg-to-png
2. 上传 `icon-192.svg`，转换为 192x192 PNG
3. 上传 `icon-512.svg`，转换为 512x512 PNG
4. 下载并重命名为：
   - `icon-192.png`
   - `icon-512.png`
5. 将文件放到 `public/` 目录下

### 方法2：使用命令行工具
如果你有 ImageMagick 安装：

```bash
# 安装 ImageMagick（如果未安装）
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# 转换图标
convert icon-192.svg -resize 192x192 icon-192.png
convert icon-512.svg -resize 512x512 icon-512.png
```

### 方法3：使用 Node.js 工具

```bash
# 安装 sharp
pnpm add -D sharp

# 创建转换脚本
# 将下面的代码保存为 convert-icons.js 并运行
```

## 验证图标是否正确

1. 在 Chrome 浏览器中打开 `chrome://web-app-internals`
2. 检查图标是否正确显示
3. 在开发者工具中检查 manifest.json 是否正确加载

## 快速测试

```bash
# 检查 manifest.json 是否可访问
curl -I https://your-domain.com/manifest.json

# 应该返回：
# Content-Type: application/manifest+json
```

## 注意事项

- PNG图标应该是正方形
- 背景透明或与主题色匹配
- 图标内容清晰，在小尺寸下也能识别
- 确保PNG文件的MIME类型正确（image/png）
