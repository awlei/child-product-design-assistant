'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

type StandardType = 'R129' | 'R44' | 'FMVSS213';

interface DesignReport {
  productPosition: string;
  technicalRequirements: string[];
  safetyFeatures: string[];
  brandComparison: string;
  designSuggestions: string;
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

      // 改进的报告内容解析
      setReport(parseReport(fullContent));
    } catch (err) {
      console.error('生成报告错误:', err);
      setError('生成报告失败，请稍后重试');
    } finally {
      setIsGenerating(false);
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

  // 改进的报告解析函数
  const parseReport = (content: string): DesignReport => {
    return {
      productPosition: extractSection(content, ['产品定位', '适用标准']),
      technicalRequirements: extractList(content, ['关键技术', '技术要求']),
      safetyFeatures: extractList(content, ['核心安全功能', '安全功能']),
      brandComparison: extractSection(content, ['品牌', '主流品牌']),
      designSuggestions: extractSection(content, ['设计建议', '人体工程学']),
    };
  };

  // 改进的章节提取函数 - 支持多个关键词
  const extractSection = (content: string, keywords: string[]): string => {
    const lines = content.split('\n');
    let section = '';
    let inSection = false;
    let foundKeyword = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 检查是否匹配任一关键词
      for (const keyword of keywords) {
        if (line.includes(keyword) && (line.startsWith('###') || line.startsWith('#'))) {
          inSection = true;
          foundKeyword = keyword;
          continue;
        }
      }

      // 如果找到了关键词，开始收集内容
      if (inSection && line.trim() !== foundKeyword) {
        // 检查是否到达下一个章节
        if (line.startsWith('###') || line.startsWith('#')) {
          // 如果包含其他关键词，停止
          const isNextSection = keywords.some(k => line.includes(k) && k !== foundKeyword);
          if (isNextSection && !line.includes(foundKeyword)) {
            break;
          }
        }

        // 收集内容，跳过空行和标题
        if (line.trim() && !line.startsWith('###') && !line.startsWith('#')) {
          section += line + '\n';
        }
      }
    }

    return section.trim();
  };

  // 改进的列表提取函数 - 支持多个关键词
  const extractList = (content: string, keywords: string[]): string[] => {
    const lines = content.split('\n');
    let items: string[] = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 检查是否匹配任一关键词
      for (const keyword of keywords) {
        if (line.includes(keyword) && (line.startsWith('###') || line.startsWith('#'))) {
          inList = true;
          break;
        }
      }

      // 如果在列表区域，提取列表项
      if (inList) {
        // 检查是否到达下一个章节
        if (line.startsWith('###')) {
          const isNextSection = keywords.some(k => line.includes(k));
          if (isNextSection) {
            break;
          }
        }

        // 提取列表项
        if (line.startsWith('- ') || line.startsWith('* ')) {
          const item = line.replace(/^- /, '').replace(/^\* /, '').trim();
          if (item) {
            items.push(item);
          }
        } else if (line.match(/^\d+\./)) {
          // 处理数字列表
          const item = line.replace(/^\d+\.\s*/, '').trim();
          if (item) {
            items.push(item);
          }
        }
      }
    }

    return items;
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
                V8.0.0
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
              输入儿童身高或体重范围，生成专业的设计报告
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
                  正在生成设计报告...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  生成设计报告
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 设计报告 */}
        {report && (
          <Card className="bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                设计报告
              </CardTitle>
              <CardDescription>
                基于 {getStandardName(standard)} 标准的专业设计建议
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 产品定位与适用标准 */}
              <section>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#667eea' }}>
                  <Shield className="w-5 h-5" />
                  产品定位与适用标准
                </h3>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4">
                    <p className="whitespace-pre-wrap text-gray-700">{report.productPosition}</p>
                  </CardContent>
                </Card>
              </section>

              {/* 关键技术要求 */}
              <section>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#667eea' }}>
                  <Shield className="w-5 h-5" />
                  关键技术要求
                </h3>
                <div className="grid gap-2">
                  {report.technicalRequirements.map((item, idx) => (
                    <Card key={idx} className="bg-blue-50 border-blue-200">
                      <CardContent className="p-3">
                        <p className="text-gray-700">{item}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* 核心安全功能推荐 */}
              <section>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#667eea' }}>
                  <Shield className="w-5 h-5" />
                  核心安全功能推荐
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {report.safetyFeatures.map((item, idx) => (
                    <Card key={idx} className="bg-green-50 border-green-200">
                      <CardContent className="p-3">
                        <p className="text-gray-700">{item}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* 主流品牌参数对比 */}
              <section>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#667eea' }}>
                  <Shield className="w-5 h-5" />
                  主流品牌参数对比
                </h3>
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="whitespace-pre-wrap text-gray-700 font-mono text-sm overflow-x-auto">
                      {report.brandComparison}
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* 设计建议与人体工程学要点 */}
              <section>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#667eea' }}>
                  <Shield className="w-5 h-5" />
                  设计建议与人体工程学要点
                </h3>
                <Card className="bg-pink-50 border-pink-200">
                  <CardContent className="p-4">
                    <p className="whitespace-pre-wrap text-gray-700">{report.designSuggestions}</p>
                  </CardContent>
                </Card>
              </section>

              {/* 安全提醒 */}
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-red-800 mb-2">重要安全提醒</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>• 儿童安全座椅必须购买已通过官方认证的产品</li>
                        <li>• 设计方案仅作开发参考，不可直接用于生产</li>
                        <li>• 最终产品必须通过权威机构（TÜV、ADAC、中国CCC）型式认证</li>
                        <li>• 必须通过实车碰撞测试验证安全性</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
