import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, SearchClient } from 'coze-coding-dev-sdk';

const SYSTEM_PROMPT = `你是一个专业的儿童汽车安全座椅（CRS）综合设计助手，严格遵循ECE R129（i-Size）标准。

用户会提供以下信息：
- 身高范围（cm）
- 体重范围（kg）
- 选择的标准（R129或R44）

你需要生成完整的设计方案报告，包含以下5个部分，使用清晰的中文表述：

### 1. 假人矩阵（测试假人组合）
- 根据身高范围确定需要使用的Q系列假人组合
- Q系列假人标准：
  - Q0（新生儿，约40-50 cm，约3.5-5.5 kg）
  - Q1.5（18个月，约65-75 cm，约9-11 kg）
  - Q3（3岁，约95-100 cm，约15-18 kg）
  - Q6（6岁，约115-125 cm，约21.5-25.5 kg）
  - Q10（10岁，约135-145 cm，约32-37 kg）
- 输出假人矩阵表格，包含假人型号、身高范围、体重范围

### 2. ISOFIX尺寸分类
- 根据假人矩阵中最大假人规格确定ISOFIX尺寸类别
- ISOFIX尺寸分类标准：
  - Size Class A/B：后向座椅，适用于40-105 cm
  - Size Class C/D/E：后向座椅，适用于40-83 cm
  - Size Class F/G/H：增高垫，适用于100-150 cm
  - Size Class I/J：前向座椅，适用于100-150 cm
- 输出包络尺寸（宽度、长度、高度）

### 3. 碰撞测试矩阵
- 列出需要通过的主要动态碰撞测试
- 正面碰撞：50 km/h（R129）或 50 km/h（R44）
- 后碰撞：30 km/h（仅后向座椅）
- 侧面碰撞：动态25 km/h（R129）或 静态侧面（R44）
- 对应每个测试使用的假人
- 关键指标：HIC ≤ 1000、胸部3ms加速度 ≤ 55g、颈部负荷等

### 4. 产品内部尺寸设计
根据身高范围和假人矩阵计算关键内部尺寸：
- 靠背内部高度范围 = 最大假人身高 + 200mm头部空间
- 头托调节高度 = 120-180mm（可调范围）
- 座椅内部宽度 = 380-450mm（根据假人肩宽）
- 座椅深度 = 假人大腿长度 + 50-80mm
- 靠背角度：
  - 后向：40-50°（45°±5°）
  - 前向：15-25°（20°±5°）
  - 增高垫：80-90°（接近垂直）
- 五点式安全带槽位高度范围：200-400mm（可调）

### 5. 设计建议
- 提供关键设计要点和安全建议
- 包含头枕调节、侧翼保护、安全带系统等
- 根据选择的标准（R129或R44）给出差异说明

输出要求：
- 全部使用简洁、专业的中文
- 结构清晰，使用Markdown标题和列表/表格
- 包含具体数值的设计参数`;

const COMPARISON_PROMPT = `你是一个专业的儿童汽车安全座椅市场分析专家。

基于搜索到的品牌产品信息和用户设计方案，进行专业的对比分析。

请生成一个结构化的对比分析报告，包含以下部分：

### 1. 市场同类产品概览
- 列出3-5个主要品牌的代表性产品
- 包含产品型号、主要规格、适用范围

### 2. 尺寸与规格对比
- 对比各产品的包络尺寸（宽度、长度、高度）
- 对比适用身高/体重范围
- 对比ISOFIX尺寸分类

### 3. 功能特性对比
- 安装方式（ISOFIX、安全带、支撑腿等）
- 调节功能（头枕、靠背角度、侧翼等）
- 安全特性（侧碰保护、抗翻转装置等）

### 4. 创新点分析
- 分析各产品的创新设计
- 识别行业趋势和技术发展方向

### 5. 设计建议
- 基于市场对比，给出设计方案优化建议
- 指出差异化机会点
- 提供可借鉴的优秀设计

输出要求：
- 使用清晰的中文
- 结构化呈现，使用表格和列表
- 保持客观和专业
- 重点突出与用户设计方案的相关性`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { minHeight, maxHeight, minWeight, maxWeight, standard } = body;

    // 验证输入 - 至少需要提供身高范围或重量范围中的一种
    const hasHeightRange = minHeight && maxHeight;
    const hasWeightRange = minWeight && maxWeight;

    if (!hasHeightRange && !hasWeightRange) {
      return NextResponse.json(
        { error: '请至少提供身高范围或重量范围' },
        { status: 400 }
      );
    }

    if (!standard) {
      return NextResponse.json(
        { error: '请提供测试标准（R129或R44）' },
        { status: 400 }
      );
    }

    // 如果只提供了一种范围，自动补充另一种的默认值
    const finalMinHeight = minHeight || '40';
    const finalMaxHeight = maxHeight || '150';
    const finalMinWeight = minWeight || '0';
    const finalMaxWeight = maxWeight || '50';

    const config = new Config();
    const llmClient = new LLMClient(config);
    const searchClient = new SearchClient(config);

    // 1. 生成设计方案
    const designPrompt = `现在请根据以下信息生成完整设计方案：
- 身高范围：${finalMinHeight} cm - ${finalMaxHeight} cm
- 体重范围：${finalMinWeight} kg - ${finalMaxWeight} kg
- 选择的标准：${standard}

${hasHeightRange ? '注意：用户提供了身高范围作为主要设计依据。' : ''}
${hasWeightRange ? '注意：用户提供了体重范围作为主要设计依据。' : ''}

请生成包含假人矩阵、ISOFIX尺寸分类、碰撞测试矩阵、产品内部尺寸设计和设计建议的完整报告。`;

    const designMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: designPrompt },
    ];

    // 2. 搜索品牌产品信息
    const brands = ['Cybex', 'Britax', 'Dorel', 'Graco', 'Maxi-Cosi'];
    const brandResults: Array<{ brand: string; products: Array<{ title: string; snippet: string; url?: string }> }> = [];

    for (const brand of brands) {
      try {
        const searchQuery = `${brand} 儿童安全座椅 产品规格 尺寸 R129 i-Size 适用身高体重`;
        const searchResponse = await searchClient.webSearch(searchQuery, 3, false);

        if (searchResponse.web_items && searchResponse.web_items.length > 0) {
          const products = searchResponse.web_items.map(item => ({
            title: item.title,
            snippet: item.snippet,
            url: item.url,
          }));
          brandResults.push({ brand, products });
        }
      } catch (error) {
        console.error(`搜索 ${brand} 产品失败:`, error);
      }
    }

    // 3. 生成对比分析
    let comparisonAnalysis = '';
    if (brandResults.length > 0) {
      const comparisonInput = `
用户设计方案参数：
- 身高范围：${finalMinHeight} cm - ${finalMaxHeight} cm
- 体重范围：${finalMinWeight} kg - ${finalMaxWeight} kg
- 选择的标准：${standard}

搜索到的品牌产品信息：
${brandResults.map(result => `
品牌：${result.brand}
产品：
${result.products.map((p: any) => `- ${p.title}: ${p.snippet}`).join('\n')}
`).join('\n')}

请基于以上信息进行专业的对比分析。`;

      const comparisonMessages = [
        { role: 'system' as const, content: COMPARISON_PROMPT },
        { role: 'user' as const, content: comparisonInput },
      ];

      const comparisonStream = llmClient.stream(comparisonMessages, {
        model: 'doubao-seed-1-8-251228',
        temperature: 0.7,
      });

      // 收集对比分析文本
      for await (const chunk of comparisonStream) {
        if (chunk.content) {
          comparisonAnalysis += chunk.content.toString();
        }
      }
    }

    // 4. 创建响应流
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // 先发送品牌对比分析
          if (comparisonAnalysis) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ 
                  type: 'comparison',
                  content: comparisonAnalysis,
                  brands: brandResults 
                })}\n\n`
              )
            );
          }

          // 然后发送设计方案流式输出
          const designStream = llmClient.stream(designMessages, {
            model: 'doubao-seed-1-8-251228',
            temperature: 0.7,
          });

          for await (const chunk of designStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'design', content: text })}\n\n`)
              );
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
    console.error('Comprehensive Design error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '服务器错误',
      },
      { status: 500 }
    );
  }
}
