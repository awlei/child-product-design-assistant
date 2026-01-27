'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Sparkles, Loader2, CheckCircle, AlertCircle, Settings, ShieldCheck } from 'lucide-react';

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

  const handleStandardChange = (value: string) => {
    setStandard(value as StandardType);
    setInputType(value === 'R129' ? 'height' : 'weight');
    // 清空输入
    setMinHeight('');
    setMaxHeight('');
    setMinWeight('');
    setMaxWeight('');
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
        throw new Error('生成报告失败');
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

      // 解析JSON格式的报告
      const parsedReport = parseJsonReport(fullContent);
      if (parsedReport) {
        setReport(parsedReport);
      } else {
        setError('生成报告格式错误，请重试');
      }
    } catch (err) {
      console.error('生成报告错误:', err);
      setError('生成报告失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 解析JSON格式的报告
  const parseJsonReport = (content: string): DesignReport | null => {
    try {
      // 尝试提取JSON部分
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in content');
        return null;
      }

      const jsonStr = jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      // 验证结构
      if (!parsed.module1 || !parsed.module2 || !parsed.module3) {
        console.error('Invalid report structure');
        return null;
      }

      return {
        module1: {
          title: parsed.module1.title || '产品定位与适用标准',
          content: parsed.module1.content || '',
        },
        module2: {
          title: parsed.module2.title || '关键技术要求',
          requirements: Array.isArray(parsed.module2.requirements)
            ? parsed.module2.requirements
            : [],
        },
        module3: {
          title: parsed.module3.title || '核心安全功能推荐',
          features: Array.isArray(parsed.module3.features)
            ? parsed.module3.features
            : [],
        },
      };
    } catch (e) {
      console.error('Failed to parse JSON report:', e);
      return null;
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
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm px-3 py-1">
                V8.1.0
              </Badge>
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
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-red-700">{error}</p>
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
                <CardTitle className="flex items-center gap-2" style={{ color: '#667eea' }}>
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
                <CardTitle className="flex items-center gap-2" style={{ color: '#667eea' }}>
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
              </CardContent>
            </Card>

            {/* 模块3：核心安全功能推荐 */}
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: '#667eea' }}>
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
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h4 className="font-bold text-gray-900">{feature.name}</h4>
                        </div>
                        <div className="space-y-2 ml-7">
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
              </CardContent>
            </Card>

            {/* 安全提醒 */}
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
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
          </div>
        )}
      </div>
    </div>
  );
}
