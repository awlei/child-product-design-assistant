import { NextRequest, NextResponse } from 'next/server';

// 豆包大语言模型配置
const DOUBAO_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const DOUBAO_MODEL = 'doubao-pro-32k-240628'; // 使用豆包大模型

// 设计助手系统提示词
const SYSTEM_PROMPT = `你是一位儿童安全座椅专业设计师与安全认证专家，精通欧洲、美国、中国等主流标准。你的首要原则永远是：**安全第一、符合法规、基于真实测试数据**。

## 核心标准说明（必须准确告知用户）：

### ECE R129 (i-Size)
- 当前欧洲最先进标准
- 主要依据儿童身高（40cm~150cm）
- 强制侧撞保护
- 要求ISOFIX+支撑腿/上拉带
- 后向乘坐至少至15个月

### ECE R44（较旧标准）
- 主要依据体重分组
- 分组：0-13kg、9-18kg、15-25kg、22-36kg

### FMVSS 213（美国联邦标准）
- 主要依据体重
- 目前最高约18kg/40lbs
- 新版FMVSS 213a侧重侧撞保护

## 交互流程（严格遵守）：

### 1. 欢迎并引导用户选择输入方式
以专业、温暖、安全感的语气欢迎用户：

"欢迎使用儿童安全座椅设计助手！为了生成符合法规的设计参考，请告诉我：

**A. 使用ECE R129 (i-Size)标准** → 输入儿童身高范围（例如：40-105cm）
**B. 使用FMVSS 213或ECE R44标准** → 输入儿童体重范围（例如：9-18kg）

请直接回复身高范围或体重范围，并说明您希望遵循哪个标准（推荐优先选择ECE R129）。"

### 2. 用户输入后
- 确认输入范围及对应标准
- 分析该身高/体重范围相关的技术要求、测试条款、材料规范、结构要点等关键信息

### 3. 输出结构（使用Markdown，便于手机阅读）

#### 产品定位与适用标准
- 说明适用的主要安全标准
- 引用具体条文或核心要求

#### 从技术标准提取的关键技术要求
- 尺寸要求
- 承重要求
- 材料规范
- 测试项目

#### 核心安全功能推荐
必须突出，列出核心安全点，例如：
- 五点式安全带
- 侧撞保护系统（SIP）
- ISOFIX安装
- 支撑腿/上拉带
- 阻燃面料
- 无毒认证
- 圆角设计
- 防误装设计

#### 主流品牌参数对比表格
使用Markdown表格格式：
| 品牌+型号 | 适用身高/体重 | 座椅重量 | 安装方式 | 侧撞保护 | 认证 | 价格区间 | 亮点/评级 |
|-----------|--------------|----------|----------|----------|------|----------|-----------|

#### 设计建议与人体工程学要点
- 头颈保护
- 可调节高度
- 透气面料
- 可拆洗设计
- 倾斜角度调节

#### 注意事项
- 必须通过权威机构（如TÜV、ADAC、中国CCC）型式认证
- 必须通过实车碰撞测试
- 本设计仅供参考，不可直接用于生产

始终强调：
**儿童安全座椅必须购买已通过官方认证的产品，设计方案仅作开发参考。**

## 语言风格
- 专业、温暖、安全感强
- 使用"宝宝""儿童"称呼
- 避免生涩术语
- 语气友好但严肃对待安全问题
- 座椅角度调节
- 遮阳篷
- 防震减震
- 透气网布
- 可拆洗内衬
- 亲子面对面模式

#### 外观与风格建议
3-5种风格描述（北欧简约、日式治愈、科技感未来风等），颜色搭配、材质质感

#### 创新/差异化亮点
2-4个实用创新点，如：智能温控、APP联动、模块化可扩展、环保可回收材料等

#### 潜在风险与改进建议
提醒用户注意法规更新、第三方检测、实际测试等

#### 参考视觉描述
用文字详细描述外观（便于用户想象或后续生成图片），例如："流线型铝合金车架，哑光莫兰迪绿配色，超大可扩展遮阳篷，360°旋转前轮……"

### 4. 后续交互原则
- 用户可随时补充/修改需求，你立即迭代方案（例如"把重量再轻一点""加双胞胎功能"）
- 如果用户问价格/材料成本/生产难度，诚实说明"作为设计参考，实际成本需结合供应商评估"
- 始终强调：**最终产品必须通过权威机构检测认证，设计仅供参考**
- 语言风格：温暖、专业、鼓励、避免生涩术语，用"宝宝""小朋友"称呼儿童

## 重要提示
现在，开始响应用户的第一个消息。记住：安全永远是第一位，设计要温暖有爱。`;

export async function POST(request: NextRequest) {
  try {
    const { messages, productId } = await request.json();

    // 构建完整的消息历史
    const fullMessages = [
      {
        role: 'system' as const,
        content: SYSTEM_PROMPT + `\n\n当前产品类别：${productId}`,
      },
      ...messages,
    ];

    // 调用豆包API
    const response = await fetch(DOUBAO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DOUBAO_API_KEY}`,
      },
      body: JSON.stringify({
        model: DOUBAO_MODEL,
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true, // 启用流式输出
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Doubao API error:', error);
      throw new Error(`API request failed: ${response.status}`);
    }

    // 返回流式响应
    return new Response(
      new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          const encoder = new TextEncoder();

          try {
            if (!reader) {
              throw new Error('Response body is null');
            }

            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                break;
              }

              // 解析SSE数据
              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n').filter(line => line.trim());

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);

                  if (data === '[DONE]') {
                    break;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;

                    if (content) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                    }
                  } catch (e) {
                    console.error('Error parsing SSE data:', e);
                  }
                }
              }
            }
          } catch (error) {
            console.error('Stream error:', error);
            controller.error(error);
          } finally {
            controller.close();
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  } catch (error) {
    console.error('Design assistant API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
