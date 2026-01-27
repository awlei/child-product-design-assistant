import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// 审核智能体系统提示词
const AUDIT_SYSTEM_PROMPT = `你是一位专业的儿童安全座椅法规审核专家，精通ECE R129 (i-Size)、FMVSS 213、ECE R44等国际安全标准。你的职责是审核设计报告是否符合法规要求，确保输出的技术参数准确、安全建议正确、法规引用无误。

## 审核标准

### 1. 法规引用准确性
- 检查ECE R129、FMVSS 213、ECE R44标准的引用是否正确
- 确保技术参数来自官方标准文档
- 验证伤害指标（HIC、HIC15、HIC36）的数值是否准确

### 2. 技术参数正确性
- 座椅角度要求（如R129要求后向乘坐45-50°）
- 头枕高度调节范围
- ISOFIX接口要求
- 承重要求

### 3. 安全建议合规性
- 是否包含必要的安全提醒
- 是否建议使用已认证产品
- 是否强调必须通过权威机构认证
- 是否提醒需要进行实车碰撞测试

### 4. 内容真实性
- 禁止编造技术数据
- 禁止夸大产品性能
- 禁止提供误导性建议

### 5. 安全责任声明
- 必须包含"设计建议仅供参考"的声明
- 必须提醒最终产品必须通过认证
- 必须强调安全第一的原则

## 审核输出格式

你必须按照以下JSON格式输出审核结果：

\`\`\`json
{
  "audit_passed": true/false,
  "audit_score": 0-100,
  "issues": [
    {
      "type": "法规引用错误/技术参数错误/安全建议不足/内容失实/责任声明缺失",
      "severity": "高/中/低",
      "description": "具体问题描述",
      "suggestion": "改进建议"
    }
  ],
  "summary": "审核总结",
  "recommendations": [
    "改进建议1",
    "改进建议2"
  ]
}
\`\`\`

## 审打分标准

- 90-100分：优秀，可以直接使用
- 70-89分：良好，有少量问题需要修正
- 50-69分：合格，有较多问题需要修订
- 0-49分：不合格，需要重新生成

## 重要提示

1. 必须严格审核，不能放宽标准
2. 安全第一，宁可错判也不能放过潜在问题
3. 如果发现任何严重问题，必须标记为"审核不通过"
4. 提供具体可行的改进建议
5. 直接输出JSON，不要添加其他内容`;

export async function POST(request: NextRequest) {
  try {
    const { report, standard } = await request.json();

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少报告内容',
        },
        { status: 400 }
      );
    }

    // 使用DeepSeek R1模型进行深度审核（推理能力强）
    const config = new Config();
    const client = new LLMClient(config);

    // 构建审核消息
    const auditMessage = `请审核以下儿童安全座椅设计报告是否符合法规要求。

**安全标准**: ${standard}

**设计报告内容**:
\`\`\`json
${JSON.stringify(report, null, 2)}
\`\`\`

请严格按照审核标准进行审核，输出JSON格式的审核结果。`;

    const messages = [
      {
        role: 'system' as const,
        content: AUDIT_SYSTEM_PROMPT,
      },
      {
        role: 'user' as const,
        content: auditMessage,
      },
    ];

    // 使用DeepSeek R1模型进行审核（推理能力强，适合审核任务）
    const response = await client.invoke(messages, {
      model: 'deepseek-r1-250528', // DeepSeek R1模型，推理能力强
      temperature: 0.3, // 低温度，确保审核结果稳定
      thinking: 'enabled', // 启用思考模式，提高审核准确性
    });

    // 解析审核结果
    let auditResult;
    try {
      // 尝试提取JSON部分
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('未找到JSON格式的审核结果');
      }
      auditResult = JSON.parse(jsonMatch[0]);
    } catch (e) {
      // 如果解析失败，返回默认审核结果
      auditResult = {
        audit_passed: false,
        audit_score: 0,
        issues: [
          {
            type: '系统错误',
            severity: '高',
            description: '无法解析审核结果',
            suggestion: '请检查审核智能体输出格式',
          },
        ],
        summary: '审核失败，无法获取审核结果',
        recommendations: ['重试审核', '联系技术支持'],
      };
    }

    return NextResponse.json({
      success: true,
      audit: auditResult,
      rawResponse: response.content,
    });
  } catch (error) {
    console.error('Audit error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '审核失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
