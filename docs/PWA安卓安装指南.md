# 儿童安全座椅设计助手 - PWA安卓安装指南

## 安装失败的可能原因及解决方案

### 问题1：图标格式不支持（最常见）

**症状：**
- 浏览器中显示"添加到主屏幕"按钮，但点击后无法安装
- 安装后图标显示不正确
- 某些设备无法识别PWA应用

**原因：**
安卓Chrome浏览器对SVG格式的PWA图标支持不完整，需要PNG格式。

**解决方案：**

1. **快速转换图标**（推荐）：
   - 访问在线转换工具：https://cloudconvert.com/svg-to-png
   - 上传 `public/icon-192.svg`，转换为 192x192 PNG
   - 上传 `public/icon-512.svg`，转换为 512x512 PNG
   - 下载并重命名为 `icon-192.png` 和 `icon-512.png`
   - 放到 `public/` 目录下

2. **手动转换**：
   - 使用 Photoshop、GIMP 或任何图片编辑软件
   - 打开SVG文件
   - 导出为PNG格式，尺寸分别为192x192和512x512
   - 保存到 `public/` 目录

### 问题2：manifest.json MIME类型错误

**症状：**
- Chrome开发者工具显示manifest加载错误
- PWA功能不工作

**解决方案：**
检查 `next.config.js` 或 `next.config.mjs` 文件，添加以下配置：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 问题3：Service Worker未注册

**症状：**
- 无法离线使用应用
- PWA安装提示不显示

**检查步骤：**
1. 打开Chrome开发者工具（F12）
2. 切换到"Application"标签
3. 查看"Service Workers"部分
4. 确认 `sw.js` 状态为"activated"或"running"

**解决方案：**
检查 `src/app/layout.tsx` 中的Service Worker注册代码是否正确。

### 问题4：HTTP协议问题

**症状：**
- PWA安装按钮不显示
- 控制台提示"Service Worker只能在HTTPS下运行"

**解决方案：**
- PWA必须在HTTPS环境下才能安装
- 本地开发可以使用 `http://localhost:5000`（localhost例外）
- 生产环境必须配置HTTPS证书

### 问题5：浏览器不兼容

**症状：**
- 使用UC浏览器、QQ浏览器等无法安装

**解决方案：**
- **必须使用Chrome浏览器**（Android最佳选择）
- 或使用Edge浏览器（Chromium内核）
- 其他浏览器对PWA支持不完整

## 正确的安装步骤

### 方法1：使用自动安装提示（推荐）

1. **确保满足条件：**
   - 使用Chrome浏览器
   - 访问 https://your-domain.com（或 http://localhost:5000）
   - 首次访问会显示安装提示

2. **点击"立即安装"按钮**
   - 页面顶部会显示蓝色安装提示条
   - 点击"立即安装"
   - 按照浏览器提示完成安装

### 方法2：通过浏览器菜单安装

1. **打开Chrome菜单**
   - 点击浏览器右上角三个点（⋮）

2. **选择"添加到主屏幕"**
   - 如果看不到此选项，说明PWA条件未满足

3. **点击"添加"**
   - 确认添加应用

### 方法3：通过地址栏图标

1. **查看地址栏右侧**
   - 可能会显示一个"+"图标或安装图标

2. **点击图标**
   - 选择"安装应用"或"添加到主屏幕"

## 验证安装成功

### 检查项：

1. **主屏幕图标：**
   - 主屏幕出现"座椅助手"图标
   - 图标清晰显示

2. **独立窗口运行：**
   - 点击图标启动应用
   - 不显示浏览器地址栏
   - 全屏或独立窗口显示

3. **离线可用：**
   - 关闭网络
   - 应用仍能正常使用

4. **状态栏显示：**
   - 应用名称"座椅助手"显示在状态栏
   - 主题色显示正确（紫色）

## 常见问题排查

### Q: 为什么安装按钮不显示？

**A:**
1. 检查是否使用Chrome浏览器
2. 检查是否通过HTTPS访问（localhost除外）
3. 检查manifest.json是否正确加载（开发者工具 → Application → Manifest）
4. 检查是否有PNG格式图标

### Q: 安装后图标是空白或默认图标？

**A:**
这是图标格式问题，必须将SVG转换为PNG格式。

### Q: 安装后应用无法离线使用？

**A:**
检查Service Worker是否正确激活：
- 开发者工具 → Application → Service Workers
- 确保状态为"activated"

### Q: 如何卸载PWA？

**A:**
1. 长按主屏幕上的应用图标
2. 点击"卸载"或"删除"
3. 确认删除

## 技术支持

如果以上方法都无法解决，请提供以下信息：

1. 浏览器版本（设置 → 关于Chrome）
2. Android系统版本
3. 错误信息截图
4. 开发者工具中的错误日志（Console标签）

## 注意事项

- **首次安装需要网络**：安装后可离线使用
- **定期更新**：PWA会自动更新
- **存储空间**：确保手机有足够存储空间
- **权限要求**：某些功能可能需要相机、存储等权限

---

**最后更新：** 2025-01-22
**适用版本：** V7.5.0
