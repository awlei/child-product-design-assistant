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
2. 型号（Model）- 如果有
3. 适用身高范围（Height Range）- 如果有
4. 适用体重范围（Weight Range）- 如果有
5. 安装方式（Installation: ISOFIX/LATCH/Seat Belt）- 如果有
6. 侧撞保护（Side Impact Protection）- 如果有
7. 后向/前向模式（Orientation）- 如果有

搜索结果：
${searchContent}

请以JSON数组格式返回产品列表，格式：
[
  {
    "brand": "品牌名",
    "model": "型号（如果没有可以留空）",
    "heightRange": "身高范围（如果没有可以留空）",
    "weightRange": "体重范围（如果没有可以留空）",
    "installation": "安装方式（如果没有可以留空）",
    "sideImpact": "侧撞保护（如果没有可以留空）",
    "orientation": "后向/前向（如果没有可以留空）"
  }
]

只返回JSON，不要其他内容。如果某个产品的信息不完整，仍然包含在数组中，对应字段留空字符串。`;

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

        console.log('[Brand Search] LLM response length:', llmContent.length);
        console.log('[Brand Search] LLM response preview:', llmContent.substring(0, 500));

        // 清理可能的markdown标记
        let jsonContent = llmContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // 尝试解析JSON
        try {
          structuredProducts = JSON.parse(jsonContent);
          console.log('[Brand Search] Extracted', structuredProducts.length, 'products');
        } catch (parseError) {
          console.error('[Brand Search] JSON parse error:', parseError);
          console.error('[Brand Search] JSON content:', jsonContent.substring(0, 500));
          // 如果JSON解析失败，从搜索结果手动提取基本信息
          structuredProducts = searchResults.slice(0, 5).map(item => ({
            brand: MAIN_BRANDS.find(b => 
              item.title.toLowerCase().includes(b.toLowerCase()) ||
              item.snippet.toLowerCase().includes(b.toLowerCase()) ||
              (item.site_name && item.site_name.toLowerCase().includes(b.toLowerCase()))
            ) || item.site_name || 'Unknown',
            model: '',
            heightRange: heightRange || '',
            weightRange: weightRange || '',
            installation: '',
            sideImpact: '',
            orientation: ''
          }));
          console.log('[Brand Search] Fallback: extracted brands from search results:', structuredProducts.length);
        }
      } catch (llmError) {
        console.error('[Brand Search] LLM error:', llmError);
        // 如果LLM调用失败，从搜索结果手动提取基本信息
        structuredProducts = searchResults.slice(0, 5).map(item => ({
          brand: MAIN_BRANDS.find(b => 
            item.title.toLowerCase().includes(b.toLowerCase()) ||
            item.snippet.toLowerCase().includes(b.toLowerCase()) ||
            (item.site_name && item.site_name.toLowerCase().includes(b.toLowerCase()))
          ) || item.site_name || 'Unknown',
          model: '',
          heightRange: heightRange || '',
          weightRange: weightRange || '',
          installation: '',
          sideImpact: '',
          orientation: ''
        }));
        console.log('[Brand Search] Fallback after LLM error: extracted brands:', structuredProducts.length);
      }
    }

    // 如果没有搜索结果，使用主流品牌作为占位
    if (structuredProducts.length === 0 && searchResults.length === 0) {
      structuredProducts = MAIN_BRANDS.slice(0, 5).map(brand => ({
        brand: brand,
        model: '',
        heightRange: heightRange || '',
        weightRange: weightRange || '',
        installation: '',
        sideImpact: '',
        orientation: ''
      }));
      console.log('[Brand Search] Fallback: using major brands:', structuredProducts.length);
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
