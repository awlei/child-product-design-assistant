# 儿童产品设计助手 V8.0.0 - 手机部署指南

## 📱 手机访问方式

### 方式一：Docker部署（推荐）

#### 1. 下载部署包
下载并解压 `child-product-design-assistant-v8.0.0-docker.tar.gz`

#### 2. 快速部署
```bash
# 进入项目目录
cd child-product-design-assistant

# 给脚本添加执行权限
chmod +x deploy.sh

# 一键部署
./deploy.sh
```

#### 3. 手机访问

**本地网络访问（同一WiFi）**
```bash
# 查看服务器IP地址
ip addr show

# 在手机浏览器输入: http://服务器IP:5000
# 例如: http://192.168.1.100:5000
```

**云服务器访问**
1. 在云服务器安全组中开放5000端口
2. 在手机浏览器输入: http://云服务器公网IP:5000

#### 4. PWA安装（添加到手机主屏幕）

**iOS (iPhone/iPad)**
1. 在Safari浏览器中打开应用
2. 点击底部的"分享"按钮（方形带箭头）
3. 向下滚动，选择"添加到主屏幕"
4. 点击"添加"完成

**Android**
1. 在Chrome浏览器中打开应用
2. 点击右上角菜单（三个点）
3. 选择"添加到主屏幕"或"安装应用"
4. 点击"添加"完成

### 方式二：手动Docker部署

#### 1. 构建镜像
```bash
docker build -t child-product-design-assistant .
```

#### 2. 运行容器
```bash
docker run -d \
  --name child-product-design-assistant \
  -p 5000:5000 \
  --restart unless-stopped \
  child-product-design-assistant
```

### 方式三：Docker Compose部署

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 🔧 常用管理命令

```bash
# 查看运行状态
docker ps

# 查看日志
docker logs -f child-product-design-assistant

# 重启容器
docker restart child-product-design-assistant

# 停止并删除容器
docker stop child-product-design-assistant
docker rm child-product-design-assistant

# 更新应用
git pull
docker-compose down
docker-compose up -d --build
```

## 🌐 网络配置

### 防火墙设置

**Ubuntu/Debian**
```bash
# 开放5000端口
sudo ufw allow 5000/tcp

# 查看防火墙状态
sudo ufw status
```

**CentOS/RHEL**
```bash
# 开放5000端口
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload

# 查看防火墙状态
sudo firewall-cmd --list-ports
```

### 云服务器安全组

**阿里云**
1. 进入云服务器ECS控制台
2. 找到实例 → 安全组 → 配置规则
3. 添加入方向规则：端口范围 5000/5000，授权对象 0.0.0.0/0

**腾讯云**
1. 进入云服务器控制台
2. 安全组 → 修改规则
3. 添加入站规则：端口 5000，来源 0.0.0.0/0

**华为云**
1. 进入控制台 → 安全组
2. 配置入方向规则：端口 5000，协议 TCP

## 📊 应用功能

### V8.0.0 核心功能

1. **产品类型选择**
   - 🛒 婴儿推车 / Stroller
   - 🚗 儿童安全座椅 / Child Safety Seat
   - 🪑 儿童高脚椅 / High Chair
   - 🛏️ 婴儿床 / Crib

2. **智能设计模块**
   - 综合设计 / Design
   - 尺寸计算 / Dimensions
   - 伤害指标 / Injury Criteria
   - GPS人体测量 / Anthropometric
   - 简笔画生成 / Sketch
   - AI智能设计助手 / AI Consultant

3. **双标准支持**
   - ECE R129（欧洲i-Size标准）
   - FMVSS 213（美国标准）

4. **中英文对照**
   - 全界面中英文双语显示

## 🐛 故障排查

### 无法访问应用

1. **检查容器状态**
```bash
docker ps
```

2. **查看日志**
```bash
docker logs child-product-design-assistant
```

3. **测试端口**
```bash
curl http://localhost:5000
```

4. **检查防火墙**
```bash
sudo netstat -tlnp | grep 5000
```

### 手机无法连接

1. **确保在同一网络**
   - 电脑和手机连接到同一个WiFi

2. **检查服务器IP**
```bash
ip addr show
```

3. **测试网络连通性**
```bash
ping 手机IP地址
```

4. **云服务器需配置安全组**
   - 确保云服务器安全组已开放5000端口

### 容器启动失败

1. **清理旧容器**
```bash
docker-compose down
docker system prune -f
```

2. **重新构建**
```bash
docker-compose build --no-cache
docker-compose up -d
```

## 📝 环境变量配置

创建 `.env` 文件（可选）：

```bash
# 豆包对象存储配置（如需使用对象存储功能）
COZE_BUCKET_ENDPOINT_URL=your_endpoint_url
COZE_BUCKET_NAME=your_bucket_name

# 应用配置
NODE_ENV=production
PORT=5000
HOSTNAME=0.0.0.0
```

## 🔒 安全建议

1. **生产环境建议**
   - 使用HTTPS（配置Nginx反向代理）
   - 设置强密码
   - 定期更新镜像

2. **Nginx反向代理配置示例**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📞 技术支持

如有问题，请检查：
1. Docker版本 >= 20.10
2. 系统内存 >= 2GB
3. 磁盘空间 >= 5GB

## 📄 许可证

MIT License

---

**版本**: V8.0.0
**更新日期**: 2026-01-23
