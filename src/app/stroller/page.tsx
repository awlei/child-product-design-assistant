'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StrollerData {
  standard_info: {
    name: string;
    description: string;
    version: string;
    effective_date: string;
  };
  test_dummies: Array<{
    name: string;
    stature: number;
    weight: number;
    age: string;
    position: string;
    harness_required: boolean;
    shoulder_width: number;
    hip_width: number;
    backrest_length: number;
  }>;
  stroller_types: Array<{
    type: string;
    name_cn: string;
    name_en: string;
    min_weight: number;
    max_weight: number;
    min_height: number;
    max_height: number;
    position: string;
    harness_type: string;
    recommended_dummy: string[];
  }>;
  safety_requirements: Array<{
    id: string;
    name_cn: string;
    name_en: string;
    description_cn: string;
    description_en: string;
  }>;
  dimension_requirements: Array<{
    name_cn: string;
    name_en: string;
    min_value?: number;
    max_value?: number;
    unit: string;
  }>;
  ergonomic_requirements: Array<{
    name_cn: string;
    name_en: string;
    description_cn: string;
    description_en: string;
  }>;
  safety_features: Array<{
    name_cn: string;
    name_en: string;
    importance: 'critical' | 'important' | 'recommended';
  }>;
}

export default function StrollerPage() {
  const [strollerData, setStrollerData] = useState<StrollerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDummy, setSelectedDummy] = useState<string>('');
  const [selectedStrollerType, setSelectedStrollerType] = useState<string>('');
  const [searchAge, setSearchAge] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/data/stroller-data.json');
      const data = await response.json();
      setStrollerData(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load stroller data:', error);
      setLoading(false);
    }
  };

  const getSelectedDummy = () => {
    if (!selectedDummy || !strollerData) return null;
    return strollerData.test_dummies.find(d => d.name === selectedDummy);
  };

  const getSelectedStrollerType = () => {
    if (!selectedStrollerType || !strollerData) return null;
    return strollerData.stroller_types.find(t => t.type === selectedStrollerType);
  };

  const filteredDummies = strollerData?.test_dummies.filter(d =>
    d.age.toLowerCase().includes(searchAge.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #E0F2F1 50%, #E3F2FD 100%)' }}>
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <Card className="bg-white/95 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl" style={{ color: '#667eea' }}>
                  婴儿推车设计工具 V1.0.0
                </CardTitle>
                <CardDescription>
                  GPS R016 & EN 1888-2012 标准推车设计参考
                </CardDescription>
              </div>
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                推车专用
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="standards" className="space-y-4">
          <Card className="bg-white/95 backdrop-blur">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="standards">标准规范</TabsTrigger>
                <TabsTrigger value="dummies">测试假人</TabsTrigger>
                <TabsTrigger value="types">推车类型</TabsTrigger>
                <TabsTrigger value="safety">安全要求</TabsTrigger>
              </TabsList>
            </CardHeader>
          </Card>

          {/* 标准规范标签页 */}
          <TabsContent value="standards">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle>适用标准</CardTitle>
                <CardDescription>推车安全标准详细信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {strollerData && (
                  <div className="space-y-4">
                    <div>
                      <Label>标准名称</Label>
                      <p className="text-lg font-semibold">{strollerData.standard_info.name}</p>
                    </div>
                    <div>
                      <Label>描述</Label>
                      <p>{strollerData.standard_info.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>版本</Label>
                        <p className="font-medium">{strollerData.standard_info.version}</p>
                      </div>
                      <div>
                        <Label>生效日期</Label>
                        <p className="font-medium">{strollerData.standard_info.effective_date}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 测试假人标签页 */}
          <TabsContent value="dummies">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle>测试假人</CardTitle>
                <CardDescription>用于推车测试的标准假人规格</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dummy-select">选择假人</Label>
                    <Select value={selectedDummy} onValueChange={setSelectedDummy}>
                      <SelectTrigger id="dummy-select">
                        <SelectValue placeholder="选择测试假人" />
                      </SelectTrigger>
                      <SelectContent>
                        {strollerData?.test_dummies.map((dummy) => (
                          <SelectItem key={dummy.name} value={dummy.name}>
                            {dummy.name} ({dummy.age})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="search-age">搜索年龄</Label>
                    <Input
                      id="search-age"
                      placeholder="例如: 18 months"
                      value={searchAge}
                      onChange={(e) => setSearchAge(e.target.value)}
                    />
                  </div>
                </div>

                {selectedDummy && getSelectedDummy() && (
                  <Card className="bg-purple-50 border-2 border-purple-200">
                    <CardHeader>
                      <CardTitle className="text-lg">{getSelectedDummy()!.name}</CardTitle>
                      <CardDescription>年龄: {getSelectedDummy()!.age}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                          <Label>身高 (cm)</Label>
                          <p className="text-lg font-semibold">{getSelectedDummy()!.stature}</p>
                        </div>
                        <div>
                          <Label>体重 (kg)</Label>
                          <p className="text-lg font-semibold">{getSelectedDummy()!.weight}</p>
                        </div>
                        <div>
                          <Label>肩宽 (cm)</Label>
                          <p className="text-lg font-semibold">{getSelectedDummy()!.shoulder_width}</p>
                        </div>
                        <div>
                          <Label>髋宽 (cm)</Label>
                          <p className="text-lg font-semibold">{getSelectedDummy()!.hip_width}</p>
                        </div>
                        <div>
                          <Label>靠背长度 (cm)</Label>
                          <p className="text-lg font-semibold">{getSelectedDummy()!.backrest_length}</p>
                        </div>
                        <div>
                          <Label>体位</Label>
                          <p className="text-lg font-semibold">{getSelectedDummy()!.position}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Badge variant={getSelectedDummy()!.harness_required ? 'default' : 'secondary'}>
                          {getSelectedDummy()!.harness_required ? '需要安全带' : '无需安全带'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  <h3 className="font-semibold">所有假人列表</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {filteredDummies.map((dummy) => (
                      <Card
                        key={dummy.name}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedDummy(dummy.name)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{dummy.name}</span>
                            <span className="text-sm text-gray-600">{dummy.age}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {dummy.stature}cm / {dummy.weight}kg
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 推车类型标签页 */}
          <TabsContent value="types">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle>推车类型</CardTitle>
                <CardDescription>不同类型推车的适用范围和规格</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type-select">选择推车类型</Label>
                    <Select value={selectedStrollerType} onValueChange={setSelectedStrollerType}>
                      <SelectTrigger id="type-select">
                        <SelectValue placeholder="选择推车类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {strollerData?.stroller_types.map((type) => (
                          <SelectItem key={type.type} value={type.type}>
                            {type.name_cn} / {type.name_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedStrollerType && getSelectedStrollerType() && (
                  <Card className="bg-purple-50 border-2 border-purple-200">
                    <CardHeader>
                      <CardTitle className="text-lg">{getSelectedStrollerType()!.name_cn}</CardTitle>
                      <CardDescription>{getSelectedStrollerType()!.name_en}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>适用体重</Label>
                          <p className="font-semibold">
                            {getSelectedStrollerType()!.min_weight} - {getSelectedStrollerType()!.max_weight} kg
                          </p>
                        </div>
                        <div>
                          <Label>适用身高</Label>
                          <p className="font-semibold">
                            {getSelectedStrollerType()!.min_height} - {getSelectedStrollerType()!.max_height} cm
                          </p>
                        </div>
                        <div>
                          <Label>体位要求</Label>
                          <p className="font-semibold">{getSelectedStrollerType()!.position}</p>
                        </div>
                        <div>
                          <Label>安全带类型</Label>
                          <p className="font-semibold">{getSelectedStrollerType()!.harness_type}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label>推荐测试假人</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {getSelectedStrollerType()!.recommended_dummy.map((dummy) => (
                            <Badge key={dummy} variant="secondary">
                              {dummy}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {strollerData?.stroller_types.map((type) => (
                    <Card
                      key={type.type}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedStrollerType(type.type)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{type.name_cn}</CardTitle>
                        <CardDescription>{type.name_en}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1 text-sm">
                          <div>体重: {type.min_weight}-{type.max_weight}kg</div>
                          <div>身高: {type.min_height}-{type.max_height}cm</div>
                          <div>体位: {type.position}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 安全要求标签页 */}
          <TabsContent value="safety">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle>安全要求</CardTitle>
                <CardDescription>推车安全测试要求和安全特性</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">安全测试要求</h3>
                  <div className="space-y-2">
                    {strollerData?.safety_requirements.map((req) => (
                      <Card key={req.id} className="border-l-4 border-purple-500">
                        <CardContent className="p-4">
                          <div className="font-semibold">{req.name_cn} / {req.name_en}</div>
                          <p className="text-sm text-gray-600 mt-1">{req.description_cn}</p>
                          <p className="text-sm text-gray-500 mt-1 italic">{req.description_en}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">安全特性</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {strollerData?.safety_features.map((feature, idx) => (
                      <Card
                        key={idx}
                        className={`border-l-4 ${
                          feature.importance === 'critical' ? 'border-red-500' :
                          feature.importance === 'important' ? 'border-amber-500' :
                          'border-blue-500'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-semibold">{feature.name_cn}</div>
                              <div className="text-sm text-gray-600">{feature.name_en}</div>
                            </div>
                            <Badge
                              variant={
                                feature.importance === 'critical' ? 'destructive' :
                                feature.importance === 'important' ? 'default' :
                                'secondary'
                              }
                            >
                              {feature.importance === 'critical' ? '必需' :
                               feature.importance === 'important' ? '重要' : '推荐'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
