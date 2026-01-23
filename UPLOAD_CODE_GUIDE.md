# 📤 代码上传指南 - 3种方法任选

> **选择最适合你的方法，3种方法都能成功上传代码！**

---

## 🎯 方法选择建议

| 方法 | 难度 | 速度 | 需要安装 | 推荐人群 |
|------|------|------|---------|---------|
| 方法1：网页上传 | ⭐ 超简单 | 慢 | 无 | 完全新手、文件少 |
| 方法2：Git Bash | ⭐⭐ 简单 | 快 | Git | 程序员、文件多 |
| 方法3：GitHub Desktop | ⭐⭐ 简单 | 中 | GitHub Desktop | 不喜欢命令行 |

---

## 🌐 方法1：网页上传（最简单，无需安装任何软件）

### 适用场景
- ✅ 文件数量 < 100个
- ✅ 文件总大小 < 25MB
- ✅ 不想安装Git
- ✅ 完全新手

### 操作步骤

#### 第一步：打开上传页面

1. 打开你的GitHub仓库
2. 点击仓库名称下方的 **"Add file"** 按钮
3. 选择 **"Upload files"**

#### 第二步：拖入文件

1. **拖拽文件**：将项目文件夹中的所有文件拖入上传区域

   **注意**：
   - ❌ 不要拖入 `node_modules` 文件夹（太大）
   - ❌ 不要拖入 `.next` 文件夹（自动生成）
   - ✅ 拖入所有其他文件和文件夹

2. 或者点击 **"choose your files"** 选择文件

#### 第三步：上传完成

1. 等待文件上传完成（显示绿色✓）
2. 在底部输入框输入：
   ```
   Initial commit
   ```
3. 点击绿色按钮 **"Commit changes"**

#### 第四步：手动触发构建

代码上传后**不会自动构建**，需要手动触发：

1. 点击仓库顶部的 **"Actions"** 标签
2. 左侧点击 **"Build Android APK"**
3. 右侧点击 **"Run workflow"**
4. 选择 **main** 分支
5. 点击绿色按钮 **"Run workflow"**

#### 优缺点

| 优点 | 缺点 |
|------|------|
| ✅ 无需安装任何软件 | ❌ 文件多时会很慢 |
| ✅ 操作直观 | ❌ 单次最大25MB |
| ✅ 适合初学者 | ❌ 需要手动触发构建 |

---

## 💻 方法2：Git Bash（推荐，最常用）

### 适用场景
- ✅ 文件数量多
- ✅ 需要经常更新代码
- ✅ 想要快速上传
- ✅ 愿意学习基本命令

### 前置准备

#### 安装Git（如果没有）

1. **下载Git**
   ```
   https://git-scm.com/download/win
   ```

2. **安装Git**
   - 双击下载的安装程序
   - 全部选择默认
   - 一路点击"Next"
   - 点击"Finish"完成安装

3. **验证安装**
   - 按键盘 `Win + R`
   - 输入 `cmd` 回车
   - 输入：
     ```
     git --version
     ```
   - 如果显示版本号（如 `git version 2.45.0`），说明安装成功

#### 生成Token（一次性）

GitHub不再支持密码登录，需要生成Token：

1. **登录GitHub**
   ```
   https://github.com/
   ```

2. **生成Token**
   - 点击右上角头像 → **Settings**
   - 左侧最底部 → **Developer settings**
   - 左侧 → **Personal access tokens** → **Tokens (classic)**
   - 右上角 → **"Generate new token (classic)"**

3. **设置Token**
   - Note：输入任意名称（如 `upload-code`）
   - Expiration：选择 `90 days` 或 `No expiration`
   - **勾选权限**：
     - ☑️ **repo**（第一行，点击即全选）
   - 滚动到底部 → 点击 **"Generate token"**

4. **复制Token**
   - ⚠️ **重要**：Token只显示一次，必须立即复制！
   - 建议保存到记事本

### 操作步骤

#### 第一步：打开Git Bash

**Windows用户**：
- 方法1：右键项目文件夹 → "Git Bash Here"
- 方法2：开始菜单 → 搜索 "Git Bash"

**Mac用户**：
- 打开"终端"（Terminal）

#### 第二步：进入项目文件夹

在Git Bash中输入：
```bash
cd child-product-design-assistant
```

**说明**：
- `cd` = change directory（进入目录）
- 如果你的文件夹名不同，替换为实际名称
- 可以输入 `ls` 查看当前目录文件

#### 第三步：初始化Git仓库

```bash
git init
```

**说明**：
- 初始化Git版本控制
- 会在文件夹中创建 `.git` 隐藏文件夹

#### 第四步：添加所有文件

```bash
git add .
```

**说明**：
- `git add` = 添加文件到暂存区
- `.` = 当前文件夹所有文件
- 可能会有很多警告信息，忽略即可

#### 第五步：提交更改

```bash
git commit -m "Initial commit"
```

**说明**：
- `git commit` = 提交更改
- `-m` = message（提交信息）
- `"Initial commit"` = 提交信息内容

#### 第六步：连接GitHub仓库

```bash
git remote add origin https://github.com/你的用户名/child-product-design-assistant.git
```

**说明**：
- `git remote add` = 添加远程仓库
- `origin` = 远程仓库的别名（习惯用法）
- 替换 `你的用户名` 为你的实际GitHub用户名

**示例**：
如果你的用户名是 `zhangsan123`，命令就是：
```bash
git remote add origin https://github.com/zhangsan123/child-product-design-assistant.git
```

#### 第七步：推送到GitHub

```bash
git branch -M main
git push -u origin main
```

**说明**：
- `git branch -M main` = 将分支重命名为 main
- `git push -u origin main` = 推送到GitHub

#### 第八步：输入用户名和密码

执行第七步后，会提示输入：

```
Username for 'https://github.com': 
```
- 输入你的**GitHub用户名**，回车

```
Password for 'https://你的用户名@github.com': 
```
- 输入你**复制的Token**，回车
- ⚠️ **密码输入时不会显示任何字符**，直接粘贴即可

#### 第九步：等待上传完成

看到类似输出表示成功：
```
Enumerating objects: xxx, done.
Counting objects: 100% (xxx/xxx), done.
...
To https://github.com/你的用户名/child-product-design-assistant.git
 * [new branch]      main -> main
```

### 优化：保存Token（下次不用再输入）

配置Git记住Token：

```bash
git config --global credential.helper store
```

下次push时会要求输入一次，之后会自动记住。

### 常见问题

| 问题 | 解决方法 |
|------|---------|
| `fatal: not a git repository` | 没有执行 `git init` |
| `fatal: remote origin already exists` | 先执行 `git remote remove origin` 再重新添加 |
| `error: failed to push some refs` | 可能是网络问题，重试 `git push` |
| `Username/Password` 错误 | 确保使用Token而不是GitHub密码 |

---

## 🖥️ 方法3：GitHub Desktop（图形界面）

### 适用场景
- ✅ 不喜欢命令行
- ✅ 想要可视化操作
- ✅ Windows/Mac用户

### 前置准备

#### 安装GitHub Desktop

1. **下载GitHub Desktop**
   ```
   https://desktop.github.com/
   ```

2. **安装GitHub Desktop**
   - 双击下载的安装程序
   - 按提示完成安装
   - 登录你的GitHub账号

### 操作步骤

#### 第一步：克隆仓库

1. 打开 **GitHub Desktop**
2. 点击左上角 **"File"** → **"Clone repository"**
3. 选择 **URL** 标签
4. 输入仓库地址：
   ```
   https://github.com/你的用户名/child-product-design-assistant.git
   ```
5. 点击 **"Clone"**
6. 选择保存位置（默认即可）

#### 第二步：复制文件

1. 打开克隆后的文件夹
   - GitHub Desktop会显示路径，点击可打开
2. 将你的项目文件**全部复制**到这个文件夹
3. 确保覆盖或添加所有文件

#### 第三步：提交更改

1. 回到 **GitHub Desktop**
2. 会看到所有更改的文件
3. 在左下角输入框输入：
   ```
   Initial commit
   ```
4. 点击 **"Commit to main"** 按钮

#### 第四步：推送

1. 点击右上角的 **"Publish repository"** 或 **"Push origin"**
2. 等待上传完成

#### 优缺点

| 优点 | 缺点 |
|------|------|
| ✅ 图形界面，直观 | ❌ 需要安装软件 |
| ✅ 无需命令行 | ❌ 占用磁盘空间 |
| ✅ 可视化历史记录 | ❌ 性能不如命令行 |

---

## 🎯 总结：选择哪种方法？

### 如果你完全不懂技术
→ **方法1：网页上传**
- 无需安装任何软件
- 操作最简单

### 如果你愿意学习一点点
→ **方法2：Git Bash**
- 只需复制粘贴命令
- 最快最常用

### 如果你喜欢图形界面
→ **方法3：GitHub Desktop**
- 可视化操作
- 无需命令行

---

## ✅ 上传成功的标志

无论使用哪种方法，成功后：

1. ✅ 刷新GitHub仓库页面
2. ✅ 看到所有文件列表
3. ✅ 代码大小和文件数正确
4. ✅ Actions页面自动开始构建（方法2和3）

---

## 🔄 以后如何更新代码？

### 方法1：网页上传
重复上传步骤，新文件会覆盖旧文件

### 方法2：Git Bash
```bash
git add .
git commit -m "update"
git push
```

### 方法3：GitHub Desktop
1. GitHub Desktop会自动检测更改
2. 输入提交信息
3. 点击"Commit"
4. 点击"Push"

---

## 📚 更多帮助

- **GitHub官方文档**：https://docs.github.com/en
- **Git教程**：https://git-scm.com/book/zh/v2
- **问题反馈**：查看项目仓库的Issues页面

---

**选择一种方法，跟着做就行！都能成功上传代码！** 👍
