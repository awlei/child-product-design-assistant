import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

interface DataValidationRequest {
  standard: string;
  heightRange?: string;
  weightRange?: string;
  localData: any;
}

interface DataValidationResponse {
  success: boolean;
  validationScore: number;
  validationReport: string;
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    category: string;
    description: string;
    suggestion: string;
  }>;
  verifiedData?: any;
}

export async function POST(request: NextRequest) {
  try {
    const body: DataValidationRequest = await request.json();
    const { standard, heightRange, weightRange, localData } = body;

    if (!localData) {
      return NextResponse.json(
        { error: '请提供需要验证的本地数据' },
        { status: 400 }
      );
    }

    // 构建验证提示词
    const validationPrompt = `你是一位专业的儿童安全座椅标准验证专家，精通ECE R129、FMVSS 213、ECE R44等国际标准。

## 任务
请验证以下本地数据的准确性和完整性。

## 输入信息
- 选择的标准：${standard}
- 身高范围：${heightRange || '未指定'}
- 体重范围：${weightRange || '未指定'}

## 本地数据
\`\`\`json
${JSON.stringify(localData, null, 2)}
\`\`\`

## 验证要求

请从以下几个方面进行验证：

1. **标准符合性**：数据是否符合${standard}标准的要求
2. **数据准确性**：数值是否准确（如HIC值、加速度、速度等）
3. **数据完整性**：是否缺少关键信息
4. **测试假人匹配**：假人选择是否正确
5. **测试参数**：测试速度、减速度等是否正确
6. **伤害指标**：伤害指标阈值是否正确

## 输出格式

请严格按照以下JSON格式输出：

\`\`\`json
{
  "validationScore": 85,
  "validationReport": "数据验证总体评价...",
  "issues": [
    {
      "type": "error",
      "category": "伤害指标",
      "description": "HIC15阈值应为700而非650",
      "suggestion": "修正HIC15阈值为700"
    },
    {
      "type": "warning",
      "category": "测试假人",
      "description": "建议添加Q1.5假人的测试",
      "suggestion": "补充Q1.5假人的测试数据"
    }
  ]
}
\`\`\`

## 验证标准
- validationScore: 0-100分（100分表示完全准确）
- type: error（错误）、warning（警告）、info（信息）
- category: 数据所属类别

只返回JSON，不要其他内容。`;

    const config = new Config();
    const llmClient = new LLMClient(config);

    const stream = llmClient.stream([
      { role: 'user', content: validationPrompt }
    ], {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.2,
    });

    let llmContent = '';
    for await (const chunk of stream) {
      if (chunk.content) {
        llmContent += chunk.content.toString();
      }
    }

    console.log('[Data Validation] LLM response length:', llmContent.length);

    // 清理可能的markdown标记
    let jsonContent = llmContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // 尝试解析JSON
    let validationResult: DataValidationResponse | null = null;
    try {
      validationResult = JSON.parse(jsonContent);
      console.log('[Data Validation] Parsed validation result:', validationResult);
    } catch (parseError) {
      console.error('[Data Validation] JSON parse error:', parseError);
      console.log('[Data Validation] JSON content:', jsonContent.substring(0, 500));
      
      // 如果JSON解析失败，返回默认验证结果
      validationResult = {
        success: true,
        validationScore: 70,
        validationReport: '无法解析智能体验证结果，建议人工复核本地数据。',
        issues: [
          {
            type: 'warning',
            category: '验证系统',
            description: '智能体验证失败，无法自动验证数据准确性',
            suggestion: '建议人工核对数据来源和准确性'
          }
        ]
      };
    }

    return NextResponse.json({
      success: true,
      ...validationResult,
    });

  } catch (error) {
    console.error('[Data Validation] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '数据验证失败',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
