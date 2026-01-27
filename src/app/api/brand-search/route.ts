import { NextRequest, NextResponse } from 'next/server';
import { SearchClient, Config as SearchConfig, LLMClient, Config as LLMConfig } from 'coze-coding-dev-sdk';

// 主流品牌列表
const MAIN_BRANDS = [
  'Britax',
  'Cybex',
  'Maxi-Cosi',
  'Graco',
  'Chicco',
  'Joie',
  'Recaro',
  'Nuna',
  'Uppababy',
  'Evenflo',
];

export async function POST(request: NextRequest) {
  try {
    const { heightRange, weightRange, standard } = await request.json();

    // 构建搜索查询
    let searchQuery = '';

    if (standard === 'R129' || (heightRange && !weightRange)) {
      // ECE R129 - 基于身高
      searchQuery = `child car seat ${heightRange} ECE R129 i-Size 2025 2026 specifications review`;
    } else {
      // FMVSS 213 或 ECE R44 - 基于体重
      searchQuery = `child car seat ${weightRange} FMVSS 213 ECE R44 2025 2026 specifications review`;
    }

    // 添加品牌关键词
    const brandKeywords = MAIN_BRANDS.join(' OR ');
    const finalQuery = `${searchQuery} (${brandKeywords})`;

    console.log('[Brand Search] Query:', finalQuery);

    // 使用coze-coding-dev-sdk进行搜索
    const searchConfig = new SearchConfig();
    const searchClient = new SearchClient(searchConfig);

    const searchResponse = await searchClient.webSearchWithSummary(finalQuery, 10);

    // 提取搜索结果
    const searchResults = searchResponse.web_items || [];
    console.log('[Brand Search] Found', searchResults.length, 'results');

    // 如果有搜索结果，使用LLM提取结构化的产品参数
    let structuredProducts = [];
    
    if (searchResults.length > 0) {
      // 准备搜索内容
      const searchContent = searchResults.map(item => 
        `Brand: ${item.site_name || 'Unknown'}\nTitle: ${item.title}\nSummary: ${item.snippet}\nURL: ${item.url}`
      ).join('\n\n---\n\n');

      // 使用LLM提取结构化产品信息
      const llmConfig = new LLMConfig();
      const llmClient = new LLMClient(llmConfig);

      const prompt = `你是一个专业的儿童安全座椅产品信息提取专家。请从以下搜索结果中提取主流品牌儿童安全座椅的技术参数。

用户需求：
- 标准体系: ${standard === 'R129' ? 'ECE R129 (i-Size)' : standard === 'FMVSS213' ? 'FMVSS 213' : 'ECE R44'}
- 适用范围: ${heightRange || weightRange || '未指定'}

需要提取的信息（对于每个产品）：
1. 品牌（Brand）
2. 型号（Model）
3. 适用身高范围（Height Range）
4. 适用体重范围（Weight Range）
5. 座椅重量（Seat Weight）
6. 安装方式（Installation: ISOFIX/LATCH/Seat Belt）
7. 侧撞保护（Side Impact Protection: Yes/No + Type）
8. 后向/前向模式（Rear-facing/Facing: Both/Rear-only/Front-only）
9. 可平躺（Recline: Yes/No）
10. ADAC评级（ADAC Rating）
11. Consumer Reports评级（CR Rating）
12. 价格区间（Price Range）

搜索结果：
${searchContent}

请以JSON数组格式返回产品列表，只包含完整信息的产品。格式：
[
  {
    "brand": "品牌名",
    "model": "型号",
    "heightRange": "身高范围",
    "weightRange": "体重范围",
    "seatWeight": "重量",
    "installation": "安装方式",
    "sideImpact": "侧撞保护",
    "orientation": "后向/前向",
    "recline": "可平躺",
    "adacRating": "ADAC评级",
    "crRating": "CR评级",
    "priceRange": "价格区间"
  }
]

只返回JSON，不要其他内容。`;

      try {
        const stream = llmClient.stream([
          { role: 'user', content: prompt }
        ], {
          model: 'doubao-seed-1-8-251228',
          temperature: 0.3,
        });

        let llmContent = '';
        for await (const chunk of stream) {
          if (chunk.content) {
            llmContent += chunk.content.toString();
          }
        }

        // 清理可能的markdown标记
        let jsonContent = llmContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // 尝试解析JSON
        try {
          structuredProducts = JSON.parse(jsonContent);
          console.log('[Brand Search] Extracted', structuredProducts.length, 'products');
        } catch (parseError) {
          console.error('[Brand Search] JSON parse error:', parseError);
          // 如果JSON解析失败，返回原始搜索结果
        }
      } catch (llmError) {
        console.error('[Brand Search] LLM error:', llmError);
      }
    }

    return NextResponse.json({
      success: true,
      summary: searchResponse.summary || '',
      searchResults: searchResults.map(item => ({
        brand: MAIN_BRANDS.find(b => 
          item.title.toLowerCase().includes(b.toLowerCase()) ||
          item.snippet.toLowerCase().includes(b.toLowerCase()) ||
          (item.site_name && item.site_name.toLowerCase().includes(b.toLowerCase()))
        ) || item.site_name || 'Unknown',
        title: item.title,
        snippet: item.snippet,
        url: item.url,
        siteName: item.site_name || 'Unknown',
      })),
      structuredProducts,
      totalCount: searchResults.length,
    });
  } catch (error) {
    console.error('[Brand Search] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search brand parameters',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
