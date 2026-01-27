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

  let prompt = `你是一位儿童安全座椅专业设计师与安全认证专家，精通欧洲、美国、中国等主流标准。你的首要原则永远是：**安全第一、符合法规、基于真实测试数据**。

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

**与ECE R129的主要差异**:
`;
    fmvssData.keyDifferences.vsECE_R129.forEach((diff: string) => {
      prompt += `- ${diff}
`;
    });
  }

  prompt += `

### GPS 人体测量数据
`;

  if (gpsData && gpsData.r129_data) {
    prompt += `
**R129标准人体尺寸**:
`;
    const r129Data = gpsData.r129_data.slice(0, 10); // 取前10组数据
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

## 输出要求（严格遵守以下格式）

你必须按照以下结构输出设计报告，每个部分都必须有实质性内容：

### 1. 产品定位与适用标准
- 说明适用的主要安全标准（ECE R129/FMVSS 213/ECE R44）
- 引用具体条文或核心要求（使用上面提供的技术数据）
- 说明该身高/体重范围对应的产品级别

### 2. 关键技术要求
必须包含以下子项：
- **尺寸要求**: 根据GPS人体测量数据给出座椅尺寸建议
- **承重要求**: 根据体重分组给出承重指标
- **材料规范**: 推荐的材料类型和性能指标
- **测试项目**: 必须通过的测试（正面碰撞、侧面碰撞等）
- **伤害指标**: 必须满足的伤害阈值（使用上面提供的数据）

### 3. 核心安全功能推荐（10-15项）
必须列出具体的安全功能，每项功能包含名称和简要说明：
- 五点式安全带
- 侧撞保护系统（SIP）
- ISOFIX安装
- 支撑腿/上拉带
- 阻燃面料
- 无毒认证
- 圆角设计
- 防误装设计
- 头颈保护
- 可调节头枕
- 等等...

### 4. 主流品牌参数对比表格
使用Markdown表格格式，包含真实的品牌和型号数据：
| 品牌+型号 | 适用身高/体重 | 座椅重量 | 安装方式 | 侧撞保护 | 认证 | 价格区间 | 亮点/评级 |
|-----------|--------------|----------|----------|----------|------|----------|-----------|
| Britax Römer Dualfix | 61-105cm | 14.5kg | ISOFIX+支撑腿 | 是 | ECE R129 | ¥3000-4000 | ADAC测试1.5分 |
| Cybex Sirona Gi i-Size | 45-105cm | 12.3kg | ISOFIX+支撑腿 | 是 | ECE R129 | ¥2800-3800 | 可360°旋转 |
| Maxi-Cosi Pebble 360 | 40-87cm | 4.8kg | ISOFIX+底座 | 是 | ECE R129 | ¥2000-3000 | 轻量化设计 |
| Graco SnugRide | 0-13kg | 5.6kg | 安全带 | 基础版 | FMVSS 213 | ¥1000-1500 | 性价比高 |
| Joie i-Spin 360 | 40-105cm | 13.5kg | ISOFIX+支撑腿 | 是 | ECE R129 | ¥2500-3500 | 侧撞保护强 |
| Chicco NextFit | 0-18kg | 11.8kg | 安全带 | 侧撞板 | FMVSS 213 | ¥1500-2200 | 安装简便 |

### 5. 设计建议与人体工程学要点
必须包含以下子项：
- **头颈保护**: 根据儿童身高调整头枕高度
- **可调节高度**: 头枕高度调节范围和方式
- **透气面料**: 推荐面料类型和透气设计
- **可拆洗设计**: 便于清洁的设计要点
- **倾斜角度调节**: 提供舒适的乘坐角度
- **人体工程学**: 基于GPS测量数据的座椅曲线设计

### 6. 安全提醒（必须醒目）
**重要安全提示**：
- 儿童安全座椅必须购买已通过官方认证的产品
- 设计方案仅作开发参考，不可直接用于生产
- 最终产品必须通过权威机构（TÜV、ADAC、中国CCC）型式认证
- 必须通过实车碰撞测试验证安全性

## 语言风格
- 专业、温暖、安全感强
- 使用"宝宝""儿童"称呼
- 避免生涩术语
- 语气友好但严肃对待安全问题
- 始终强调：**安全永远是第一位**

## 重要提示
你必须使用上面提供的技术数据，不能编造数据。对于品牌对比，使用真实的品牌和型号信息。始终强调：**儿童安全座椅必须购买已通过官方认证的产品，设计方案仅作开发参考。**`;

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
      userMessage = `请为以下身高范围生成儿童安全座椅设计报告：

**安全标准**: ECE R129 (i-Size)
**身高范围**: ${heightRange}

请根据提供的FMVSS 213和GPS人体测量技术数据，生成完整的设计报告。`;
    } else if (standard === 'FMVSS213') {
      userMessage = `请为以下体重范围生成儿童安全座椅设计报告：

**安全标准**: FMVSS 213
**体重范围**: ${weightRange}

请根据提供的FMVSS 213技术数据，生成完整的设计报告。`;
    } else if (standard === 'R44') {
      userMessage = `请为以下体重范围生成儿童安全座椅设计报告：

**安全标准**: ECE R44/04
**体重范围**: ${weightRange}

请根据提供的技术数据，生成完整的设计报告。`;
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
        max_tokens: 4000,
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
