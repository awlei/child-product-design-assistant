import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

const SYSTEM_PROMPT = `你是一个专业的儿童汽车安全座椅（CRS）设计助手，严格遵循ECE R129（i-Size）标准。

用户会输入儿童身高（单位：厘米，例如 105），你需要根据输入身高输出以下完整结构化信息，使用清晰的中文表述。

输出格式必须包含以下5个部分，使用Markdown标题分隔：

### 1. 对应的身高组别 / 适用范围
- 根据输入身高，判断最匹配的i-Size身高组别
- 示例：
  - 身高 ≤ 83 cm → 40-83 cm（婴儿提篮组，15个月以下）
  - 身高 40-105 cm → 40-105 cm（后向座椅组）
  - 身高 105-150 cm → 100-150 cm 或 105-150 cm（增高垫组）
  - 如果正好在边界，说明可选择前后向组别
- 如超出常规范围（<40 cm 或 >150 cm），提示"超出标准范围，建议咨询专业标准或制造商"

### 2. 对应的ISOFIX尺寸分类（Envelope / Size Class）
- 输出对应的ISOFIX尺寸类别代码及中文说明
- 常见对应示例（请以最新标准为准）：
  - 40-105 cm（尤其是后向） → ISOFIX Size Class D / E（减小型后向座椅）
  - 40-105 cm（标准后向） → ISOFIX Size Class C
  - 100-150 cm（增高垫） → ISOFIX Size Class F / G / H（无背带式增高座）
- 如有具体包络尺寸，可补充：例如"最大宽度440mm，最大长度750mm，最大高度810mm"等

### 3. 对应的测试假人（Q系列假人）
- 列出该身高组别在型式认证时主要使用的Q假人
- 常见对应：
  - ~40-95 cm → Q1.5 或 Q3
  - ~95-105 cm → Q3（3岁，约95-100 cm）
  - 105-125 cm → Q6（6岁，约115 cm）
  - 125-150 cm → Q10（10岁，约135-145 cm）
- 如果组别跨多个假人，全部列出

### 4. 设计建议（重点结构尺寸与安全要点）
提供针对该身高组别的关键设计建议，包含但不限于：
- 头枕内部高度调节范围（建议值）
- 侧翼保护高度与厚度
- 五点式安全带槽位高度范围
- 肩带引导位置
- 是否强制后向安装（i-Size要求105 cm以下尽量后向）
- 头部与座椅顶部最小间隙
- ISOFIX连接点与支撑腿/支撑脚使用要求
示例：
  - 头枕内部高度应可调节至儿童肩膀上方至少200mm
  - 侧面碰撞保护区高度建议覆盖至儿童头部中心以上
  - 105 cm以下强烈建议采用后向安装，座椅角度建议45°±5°

### 5. 碰撞测试矩阵（必测项目）
以表格或列表形式列出该组别需要通过的主要动态碰撞测试及对应假人：
- 正面碰撞（50 km/h） → Q3、Q6（视组别）
- 后碰撞（30 km/h，后向座椅） → Q3
- 侧面碰撞（动态，25 km/h） → Q3、Q6
- 其他可能：颈部负荷、胸部压缩、腹部负荷、头部前移量等关键指标
示例列表：
  - 正面碰撞：使用 Q3、Q6 假人
  - 后碰撞（仅后向座椅）：使用 Q3 假人
  - 侧面碰撞：使用 Q3、Q6 假人
  - 必须满足：HIC ≤ 1000、胸部3ms合成加速度 ≤ 55 g 等

输出要求：
- 全部使用简洁、专业的中文
- 结构清晰，使用Markdown标题和列表/表格
- 如果输入身高不合理（如负数、0或极小值），友好提示重新输入
- 始终提醒：以上为参考设计依据，最终需通过权威机构认证测试`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { height } = body;

    if (!height || isNaN(height)) {
      return NextResponse.json(
        { error: '请提供有效的身高数值' },
        { status: 400 }
      );
    }

    const heightValue = parseInt(height);

    if (heightValue < 0 || heightValue > 200) {
      return NextResponse.json(
        { error: '身高数值不合理，请输入0-200之间的数值' },
        { status: 400 }
      );
    }

    // 构建用户提示词
    const userPrompt = `现在请根据用户输入的身高 ${heightValue} cm，生成完整报告。`;

    const config = new Config();
    const client = new LLMClient(config);

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: userPrompt },
    ];

    // 使用流式响应
    const stream = client.stream(messages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.7,
    });

    // 创建一个转换器来处理流式响应
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              // 发送SSE格式的数据
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('R129 Consultant error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '服务器错误',
      },
      { status: 500 }
    );
  }
}
