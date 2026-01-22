'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface ChildData {
  age: string;
  weight_5th: number;
  weight_mean: number;
  weight_95th: number;
  height_5th: number;
  height_mean: number;
  height_95th: number;
}

interface R129Data {
  stature: number;
  sitting_height: number;
  shoulder_breadth: number;
  hip_breadth: number;
  shoulder_height_min: number;
  shoulder_height_max: number;
  abdominal_depth_5th: number | string;
  abdominal_depth_95th: number;
  upper_leg_thickness_5th: number;
  upper_leg_thickness_95th: number;
}

interface DummyData {
  name: string;
  stature: number;
  seated_height: number;
  seated_shoulder: number;
  shoulder_width: number;
  mass: number;
  hip_width: number;
  pelvic_depth: number;
}

export default function GPSAnthroTool() {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [childData, setChildData] = useState<Record<string, ChildData[]>>({
    us_child_data: [],
    eu_child_data: [],
    china_child_data: [],
  });
  const [r129Data, setR129Data] = useState<R129Data[]>([]);
  const [dummiesData, setDummiesData] = useState<DummyData[]>([]);

  // 配置状态
  const [region, setRegion] = useState('us');
  const [show95th, setShow95th] = useState(true);
  const [showMean, setShowMean] = useState(true);
  const [show5th, setShow5th] = useState(true);

  // 座椅配置
  const [harnessSlots, setHarnessSlots] = useState(3);
  const [harnessLength, setHarnessLength] = useState(125);
  const [sidePadThickness, setSidePadThickness] = useState(2);
  const [seatPadThickness, setSeatPadThickness] = useState(2);
  const [backPadThickness, setBackPadThickness] = useState(2);

  // 搜索和筛选
  const [searchAge, setSearchAge] = useState('');
  const [selectedDummy, setSelectedDummy] = useState<DummyData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/data/gps-anthro-data.json');
      const data = await response.json();
      setChildData(data);
      setR129Data(data.r129_data || []);
      setDummiesData(data.dummies_data || []);
      setDataLoaded(true);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const getCurrentChildData = () => {
    const key = `${region}_child_data`;
    return childData[key] || [];
  };

  const calculateSeatDimensions = (height: number) => {
    const harnessSlotHeight = (height * 0.85) / harnessSlots;
    const seatWidth = height * 0.38;
    const seatDepth = height * 0.42;
    const backHeight = height * 0.85;
    const headrestHeight = height * 0.35;

    return {
      harnessSlotHeight: Math.round(harnessSlotHeight * 10) / 10,
      seatWidth: Math.round(seatWidth),
      seatDepth: Math.round(seatDepth),
      backHeight: Math.round(backHeight),
      headrestHeight: Math.round(headrestHeight),
    };
  };

  const checkR129Compliance = (stature: number, sittingHeight: number) => {
    const matched = r129Data.find(r => r.stature >= stature);
    if (!matched) return null;

    const compliance = {
      sitting_height: sittingHeight >= matched.sitting_height,
      shoulder_breadth: true, // 需要更多数据
      hip_breadth: true, // 需要更多数据
    };

    return {
      required: matched,
      compliance,
      isCompliant: Object.values(compliance).every(Boolean),
    };
  };

  const filteredChildData = getCurrentChildData().filter(child =>
    child.age.toLowerCase().includes(searchAge.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <Card className="bg-white/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl" style={{ color: '#667eea' }}>
              GPS人体测量工具 V7.5.0
            </CardTitle>
            <CardDescription>
              儿童安全座椅人体测量数据分析和尺寸计算工具
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="data-analysis" className="space-y-4">
          <Card className="bg-white/95 backdrop-blur">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="data-analysis">数据分析</TabsTrigger>
                <TabsTrigger value="seat-design">座椅设计</TabsTrigger>
                <TabsTrigger value="r129-compliance">R129法规</TabsTrigger>
                <TabsTrigger value="dummies">假人数据</TabsTrigger>
              </TabsList>
            </CardHeader>
          </Card>

          {/* 数据分析标签页 */}
          <TabsContent value="data-analysis">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle>儿童人体测量数据</CardTitle>
                <CardDescription>查询和分析不同地区儿童的身高体重数据</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="region">数据区域</Label>
                    <Select value={region} onValueChange={setRegion}>
                      <SelectTrigger id="region">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us">美国 (US)</SelectItem>
                        <SelectItem value="eu">欧洲 (EU)</SelectItem>
                        <SelectItem value="china">中国 (China)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="search">搜索年龄段</Label>
                    <Input
                      id="search"
                      placeholder="例如: 1 yr"
                      value={searchAge}
                      onChange={(e) => setSearchAge(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id="show5th"
                      checked={show5th}
                      onCheckedChange={(checked) => setShow5th(checked as boolean)}
                    />
                    <Label htmlFor="show5th">5th百分位</Label>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id="showMean"
                      checked={showMean}
                      onCheckedChange={(checked) => setShowMean(checked as boolean)}
                    />
                    <Label htmlFor="showMean">Mean平均值</Label>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id="show95th"
                      checked={show95th}
                      onCheckedChange={(checked) => setShow95th(checked as boolean)}
                    />
                    <Label htmlFor="show95th">95th百分位</Label>
                  </div>
                </div>

                {dataLoaded && filteredChildData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">年龄</th>
                          {show5th && <th className="text-right p-3">体重5th (kg)</th>}
                          {showMean && <th className="text-right p-3">体重Mean (kg)</th>}
                          {show95th && <th className="text-right p-3">体重95th (kg)</th>}
                          {show5th && <th className="text-right p-3">身高5th (cm)</th>}
                          {showMean && <th className="text-right p-3">身高Mean (cm)</th>}
                          {show95th && <th className="text-right p-3">身高95th (cm)</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredChildData.map((child, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{child.age}</td>
                            {show5th && (
                              <td className="text-right p-3">{child.weight_5th || '-'}</td>
                            )}
                            {showMean && (
                              <td className="text-right p-3 font-semibold">{child.weight_mean || '-'}</td>
                            )}
                            {show95th && (
                              <td className="text-right p-3">{child.weight_95th || '-'}</td>
                            )}
                            {show5th && (
                              <td className="text-right p-3">{child.height_5th || '-'}</td>
                            )}
                            {showMean && (
                              <td className="text-right p-3 font-semibold">{child.height_mean || '-'}</td>
                            )}
                            {show95th && (
                              <td className="text-right p-3">{child.height_95th || '-'}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    {dataLoaded ? '没有找到匹配的数据' : '加载数据中...'}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 座椅设计标签页 */}
          <TabsContent value="seat-design">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle>座椅尺寸计算器</CardTitle>
                <CardDescription>根据儿童身高计算座椅的关键尺寸</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="harnessSlots">安全带插槽数量</Label>
                    <Select
                      value={harnessSlots.toString()}
                      onValueChange={(value) => setHarnessSlots(parseInt(value))}
                    >
                      <SelectTrigger id="harnessSlots">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}个插槽
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="harnessLength">安全带长度 (cm)</Label>
                    <Input
                      id="harnessLength"
                      type="number"
                      value={harnessLength}
                      onChange={(e) => setHarnessLength(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sidePad">侧垫厚度 (cm)</Label>
                    <Input
                      id="sidePad"
                      type="number"
                      value={sidePadThickness}
                      onChange={(e) => setSidePadThickness(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="seatPad">座垫厚度 (cm)</Label>
                    <Input
                      id="seatPad"
                      type="number"
                      value={seatPadThickness}
                      onChange={(e) => setSeatPadThickness(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="backPad">靠背垫厚度 (cm)</Label>
                    <Input
                      id="backPad"
                      type="number"
                      value={backPadThickness}
                      onChange={(e) => setBackPadThickness(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <Label htmlFor="testHeight">测试身高 (cm)</Label>
                  <Input
                    id="testHeight"
                    type="number"
                    placeholder="输入儿童身高进行计算"
                    className="mt-2"
                  />
                </div>

                <Button
                  className="w-full"
                  style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                  onClick={() => {
                    const height = Number((document.getElementById('testHeight') as HTMLInputElement)?.value);
                    if (height) {
                      const dimensions = calculateSeatDimensions(height);
                      alert(`计算结果:\n插槽高度: ${dimensions.harnessSlotHeight}cm\n座椅宽度: ${dimensions.seatWidth}cm\n座椅深度: ${dimensions.seatDepth}cm\n靠背高度: ${dimensions.backHeight}cm\n头枕高度: ${dimensions.headrestHeight}cm`);
                    }
                  }}
                >
                  计算座椅尺寸
                </Button>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-900 mb-2">计算说明</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 插槽高度 = (身高 × 0.85) / 插槽数量</li>
                    <li>• 座椅宽度 ≈ 身高 × 0.38</li>
                    <li>• 座椅深度 ≈ 身高 × 0.42</li>
                    <li>• 靠背高度 ≈ 身高 × 0.85</li>
                    <li>• 头枕高度 ≈ 身高 × 0.35</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* R129法规标签页 */}
          <TabsContent value="r129-compliance">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle>R129法规适应性检查</CardTitle>
                <CardDescription>检查座椅设计是否符合ECE R129法规要求</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="r129Height">儿童身高 (cm)</Label>
                    <Input
                      id="r129Height"
                      type="number"
                      placeholder="40-150"
                    />
                  </div>
                  <div>
                    <Label htmlFor="r129Sitting">坐高 (cm)</Label>
                    <Input
                      id="r129Sitting"
                      type="number"
                      placeholder="例如: 50"
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                  onClick={() => {
                    const stature = Number((document.getElementById('r129Height') as HTMLInputElement)?.value);
                    const sitting = Number((document.getElementById('r129Sitting') as HTMLInputElement)?.value);
                    if (stature && sitting) {
                      const result = checkR129Compliance(stature, sitting);
                      if (result) {
                        alert(`R129法规检查结果:\n\n合规状态: ${result.isCompliant ? '✅ 通过' : '❌ 未通过'}\n\n要求坐高: ${result.required.sitting_height}cm\n实际坐高: ${sitting}cm\n\n${result.compliance.sitting_height ? '✅' : '❌'} 坐高要求符合`);
                      } else {
                        alert('未找到匹配的R129法规数据');
                      }
                    }
                  }}
                >
                  检查法规符合性
                </Button>

                <div className="mt-6">
                  <h4 className="font-semibold mb-4">R129法规数据参考</h4>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b">
                          <th className="text-left p-2">身高(cm)</th>
                          <th className="text-right p-2">最小坐高</th>
                          <th className="text-right p-2">肩宽95th</th>
                          <th className="text-right p-2">臀宽95th</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r129Data.slice(0, 15).map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{item.stature}</td>
                            <td className="text-right p-2">{item.sitting_height}</td>
                            <td className="text-right p-2">{item.shoulder_breadth}</td>
                            <td className="text-right p-2">{item.hip_breadth}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 假人数据标签页 */}
          <TabsContent value="dummies">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle>碰撞测试假人数据</CardTitle>
                <CardDescription>用于碰撞测试的ATD假人规格</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedDummy && (
                  <Card className="bg-green-50 border-l-4 border-green-500">
                    <CardHeader>
                      <CardTitle className="text-lg">已选择: {selectedDummy.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-semibold">身高:</span> {selectedDummy.stature}cm
                        </div>
                        <div>
                          <span className="font-semibold">坐高:</span> {selectedDummy.seated_height}cm
                        </div>
                        <div>
                          <span className="font-semibold">坐肩高:</span> {selectedDummy.seated_shoulder}cm
                        </div>
                        <div>
                          <span className="font-semibold">肩宽:</span> {selectedDummy.shoulder_width}cm
                        </div>
                        <div>
                          <span className="font-semibold">质量:</span> {selectedDummy.mass}kg
                        </div>
                        <div>
                          <span className="font-semibold">臀宽:</span> {selectedDummy.hip_width}cm
                        </div>
                        <div>
                          <span className="font-semibold">盆骨深度:</span> {selectedDummy.pelvic_depth}cm
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">假人名称</th>
                        <th className="text-right p-3">身高(cm)</th>
                        <th className="text-right p-3">坐高(cm)</th>
                        <th className="text-right p-3">坐肩高(cm)</th>
                        <th className="text-right p-3">肩宽(cm)</th>
                        <th className="text-right p-3">质量(kg)</th>
                        <th className="text-right p-3">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dummiesData.map((dummy, index) => (
                        <tr
                          key={index}
                          className="border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedDummy(dummy)}
                        >
                          <td className="p-3 font-medium">{dummy.name}</td>
                          <td className="text-right p-3">{dummy.stature}</td>
                          <td className="text-right p-3">{dummy.seated_height}</td>
                          <td className="text-right p-3">{dummy.seated_shoulder}</td>
                          <td className="text-right p-3">{dummy.shoulder_width}</td>
                          <td className="text-right p-3">{dummy.mass}</td>
                          <td className="text-right p-3">
                            <Button size="sm" variant="outline">
                              选择
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
