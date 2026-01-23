# 🤖 GitHub构建傻瓜教程 - 3分钟搞定APK

> **目标：无需懂代码，按照步骤操作即可下载APK**

---

## 📦 第一步：下载并解压（1分钟）

### 下载
```
https://coze-coding-project.tos.coze.site/coze_storage_7598078310014550031/child-product-design-assistant-v8.0.0-github-actions.tar_b2c37b26.gz?sign=1769743131-bcb85b9f6d-0-5dea6bb451d2cc7c80de69d15bedfd633d1bb49e9807442cc72821973af8d42a
```

### 解压
- Windows：右键 → "解压到当前文件夹"
- Mac：双击解压

---

## 🌐 第二步：创建GitHub仓库（1分钟）

### 如果没有GitHub账号
1. 访问：https://github.com/
2. 点击 "Sign up" 注册
3. 用邮箱验证

### 创建仓库
1. 登录后，点击右上角 **"+"** → **"New repository"**
2. 填写：
   - **Repository name**：`child-product-design-assistant`
   - 选择 **Public**（免费）
3. 点击 **"Create repository"**
4. **复制仓库地址**（如：`https://github.com/你的用户名/child-product-design-assistant.git`）

---

## 📤 第三步：上传代码（复制粘贴即可）

### Windows用户（使用Git Bash）

1. **打开Git Bash**
   - 右键文件夹 → "Git Bash Here"
   - 或开始菜单搜索 "Git Bash"

2. **逐条复制粘贴以下命令**（按回车执行）：

```bash
cd child-product-design-assistant
git init
git add .
git commit -m "first"
git remote add origin https://github.com/你的用户名/child-product-design-assistant.git
git branch -M main
git push -u origin main
```

3. **如果要求输入密码**：
   - Username：你的GitHub用户名
   - Password：需要生成Token

### 生成Token（一次性）

1. 访问：https://github.com/settings/tokens
2. 点击 **"Generate new token (classic)"**
3. 勾选 **repo**（第一行）
4. 点击 **"Generate token"**
5. **复制token**（只显示一次！）
6. 在Git Bash中粘贴作为密码

---

## ⏳ 第四步：等待构建完成（10-15分钟）

### 自动构建
- 代码推送后**自动开始构建**
- 无需任何操作

### 查看进度
1. 打开你的GitHub仓库
2. 点击顶部的 **"Actions"** 标签
3. 看到黄色圆圈⭕表示正在构建
4. 绿色✓表示成功，红色✗表示失败

---

## 📥 第五步：下载APK（1分钟）

1. 在Actions页面，点击绿色的构建任务
2. 滚动到最底部
3. 看到 **"Artifacts"** 区域
4. 点击 **"app-debug-apk"**
5. 下载ZIP文件
6. 解压ZIP，得到 `app-debug.apk`

---

## 📲 安装APK到手机

1. **将APK文件发送到手机**（微信/QQ/数据线）
2. **允许安装未知应用**（设置 → 安全 → 允许）
3. **点击APK文件** → **安装**

---

## ✅ 成功标志

- ✅ 手机上看到"儿童产品设计助手"图标
- ✅ 点击可以打开应用
- ✅ 功能正常使用

---

## ❓ 遇到问题？

### 问题1：git命令找不到
**解决**：下载安装Git
```
https://git-scm.com/download/win
```

### 问题2：构建失败
**解决**：
1. 打开失败的构建任务
2. 点击失败的红色步骤
3. 查看错误信息
4. 或查看 `GITHUB_ACTIONS_BUILD_GUIDE.md`

### 问题3：Token错误
**解决**：重新生成Token，确保勾选了 `repo` 权限

### 问题4：APK无法安装
**解决**：
- 开启"允许安装未知来源"
- 检查APK文件是否完整
- 尝试重新构建

---

## 🎯 更快的方法

### 如果你是程序员
直接使用GitHub Desktop：
1. 下载GitHub Desktop
2. Clone仓库
3. 拖入项目文件
4. 点击"Commit & Push"

### 如果不会用Git
使用GitHub网页上传：
1. 在仓库页面点击"uploading an existing file"
2. 拖入所有文件
3. 点击"Commit changes"
4. 手动触发构建（见下方）

---

## 🔄 手动触发构建

如果代码推送后没有自动构建：

1. 打开仓库 → **Actions** 标签
2. 左侧点击 **"Build Android APK"**
3. 右侧点击 **"Run workflow"**
4. 选择 **main** 分支
5. 点击 **绿色的"Run workflow"** 按钮

---

## 💡 重要提示

| 注意事项 | 说明 |
|---------|------|
| 💰 免费 | 公开仓库完全免费 |
| ⏱️ 首次构建 | 15-20分钟（下载工具） |
| ⚡ 后续构建 | 8-10分钟 |
| 📦 APK有效期 | 7天（之后删除） |
| 🔄 重新构建 | 修改文件后重新推送 |

---

## 🎉 恭喜！

如果按照以上步骤操作，你应该已经成功获得了APK文件！

---

## 📚 需要更多帮助？

- **详细教程**：`GITHUB_ACTIONS_BUILD_GUIDE.md`
- **快速指南**：`GITHUB_QUICK_START.md`
- **官方文档**：https://docs.github.com/en/actions

---

**这就是最简单的GitHub构建方法，跟着做就行！** 👍
