'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Sparkles, Loader2, CheckCircle, CheckCircle2, AlertCircle, AlertTriangle, Settings, ShieldCheck, Bug, X, Lightbulb } from 'lucide-react';

type StandardType = 'R129' | 'R44' | 'FMVSS213';

// 测试矩阵数据接口
interface TestMatrixData {
  height_range: string;
  isofix_size_class: string;
  dummies: string[];
  weight_range: string;
  age_range: string;
  design_requirements: {
    head_rest_height: string;
    harness_width: string;
    seat_angle: string;
    shoulder_width: string;
    hip_width: string;
    internal_length: string;
  };
  test_matrix: Array<{
    test_type: string;
    dummies: string[];
    speed: string;
    deceleration: string;
    injury_criteria: string[];
  }>;
}

interface TestMatrixResponse {
  version: string;
  standard: string;
  r129_height_groups: TestMatrixData[];
  fmvss_213_weight_groups: TestMatrixData[];
  design_tips: string[];
}

// 设计报告接口 - 使用自然语言markdown格式
interface DesignReport {
  content: string; // AI生成的markdown格式内容
  standard: string; // 使用的标准
  timestamp: string; // 生成时间
  dataSource: 'ai' | 'local' | 'free-llm-api'; // 数据来源：AI、本地知识库或免费大模型
}

// 错误详情接口
interface ErrorDetails {
  message: string;
  rawContent?: string;
  parseError?: string;
  jsonPath?: string;
}

// 审核结果接口
interface AuditResult {
  audit_passed: boolean;
  audit_score: number;
  issues: Array<{
    type: string;
    severity: string;
    description: string;
    suggestion: string;
  }>;
  summary: string;
  recommendations: string[];
}

export default function CarSeatDesignPage() {
  const [standard, setStandard] = useState<StandardType>('R129');
  const [inputType, setInputType] = useState<'height' | 'weight'>('height');
  const [minHeight, setMinHeight] = useState('');
  const [maxHeight, setMaxHeight] = useState('');
  const [minWeight, setMinWeight] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<DesignReport | null>(null);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // 审核状态
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditError, setAuditError] = useState('');

  // 测试矩阵数据
  const [testMatrixData, setTestMatrixData] = useState<TestMatrixData | null>(null);
  
  // 数据验证结果
  const [dataValidation, setDataValidation] = useState<any>(null);

  const handleStandardChange = (value: string) => {
    setStandard(value as StandardType);
    setInputType(value === 'R129' ? 'height' : 'weight');
    // 清空输入
    setMinHeight('');
    setMaxHeight('');
    setMinWeight('');
    setMaxWeight('');
    setError('');
    setErrorDetails(null);
    setTestMatrixData(null);
    setReport(null);
  };

  // 使用本地数据生成报告（APK模式）
  const generateLocalReport = async (
    std: StandardType,
    heightRange: string | null,
    weightRange: string | null
  ): Promise<DesignReport | null> => {
    try {
      // 加载本地数据
      const response = await fetch('/data/test-matrix-data.json');
      if (!response.ok) {
        throw new Error('Failed to load local data');
      }
      const data: TestMatrixResponse = await response.json();

      // 查找匹配的数据
      let groups: TestMatrixData[] = [];
      let inputValue = 0;
      let unit = '';

      if (std === 'R129' && heightRange) {
        groups = data.r129_height_groups;
        const parts = heightRange.split('-');
        inputValue = (parseInt(parts[0]) + parseInt(parts[1])) / 2;
        unit = 'cm';
      } else if (std === 'FMVSS213' && weightRange) {
        groups = data.fmvss_213_weight_groups;
        const parts = weightRange.split('-');
        inputValue = (parseFloat(parts[0]) + parseFloat(parts[1])) / 2;
        unit = 'kg';
      } else {
        return null;
      }

      // 查找最匹配的数据组
      let matchedGroup: TestMatrixData | null = null;
      for (const group of groups) {
        const rangeParts = group.height_range ? group.height_range.split('-') : 
                          group.weight_range ? group.weight_range.split('-') : [];
        if (rangeParts.length === 2) {
          const min = parseFloat(rangeParts[0]);
          const max = parseFloat(rangeParts[1]);
          if (inputValue >= min && inputValue <= max) {
            matchedGroup = group;
            break;
          }
        }
      }

      if (!matchedGroup) {
        return null;
      }

      // 并行执行：生成报告内容 + 联网搜索品牌信息
      const [brandSearchResult] = await Promise.allSettled([
        // 联网搜索品牌参数
        (async () => {
          try {
            console.log('[APK Mode] Starting brand search...');
            const brandResponse = await fetch('/api/brand-search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                standard,
                heightRange,
                weightRange,
              }),
            });
            
            if (brandResponse.ok) {
              const data = await brandResponse.json();
              console.log('[APK Mode] Brand search result:', data.success, data.structuredProducts?.length);
              return data;
            }
            return null;
          } catch (err) {
            console.error('[APK Mode] Brand search failed:', err);
            return null;
          }
        })(),
      ]);

      const brandData = brandSearchResult.status === 'fulfilled' ? brandSearchResult.value : null;

      // 生成Markdown格式的报告
      let standardName = '';
      switch (std as string) {
        case 'R129':
          standardName = 'ECE R129 (i-Size)';
          break;
        case 'R44':
          standardName = 'ECE R44/04';
          break;
        case 'FMVSS213':
        default:
          standardName = 'FMVSS 213';
          break;
      }
      const rangeStr = heightRange || weightRange || '';

      let markdown = `# 儿童安全座椅设计报告

## 1. 产品概述

**设计标准**: ${standardName}
**适用范围**: ${rangeStr}
**数据来源**: 本地知识库（APK离线模式）

---

## 2. ISOFIX尺寸分类

**尺寸类别**: ${matchedGroup.isofix_size_class}

---

## 3. 测试假人

`;
      if (matchedGroup.dummies && matchedGroup.dummies.length > 0) {
        matchedGroup.dummies.forEach((dummy, idx) => {
          markdown += `### ${idx + 1}. ${dummy}
`;
        });
      } else {
        markdown += `* 无相关假人数据
`;
      }

      markdown += `
---

## 4. 设计要求

`;

      const req = matchedGroup.design_requirements;
      if (req) {
        markdown += `### 头托高度
${req.head_rest_height || '无要求'}

### 安全带宽度
${req.harness_width || '无要求'}

### 座椅角度
${req.seat_angle || '无要求'}

### 肩部宽度
${req.shoulder_width || '无要求'}

### 臀部宽度
${req.hip_width || '无要求'}

### 内部长度
${req.internal_length || '无要求'}
`;
      }

      markdown += `
---

## 5. 碰撞测试矩阵

`;

      if (matchedGroup.test_matrix && matchedGroup.test_matrix.length > 0) {
        matchedGroup.test_matrix.forEach((test, idx) => {
          markdown += `### ${idx + 1}. ${test.test_type}

**测试假人**: ${test.dummies.join(', ') || '未指定'}
**测试速度**: ${test.speed || '未指定'}
**减速度**: ${test.deceleration || '未指定'}

**伤害指标**:
`;
          if (test.injury_criteria && test.injury_criteria.length > 0) {
            test.injury_criteria.forEach(criteria => {
              markdown += `- ${criteria}
`;
            });
          } else {
            markdown += `- 无伤害指标要求
`;
          }
          markdown += `
`;
        });
      } else {
        markdown += `无碰撞测试数据

`;
      }

      markdown += `
---

## 6. 年龄范围

${matchedGroup.age_range || '未指定'}

---

## 7. 体重范围

${matchedGroup.weight_range || '未指定'}

---

## 8. 安全建议

1. 严格按照上述设计要求进行产品设计
2. 确保所有碰撞测试符合标准要求
3. 定期进行质量检查和测试
4. 产品使用说明需包含详细的安装和使用指南

---

## 9. 主流品牌产品对比

`;

      // 添加品牌搜索结果
      if (brandData && brandData.success && brandData.structuredProducts && brandData.structuredProducts.length > 0) {
        markdown += `以下是基于${standardName}标准，适用范围${rangeStr}的主流品牌产品对比：

| 品牌 | 型号 | 身高/体重范围 | 安装方式 | 侧撞保护 | 后向/前向 |
|------|------|---------------|----------|----------|-----------|
`;

        brandData.structuredProducts.forEach((product: any) => {
          const height = product.heightRange || '-';
          const weight = product.weightRange || '-';
          const installation = product.installation || '-';
          const sideImpact = product.sideImpact || '-';
          const orientation = product.orientation || '-';

          markdown += `| ${product.brand} | ${product.model || '-'} | ${height}<br/>${weight} | ${installation} | ${sideImpact} | ${orientation} |
`;
        });

        // 添加AI总结
        if (brandData.summary) {
          markdown += `
### 市场分析总结

${brandData.summary}
`;
        }
      } else {
        markdown += `
⚠️ **暂未获取到品牌对比数据**

原因：联网搜索暂时失败，可能的原因包括：
- 网络连接不稳定
- 搜索服务暂时不可用
- 当前无匹配结果

**建议**：
1. 稍后重试（建议等待30秒后）
2. 访问Web版使用完整AI功能获取品牌对比数据
3. 使用本地数据查看技术规范和测试要求
`;
      }

      markdown += `
---

**报告生成时间**: ${new Date().toLocaleString('zh-CN')}
**数据版本**: ${data.version}
`;

      return {
        content: markdown,
        standard: standardName,
        timestamp: new Date().toISOString(),
        dataSource: 'local' as const,
      };
    } catch (err) {
      console.error('生成本地报告失败:', err);
      return null;
    }
  };

  const handleGenerateReport = async () => {
    // 验证输入
    if (inputType === 'height') {
      if (!minHeight || !maxHeight) {
        setError('请输入身高范围（例如：40-105cm）');
        return;
      }
      const min = parseInt(minHeight);
      const max = parseInt(maxHeight);
      if (min < 40 || max > 150 || min >= max) {
        setError('身高范围无效，请输入40-150cm之间的有效范围');
        return;
      }
    } else {
      if (!minWeight || !maxWeight) {
        setError('请输入体重范围（例如：9-18kg）');
        return;
      }
      const min = parseFloat(minWeight);
      const max = parseFloat(maxWeight);
      if (min < 0 || max > 50 || min >= max) {
        setError('体重范围无效，请输入0-50kg之间的有效范围');
        return;
      }
    }

    setError('');
    setErrorDetails(null);
    setIsGenerating(true);
    setReport(null);

    // 构建输入参数
    const heightRange = inputType === 'height' ? `${minHeight}-${maxHeight}cm` : null;
    const weightRange = inputType === 'weight' ? `${minWeight}-${maxWeight}kg` : null;

    try {
      // 统一使用免费智能体API生成报告（APK和Web版本一致）
      console.log('使用免费智能体API生成报告');
      const response = await fetch('/api/design-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          standard,
          heightRange,
          weightRange,
        }),
      });

      if (!response.ok) {
        // 尝试读取错误响应体
        let errorMessage = '生成报告失败';
        try {
          const errorData = await response.json();
          errorMessage = errorData.details || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let rawChunks: string[] = []; // 记录所有原始chunk
      const dataSource = response.headers.get('X-Data-Source') as 'ai' | 'local' | 'free-llm-api' || 'ai';

      if (!reader) {
        throw new Error('无法获取响应流');
      }

      console.log('[前端] 开始处理流式响应，数据来源:', dataSource);
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('流式响应结束，总共接收', chunkCount, '个chunk');
          break;
        }

        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        console.log(`Chunk ${chunkCount}:`, chunk.substring(0, 100));
        rawChunks.push(chunk); // 记录原始chunk

        // 尝试多种解析方式
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (!trimmedLine) continue;

          // 方法1: 标准SSE格式 (data: {...})
          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6);
            if (data === '[DONE]') {
              console.log('收到[DONE]标记');
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                console.log('添加content:', parsed.content.substring(0, 50));
              } else if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                // 豆包API的标准格式
                fullContent += parsed.choices[0].delta.content;
                console.log('添加content (豆包格式):', parsed.choices[0].delta.content.substring(0, 50));
              } else {
                console.log('收到data但没有可提取的content:', JSON.stringify(parsed).substring(0, 100));
              }
            } catch (e) {
              console.error('解析SSE数据失败:', trimmedLine, e);
            }
          }
          // 方法2: 直接是JSON对象（没有data:前缀）
          else if (trimmedLine.startsWith('{')) {
            try {
              const parsed = JSON.parse(trimmedLine);
              if (parsed.content) {
                fullContent += parsed.content;
                console.log('添加content (直接JSON):', parsed.content.substring(0, 50));
              } else if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                fullContent += parsed.choices[0].delta.content;
                console.log('添加content (直接JSON-豆包):', parsed.choices[0].delta.content.substring(0, 50));
              } else {
                console.log('收到JSON但没有可提取的content:', JSON.stringify(parsed).substring(0, 100));
              }
            } catch (e) {
              console.error('解析直接JSON失败:', trimmedLine, e);
            }
          }
        }
      }

      console.log('Full content from AI (length:', fullContent.length, '):');
      console.log(fullContent);

      // 直接保存AI输出的markdown内容，不解析JSON
      if (fullContent && fullContent.trim().length > 0) {
        setReport({
          content: fullContent,
          standard: getStandardName(standard),
          timestamp: new Date().toISOString(),
          dataSource: dataSource,
        });
        console.log('报告已设置，数据来源:', dataSource);

        // 并行执行：加载测试矩阵数据 + 联网搜索品牌信息
        const [matrixData, brandSearchResult] = await Promise.allSettled([
          loadTestMatrixData(standard, heightRange, weightRange),
          // 联网搜索品牌参数
          (async () => {
            try {
              console.log('[Web Mode] Starting brand search...');
              const brandResponse = await fetch('/api/brand-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  standard,
                  heightRange,
                  weightRange,
                }),
              });
              
              if (brandResponse.ok) {
                const data = await brandResponse.json();
                console.log('[Web Mode] Brand search result:', data.success, data.structuredProducts?.length);
                return data;
              }
              return null;
            } catch (err) {
              console.error('[Web Mode] Brand search failed:', err);
              return null;
            }
          })(),
        ]);

        // 设置测试矩阵数据和验证结果
        if (matrixData.status === 'fulfilled' && matrixData.value) {
          const { data, validation } = matrixData.value;
          setTestMatrixData(data);
          setDataValidation(validation);
          console.log('测试矩阵数据已加载:', data);
          console.log('数据验证结果:', validation);
        } else {
          console.log('未找到匹配的测试矩阵数据');
          setTestMatrixData(null);
        }

        // 如果品牌搜索成功，添加到报告中
        if (brandSearchResult.status === 'fulfilled' && brandSearchResult.value && brandSearchResult.value.success) {
          const brandData = brandSearchResult.value;
          
          if (brandData.structuredProducts && brandData.structuredProducts.length > 0) {
            const brandSection = `

## 9. 主流品牌产品对比

以下是基于${standard === 'R129' ? 'ECE R129 (i-Size)' : standard === 'FMVSS213' ? 'FMVSS 213' : 'ECE R44'}标准，适用范围${heightRange || weightRange}的主流品牌产品对比：

| 品牌 | 型号 | 身高/体重范围 | 安装方式 | 侧撞保护 | 后向/前向 |
|------|------|---------------|----------|----------|-----------|
${brandData.structuredProducts.map((product: any) => {
  const height = product.heightRange || '-';
  const weight = product.weightRange || '-';
  const installation = product.installation || '-';
  const sideImpact = product.sideImpact || '-';
  const orientation = product.orientation || '-';
  return `| ${product.brand} | ${product.model || '-'} | ${height}<br/>${weight} | ${installation} | ${sideImpact} | ${orientation} |`;
}).join('\n')}
`;

            // 添加AI总结
            if (brandData.summary) {
              const summarySection = `
### 市场分析总结

${brandData.summary}
`;
              
              // 更新报告内容
              setReport(prev => prev ? {
                ...prev,
                content: fullContent + brandSection + summarySection,
              } : null);
            }
          }
        }
      } else {
        console.error('AI未返回任何内容，fullContent为空');
        setError('生成报告失败，AI未返回任何内容');
        // 显示原始响应内容，帮助诊断问题
        const rawResponse = rawChunks.join('\n').substring(0, 1000);
        setErrorDetails({
          message: 'AI返回的内容为空，请检查API配置或稍后重试',
          rawContent: `接收到${chunkCount}个chunk，但未提取到有效内容。\n\n原始响应:\n${rawResponse}${rawChunks.join('\n').length > 1000 ? '...' : ''}`,
        });
      }
    } catch (err) {
      console.error('生成报告错误:', err);
      console.error('错误详情:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : '未知错误',
        stack: err instanceof Error ? err.stack : undefined,
      });

      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError('生成报告失败，请稍后重试');
      setErrorDetails({
        message: errorMessage,
        rawContent: err instanceof Error && err.stack ? err.stack.substring(0, 300) : '无详细信息',
      });
    } finally {
      console.log('生成报告流程结束，isGenerating:', isGenerating);
      setIsGenerating(false);
    }
  };

  // 审核报告函数
  const handleAuditReport = async () => {
    if (!report) return;

    // 统一使用免费智能体API审核报告（APK和Web版本一致）
    setIsAuditing(true);
    setAuditError('');
    setAuditResult(null);

    try {
      const response = await fetch('/api/audit-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report,
          standard,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || '审核失败');
      }

      const data = await response.json();
      if (data.success && data.audit) {
        setAuditResult(data.audit);
      } else {
        throw new Error('审核结果格式错误');
      }
    } catch (err) {
      console.error('Audit error:', err);
      setAuditError(err instanceof Error ? err.message : '审核失败');
    } finally {
      setIsAuditing(false);
    }
  };

  const getStandardName = (std: StandardType): string => {
    switch (std) {
      case 'R129':
        return 'ECE R129 (i-Size)';
      case 'R44':
        return 'ECE R44/04';
      case 'FMVSS213':
        return 'FMVSS 213';
      default:
        return '';
    }
  };

  // 加载测试矩阵数据
  const loadTestMatrixData = async (
    std: StandardType,
    heightRange: string | null,
    weightRange: string | null
  ): Promise<{ data: TestMatrixData | null; validation: any } | null> => {
    try {
      const response = await fetch('/data/test-matrix-data.json');
      if (!response.ok) {
        throw new Error('Failed to load test matrix data');
      }

      const data: TestMatrixResponse = await response.json();

      // 根据标准选择对应的数据组
      let groups: TestMatrixData[] = [];
      let inputValue: number = 0;

      if (std === 'R129' && heightRange) {
        groups = data.r129_height_groups;
        // 计算身高中位数
        const parts = heightRange.split('-');
        inputValue = (parseInt(parts[0]) + parseInt(parts[1])) / 2;
      } else if (std === 'FMVSS213' && weightRange) {
        groups = data.fmvss_213_weight_groups;
        // 计算体重中位数
        const parts = weightRange.split('-');
        inputValue = (parseFloat(parts[0]) + parseFloat(parts[1])) / 2;
      } else {
        return null;
      }

      // 匹配最接近的组
      let matchedGroup: TestMatrixData | null = null;
      for (const group of groups) {
        const groupParts = std === 'R129'
          ? group.height_range.split('-').map((s) => parseInt(s.replace('cm', '')))
          : group.weight_range.split('-').map((s) => parseInt(s.replace('kg', '')));

        if (inputValue >= groupParts[0] && inputValue <= groupParts[1]) {
          matchedGroup = group;
          break;
        }
      }

      if (!matchedGroup) {
        return { data: null, validation: null };
      }

      // 调用验证API验证数据准确性
      let validationResult: any = null;
      try {
        console.log('[Frontend] Validating local data...');
        const validationResponse = await fetch('/api/validate-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            standard: std,
            heightRange,
            weightRange,
            localData: matchedGroup,
          }),
        });

        if (validationResponse.ok) {
          validationResult = await validationResponse.json();
          console.log('[Frontend] Validation result:', validationResult);
        } else {
          console.warn('[Frontend] Validation API returned error');
        }
      } catch (validationError) {
        console.error('[Frontend] Validation error:', validationError);
      }

      return { data: matchedGroup, validation: validationResult };
    } catch (error) {
      console.error('Error loading test matrix data:', error);
      return null;
    }
  };

  // 简单的markdown渲染函数
  const renderMarkdown = (text: string): string => {
    let html = text;

    // 转义HTML标签
    html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // 标题 (## 或 ###)
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // 粗体
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // 斜体
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // 无序列表
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // 有序列表
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // 链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // 段落
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    // 移除空段落
    html = html.replace(/<p>\s*<\/p>/g, '');

    // 修复列表嵌套问题
    html = html.replace(/<\/p><ul>/g, '<ul>');
    html = html.replace(/<\/ul><p>/g, '</ul>');

    return html;
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <Card className="bg-white/95 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl md:text-3xl flex items-center gap-2" style={{ color: '#667eea' }}>
                  <Shield className="w-8 h-8" />
                  儿童安全座椅专业设计助手
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  ECE R129 (i-Size) / FMVSS 213 / ECE R44 · 安全第一 · 专业设计
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm px-3 py-1">
                  V8.4.0
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDebug(!showDebug)}
                  className="flex items-center gap-1"
                >
                  <Bug className="w-4 h-4" />
                  调试
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 输入表单 */}
        <Card className="bg-white/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              开始设计
            </CardTitle>
            <CardDescription>
              输入儿童身高或体重范围，生成专业的设计建议
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="standard">选择安全标准</Label>
                <Select value={standard} onValueChange={handleStandardChange}>
                  <SelectTrigger id="standard">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="R129">
                      ECE R129 (i-Size) - 基于身高（推荐）
                    </SelectItem>
                    <SelectItem value="FMVSS213">
                      FMVSS 213 - 基于体重（美国标准）
                    </SelectItem>
                    <SelectItem value="R44">
                      ECE R44/04 - 基于体重（较旧标准）
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {standard === 'R129' ? (
                <>
                  <div>
                    <Label htmlFor="minHeight">最小身高 (cm)</Label>
                    <Input
                      id="minHeight"
                      type="number"
                      placeholder="例如：40"
                      value={minHeight}
                      onChange={(e) => setMinHeight(e.target.value)}
                      min="40"
                      max="150"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxHeight">最大身高 (cm)</Label>
                    <Input
                      id="maxHeight"
                      type="number"
                      placeholder="例如：105"
                      value={maxHeight}
                      onChange={(e) => setMaxHeight(e.target.value)}
                      min="40"
                      max="150"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="minWeight">最小体重 (kg)</Label>
                    <Input
                      id="minWeight"
                      type="number"
                      placeholder="例如：9"
                      value={minWeight}
                      onChange={(e) => setMinWeight(e.target.value)}
                      min="0"
                      max="50"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxWeight">最大体重 (kg)</Label>
                    <Input
                      id="maxWeight"
                      type="number"
                      placeholder="例如：18"
                      value={maxWeight}
                      onChange={(e) => setMaxWeight(e.target.value)}
                      min="0"
                      max="50"
                      step="0.1"
                    />
                  </div>
                </>
              )}
            </div>

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-red-700 font-semibold mb-2">{error}</p>
                    {errorDetails && (
                      <div className="space-y-2 mt-3">
                        <p className="text-red-600 text-sm">{errorDetails.message}</p>
                        {errorDetails.parseError && (
                          <p className="text-red-600 text-xs">解析错误: {errorDetails.parseError}</p>
                        )}
                        {errorDetails.rawContent && showDebug && (
                          <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                            <p className="text-xs font-semibold mb-2">AI原始输出（前500字符）:</p>
                            <pre className="text-xs text-red-800 whitespace-pre-wrap font-mono">
                              {errorDetails.rawContent}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {errorDetails && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDebug(!showDebug)}
                      className="flex-shrink-0"
                    >
                      <Bug className="w-4 h-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-semibold text-lg py-6"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  正在生成设计建议...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  生成设计建议
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 设计报告 - 使用自然语言markdown格式 */}
        {report && (
          <div className="space-y-6">
            {/* 报告头部 */}
            <Card className="bg-white/95 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">设计报告</h3>
                    <p className="text-sm text-gray-600">
                      标准：{report.standard} · 生成时间：{new Date(report.timestamp).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.dataSource === 'local' && (
                      <Badge className="bg-blue-600 text-white flex items-center gap-1">
                        <Settings className="w-3 h-3" />
                        本地知识库
                      </Badge>
                    )}
                    {report.dataSource === 'free-llm-api' && (
                      <Badge className="bg-green-600 text-white flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        免费AI模型
                      </Badge>
                    )}
                    <Badge className="bg-purple-600 text-white">
                      已生成
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Markdown内容渲染 */}
            <Card className="bg-white/95 backdrop-blur">
              <CardContent className="p-6">
                <div
                  className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-strong:text-gray-900 prose-p:text-gray-700 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700 prose-a:text-purple-600"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(report.content) }}
                />
              </CardContent>
            </Card>

            {/* 测试矩阵数据 */}
            {testMatrixData && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    测试矩阵与设计要求
                  </CardTitle>
                  <CardDescription>
                    基于输入范围匹配的官方测试数据
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Envelope 和 测试假人 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">ISOFIX Size Class (Envelope)</h4>
                      <Badge className="bg-blue-600 text-white text-sm px-3 py-1">
                        {testMatrixData.isofix_size_class}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">测试假人</h4>
                      <div className="flex flex-wrap gap-2">
                        {testMatrixData.dummies.map((dummy, idx) => (
                          <Badge key={idx} className="bg-green-600 text-white">
                            {dummy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 设计要求 */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">设计要求</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="bg-white p-2 rounded border border-blue-200">
                        <span className="text-gray-600">头托高度:</span> {testMatrixData.design_requirements.head_rest_height}
                      </div>
                      <div className="bg-white p-2 rounded border border-blue-200">
                        <span className="text-gray-600">安全带宽度:</span> {testMatrixData.design_requirements.harness_width}
                      </div>
                      <div className="bg-white p-2 rounded border border-blue-200">
                        <span className="text-gray-600">座椅角度:</span> {testMatrixData.design_requirements.seat_angle}
                      </div>
                      <div className="bg-white p-2 rounded border border-blue-200">
                        <span className="text-gray-600">肩宽:</span> {testMatrixData.design_requirements.shoulder_width}
                      </div>
                      <div className="bg-white p-2 rounded border border-blue-200">
                        <span className="text-gray-600">臀宽:</span> {testMatrixData.design_requirements.hip_width}
                      </div>
                      <div className="bg-white p-2 rounded border border-blue-200">
                        <span className="text-gray-600">内部长度:</span> {testMatrixData.design_requirements.internal_length}
                      </div>
                    </div>
                  </div>

                  {/* 撞击测试矩阵 */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">撞击测试矩阵</h4>
                    <div className="space-y-3">
                      {testMatrixData.test_matrix.map((test, idx) => (
                        <Card key={idx} className="bg-white border border-blue-200">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className="bg-purple-600 text-white text-xs">
                                {test.test_type}
                              </Badge>
                              <span className="text-sm text-gray-600">{test.speed}</span>
                            </div>
                            <div className="space-y-1">
                              <div className="text-sm">
                                <span className="text-gray-600">假人:</span>{' '}
                                {test.dummies.map((d, i) => (
                                  <Badge key={i} className="bg-green-600 text-white text-xs ml-1">
                                    {d}
                                  </Badge>
                                ))}
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-600">减速度:</span> {test.deceleration}
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-600">伤害指标:</span>{' '}
                                {test.injury_criteria.map((c, i) => (
                                  <span key={i} className="inline-block bg-yellow-100 text-yellow-800 text-xs px-1 py-0.5 rounded ml-1">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 数据验证结果 */}
            {dataValidation && (
              <Card className={`${
                dataValidation.is_valid ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
              }`}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {dataValidation.is_valid ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    )}
                    数据验证结果 (AI智能核对)
                  </CardTitle>
                  <CardDescription>
                    智能体验证本地数据准确性的结果
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* 验证状态 */}
                  <div className="flex items-center gap-2">
                    <Badge className={
                      dataValidation.is_valid
                        ? 'bg-green-600 text-white'
                        : 'bg-yellow-600 text-white'
                    }>
                      {dataValidation.is_valid ? '验证通过' : '需要注意'}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      共检查 {dataValidation.checked_count} 项数据
                    </span>
                  </div>

                  {/* 验证说明 */}
                  {dataValidation.explanation && (
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-sm text-gray-700">{dataValidation.explanation}</p>
                    </div>
                  )}

                  {/* 发现的问题 */}
                  {dataValidation.issues && dataValidation.issues.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">发现的问题</h4>
                      <div className="space-y-2">
                        {dataValidation.issues.map((issue: any, idx: number) => (
                          <div key={idx} className="bg-white p-3 rounded border border-yellow-200">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{issue.item}</p>
                                <p className="text-sm text-gray-600 mt-1">{issue.issue}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 建议的修正 */}
                  {dataValidation.issues && dataValidation.issues.length > 0 && dataValidation.issues.some((i: any) => i.suggestion) && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">建议的修正</h4>
                      <div className="space-y-2">
                        {dataValidation.issues.filter((i: any) => i.suggestion).map((issue: any, idx: number) => (
                          <div key={idx} className="bg-white p-3 rounded border border-blue-200">
                            <div className="flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{issue.category}</p>
                                <p className="text-sm text-gray-600 mt-1">{issue.suggestion}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 安全提醒 */}
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Badge className="bg-red-600 text-white px-2 py-0 flex-shrink-0 mt-0.5">04</Badge>
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-bold text-red-800 mb-2">重要安全提醒</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• 儿童安全座椅必须购买已通过官方认证的产品</li>
                      <li>• 设计建议仅作开发参考，不可直接用于生产</li>
                      <li>• 最终产品必须通过权威机构（TÜV、ADAC、中国CCC）型式认证</li>
                      <li>• 必须通过实车碰撞测试验证安全性</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 法规审核按钮 */}
            <Card className="bg-white/95 backdrop-blur">
              <CardContent className="p-4">
                <Button
                  onClick={handleAuditReport}
                  disabled={isAuditing}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 font-semibold text-lg py-4"
                  size="lg"
                >
                  {isAuditing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      正在审核报告...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5 mr-2" />
                      启动法规合规性审核
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  使用DeepSeek R1模型深度审核，确保报告符合ECE R129/FMVSS 213等法规要求
                </p>
              </CardContent>
            </Card>

            {/* 审核结果 */}
            {auditResult && (
              <Card className={`bg-white/95 backdrop-blur border-2 ${auditResult.audit_passed ? 'border-green-500' : 'border-red-500'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    {auditResult.audit_passed ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <span className="text-green-700">审核通过</span>
                      </>
                    ) : (
                      <>
                        <X className="w-6 h-6 text-red-600" />
                        <span className="text-red-700">审核未通过</span>
                      </>
                    )}
                    <Badge
                      className={`ml-4 ${
                        auditResult.audit_score >= 90
                          ? 'bg-green-600'
                          : auditResult.audit_score >= 70
                          ? 'bg-blue-600'
                          : auditResult.audit_score >= 50
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      } text-white`}
                    >
                      {auditResult.audit_score}分
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 审核摘要 */}
                  <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="p-4">
                      <h4 className="font-bold text-gray-900 mb-2">审核摘要</h4>
                      <p className="text-gray-700 text-sm">{auditResult.summary}</p>
                    </CardContent>
                  </Card>

                  {/* 问题列表 */}
                  {auditResult.issues && auditResult.issues.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-gray-900">发现的问题</h4>
                      {auditResult.issues.map((issue, idx) => (
                        <Card
                          key={idx}
                          className={`border-2 ${
                            issue.severity === '高'
                              ? 'border-red-300 bg-red-50'
                              : issue.severity === '中'
                              ? 'border-yellow-300 bg-yellow-50'
                              : 'border-blue-300 bg-blue-50'
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Badge
                                className={`${
                                  issue.severity === '高'
                                    ? 'bg-red-600'
                                    : issue.severity === '中'
                                    ? 'bg-yellow-600'
                                    : 'bg-blue-600'
                                } text-white flex-shrink-0 mt-0.5`}
                              >
                                {issue.severity}
                              </Badge>
                              <div className="flex-1">
                                <div className="font-bold text-gray-900 mb-1">{issue.type}</div>
                                <p className="text-gray-700 text-sm mb-2">{issue.description}</p>
                                <p className="text-gray-600 text-xs italic">
                                  建议：{issue.suggestion}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* 改进建议 */}
                  {auditResult.recommendations && auditResult.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-900">改进建议</h4>
                      <ul className="space-y-2">
                        {auditResult.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Badge className="bg-green-600 text-white flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </Badge>
                            <span className="text-gray-700 text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 审核错误 */}
            {auditError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-700 font-semibold mb-1">审核失败</p>
                    <p className="text-red-600 text-sm">{auditError}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
