import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 品牌搜索API - 纯本地数据库版本 v2.0
 * 完全基于brand-data.json，确保品牌参数稳定输出
 */

interface BrandData {
  version: string;
  description: string;
  lastUpdated: string;
  dataSources: string[];
  brands: Brand[];
}

interface Brand {
  brand: string;
  website: string;
  products: Product[];
}

interface Product {
  model: string;
  heightRange: string;
  weightRange: string;
  ageRange: string;
  standard: string;
  installation: string;
  sideImpact: string;
  orientation: string;
  features: string[];
  isofixClass: string;
}

// 加载品牌数据
function loadBrandData(): BrandData | null {
  try {
    const filePath = join(process.cwd(), 'public/data/brand-data.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('[Brand API] 加载品牌数据失败:', error);
    return null;
  }
}

// 搜索产品
function searchProducts(brandData: BrandData, query: string): Array<Product & { brandName: string }> {
  const results: Array<Product & { brandName: string }> = [];
  const lowerQuery = query.toLowerCase();

  for (const brand of brandData.brands) {
    for (const product of brand.products) {
      // 匹配品牌名
      if (brand.brand.toLowerCase().includes(lowerQuery)) {
        results.push({ ...product, brandName: brand.brand });
        continue;
      }

      // 匹配产品型号
      if (product.model.toLowerCase().includes(lowerQuery)) {
        results.push({ ...product, brandName: brand.brand });
        continue;
      }

      // 匹配标准
      if (product.standard.toLowerCase().includes(lowerQuery)) {
        results.push({ ...product, brandName: brand.brand });
        continue;
      }

      // 匹配尺寸范围
      if (product.heightRange.toLowerCase().includes(lowerQuery)) {
        results.push({ ...product, brandName: brand.brand });
        continue;
      }

      // 匹配特征
      if (product.features.some(f => f.toLowerCase().includes(lowerQuery))) {
        results.push({ ...product, brandName: brand.brand });
      }
    }
  }

  return results;
}

// 生成搜索结果文本
function generateSearchResults(products: Array<Product & { brandName: string }>, query: string): string {
  if (products.length === 0) {
    return `## 🔍 搜索结果

未找到与 "${query}" 相关的产品信息。

建议：
- 尝试使用品牌名称搜索（如：Cybex、Britax）
- 尝试使用产品型号搜索
- 尝试使用标准名称搜索（如：i-Size、R129）

---
`;
  }

  let result = `## 🔍 搜索结果

找到 ${products.length} 个与 "${query}" 相关的产品：

---

`;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    result += `### ${i + 1}. ${product.brandName} ${product.model}

**适用范围**：
- 身高范围：${product.heightRange}
- 体重范围：${product.weightRange}
- 年龄范围：${product.ageRange}

**安全标准**：${product.standard}

**安装方式**：${product.installation}

**侧撞保护**：${product.sideImpact}

**朝向**：${product.orientation}

**ISOFIX Class**：${product.isofixClass}

**核心特性**：
${product.features.map(f => `- ${f}`).join('\n')}

---
`;
  }

  result += `
*数据来源：本地品牌数据库 (v${loadBrandData()?.version || '未知'})*
`;

  return result;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Brand API] 开始处理品牌搜索请求（纯本地数据库）...');

    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: '请输入搜索关键词' },
        { status: 400 }
      );
    }

    // 加载品牌数据
    const brandData = loadBrandData();
    if (!brandData) {
      console.error('[Brand API] 无法加载品牌数据');
      return NextResponse.json(
        { success: false, error: '无法加载数据' },
        { status: 500 }
      );
    }

    // 搜索产品
    const products = searchProducts(brandData, query);
    console.log('[Brand API] 搜索完成，找到', products.length, '个产品');

    // 生成结果文本
    const results = generateSearchResults(products, query);

    // 流式返回
    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const chars = results.split('');
          
          for (const char of chars) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: char })}\n\n`));
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          
          controller.close();
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Data-Source': 'local-database-only',
        },
      }
    );
  } catch (error) {
    console.error('[Brand API] 处理请求失败:', error);
    
    return NextResponse.json(
      { success: false, error: '搜索失败' },
      { status: 500 }
    );
  }
}
