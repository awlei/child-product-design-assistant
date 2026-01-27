import { NextRequest, NextResponse } from 'next/server';
import { SearchClient, Config } from 'coze-coding-dev-sdk';

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
  'Safe-n-Sound',
  'Concord',
  'Kiddicare'
];

export async function POST(request: NextRequest) {
  try {
    const { heightRange, weightRange, standard } = await request.json();

    // 构建搜索查询
    let searchQuery = '';

    if (standard === 'R129' || (heightRange && !weightRange)) {
      // ECE R129 - 基于身高
      searchQuery = `child car seat ${heightRange} ECE R129 i-Size 2025 2026 specifications`;
    } else {
      // FMVSS 213 或 ECE R44 - 基于体重
      searchQuery = `child car seat ${weightRange} FMVSS 213 ECE R44 2025 2026 specifications`;
    }

    // 添加品牌关键词
    const brandKeywords = MAIN_BRANDS.slice(0, 6).join(' OR ');
    const finalQuery = `${searchQuery} (${brandKeywords})`;

    // 使用coze-coding-dev-sdk进行搜索
    const config = new Config();
    const client = new SearchClient(config);

    const response = await client.webSearchWithSummary(finalQuery, 10);

    // 提取搜索结果
    const searchResults = response.web_items || [];

    // 整理品牌参数信息
    const brandParameters = searchResults.map(item => {
      // 尝试从标题和摘要中提取品牌信息
      const brand = MAIN_BRANDS.find(b =>
        item.title.toLowerCase().includes(b.toLowerCase()) ||
        item.snippet.toLowerCase().includes(b.toLowerCase())
      ) || 'Unknown';

      return {
        brand,
        title: item.title,
        snippet: item.snippet,
        url: item.url,
        siteName: item.site_name,
        publishTime: item.publish_time,
        authority: item.auth_info_des,
      };
    });

    // 添加AI总结
    const summary = response.summary || '';

    return NextResponse.json({
      success: true,
      summary,
      results: brandParameters,
      totalCount: searchResults.length,
    });
  } catch (error) {
    console.error('Brand search error:', error);
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
