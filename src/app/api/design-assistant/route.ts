import { NextRequest, NextResponse } from 'next/server';
import { SearchClient, Config } from 'coze-coding-dev-sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

// 豆包大语言模型配置
const DOUBAO_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const DOUBAO_MODEL = 'doubao-pro-32k-240628';

// 读取技术数据
function loadTechnicalData() {
  try {
    // 读取FMVSS 213数据
    const fmvssPath = join(process.cwd(), 'src/data/fmvss-213-data.json');
    const fmvssData = JSON.parse(readFileSync(fmvssPath, 'utf-8'));

    // 读取GPS人体测量数据
    const gpsPath = join(process.cwd(), 'public/data/gps-anthro-data.json');
    const gpsData = JSON.parse(readFileSync(gpsPath, 'utf-8'));

    return { fmvssData, gpsData };
  } catch (error) {
    console.error('Error loading technical data:', error);
    return { fmvssData: null, gpsData: null };
  }
}

// 构建系统提示词
function buildSystemPrompt(technicalData: any): string {
  const { fmvssData, gpsData } = technicalData;

  let prompt = `【角色定位】
你是一位儿童安全座椅领域的资深设计专家，精通 ECE R129 (i-Size)、FMVSS 213、ECE R44 三大国际安全标准。你的任务是根据用户输入的身高/体重参数，输出专业、结构化的设计建议。

【输出要求】
严格按照以下三个模块输出，每个模块内容必须专业、具体、可落地：

【模块1：产品定位与适用标准】
- 明确该身高范围对应的儿童年龄段（如12-36个月）
- 说明该范围适用的市场区域（如欧洲/北美/全球）
- 强调该产品的核心差异化卖点（如"全阶段覆盖"或"轻量化设计"）

【模块2：关键技术要求】
- 基于所选标准列出3-5条强制性技术参数（如座椅角度、头枕高度调节范围、ISOFIX接口要求）
- 针对输入的身高范围，给出具体数值建议（如"40-75cm需使用新生儿插件"）

【模块3：核心安全功能推荐】
- 列出3-5个核心安全功能，每个功能需说明：功能名称 + 技术实现方式 + 安全价值
- 优先推荐适用于当前身高范围的功能（如105cm以下需强调五点式安全带）

【格式约束】
- 使用专业术语，但表述要清晰易懂
- 每个模块控制在200-300字
- 禁止输出无关的营销话术或过度夸张的形容词
- 输出格式必须使用JSON结构，便于前端解析

## 技术数据参考（必须使用以下真实数据）

### FMVSS 213 标准数据
`;

  if (fmvssData) {
    prompt += `**版本**: ${fmvssData.version}
**实施日期**: ${fmvssData.implementationDate}

**体重分组**:
`;

    fmvssData.weightGroups.forEach((group: any) => {
      prompt += `- ${group.name}: ${group.weightMinKg}-${group.weightMaxKg}kg (${group.weightMinLb}-${group.weightMaxLb}lb), 身高${group.heightMinMm}-${group.heightMaxMm}mm, 使用假人: ${group.dummy}
`;
    });

    prompt += `
**伤害指标**:

**正面碰撞**:
`;
    fmvssData.injuryCriteria.frontal.criteria.forEach((criteria: any) => {
      prompt += `- ${criteria.name}: ${criteria.value}${criteria.unit} - ${criteria.description}
`;
    });

    prompt += `
**侧面碰撞**:
`;
    fmvssData.injuryCriteria.side.criteria.forEach((criteria: any) => {
      prompt += `- ${criteria.name}: ${criteria.value}${criteria.unit} - ${criteria.description}
`;
    });

    prompt += `
**位移限制**:
`;
    fmvssData.excursionLimits.frontal.limits.forEach((limit: any) => {
      prompt += `- ${limit.position}: ${limit.limitMm}mm (${limit.limitIn}in) ${limit.description}
`;
    });

    prompt += `
**测试要求**:
- 正面碰撞: ${fmvssData.testRequirements.frontal.speed} - ${fmvssData.testRequirements.frontal.description}
- 侧面碰撞: ${fmvssData.testRequirements.side.speed} - ${fmvssData.testRequirements.side.description}

**安装方式**: ${fmvssData.installationMethods.join(', ')}
`;
  }

  prompt += `

### GPS 人体测量数据
`;

  if (gpsData && gpsData.r129_data) {
    prompt += `
**R129标准人体尺寸**:
`;
    const r129Data = gpsData.r129_data.slice(0, 10);
    r129Data.forEach((data: any) => {
      prompt += `- 身高 ${data.stature}cm: 坐高 ${data.sitting_height}cm, 肩宽 ${data.shoulder_breadth}cm, 臀宽 ${data.hip_breadth}cm, 肩高 ${data.shoulder_height_min}cm
`;
    });
  }

  prompt += `

## 核心标准说明

### ECE R129 (i-Size)
- 当前欧洲最先进标准
- 主要依据儿童身高（40cm~150cm）
- 强制侧撞保护
- 要求ISOFIX+支撑腿/上拉带
- 后向乘坐至少至15个月

### ECE R44/04（较旧标准）
- 主要依据体重分组
- 分组：0-13kg、9-18kg、15-25kg、22-36kg

### FMVSS 213（美国联邦标准）
- 主要依据体重
- 目前最高约18kg/40lbs
- 新版FMVSS 213a侧重侧撞保护

## JSON输出格式

【最关键】你**必须**且**只能**输出纯JSON对象，严格遵守以下要求：

### 绝对禁止
❌ 不要添加代码块标记
❌ 不要添加任何解释性文字、注释或说明
❌ 不要添加"以下是设计建议"等引导语
❌ 不要添加"请参考"或"设计完成后"等总结语

### 必须输出
✅ 仅输出一个完整的JSON对象，以 { 开始，以 } 结束
✅ JSON对象必须包含 module1、module2、module3 三个模块
✅ 每个模块必须包含完整的字段（title、content 或 requirements/features）

### JSON示例（请严格按照此格式输出）
{
  "module1": {
    "title": "产品定位与适用标准",
    "content": "该身高范围对应15-36个月儿童。适用欧洲市场（ECE R129 i-Size标准）。核心卖点：全阶段覆盖设计，可从40cm使用至105cm，满足儿童成长全周期需求。"
  },
  "module2": {
    "title": "关键技术要求",
    "requirements": [
      "座椅角度：后向乘坐角度应保持在45°-50°之间，确保新生儿头部安全",
      "头枕高度调节范围：40-75cm需使用新生儿插件，75-105cm头枕可调节至7档",
      "ISOFIX接口要求：必须符合ISO 13216标准，配备支撑腿或上拉带"
    ]
  },
  "module3": {
    "title": "核心安全功能推荐",
    "features": [
      {
        "name": "五点式安全带",
        "implementation": "采用高强度聚酯带，配备防滑锁定器，肩带宽度25mm",
        "safetyValue": "105cm以下儿童必须使用，分散碰撞冲击力，防止儿童滑脱"
      },
      {
        "name": "侧撞保护系统（SIP）",
        "implementation": "座椅两侧集成可折叠的侧翼，吸收侧面冲击能量",
        "safetyValue": "减少侧面碰撞对头部和胸部的伤害，降低伤害指标30%"
      }
    ]
  }
}

### 字段说明
- module1: { title: string, content: string }
- module2: { title: string, requirements: string[] }
- module3: { title: string, features: Array<{name: string, implementation: string, safetyValue: string}> }

### 验证要点
- 确保JSON格式正确，所有引号、括号匹配
- 确保所有字符串使用双引号
- 确保所有数组使用方括号 [] 包裹
- 确保所有对象使用大括号 {} 包裹

## 重要提示

1. 【绝对要求】必须且只能输出纯JSON对象，从第一个字符 { 开始，到最后一个字符 } 结束
2. 【禁令】严禁添加markdown代码块标记、解释性文字、注释、引导语、总结语
3. 【数据真实性】必须使用上面提供的技术数据，不能编造数据
4. 【内容质量】每个模块内容必须专业、具体、可落地，控制在200-300字
5. 【语言风格】禁止输出营销话术或过度夸张的形容词，使用专业术语
6. 【核心原则】始终强调：安全永远是第一位

## 输出检查清单（生成前自我检查）
- [ ] 输出是否以 { 开始？
- [ ] 输出是否以 } 结束？
- [ ] 输出是否包含markdown标记？（如果有，删除）
- [ ] 输出是否包含解释性文字？（如果有，删除）
- [ ] JSON格式是否完整且有效？
- [ ] 是否包含 module1、module2、module3 三个模块？`;

  return prompt;
}

// 联网搜索品牌参数
async function searchBrandParameters(
  standard: string,
  heightRange: string | null,
  weightRange: string | null
): Promise<string> {
  try {
    const config = new Config();
    const client = new SearchClient(config);

    let searchQuery = '';
    if (standard === 'R129' && heightRange) {
      searchQuery = `child car seat ${heightRange} ECE R129 i-Size Britax Cybex Maxi-Cosi specifications price 2025`;
    } else if (weightRange) {
      searchQuery = `child car seat ${weightRange} FMVSS 213 Graco Chicco Evenflo specifications price 2025`;
    } else {
      return '';
    }

    const response = await client.webSearchWithSummary(searchQuery, 8);
    return response.summary || '';
  } catch (error) {
    console.error('Brand search error:', error);
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    // 检查API Key是否配置
    if (!process.env.DOUBAO_API_KEY || process.env.DOUBAO_API_KEY.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'DOUBAO_API_KEY未配置',
          details: '请在.env文件中配置DOUBAO_API_KEY环境变量，或联系开发团队获取API Key。',
        },
        { status: 500 }
      );
    }

    const { standard, heightRange, weightRange } = await request.json();

    // 加载技术数据
    const technicalData = loadTechnicalData();

    // 联网搜索品牌参数
    const brandSearchResults = await searchBrandParameters(
      standard,
      heightRange,
      weightRange
    );

    // 构建用户消息
    let userMessage = '';

    if (standard === 'R129') {
      userMessage = `请为以下身高范围生成儿童安全座椅设计建议：

**安全标准**: ECE R129 (i-Size)
**身高范围**: ${heightRange}

请严格按照三个模块的要求输出JSON格式的设计建议。`;
    } else if (standard === 'FMVSS213') {
      userMessage = `请为以下体重范围生成儿童安全座椅设计建议：

**安全标准**: FMVSS 213
**体重范围**: ${weightRange}

请严格按照三个模块的要求输出JSON格式的设计建议。`;
    } else if (standard === 'R44') {
      userMessage = `请为以下体重范围生成儿童安全座椅设计建议：

**安全标准**: ECE R44/04
**体重范围**: ${weightRange}

请严格按照三个模块的要求输出JSON格式的设计建议。`;
    }

    // 添加品牌搜索结果
    if (brandSearchResults) {
      userMessage += `\n\n**品牌对比参考数据**:\n${brandSearchResults}`;
    }

    // 构建完整的消息历史
    const systemPrompt = buildSystemPrompt(technicalData);
    const fullMessages = [
      {
        role: 'system' as const,
        content: systemPrompt,
      },
      {
        role: 'user' as const,
        content: userMessage,
      },
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
        stream: true,
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
    console.error('Design assistant error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate design report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
