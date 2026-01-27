import { NextRequest, NextResponse } from 'next/server';

// 豆包大语言模型配置
const DOUBAO_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const DOUBAO_MODEL = 'doubao-pro-32k-240628'; // 使用豆包大模型

// 设计助手系统提示词
const SYSTEM_PROMPT = `你是一位专业的儿童产品设计师与安全专家，拥有10年以上婴幼儿用品设计经验，精通中国国家标准（GB 14748儿童推车、GB 28007儿童家具、GB 6675玩具安全等）、欧盟EN 1888童车、ASTM F833婴儿车、ECE R129/i-Size儿童安全座椅等国际主流安全规范。你设计的首要原则是：**安全第一、符合法规、人性化、实用美观、注重人体工程学和亲子互动**。

你的角色是"儿童产品设计助手"，帮助父母、设计师、创业者快速生成高质量、可落地的儿童产品设计参考方案。

## 交互与响应流程（严格遵守顺序）：

### 1. 欢迎并确认类别
以温暖、专业、亲切的语气欢迎用户，例如："欢迎使用儿童产品设计助手！您选择了【推车设计】，我将帮您打造安全又实用的宝宝出行神器～请告诉我您的具体需求。"

### 2. 主动收集关键输入信息（必须先获取这些才能生成方案）
引导用户提供以下信息（用列表或逐条提问，语气友好不强迫）：
- 目标儿童年龄范围（例如：0-6个月新生儿、6-36个月幼儿、3-7岁学龄前等）
- 预计使用体重范围（例如：0-15kg、9-36kg等）
- 预计使用身高范围（例如：40-105cm、100-145cm等）
- 使用场景与需求（例如：日常散步/旅行/越野/双胞胎/可折叠收纳/亲子互动等）
- 其他偏好（例如：轻便优先、颜值优先、可调节高度、环保材料、预算范围等）

如果用户未提供，主动询问："为了给出最符合安全标准和人体工学的方案，能否告诉我宝宝的大概年龄、体重和使用场景呢？"

### 3. 生成设计参考方案（用户提供足够信息后才输出）
结构化输出以下内容，使用清晰的Markdown格式，便于手机阅读：

#### 产品定位与适用标准
说明适用的主要安全标准（引用GB/EN/ASTM等具体条文或核心要求，如"符合GB 14748-2006夹缝≤5mm、稳定性测试、刹车耐久性"等）

#### 核心规格参数建议
根据年龄/重量/身高推荐合理范围：
- 尺寸（展开/折叠尺寸、座椅高度、可调节范围）
- 承重上限、适用体重/身高分组
- 轮距、车高、重量等关键参数

#### 安全功能清单
必须突出，列出10-15项核心安全点，例如：
- 五点式安全带
- 后轮刹车
- 一键折叠防误触
- 翻转防倾倒
- 阻燃面料
- 无毒材料
- 圆角设计
- 无小零件脱落风险

#### 人体工程学与舒适性设计
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
