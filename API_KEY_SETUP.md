# DOUBAO_API_KEY配置指南

## 问题描述

用户在APK中运行时遇到以下错误：
```
生成报告失败，AI未返回任何内容
AI返回的内容为空，请检查API配置或稍后重试
接收到X个chunk，但未提取到有效内容
```

## 根本原因

**DOUBAO_API_KEY未配置或配置错误**

儿童安全座椅设计助手需要调用豆包大语言模型API生成设计报告，如果没有配置有效的API Key，豆包API会返回错误或空响应。

## 解决方案

### 方案1：配置豆包API Key（推荐）

#### 步骤1：获取豆包API Key

1. 访问[豆包开放平台](https://www.volcengine.com/product/ark)
2. 注册/登录账号
3. 进入控制台
4. 创建API Key
5. 复制API Key

#### 步骤2：配置环境变量

**开发环境（本地运行）**：

编辑项目根目录的`.env`文件：
```env
DOUBAO_API_KEY=你的API_KEY
```

**生产环境（部署）**：

在部署环境中设置环境变量：
```bash
export DOUBAO_API_KEY=你的API_KEY
```

或者在Docker容器中：
```yaml
environment:
  - DOUBAO_API_KEY=你的API_KEY
```

#### 步骤3：重启应用

```bash
# 停止当前运行
pkill -f "next dev"

# 重新启动
coze dev
```

### 方案2：使用coze-coding-dev-sdk（替代方案）

如果无法获取豆包API Key，可以使用coze-coding-dev-sdk提供的免费大模型服务。

**注意**：这需要修改代码，将豆包API调用改为使用coze-coding-dev-sdk。

### 方案3：使用Mock数据（仅用于测试）

如果暂时无法获取API Key，可以使用Mock数据返回预设的设计报告。

**注意**：这仅用于开发测试，不能用于生产环境。

## 验证API Key配置

### 方法1：查看日志

启动应用后，查看日志输出：

```bash
coze dev > /tmp/app.log 2>&1 &
tail -f /tmp/app.log
```

如果看到以下日志，说明API Key配置成功：
```
[API] 开始处理豆包API流式响应...
[API] 提取到content (长度 12): ## 模块1：产品
[API] 提取到content (长度 20): 定位与适用标准
```

如果看到以下日志，说明API Key配置失败：
```
Doubao API error: ...
API request failed: 401
```

### 方法2：测试API端点

使用curl测试：
```bash
curl -X POST http://localhost:5000/api/design-assistant \
  -H "Content-Type: application/json" \
  -d '{"standard":"R129","heightRange":"40-105cm","weightRange":null}'
```

**成功响应**：
- 返回流式SSE数据
- 状态码：200

**失败响应**：
```json
{
  "success": false,
  "error": "DOUBAO_API_KEY未配置",
  "details": "请在.env文件中配置DOUBAO_API_KEY环境变量"
}
```

### 方法3：查看浏览器控制台

1. 打开浏览器控制台（F12）
2. 访问应用
3. 输入参数并生成报告
4. 查看控制台日志

**成功日志**：
```
开始处理流式响应...
Chunk 1: data: {"content":"##"}
添加content: ##
...
流式响应结束，总共接收 45 个chunk
Full content from AI (length: 856): ...
报告已设置
```

**失败日志**：
```
生成报告错误: Error: DOUBAO_API_KEY未配置
错误详情: {
  name: 'Error',
  message: 'DOUBAO_API_KEY未配置',
  stack: '...'
}
```

## 诊断"AI未返回任何内容"问题

### 1. 查看原始响应

在错误信息中，点击"显示调试"按钮，查看原始响应内容。

如果看到：
```
接收到X个chunk，但未提取到有效内容

原始响应:
data: {"id":"chat-123","object":"chat.completion.chunk","created":1234567890,"model":"doubao-pro-32k-240628","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}
data: {"id":"chat-123","object":"chat.completion.chunk","created":1234567890,"model":"doubao-pro-32k-240628","choices":[{"index":0,"delta":{"content":""},"finish_reason":null}]}
```

说明：
- API Key配置成功
- 豆包API返回了响应
- 但是没有实际的content内容

可能原因：
1. 输入参数问题
2. API调用参数错误
3. 豆包API暂时不可用

### 2. 检查API Key有效性

```bash
# 测试API Key是否有效
curl -X POST https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 你的API_KEY" \
  -d '{
    "model": "doubao-pro-32k-240628",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 10
  }'
```

**成功响应**：
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "你好！"
      }
    }
  ]
}
```

**失败响应**：
```json
{
  "error": {
    "message": "Invalid API key",
    "code": 401
  }
}
```

### 3. 检查账户余额

访问豆包控制台，检查账户余额是否充足。

如果余额不足，API会返回错误或空响应。

## 常见问题

### Q1: API Key配置后仍然报错

**可能原因**：
1. API Key复制错误（有空格或换行）
2. 应用没有重启
3. .env文件不在正确的位置

**解决方法**：
1. 重新复制API Key，确保没有多余字符
2. 重启应用：`coze dev`
3. 确保.env文件在项目根目录

### Q2: 配置了API Key但返回空内容

**可能原因**：
1. 账户余额不足
2. 账户被冻结
3. API调用参数错误
4. 豆包API暂时不可用

**解决方法**：
1. 检查账户余额
2. 检查账户状态
3. 查看后端日志，确认API调用参数
4. 联系豆包技术支持

### Q3: 在APK中如何配置API Key

**方法1：环境变量（推荐）**

在部署APK时设置环境变量：
```bash
export DOUBAO_API_KEY=你的API_KEY
```

**方法2：.env文件**

将.env文件打包到APK中（不推荐，不安全）。

**方法3：配置页面（最佳）**

添加配置页面，让用户输入API Key并保存到本地存储。

## 联系支持

如果以上方法都无法解决问题，请：

1. 收集以下信息：
   - 完整的错误信息
   - 浏览器控制台日志
   - 后端日志（如果有）
   - API Key状态（已配置/未配置）

2. 通过以下方式联系技术支持：
   - GitHub Issues
   - 技术支持邮箱
   - 在线客服

## 相关文档

- [DEBUG_GUIDE.md](./DEBUG_GUIDE.md) - 调试指南
- [FIX_VALIDATION_REPORT.md](./FIX_VALIDATION_REPORT.md) - 修复验证报告
- [APK_TEST_GUIDE.md](./APK_TEST_GUIDE.md) - APK测试指南

---

**最后更新**: 2026-01-27
**适用版本**: V8.6.0+
