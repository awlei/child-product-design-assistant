import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 品牌搜索API - 仅使用本地数据版本
 * 移除所有联网搜索和AI调用
 */

// 从本地数据加载品牌信息
function loadLocalBrandData() {
  try {
    const filePath = join(process.cwd(), 'public/data/brand-data.json');
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
          features: product.features || [],
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

    console.log('[Brand Search] Request received:', { heightRange, weightRange, standard });

    // 加载本地品牌数据
    const localData = loadLocalBrandData();
    
    if (!localData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to load local brand data',
        },
        { status: 500 }
      );
    }

    // 匹配产品
    const structuredProducts = matchProductsByRange(localData, heightRange, weightRange);
    console.log('[Brand Search] Found', structuredProducts.length, 'products from local data');

    // 生成摘要
    let summary = '本地品牌数据库';
    if (structuredProducts.length > 0) {
      const brandNames = [...new Set(structuredProducts.map(p => p.brand))].join('、');
      summary = `从本地数据库找到 ${structuredProducts.length} 款产品，来自品牌：${brandNames}`;
    } else {
      summary = '本地数据库未找到匹配的产品';
    }

    return NextResponse.json({
      success: true,
      summary: summary,
      searchResults: structuredProducts.map((product, index) => ({
        brand: product.brand,
        title: product.model,
        snippet: `${product.heightRange || product.weightRange} | ${product.installation}`,
        url: `#${product.brand.toLowerCase().replace(/\s/g, '-')}`,
        siteName: product.brand,
      })),
      structuredProducts,
      totalCount: structuredProducts.length,
      dataSource: 'local',
    });
  } catch (error) {
    console.error('[Brand Search] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Brand search failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
