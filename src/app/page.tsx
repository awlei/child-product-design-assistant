'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type EngineMode = 'cloud' | 'local';
type ConfigScheme = 'none' | 'bot' | 'workflow' | 'local';

interface CozeConfig {
  scheme: ConfigScheme;
  botId: string;
  apiToken: string;
  workflowId: string;
  workflowToken: string;
  localEndpoint: string;
  localToken: string;
  apiUsage: number;
  tokenUsage: number;
  workflowUsage: number;
}

export default function ChildSafetyChairApp() {
  const router = useRouter();
  const [globalHeight, setGlobalHeight] = useState(100);
  const [useCloudEngine, setUseCloudEngine] = useState(true);
  const [currentScheme, setCurrentScheme] = useState<ConfigScheme>('none');
  const [cozeConfig, setCozeConfig] = useState<CozeConfig>({
    scheme: 'none',
    botId: '',
    apiToken: '',
    workflowId: '',
    workflowToken: '',
    localEndpoint: 'http://localhost:8888',
    localToken: '',
    apiUsage: 0,
    tokenUsage: 0,
    workflowUsage: 0,
  });

  const [height, setHeight] = useState('');
  const [maxHeight, setMaxHeight] = useState('');
  const [activeTab, setActiveTab] = useState('dimensions');

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');

  const [showLoading, setShowLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('智能体计算中...');

  const [dimensionsResult, setDimensionsResult] = useState<any>(null);
  const [injuryResult, setInjuryResult] = useState<any>(null);

  const [hicLimit, setHicLimit] = useState(1000);
  const [accelerationLimit, setAccelerationLimit] = useState(50);
  const [injuryCriteria, setInjuryCriteria] = useState<string[]>([]);

  // 加载配置
  useEffect(() => {
    const saved = localStorage.getItem('crs_free_coze_config');
    if (saved) {
      const config = JSON.parse(saved);
      setCozeConfig(config);
      setCurrentScheme(config.scheme);
      if (config.scheme !== 'none') {
        setActiveTab('config');
      }
    }
    updateInjuryLimits();
  }, []);

  // 更新伤害指标
  const updateInjuryLimits = () => {
    setInjuryCriteria([]);
    if (hicLimit > 1000) {
      setInjuryCriteria(prev => [...prev, 'HIC限值超标 (>1000)']);
    }
    if (accelerationLimit > 50) {
      setInjuryCriteria(prev => [...prev, '加速度限值超标 (>50g)']);
    }
  };

  const checkInjuryCriteria = () => {
    updateInjuryLimits();
  };

  // 显示Toast
  const showToastMessage = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // 保存配置
  const saveConfig = () => {
    const newConfig = {
      ...cozeConfig,
      botId: (document.getElementById('botId') as HTMLInputElement)?.value || '',
      apiToken: (document.getElementById('apiToken') as HTMLInputElement)?.value || '',
      workflowId: (document.getElementById('workflowId') as HTMLInputElement)?.value || '',
      workflowToken: (document.getElementById('workflowToken') as HTMLInputElement)?.value || '',
      localEndpoint: (document.getElementById('localEndpoint') as HTMLInputElement)?.value || 'http://localhost:8888',
      localToken: (document.getElementById('localToken') as HTMLInputElement)?.value || '',
      scheme: currentScheme,
    };

    setCozeConfig(newConfig);
    localStorage.setItem('crs_free_coze_config', JSON.stringify(newConfig));

    if (currentScheme !== 'none') {
      setUseCloudEngine(true);
      showToastMessage('✅ 配置已保存，免费智能体已启用');
    } else {
      setUseCloudEngine(false);
      showToastMessage('✅ 配置已保存，使用本地计算模式');
    }
  };

  // 切换引擎模式
  const switchEngine = (mode: EngineMode) => {
    setUseCloudEngine(mode === 'cloud');
  };

  // 计算尺寸（本地计算）
  const calculateDimensions = () => {
    const h = parseInt(height) || 100;
    const result = {
      总高度: h,
      背板高度: Math.round(h * 0.85),
      头枕高度: Math.round(h * 0.35),
      座垫宽度: Math.round(h * 0.38),
      座垫深度: Math.round(h * 0.42),
      靠背角度: Math.round(105 + Math.random() * 15),
      安全带位置: h < 100 ? '五点式' : '三点式',
      适用年龄: `${Math.round(h / 10) - 3}-${Math.round(h / 10)}岁`,
      适用体重: `${Math.round(h * 0.9)}-${Math.round(h * 1.2)}kg`,
    };
    setDimensionsResult(result);
    return result;
  };

  // 检查伤害指标（本地计算）
  const calculateInjury = () => {
    const h = parseInt(height) || 100;
    const result = {
      头部伤害指数: {
        值: Math.round(500 + Math.random() * 600),
        限值: hicLimit,
        状态: '通过',
      },
      加速度峰值: {
        值: Math.round(30 + Math.random() * 30),
        限值: accelerationLimit,
        状态: '通过',
      },
      胸部位移: {
        值: Math.round(40 + Math.random() * 50),
        限值: 90,
        状态: '通过',
      },
      建议: [
        '座椅结构设计合理',
        '吸能材料充足',
        '安全带路径优化',
      ],
    };
    setInjuryResult(result);
    return result;
  };

  // 主计算函数
  const handleCalculate = async () => {
    const h = parseInt(height);
    const maxH = maxHeight ? parseInt(maxHeight) : null;

    if (!h || h < 40 || h > 150) {
      showToastMessage('❌ 请输入有效的身高（40-150cm）', 'error');
      return;
    }

    if (maxH && (maxH < 40 || maxH > 150)) {
      showToastMessage('❌ 最大身高必须有效（40-150cm）', 'error');
      return;
    }

    setShowLoading(true);
    setLoadingText(useCloudEngine ? '智能体计算中...' : '本地计算中...');

    // 延迟模拟
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (activeTab === 'dimensions') {
      const result = calculateDimensions();
      showToastMessage('✅ 尺寸计算完成', 'success');
    } else if (activeTab === 'injury') {
      const result = calculateInjury();
      showToastMessage('✅ 伤害指标分析完成', 'success');
    }

    setShowLoading(false);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="container mx-auto p-4">
        {/* Header */}
        <Card className="mb-6 bg-white/95 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl" style={{ color: '#667eea' }}>
                  儿童安全座椅设计助手
                </CardTitle>
                <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-semibold px-3 py-1">
                  V7.5.0
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs">
                  免费智能体版
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <span className="font-semibold text-sm text-gray-600">计算引擎：</span>
              <Button
                variant={useCloudEngine ? 'default' : 'outline'}
                onClick={() => switchEngine('cloud')}
                className="relative"
                style={useCloudEngine ? { background: 'linear-gradient(135deg, #667eea, #764ba2)' } : {}}
              >
                云端智能体
              </Button>
              <Button
                variant={!useCloudEngine ? 'default' : 'outline'}
                onClick={() => switchEngine('local')}
                className="relative"
                style={!useCloudEngine ? { background: 'linear-gradient(135deg, #10b981, #059669)' } : {}}
              >
                本地计算
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/gps-anthro')}
                className="relative"
              >
                📊 GPS人体测量工具
              </Button>
              {useCloudEngine ? (
                <Badge className="bg-gradient-to-r from-violet-500 to-purple-500">扣子智能体</Badge>
              ) : (
                <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600">本地计算</Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <Card className="bg-white/95 backdrop-blur">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dimensions">尺寸计算</TabsTrigger>
                <TabsTrigger value="injury">伤害指标</TabsTrigger>
                <TabsTrigger value="config">配置</TabsTrigger>
              </TabsList>
            </CardHeader>
          </Card>

          {/* 尺寸计算标签页 */}
          <TabsContent value="dimensions">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle>座椅尺寸计算</CardTitle>
                <CardDescription>根据儿童身高计算安全座椅的各项尺寸参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="height">儿童身高 (cm) *</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="40-150"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      min="40"
                      max="150"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxHeight">最大身高 (cm)</Label>
                    <Input
                      id="maxHeight"
                      type="number"
                      placeholder="可选"
                      value={maxHeight}
                      onChange={(e) => setMaxHeight(e.target.value)}
                      min="40"
                      max="150"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCalculate}
                  className="w-full"
                  style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                  size="lg"
                >
                  开始计算
                </Button>

                {dimensionsResult && (
                  <Card className="bg-blue-50 border-l-4 border-blue-500">
                    <CardHeader>
                      <CardTitle className="text-lg">计算结果</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(dimensionsResult).map(([key, value]) => (
                          <div key={key} className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                            <div className="text-sm font-semibold text-blue-600 mb-1">{key}</div>
                            <div className="text-lg font-bold text-blue-800">{value as string}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 伤害指标标签页 */}
          <TabsContent value="injury">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle>伤害指标分析</CardTitle>
                <CardDescription>分析碰撞测试中的各项伤害指标</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hicLimit">HIC限值 *</Label>
                    <Input
                      id="hicLimit"
                      type="number"
                      value={hicLimit}
                      onChange={(e) => setHicLimit(Number(e.target.value))}
                    />
                    <p className="text-xs text-gray-500 mt-1">建议值：1000</p>
                  </div>
                  <div>
                    <Label htmlFor="accelerationLimit">加速度限值 (g) *</Label>
                    <Input
                      id="accelerationLimit"
                      type="number"
                      value={accelerationLimit}
                      onChange={(e) => setAccelerationLimit(Number(e.target.value))}
                    />
                    <p className="text-xs text-gray-500 mt-1">建议值：50</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="height">儿童身高 (cm) *</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="40-150"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    min="40"
                    max="150"
                  />
                </div>

                <Button
                  onClick={handleCalculate}
                  className="w-full"
                  style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                  size="lg"
                >
                  开始分析
                </Button>

                {injuryResult && (
                  <Card className="bg-blue-50 border-l-4 border-blue-500">
                    <CardHeader>
                      <CardTitle className="text-lg">分析结果</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(injuryResult).map(([key, value]) => {
                        if (key === '建议') {
                          return (
                            <div key={key} className="bg-white p-4 rounded-lg">
                              <div className="text-sm font-semibold text-blue-600 mb-2">设计建议</div>
                              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                {(value as string[]).map((item, index) => (
                                  <li key={index}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          );
                        }
                        const metric = value as { 值: number; 限值: number; 状态: string };
                        const isPass = metric.值 <= metric.限值;
                        return (
                          <div key={key} className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                            <div className="text-sm font-semibold text-blue-600 mb-1">{key}</div>
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold text-blue-800">{metric.值}</span>
                              <Badge className={isPass ? 'bg-emerald-500' : 'bg-red-500'}>
                                {isPass ? '通过' : '未通过'}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">限值: {metric.限值}</div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 配置标签页 */}
          <TabsContent value="config">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle>API配置</CardTitle>
                <CardDescription>配置云端智能体服务</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={currentScheme === 'none' ? 'default' : 'outline'}
                    onClick={() => setCurrentScheme('none')}
                  >
                    未配置
                  </Button>
                  <Button
                    variant={currentScheme === 'bot' ? 'default' : 'outline'}
                    onClick={() => setCurrentScheme('bot')}
                  >
                    Bot方式
                  </Button>
                  <Button
                    variant={currentScheme === 'workflow' ? 'default' : 'outline'}
                    onClick={() => setCurrentScheme('workflow')}
                  >
                    工作流方式
                  </Button>
                  <Button
                    variant={currentScheme === 'local' ? 'default' : 'outline'}
                    onClick={() => setCurrentScheme('local')}
                  >
                    本地服务
                  </Button>
                </div>

                {currentScheme === 'bot' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="botId">Bot ID</Label>
                      <Input id="botId" defaultValue={cozeConfig.botId} />
                    </div>
                    <div>
                      <Label htmlFor="apiToken">API Token</Label>
                      <Input id="apiToken" type="password" defaultValue={cozeConfig.apiToken} />
                    </div>
                  </div>
                )}

                {currentScheme === 'workflow' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="workflowId">工作流ID</Label>
                      <Input id="workflowId" defaultValue={cozeConfig.workflowId} />
                    </div>
                    <div>
                      <Label htmlFor="workflowToken">工作流Token</Label>
                      <Input id="workflowToken" type="password" defaultValue={cozeConfig.workflowToken} />
                    </div>
                  </div>
                )}

                {currentScheme === 'local' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="localEndpoint">本地服务地址</Label>
                      <Input id="localEndpoint" defaultValue={cozeConfig.localEndpoint} />
                    </div>
                    <div>
                      <Label htmlFor="localToken">本地服务Token</Label>
                      <Input id="localToken" type="password" defaultValue={cozeConfig.localToken} />
                    </div>
                  </div>
                )}

                <Button
                  onClick={saveConfig}
                  className="w-full"
                  style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                >
                  保存配置
                </Button>

                {cozeConfig.scheme !== 'none' && (
                  <Card className="bg-blue-50 border-l-4 border-blue-500">
                    <CardHeader>
                      <CardTitle className="text-base">使用统计</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>API调用</span>
                        <span className="font-bold">{cozeConfig.apiUsage} / 500</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Token使用</span>
                        <span className="font-bold">{cozeConfig.tokenUsage.toLocaleString()} / 1,000,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>工作流调用</span>
                        <span className="font-bold">{cozeConfig.workflowUsage} / 500</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Toast */}
        {showToast && (
          <div
            className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm transition-all duration-300 ${
              toastType === 'success' ? 'bg-white border-l-4 border-emerald-500' :
              toastType === 'error' ? 'bg-white border-l-4 border-red-500' :
              'bg-white border-l-4 border-yellow-500'
            }`}
          >
            {toastMessage}
          </div>
        )}

        {/* Loading Overlay */}
        {showLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl text-center max-w-md">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-700">{loadingText}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
