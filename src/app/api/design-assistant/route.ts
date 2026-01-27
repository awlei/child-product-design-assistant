import { NextRequest, NextResponse } from 'next/server';
import { SearchClient, Config } from 'coze-coding-dev-sdk';
import { readFileSync } from 'fs';
import { join } from 'path';
import { generateLocalAdvice, formatLocalAdvice, LocalKnowledgeRequest } from '@/lib/localKnowledge';

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

【格式要求】
- 使用自然语言直接输出，不要使用JSON格式
- 每个模块使用markdown标题标记（如 ## 模块1：产品定位与适用标准）
- 使用专业术语，但表述要清晰易懂
- 每个模块控制在200-300字
- 禁止输出无关的营销话术或过度夸张的形容词
- 使用列表、加粗等markdown格式增强可读性

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

## 输出格式示例

请按照以下格式输出设计建议：

## 模块1：产品定位与适用标准

该身高范围对应15-36个月儿童。适用欧洲市场（ECE R129 i-Size标准）。核心卖点：全阶段覆盖设计，可从40cm使用至105cm，满足儿童成长全周期需求。

## 模块2：关键技术要求

1. **座椅角度**：后向乘坐角度应保持在45°-50°之间，确保新生儿头部安全
2. **头枕高度调节范围**：40-75cm需使用新生儿插件，75-105cm头枕可调节至7档
3. **ISOFIX接口要求**：必须符合ISO 13216标准，配备支撑腿或上拉带

## 模块3：核心安全功能推荐

### 五点式安全带
- **技术实现**：采用高强度聚酯带，配备防滑锁定器，肩带宽度25mm
- **安全价值**：105cm以下儿童必须使用，分散碰撞冲击力，防止儿童滑脱

### 侧撞保护系统（SIP）
- **技术实现**：座椅两侧集成可折叠的侧翼，吸收侧面冲击能量
- **安全价值**：减少侧面碰撞对头部和胸部的伤害，降低伤害指标30%

## 重要提示

1. 【数据真实性】必须使用上面提供的技术数据，不能编造数据
2. 【内容质量】每个模块内容必须专业、具体、可落地，控制在200-300字
3. 【语言风格】禁止输出营销话术或过度夸张的形容词，使用专业术语
4. 【核心原则】始终强调：安全永远是第一位`;

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
    // 检查API Key是否配置，如果未配置则直接使用本地知识库
    if (!process.env.DOUBAO_API_KEY || process.env.DOUBAO_API_KEY.trim() === '') {
      console.log('[API] DOUBAO_API_KEY未配置，切换到本地知识库');
      return await handleLocalKnowledgeFallback(request);
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

            console.log('[API] 开始处理豆包API流式响应...');
            let chunkCount = 0;

            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                console.log(`[API] 流式响应结束，总共处理 ${chunkCount} 个chunk`);
                break;
              }

              chunkCount++;
              // 解析SSE数据
              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n').filter(line => line.trim());

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);

                  if (data === '[DONE]') {
                    console.log('[API] 收到[DONE]标记');
                    break;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;

                    if (content) {
                      console.log(`[API] 提取到content (长度 ${content.length}): ${content.substring(0, 50)}`);
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                    } else {
                      console.log('[API] 收到数据但没有content字段:', JSON.stringify(parsed).substring(0, 200));
                    }
                  } catch (e) {
                    console.error('[API] Error parsing SSE data:', line, e);
                  }
                }
              }
            }
          } catch (error) {
            console.error('[API] Stream error:', error);
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
    console.error('[API] AI服务失败，尝试使用本地知识库:', error);
    // 尝试使用本地知识库作为fallback
    return await handleLocalKnowledgeFallback(request);
  }
}

/**
 * 处理本地知识库fallback方案
 */
async function handleLocalKnowledgeFallback(request: NextRequest) {
  try {
    const { standard, heightRange, weightRange, productType } = await request.json();

    console.log('[API] 本地知识库fallback - 参数:', { standard, heightRange, weightRange, productType });

    // 转换标准名称
    let localStandard: 'ECE_R129' | 'FMVSS_213' | 'ECE_R44';
    if (standard === 'R129') {
      localStandard = 'ECE_R129';
    } else if (standard === 'FMVSS213') {
      localStandard = 'FMVSS_213';
    } else if (standard === 'R44') {
      localStandard = 'ECE_R44';
    } else {
      console.log('[API] 不支持的标准:', standard);
      return NextResponse.json(
        {
          success: false,
          error: 'Unknown standard',
          details: `不支持的标准: ${standard}`,
        },
        { status: 400 }
      );
    }

    // 解析范围
    const localRequest: LocalKnowledgeRequest = {
      productType: productType || 'child-safety-seat',
      standard: localStandard,
      heightRange: heightRange ? parseRange(heightRange) : undefined,
      weightRange: weightRange ? parseRange(weightRange) : undefined,
    };

    console.log('[API] 本地知识库请求:', localRequest);

    // 生成本地建议
    const advice = await generateLocalAdvice(localRequest);
    console.log('[API] 本地建议生成成功，sections数量:', advice.sections.length);

    const markdownContent = formatLocalAdvice(advice);
    console.log('[API] Markdown内容长度:', markdownContent.length);

    // 模拟流式响应，将本地内容逐字发送
    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const chars = markdownContent.split('');

          // 模拟打字机效果，每100ms发送5个字符
          for (let i = 0; i < chars.length; i += 5) {
            const chunk = chars.slice(i, i + 5).join('');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
            await new Promise(resolve => setTimeout(resolve, 30));
          }

          controller.close();
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Data-Source': 'local-knowledge-base',
        },
      }
    );
  } catch (error) {
    console.error('[API] 本地知识库处理失败:', error);
    console.error('[API] 错误堆栈:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate design report from local knowledge base',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 解析范围字符串（如 "40-105 cm" 或 "0-13kg"）
 */
function parseRange(rangeStr: string): { min: number; max: number } | undefined {
  try {
    // 移除空格和单位
    const cleaned = rangeStr.trim().replace(/cm|kg|kg\)|cm\)|\s/g, '');
    const parts = cleaned.split('-');

    if (parts.length === 2) {
      const min = parseFloat(parts[0]);
      const max = parseFloat(parts[1]);

      if (!isNaN(min) && !isNaN(max)) {
        return { min, max };
      }
    }
  } catch (error) {
    console.error('[API] 解析范围失败:', rangeStr, error);
  }

  return undefined;
}

