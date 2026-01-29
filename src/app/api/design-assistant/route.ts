import { NextRequest, NextResponse } from 'next/server';
import { generateLocalAdvice, formatLocalAdvice, LocalKnowledgeRequest } from '@/lib/localKnowledge';

/**
 * 设计助手API - 仅使用本地知识库版本
 * 移除所有AI和智能接口调用
 */

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

export async function POST(request: NextRequest) {
  try {
    console.log('[API] 开始处理设计请求（仅本地知识库）...');

    const { standard, heightRange, weightRange, productType } = await request.json();

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

    // 流式返回本地内容
    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          // 添加标题
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            content: '## 📚 设计建议（本地知识库）\n\n' 
          })}\n\n`));

          // 模拟流式输出
          const chars = markdownContent.split('');
          for (let i = 0; i < chars.length; i += 5) {
            const chunk = chars.slice(i, i + 5).join('');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
            await new Promise(resolve => setTimeout(resolve, 20));
          }

          controller.close();
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Data-Source': 'local-knowledge-only',
        },
      }
    );
  } catch (error) {
    console.error('[API] 处理请求失败:', error);
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
