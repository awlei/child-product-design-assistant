'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Sparkles, Loader2, CheckCircle, AlertCircle, Settings, ShieldCheck, Bug, X } from 'lucide-react';

type StandardType = 'R129' | 'R44' | 'FMVSS213';

// 新的设计报告接口 - 三模块结构
interface DesignReport {
  module1: {
    title: string;
    content: string;
  };
  module2: {
    title: string;
    requirements: string[];
  };
  module3: {
    title: string;
    features: Array<{
      name: string;
      implementation: string;
      safetyValue: string;
    }>;
  };
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

    try {
      // 构建API请求参数
      const heightRange = inputType === 'height' ? `${minHeight}-${maxHeight}cm` : null;
      const weightRange = inputType === 'weight' ? `${minWeight}-${maxWeight}kg` : null;

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

      if (!reader) {
        throw new Error('无法获取响应流');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      console.log('Full content from AI:', fullContent);

      // 解析JSON格式的报告
      const parseResult = parseJsonReport(fullContent);
      if (parseResult.success && parseResult.report) {
        setReport(parseResult.report);
      } else {
        // 解析失败，显示详细错误
        setError('生成报告格式错误');
        setErrorDetails({
          message: parseResult.error || '未知错误',
          rawContent: fullContent.substring(0, 500) + (fullContent.length > 500 ? '...' : ''),
          parseError: parseResult.parseError,
        });
      }
    } catch (err) {
      console.error('生成报告错误:', err);
      setError('生成报告失败，请稍后重试');
      setErrorDetails({
        message: err instanceof Error ? err.message : '未知错误',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 审核报告函数
  const handleAuditReport = async () => {
    if (!report) return;

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

  // 改进的JSON解析函数 - 支持多种格式和详细错误诊断
  const parseJsonReport = (content: string): { success: boolean; report?: DesignReport; error?: string; parseError?: string } => {
    console.log('Starting JSON parsing...');
    console.log('Content length:', content.length);
    console.log('Content preview:', content.substring(0, 300) + '...');

    // 预处理：移除markdown代码块标记
    let cleanedContent = content.trim();

    // 方法1: 移除 ```json 和 ``` 标记
    cleanedContent = cleanedContent.replace(/^```json\s*\n?/i, '');
    cleanedContent = cleanedContent.replace(/^```\s*\n?/, '');
    cleanedContent = cleanedContent.replace(/\n?```\s*$/, '');
    cleanedContent = cleanedContent.trim();

    console.log('Cleaned content preview:', cleanedContent.substring(0, 300) + '...');

    // 方法2: 直接尝试解析清理后的内容
    try {
      console.log('Method 1: Trying to parse cleaned content as JSON...');
      const parsed = JSON.parse(cleanedContent);
      console.log('Method 1: Direct parse successful');
      const report = validateAndNormalize(parsed);
      if (report) {
        return { success: true, report };
      } else {
        console.error('Method 1: Validation failed');
        return { success: false, error: 'JSON结构不符合要求' };
      }
    } catch (e) {
      console.log('Method 1: Direct parse failed, trying method 2...');
    }

    // 方法3: 提取第一个完整的JSON对象（处理可能有多个JSON的情况）
    try {
      console.log('Method 2: Extracting first JSON object from original content...');
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Method 2: No JSON found in original content');

        // 尝试从清理后的内容中提取
        console.log('Method 2: Trying to extract from cleaned content...');
        const cleanedJsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (!cleanedJsonMatch) {
          console.error('Method 2: No JSON found in cleaned content either');
          return {
            success: false,
            error: 'AI未返回JSON格式的内容',
            parseError: '未找到JSON对象',
          };
        }

        const jsonStr = cleanedJsonMatch[0];
        console.log('Method 2: Found JSON in cleaned content, length:', jsonStr.length);

        const parsed = JSON.parse(jsonStr);
        console.log('Method 2: JSON parsed successfully');

        const normalized = validateAndNormalize(parsed);
        if (normalized) {
          console.log('Method 2: Validation successful');
          return { success: true, report: normalized };
        } else {
          console.error('Method 2: Validation failed');
          return {
            success: false,
            error: 'JSON结构不符合要求',
            parseError: '缺少必要的模块（module1/module2/module3）',
          };
        }
      }

      const jsonStr = jsonMatch[0];
      console.log('Method 2: Found JSON, length:', jsonStr.length);

      const parsed = JSON.parse(jsonStr);
      console.log('Method 2: JSON parsed successfully');

      const normalized = validateAndNormalize(parsed);
      if (normalized) {
        console.log('Method 2: Validation successful');
        return { success: true, report: normalized };
      } else {
        console.error('Method 2: Validation failed');
        return {
          success: false,
          error: 'JSON结构不符合要求',
          parseError: '缺少必要的模块（module1/module2/module3）',
        };
      }
    } catch (e) {
      console.error('Method 2: Parse failed', e);
      return {
        success: false,
        error: 'JSON解析失败',
        parseError: e instanceof Error ? e.message : '未知解析错误',
      };
    }
  };

  // 验证和标准化报告数据
  const validateAndNormalize = (parsed: any): DesignReport | null => {
    console.log('Validating report structure...');

    // 检查必需的模块
    if (!parsed.module1) {
      console.error('Missing module1');
      return null;
    }
    if (!parsed.module2) {
      console.error('Missing module2');
      return null;
    }
    if (!parsed.module3) {
      console.error('Missing module3');
      return null;
    }

    // 验证module1
    if (typeof parsed.module1.content !== 'string') {
      console.error('Invalid module1.content type:', typeof parsed.module1.content);
      parsed.module1.content = String(parsed.module1.content || '');
    }

    // 验证module2
    if (!Array.isArray(parsed.module2.requirements)) {
      console.error('Invalid module2.requirements type:', typeof parsed.module2.requirements);
      if (typeof parsed.module2.requirements === 'string') {
        // 如果是字符串，尝试按换行符分割
        parsed.module2.requirements = parsed.module2.requirements.split('\n').filter((r: string) => r.trim());
      } else {
        parsed.module2.requirements = [];
      }
    }

    // 验证module3
    if (!Array.isArray(parsed.module3.features)) {
      console.error('Invalid module3.features type:', typeof parsed.module3.features);
      parsed.module3.features = [];
    }

    // 标准化features
    parsed.module3.features = parsed.module3.features.map((f: any) => ({
      name: f.name || '未命名功能',
      implementation: f.implementation || '暂无说明',
      safetyValue: f.safetyValue || '暂无说明',
    }));

    console.log('Validation successful');
    return {
      module1: {
        title: parsed.module1.title || '产品定位与适用标准',
        content: parsed.module1.content,
      },
      module2: {
        title: parsed.module2.title || '关键技术要求',
        requirements: parsed.module2.requirements,
      },
      module3: {
        title: parsed.module3.title || '核心安全功能推荐',
        features: parsed.module3.features,
      },
    };
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
                  V8.2.0
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

        {/* 设计报告 - 三模块结构 */}
        {report && (
          <div className="space-y-6">
            {/* 模块1：产品定位与适用标准 */}
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-3" style={{ color: '#667eea' }}>
                  <Badge className="bg-purple-600 text-white px-2 py-0">01</Badge>
                  <ShieldCheck className="w-6 h-6" />
                  {report.module1.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {report.module1.content}
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* 模块2：关键技术要求 */}
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-3" style={{ color: '#667eea' }}>
                  <Badge className="bg-blue-600 text-white px-2 py-0">02</Badge>
                  <Settings className="w-6 h-6" />
                  {report.module2.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.module2.requirements.map((req, idx) => (
                  <Card key={idx} className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </div>
                        <p className="text-gray-700 flex-1">{req}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {report.module2.requirements.length === 0 && (
                  <p className="text-gray-500 italic">暂无技术要求</p>
                )}
              </CardContent>
            </Card>

            {/* 模块3：核心安全功能推荐 */}
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-3" style={{ color: '#667eea' }}>
                  <Badge className="bg-green-600 text-white px-2 py-0">03</Badge>
                  <ShieldCheck className="w-6 h-6" />
                  {report.module3.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.module3.features.map((feature, idx) => (
                  <Card key={idx} className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          <h4 className="font-bold text-gray-900">{feature.name}</h4>
                        </div>
                        <div className="space-y-2 ml-8">
                          <div>
                            <span className="font-semibold text-gray-700">技术实现：</span>
                            <span className="text-gray-600 ml-2">{feature.implementation}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">安全价值：</span>
                            <span className="text-gray-600 ml-2">{feature.safetyValue}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {report.module3.features.length === 0 && (
                  <p className="text-gray-500 italic">暂无安全功能推荐</p>
                )}
              </CardContent>
            </Card>

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
