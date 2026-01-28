import { NextRequest, NextResponse } from 'next/server';
import { SearchClient, Config as SearchConfig, LLMClient, Config as LLMConfig } from 'coze-coding-dev-sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

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

// 从本地数据加载品牌信息
function loadLocalBrandData() {
  try {
    const filePath = join(process.cwd(), 'public', 'data', 'brand-data.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('[Brand Search] Failed to load local brand data:', error);
    return null;
  }
}

// 根据身高/体重范围匹配产品
function matchProductsByRange(
  localData: any,
  heightRange: string | null,
  weightRange: string | null
) {
  if (!localData || !localData.brands) {
    return [];
  }

  const matchedProducts: any[] = [];

  for (const brandData of localData.brands) {
    for (const product of brandData.products) {
      let matched = false;

      // 基于身高匹配
      if (heightRange && product.heightRange) {
        const userMin = parseInt(heightRange.split('-')[0]);
        const userMax = parseInt(heightRange.split('-')[1]);
        const productMin = parseInt(product.heightRange.split('-')[0]);
        const productMax = parseInt(product.heightRange.split('-')[1]);

        // 检查是否有重叠或包含关系
        if (!(userMax < productMin || userMin > productMax)) {
          matched = true;
        }
      }

      // 基于体重匹配
      if (!matched && weightRange && product.weightRange) {
        const userMin = parseFloat(weightRange.split('-')[0]);
        const userMax = parseFloat(weightRange.split('-')[1]);
        const productMin = parseFloat(product.weightRange.split('-')[0]);
        const productMax = parseFloat(product.weightRange.split('-')[1]);

        // 检查是否有重叠或包含关系
        if (!(userMax < productMin || userMin > productMax)) {
          matched = true;
        }
      }

      if (matched) {
        matchedProducts.push({
          brand: brandData.brand,
          model: product.model,
          heightRange: product.heightRange,
          weightRange: product.weightRange,
          installation: product.installation,
          sideImpact: product.sideImpact,
          orientation: product.orientation,
        });
      }
    }
  }

  // 限制返回数量，每个品牌最多1个产品
  const brandCount = new Map();
  const filteredProducts = matchedProducts.filter(product => {
    const count = brandCount.get(product.brand) || 0;
    if (count < 1) {
      brandCount.set(product.brand, count + 1);
      return true;
    }
    return false;
  });

  return filteredProducts.slice(0, 10);
}

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

    // 检查提取的产品是否包含足够的详细信息
    const hasCompleteInfo = structuredProducts.some((p: any) => p.installation && p.sideImpact && p.orientation);

    // 如果搜索结果中没有完整信息，优先使用本地数据
    if (!hasCompleteInfo) {
      console.log('[Brand Search] Extracted products lack complete info, trying local data fallback...');
      const localData = loadLocalBrandData();
      if (localData) {
        const localProducts = matchProductsByRange(localData, heightRange, weightRange);
        if (localProducts.length > 0) {
          console.log('[Brand Search] Using local data with', localProducts.length, 'complete products');
          structuredProducts = localProducts;
        }
      }
    }

    // 如果仍然没有产品，使用本地数据作为最后fallback
    if (structuredProducts.length === 0) {
      console.log('[Brand Search] No products, trying local data fallback...');
      const localData = loadLocalBrandData();
      if (localData) {
        structuredProducts = matchProductsByRange(localData, heightRange, weightRange);
        console.log('[Brand Search] Local data fallback found:', structuredProducts.length, 'products');
      }

      // 如果本地数据也没有，使用主流品牌作为占位
      if (structuredProducts.length === 0) {
        structuredProducts = MAIN_BRANDS.slice(0, 5).map(brand => ({
          brand: brand,
          model: '',
          heightRange: heightRange || '',
          weightRange: weightRange || '',
          installation: '',
          sideImpact: '',
          orientation: ''
        }));
        console.log('[Brand Search] Ultimate fallback: using major brands:', structuredProducts.length);
      }
    }

    // 更新dataSource标记
    const dataSource = hasCompleteInfo && searchResults.length > 0 ? 'web' : 'local';

    return NextResponse.json({
      success: true,
      summary: searchResponse.summary || '使用本地品牌数据库',
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
      dataSource: dataSource,
    });
  } catch (error) {
    console.error('[Brand Search] Error:', error);

    // 即使出错也尝试返回本地数据
    console.log('[Brand Search] Error occurred, trying local data fallback...');
    const { heightRange, weightRange, standard } = await request.json().catch(() => ({}));

    const localData = loadLocalBrandData();
    let structuredProducts = [];

    if (localData) {
      structuredProducts = matchProductsByRange(localData, heightRange || null, weightRange || null);
      console.log('[Brand Search] Local data fallback after error found:', structuredProducts.length, 'products');
    }

    // 如果本地数据也没有，使用主流品牌作为占位
    if (structuredProducts.length === 0) {
      structuredProducts = MAIN_BRANDS.slice(0, 5).map(brand => ({
        brand: brand,
        model: '',
        heightRange: heightRange || '',
        weightRange: weightRange || '',
        installation: '',
        sideImpact: '',
        orientation: ''
      }));
      console.log('[Brand Search] Ultimate fallback after error: using major brands:', structuredProducts.length);
    }

    return NextResponse.json({
      success: true,
      summary: '使用本地品牌数据库（网络搜索失败）',
      searchResults: [],
      structuredProducts,
      totalCount: structuredProducts.length,
      dataSource: 'local',
      fallback: true,
    });
  }
}
