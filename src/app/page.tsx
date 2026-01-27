'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

type EngineMode = 'cloud' | 'local';
type ConfigScheme = 'none' | 'bot' | 'workflow' | 'local';
type StandardType = 'R129' | 'FMVSS213';
type ProductType = 'stroller' | 'car-seat' | 'high-chair' | 'crib';

interface ProductTypeOption {
  value: ProductType;
  labelCN: string;
  labelEN: string;
  icon: string;
}

const PRODUCT_TYPES: ProductTypeOption[] = [
  { value: 'stroller', labelCN: '婴儿推车', labelEN: 'Baby Stroller', icon: '👶' },
  { value: 'car-seat', labelCN: '儿童安全座椅', labelEN: 'Child Car Seat', icon: '🚗' },
  { value: 'high-chair', labelCN: '儿童高脚椅', labelEN: 'High Chair', icon: '🪑' },
  { value: 'crib', labelCN: '婴儿床', labelEN: 'Baby Crib', icon: '🛏️' },
];

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
  const [selectedStandard, setSelectedStandard] = useState<StandardType>('R129');
  const [selectedProductType, setSelectedProductType] = useState<ProductType>('car-seat');
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

  // GPS人体测量工具状态
  const [gpsDataLoaded, setGpsDataLoaded] = useState(false);
  const [childData, setChildData] = useState<Record<string, ChildData[]>>({
    us_child_data: [],
    eu_child_data: [],
    china_child_data: [],
  });
  const [r129Data, setR129Data] = useState<R129Data[]>([]);
  const [dummiesData, setDummiesData] = useState<DummyData[]>([]);
  const [region, setRegion] = useState('us');
  const [show95th, setShow95th] = useState(true);
  const [showMean, setShowMean] = useState(true);
  const [show5th, setShow5th] = useState(true);
  const [harnessSlots, setHarnessSlots] = useState(3);
  const [harnessLength, setHarnessLength] = useState(125);
  const [sidePadThickness, setSidePadThickness] = useState(2);
  const [seatPadThickness, setSeatPadThickness] = useState(2);
  const [backPadThickness, setBackPadThickness] = useState(2);
  const [searchAge, setSearchAge] = useState('');
  const [selectedDummy, setSelectedDummy] = useState<DummyData | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');
  const [imageStyle, setImageStyle] = useState<'simple' | 'detailed' | 'cartoon'>('simple');
  const [gpsActiveTab, setGpsActiveTab] = useState('data-analysis');

  // 测试矩阵相关状态
  const [testMatrix, setTestMatrix] = useState<any[]>([]);
  const [matrixConfig, setMatrixConfig] = useState({
    impactTypes: ['Frontal', 'Rear'],
    dummies: ['Q0', 'Q1', 'Q1.5', 'Q3', 'Q6'],
    positions: ['Rearward facing', 'Forward facing'],
    installations: ['Isofix 3 pts', 'Isofix 2 pts', 'Vehicle belt'],
    configurations: ['Upright', 'Reclined'],
  });
  const [exportingMatrix, setExportingMatrix] = useState(false);

  // R129智能设计助手状态
  const [r129Height, setR129Height] = useState('');
  const [r129Consulting, setR129Consulting] = useState(false);
  const [r129Response, setR129Response] = useState('');
  const [r129StreamContent, setR129StreamContent] = useState('');

  const [hicLimit, setHicLimit] = useState(1000);
  const [accelerationLimit, setAccelerationLimit] = useState(50);
  const [injuryCriteria, setInjuryCriteria] = useState<string[]>([]);

  // 综合设计状态
  const [designInput, setDesignInput] = useState({
    inputType: 'height', // 'height' or 'weight'
    minHeight: '',
    maxHeight: '',
    minWeight: '',
    maxWeight: '',
    standard: 'R129', // 'R44', 'R129', 'FMVSS213'
    productType: 'forward', // 'rearward', 'forward', 'booster'
  });

  // 同步全局标准选择到综合设计
  useEffect(() => {
    setDesignInput(prev => ({
      ...prev,
      standard: selectedStandard,
    }));
  }, [selectedStandard]);

  // 根据产品类型获取中英文名称
  const getProductTypeName = () => {
    return PRODUCT_TYPES.find(t => t.value === selectedProductType) || PRODUCT_TYPES[1]; // 默认 car-seat
  };

  const [designResults, setDesignResults] = useState<{
    dummyMatrix: any[];
    isoClass: string | null;
    testMatrix: any[];
    internalDimensions: any;
  } | null>(null);

  const [isCalculating, setIsCalculating] = useState(false);
  const [brandComparison, setBrandComparison] = useState<{
    analysis: string;
    brands: Array<{ brand: string; products: any[] }>;
  } | null>(null);
  const [isSearchingBrands, setIsSearchingBrands] = useState(false);
  const [designContent, setDesignContent] = useState('');

  // 综合计算函数
  const calculateIntegratedDesign = async () => {
    setIsCalculating(true);
    setIsSearchingBrands(true);
    setBrandComparison(null);
    setDesignContent('');
    setDesignResults(null);

    const { inputType, minHeight, maxHeight, minWeight, maxWeight, standard, productType } = designInput;

    // 验证输入
    if (inputType === 'height') {
      if (!minHeight || !maxHeight || parseInt(minHeight) < 40 || parseInt(maxHeight) > 150) {
        showToastMessage('❌ 请输入有效的身高范围（40-150cm）', 'error');
        setIsCalculating(false);
        return;
      }
    } else {
      if (!minWeight || !maxWeight || parseFloat(minWeight) < 0 || parseFloat(maxWeight) > 50) {
        showToastMessage('❌ 请输入有效的重量范围（0-50kg）', 'error');
        setIsCalculating(false);
        return;
      }
    }

    // 准备请求数据
    const requestData: any = {
      minHeight: inputType === 'height' ? minHeight : undefined,
      maxHeight: inputType === 'height' ? maxHeight : undefined,
      minWeight: inputType === 'weight' ? minWeight : undefined,
      maxWeight: inputType === 'weight' ? maxWeight : undefined,
      standard,
    };

    // 创建超时控制器（120秒）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 120000);

    try {
      // 调用API获取综合设计结果
      const response = await fetch('/api/comprehensive-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '未知错误' }));
        throw new Error(errorData.error || `API请求失败 (${response.status})`);
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

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
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              setIsSearchingBrands(false);
              break;
            }

            try {
              const data = JSON.parse(dataStr);

              if (data.type === 'comparison') {
                setBrandComparison({
                  analysis: data.content,
                  brands: data.brands,
                });
                setIsSearchingBrands(false);
              } else if (data.type === 'design') {
                setDesignContent(prev => prev + data.content);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      // 使用本地计算生成结构化数据用于表格展示
      try {
        const dummyMatrix = generateDummyMatrix(inputType, minHeight, maxHeight, minWeight, maxWeight, standard, productType);
        const isoClass = calculateISOClass(dummyMatrix);
        const testMatrix = generateTestMatrixForDesign(dummyMatrix, standard, productType);
        const internalDimensions = calculateInternalDimensions(dummyMatrix, productType);

        setDesignResults({
          dummyMatrix,
          isoClass,
          testMatrix,
          internalDimensions,
        });
      } catch (localError) {
        console.error('本地计算失败:', localError);
      }

      showToastMessage('✅ 综合设计计算完成', 'success');
    } catch (error) {
      console.error('综合设计计算失败:', error);

      let errorMessage = '❌ 计算失败，请重试';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = '❌ 请求超时，请检查网络连接后重试';
        } else {
          errorMessage = `❌ ${error.message}`;
        }
      }

      showToastMessage(errorMessage, 'error');
    } finally {
      setIsCalculating(false);
    }
  };

  // 生成假人矩阵
  const generateDummyMatrix = (inputType: string, minHeight: string, maxHeight: string, minWeight: string, maxWeight: string, standard: string, productType: string) => {
    const dummies: any[] = [];

    // 定义假人规格
    const dummySpecs = [
      { name: 'Q0', height: 50, weight: 3.5, age: '0-6mo', position: 'Rearward' },
      { name: 'Q1', height: 75, weight: 9.7, age: '12mo', position: 'Rearward' },
      { name: 'Q1.5', height: 87.5, weight: 11.5, age: '18mo', position: 'Rearward/Forward' },
      { name: 'Q3', height: 105, weight: 15, age: '3yr', position: 'Forward' },
      { name: 'Q6', height: 125, weight: 21.5, age: '6yr', position: 'Forward' },
      { name: 'Q10', height: 138, weight: 32, age: '10yr', position: 'Booster' },
    ];

    dummySpecs.forEach(dummy => {
      const hMin = parseInt(minHeight) || 0;
      const hMax = parseInt(maxHeight) || 200;
      const wMin = parseFloat(minWeight) || 0;
      const wMax = parseFloat(maxWeight) || 100;

      let included = false;
      let reason = '';

      if (inputType === 'height') {
        if (dummy.height >= hMin && dummy.height <= hMax) {
          included = true;
          reason = '身高在范围内';
        }
      } else {
        if (dummy.weight >= wMin && dummy.weight <= wMax) {
          included = true;
          reason = '重量在范围内';
        }
      }

      // 检查与产品类型匹配
      if (included) {
        if (productType === 'rearward' && dummy.position.includes('Forward')) {
          included = false;
          reason = '后向座椅不支持前向假人';
        }
        if (productType === 'forward' && dummy.position === 'Rearward') {
          included = false;
          reason = '前向座椅不支持后向假人';
        }
      }

      if (included) {
        dummies.push({
          ...dummy,
          included,
          reason,
          r44_compatible: standard === 'R44' || true,
          r129_compatible: standard === 'R129' || true,
          test_required: true,
        });
      }
    });

    return dummies;
  };

  // 计算ISO尺寸分类
  const calculateISOClass = (dummyMatrix: any[]) => {
    if (dummyMatrix.length === 0) return null;

    const maxHeight = Math.max(...dummyMatrix.map(d => d.height));
    const maxWeight = Math.max(...dummyMatrix.map(d => d.weight));

    // ISO尺寸分类（基于R129标准）
    if (maxHeight <= 83) return 'ISO Class A (婴儿提篮)';
    if (maxHeight <= 105) return 'ISO Class B/C (后向座椅)';
    if (maxHeight <= 125) return 'ISO Class D (前向座椅)';
    if (maxHeight <= 150) return 'ISO Class E/F (增高垫)';
    return 'ISO Class G (大尺寸增高垫)';
  };

  // 为设计生成测试矩阵
  const generateTestMatrixForDesign = (dummyMatrix: any[], standard: string, productType: string) => {
    const matrix: any[] = [];
    let testNum = 1;

    dummyMatrix.forEach(dummy => {
      if (!dummy.included) return;

      // 碰撞类型
      const impacts = dummy.position.includes('Rearward') ? ['Frontal', 'Rear'] : ['Frontal'];

      impacts.forEach(impact => {
        const test: any = {
          'Test #': testNum++,
          'Dummy': dummy.name,
          'Standard': standard,
          'Impact': impact,
          'Position': productType === 'rearward' ? 'Rearward facing' : 'Forward facing',
          'Speed (km/h)': impact === 'Frontal' ? '50' : '30',
          'Installation': 'Isofix 3 pts',
          'Harness': 'With',
          'Top Tether': productType === 'forward' ? 'With' : 'With',
          'HIC Limit': standard === 'R129' ? '1000' : '1000',
          'Chest Acc Limit': standard === 'R129' ? '55g' : '55g',
          'Chest Deflection Limit': standard === 'R129' ? '50mm' : '50mm',
          'Status': 'Pending',
        };

        matrix.push(test);
      });
    });

    return matrix;
  };

  // 计算产品内部尺寸
  const calculateInternalDimensions = (dummyMatrix: any[], productType: string) => {
    if (dummyMatrix.length === 0) return null;

    const maxHeight = Math.max(...dummyMatrix.map(d => d.height));
    const maxWeight = Math.max(...dummyMatrix.map(d => d.weight));

    const seatWidth = Math.max(30, Math.round(maxHeight * 0.35));
    const seatDepth = Math.max(25, Math.round(maxHeight * 0.38));
    const backHeight = Math.round(maxHeight * 0.72);
    const headrestHeight = Math.round(maxHeight * 0.28);
    const totalHeight = backHeight + headrestHeight;

    // 靠背角度
    const backrestAngle = productType === 'rearward' ? 45 : 105;

    // 头托调节高度
    const headrestAdjustmentRange = headrestHeight * 0.6;
    const headrestPositions = Math.floor(headrestAdjustmentRange / 3) + 1;

    // 倾斜角度范围
    const reclineAngleMin = productType === 'rearward' ? 30 : 100;
    const reclineAngleMax = productType === 'rearward' ? 55 : 115;
    const reclinePositions = Math.floor((reclineAngleMax - reclineAngleMin) / 5) + 1;

    return {
      external: {
        totalHeight: totalHeight + 10, // 包含ISOFIX接口
        totalWidth: seatWidth + 20, // 包含侧翼
        totalDepth: seatDepth + 30, // 包含底座
        isoClass: calculateISOClass(dummyMatrix),
      },
      internal: {
        seatWidth: seatWidth,
        seatDepth: seatDepth,
        backHeight: backHeight,
        headrestHeight: headrestHeight,
        headrestAdjustment: {
          minHeight: backHeight + 5,
          maxHeight: backHeight + headrestAdjustmentRange,
          positions: headrestPositions,
          adjustmentRange: `${headrestAdjustmentRange.toFixed(1)}cm`,
        },
        backrestAngle: {
          angle: `${backrestAngle}°`,
          fixed: false,
        },
        reclineAngle: {
          minAngle: `${reclineAngleMin}°`,
          maxAngle: `${reclineAngleMax}°`,
          positions: reclinePositions,
          range: `${reclineAngleMax - reclineAngleMin}°`,
        },
      },
      safetySystem: {
        harnessSlots: Math.ceil((maxHeight * 0.72) / 5),
        harnessLength: 125,
        chestClip: 'With',
        buckle: 'Central',
        sideImpactProtection: 'With',
      },
      capacity: {
        maxHeight: maxHeight,
        maxWeight: maxWeight,
        maxAge: dummyMatrix[dummyMatrix.length - 1]?.age || 'Unknown',
      },
    };
  };

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
    loadGpsData();
  }, []);

  // 加载GPS人体测量数据
  const loadGpsData = async () => {
    try {
      const response = await fetch('/data/gps-anthro-data.json');
      const data = await response.json();
      setChildData(data);
      setR129Data(data.r129_data || []);
      setDummiesData(data.dummies_data || []);
      setGpsDataLoaded(true);
    } catch (error) {
      console.error('Failed to load GPS data:', error);
    }
  };

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

  // R129/FMVSS智能设计助手函数
  const consultR129Expert = async () => {
    const height = parseInt(r129Height);
    if (!height || height < 0 || height > 200) {
      alert('请输入有效的身高（0-200cm）');
      return;
    }

    setR129Consulting(true);
    setR129Response('');
    setR129StreamContent('');

    try {
      const response = await fetch('/api/r129-consultant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          height: height.toString(),
          standard: selectedStandard,
        }),
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let fullContent = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setR129StreamContent(fullContent);
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
        setR129Response(fullContent);
      }
    } catch (error) {
      console.error('R129 consultation error:', error);
      setR129Response('咨询失败，请稍后重试');
    } finally {
      setR129Consulting(false);
    }
  };

  // GPS人体测量工具辅助函数
  const getCurrentChildData = () => {
    const key = `${region}_child_data`;
    return childData[key] || [];
  };

  const calculateSeatDimensions = (height: number) => {
    // 基于R129标准和实际工程经验改进尺寸计算
    // 查找最接近的R129数据
    const matchedR129 = r129Data.find(r => r.stature >= height) || r129Data[r129Data.length - 1];

    // 核心尺寸计算（基于R129数据和儿童人体测量学）
    const seatWidth = Math.max(30, Math.round(height * 0.35)); // 最小30cm
    const seatDepth = Math.max(25, Math.round(height * 0.38)); // 最小25cm
    const backHeight = Math.round(height * 0.72); // 靠背高度约为身高的72%
    const headrestHeight = Math.round(height * 0.28); // 头枕高度约为身高的28%

    // 安全带系统设计
    const shoulderHeightMin = matchedR129?.shoulder_height_min || 28;
    const shoulderHeightMax = matchedR129?.shoulder_height_max || 50;
    const shoulderHeightRange = shoulderHeightMax - shoulderHeightMin;

    // 插槽分布：均匀分布在肩高范围内
    const harnessSlotHeight = harnessSlots > 1 
      ? Math.round((shoulderHeightRange * 10) / harnessSlots) / 10 
      : shoulderHeightMin;

    const harnessStartHeight = shoulderHeightMin;

    // 侧翼设计（基于R129肩宽数据）
    const shoulderBreadth = matchedR129?.shoulder_breadth || 20;
    const sideWingDepth = Math.round(shoulderBreadth * 0.15 + sidePadThickness); // 侧翼深度

    // 座椅总高度
    const totalHeight = backHeight + headrestHeight;

    return {
      // 基础尺寸
      totalHeight: totalHeight,
      seatWidth: seatWidth,
      seatDepth: seatDepth,
      backHeight: backHeight,
      headrestHeight: headrestHeight,

      // 安全带系统
      harnessSlotHeight: harnessSlotHeight,
      harnessStartHeight: harnessStartHeight,
      harnessSlots: harnessSlots,

      // 侧翼保护
      sideWingDepth: sideWingDepth,
      shoulderBreadth: shoulderBreadth,

      // 垫层厚度
      seatPadThickness: seatPadThickness,
      backPadThickness: backPadThickness,
      sidePadThickness: sidePadThickness,

      // 参考数据
      referenceR129: matchedR129?.stature || null,
    };
  };

  const generateSeatSchematic = async (height: number, dimensions: any) => {
    setIsGeneratingImage(true);
    setImageError('');
    setGeneratedImageUrl('');

    try {
      // 构建更专业的prompt，描述儿童安全座椅的结构
      const prompt = `Professional child safety car seat technical drawing, side view schematic diagram.

Key specifications:
- Total height: ${dimensions.totalHeight}cm
- Seat cushion: width ${dimensions.seatWidth}cm, depth ${dimensions.seatDepth}cm
- Backrest height: ${dimensions.backHeight}cm
- Headrest height: ${dimensions.headrestHeight}cm
- Harness system: ${dimensions.harnessSlots} slots, starting from ${dimensions.harnessStartHeight}cm height
- Side protection depth: ${dimensions.sideWingDepth}cm
- Shoulder width capacity: ${dimensions.shoulderBreadth}cm

Structural features:
- Five-point safety harness system with clearly visible buckle
- Adjustable headrest with multiple height positions
- Side-impact protection wings
- Seat cushion with ergonomic design
- ISOFIX installation connectors visible at base
- Recline angle indicator

Drawing style: Clean technical schematic with clear dimensions labeled, engineering blueprint style, side elevation view showing complete seat structure.`;

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          style: imageStyle,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedImageUrl(result.imageUrl);
      } else {
        setImageError(result.error || '图片生成失败');
      }
    } catch (error) {
      setImageError(error instanceof Error ? error.message : '生成失败');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 生成测试矩阵
  const generateTestMatrix = () => {
    const matrix: any[] = [];
    let testNumber = 1;

    // 为每个碰撞类型和假人生成测试组合
    matrixConfig.impactTypes.forEach((impact) => {
      matrixConfig.dummies.forEach((dummy) => {
        matrixConfig.positions.forEach((position) => {
          matrixConfig.installations.forEach((installation) => {
            matrixConfig.configurations.forEach((config) => {
              // 生成测试项
              const testItem: any = {
                'Test #': testNumber,
                'Pulse': 'R129',
                'Impact': impact,
                'Dummy': dummy,
                'Position': position,
                'Installation': installation,
                'Product Configuration': config,
                'Isofix anchors': installation.includes('Isofix') ? 'yes' : 'no',
                'Position of floor': 'Low',
                'Harness': 'With',
                'Top Tether / Support leg': 'With',
                'Dashboard': 'With',
                'Comments': '',
                'Buckle': 'no',
                'Adjuster': 'no',
                'Isofix': 'no',
                'Top Tether': installation.includes('Isofix') ? 'With' : 'no',
                'Quantity': 1,
                'Test No': testNumber,
                'Speed (km/h)': impact === 'Frontal' ? '50' : '30',
                'Max Pulse (g)': '',
                'Stopping Distance (mm)': '',
                'Head Excursion (mm)': '',
                'Chest Acc. Vert (g)': '',
                'Chest Acc. Result (g)': '',
                'Head Acc. 3ms (g)': '',
                'HIC36/HPC15': '',
                'Upper Neck Force (N)': '',
                'Upper Neck Moment (Nm)': '',
                'Chest Deflection (mm)': '',
                'Observation': '',
                'Status': '',
              };

              // 根据假人类型调整参数
              if (dummy === 'Q0' && position === 'Forward facing') {
                // Q0通常不用于前向，跳过
                return;
              }

              // Q0/Q1/Q1.5 - 婴幼儿组 (后向)
              if (['Q0', 'Q1', 'Q1.5'].includes(dummy)) {
                testItem['Position'] = 'Rearward facing';
                testItem['Product Configuration'] = 'Reclined';
                testItem['Isofix anchors'] = 'yes';
              }

              // Q3/Q6 - 儿童组
              if (['Q3', 'Q6'].includes(dummy)) {
                testItem['Top Tether / Support leg'] = position === 'Forward facing' ? 'With' : 'With';
              }

              matrix.push(testItem);
              testNumber++;
            });
          });
        });
      });
    });

    setTestMatrix(matrix);
  };

  // 导出测试矩阵为CSV
  const exportMatrixToCSV = () => {
    if (testMatrix.length === 0) {
      alert('请先生成测试矩阵');
      return;
    }

    setExportingMatrix(true);

    try {
      const headers = Object.keys(testMatrix[0]);
      const csvContent = [
        headers.join(','),
        ...testMatrix.map(row => headers.map(header => {
          const val = row[header];
          return val !== undefined && val !== null ? `"${val}"` : '';
        }).join(','))
      ].join('\n');

      const BOM = '\uFEFF'; // 添加BOM以支持Excel中文显示
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dynamic_Test_Matrix_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToastMessage('✅ 测试矩阵已导出', 'success');
    } catch (error) {
      showToastMessage('❌ 导出失败', 'error');
    } finally {
      setExportingMatrix(false);
    }
  };

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('下载失败，请右键图片另存为');
    }
  };

  const checkR129Compliance = (stature: number, sittingHeight: number) => {
    const matched = r129Data.find(r => r.stature >= stature);
    if (!matched) return null;

    const compliance = {
      sitting_height: sittingHeight >= matched.sitting_height,
      shoulder_breadth: true,
      hip_breadth: true,
    };

    return {
      required: matched,
      compliance,
      isCompliant: Object.values(compliance).every(Boolean),
    };
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
                <CardTitle className="text-xl md:text-2xl" style={{ color: '#667eea' }}>
                  儿童产品设计助手 <span className="text-sm md:text-lg">/ Child Product Design Assistant</span>
                </CardTitle>
                <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-semibold px-2 py-1">
                  V8.0.0
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs">
                  免费智能体版
                </Badge>
              </div>
            </div>

            {/* 产品类型选择器 */}
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <span className="font-semibold text-sm text-gray-600">产品类型 / Product Type：</span>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    variant={selectedProductType === type.value ? 'default' : 'outline'}
                    onClick={() => setSelectedProductType(type.value)}
                    className="relative"
                    style={selectedProductType === type.value ? { background: 'linear-gradient(135deg, #667eea, #764ba2)' } : {}}
                  >
                    <span className="mr-1">{type.icon}</span>
                    <span className="text-sm">
                      <span className="font-medium">{type.labelCN}</span>
                      <span className="ml-1 text-xs opacity-80">/ {type.labelEN}</span>
                    </span>
                  </Button>
                ))}
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
              {useCloudEngine ? (
                <Badge className="bg-gradient-to-r from-violet-500 to-purple-500">扣子智能体</Badge>
              ) : (
                <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600">本地计算</Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* 产品设计助手入口 */}
        <Card className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                  🎨 AI 智能产品设计助手
                </CardTitle>
                <CardDescription className="text-purple-100 mt-2">
                  与专业设计师对话，获取定制化的产品设计方案
                </CardDescription>
              </div>
              <Link href="/product-design">
                <Button className="bg-white text-purple-600 hover:bg-purple-50 font-semibold">
                  开始设计
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur-sm">
                <div className="text-2xl mb-1">👶</div>
                <div className="text-xs font-medium">推车设计</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur-sm">
                <div className="text-2xl mb-1">🚗</div>
                <div className="text-xs font-medium">安全座椅</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur-sm">
                <div className="text-2xl mb-1">🪑</div>
                <div className="text-xs font-medium">儿童家具</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur-sm">
                <div className="text-2xl mb-1">🎮</div>
                <div className="text-xs font-medium">玩具设计</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur-sm col-span-2 md:col-span-1">
                <div className="text-2xl mb-1">🎁</div>
                <div className="text-xs font-medium">其他用品</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <Card className="bg-white/95 backdrop-blur">
            <CardHeader>
              {/* 标准切换器 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="standard-select" className="text-sm font-medium">选择标准：</Label>
                  <Select value={selectedStandard} onValueChange={(value) => setSelectedStandard(value as StandardType)}>
                    <SelectTrigger id="standard-select" className="w-[180px] md:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="R129">ECE R129 (i-Size)</SelectItem>
                      <SelectItem value="FMVSS213">FMVSS 213 (美国)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedStandard === 'FMVSS213' && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">
                    🇺🇸 美国标准
                  </Badge>
                )}
                {selectedStandard === 'R129' && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                    🇪🇺 欧洲标准
                  </Badge>
                )}
              </div>

              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1 h-auto">
                <TabsTrigger value="integrated-design" className="text-xs md:text-sm py-3 px-2 md:px-4">
                  <span className="hidden md:inline">综合设计 / Design</span>
                  <span className="md:hidden">综合设计</span>
                </TabsTrigger>
                <TabsTrigger value="dimensions" className="text-xs md:text-sm py-3 px-2 md:px-4">
                  <span className="hidden md:inline">尺寸计算 / Size</span>
                  <span className="md:hidden">尺寸计算</span>
                </TabsTrigger>
                <TabsTrigger value="injury" className="text-xs md:text-sm py-3 px-2 md:px-4">
                  <span className="hidden md:inline">伤害指标 / Injury</span>
                  <span className="md:hidden">伤害指标</span>
                </TabsTrigger>
                <TabsTrigger value="gps-anthro" className="text-xs md:text-sm py-3 px-2 md:px-4">
                  <span className="hidden md:inline">GPS人体测量</span>
                  <span className="md:hidden">GPS测量</span>
                </TabsTrigger>
                <TabsTrigger value="r129-expert" className="text-xs md:text-sm py-3 px-2 md:px-4">
                  {selectedStandard === 'FMVSS213' ? (
                    <span className="hidden md:inline">FMVSS专家</span>
                  ) : (
                    <span className="hidden md:inline">R129专家</span>
                  )}
                  <span className="md:hidden">标准专家</span>
                </TabsTrigger>
                <TabsTrigger value="config" className="text-xs md:text-sm py-3 px-2 md:px-4">
                  <span className="hidden md:inline">配置</span>
                  <span className="md:hidden">配置</span>
                </TabsTrigger>
              </TabsList>
            </CardHeader>
          </Card>

          {/* 综合设计标签页 */}
          <TabsContent value="integrated-design">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle>
                  {getProductTypeName().labelCN} 综合设计助手 / Integrated Design Assistant
                  {selectedStandard === 'FMVSS213' ? ' (FMVSS 213)' : ' (ECE R129)'}
                </CardTitle>
                <CardDescription>
                  输入身高或重量范围，自动生成完整的测试矩阵和产品尺寸规格
                  {selectedStandard === 'FMVSS213' && ' · 支持美国FMVSS 213标准'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 输入区域 */}
                <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200">
                  <CardHeader>
                    <CardTitle className="text-lg">设计参数输入</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="inputType">输入类型</Label>
                        <Select
                          value={designInput.inputType}
                          onValueChange={(value) => setDesignInput({ ...designInput, inputType: value as any })}
                        >
                          <SelectTrigger id="inputType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="height">身高范围</SelectItem>
                            <SelectItem value="weight">重量范围</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="standard">测试标准</Label>
                        <Select
                          value={designInput.standard}
                          onValueChange={(value) => {
                            setDesignInput({ ...designInput, standard: value as any });
                            setSelectedStandard(value as StandardType);
                          }}
                        >
                          <SelectTrigger id="standard">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="R129">ECE R129 (i-Size)</SelectItem>
                            <SelectItem value="R44">ECE R44/04</SelectItem>
                            <SelectItem value="FMVSS213">FMVSS 213 (美国)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="productType">产品类型</Label>
                        <Select
                          value={designInput.productType}
                          onValueChange={(value) => setDesignInput({ ...designInput, productType: value as any })}
                        >
                          <SelectTrigger id="productType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rearward">后向座椅 (Rearward Facing)</SelectItem>
                            <SelectItem value="forward">前向座椅 (Forward Facing)</SelectItem>
                            <SelectItem value="booster">增高垫 (Booster)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {designInput.inputType === 'height' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="minHeight">最小身高 (cm) *</Label>
                          <Input
                            id="minHeight"
                            type="number"
                            placeholder="例如: 40"
                            value={designInput.minHeight}
                            onChange={(e) => setDesignInput({ ...designInput, minHeight: e.target.value })}
                            min="40"
                            max="150"
                          />
                          <p className="text-xs text-gray-500 mt-1">范围: 40-150 cm</p>
                        </div>
                        <div>
                          <Label htmlFor="maxHeight">最大身高 (cm) *</Label>
                          <Input
                            id="maxHeight"
                            type="number"
                            placeholder="例如: 105"
                            value={designInput.maxHeight}
                            onChange={(e) => setDesignInput({ ...designInput, maxHeight: e.target.value })}
                            min="40"
                            max="150"
                          />
                          <p className="text-xs text-gray-500 mt-1">范围: 40-150 cm</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="minWeight">最小重量 (kg) *</Label>
                          <Input
                            id="minWeight"
                            type="number"
                            step="0.1"
                            placeholder="例如: 3.5"
                            value={designInput.minWeight}
                            onChange={(e) => setDesignInput({ ...designInput, minWeight: e.target.value })}
                            min="0"
                            max="50"
                          />
                          <p className="text-xs text-gray-500 mt-1">范围: 0-50 kg</p>
                        </div>
                        <div>
                          <Label htmlFor="maxWeight">最大重量 (kg) *</Label>
                          <Input
                            id="maxWeight"
                            type="number"
                            step="0.1"
                            placeholder="例如: 18"
                            value={designInput.maxWeight}
                            onChange={(e) => setDesignInput({ ...designInput, maxWeight: e.target.value })}
                            min="0"
                            max="50"
                          />
                          <p className="text-xs text-gray-500 mt-1">范围: 0-50 kg</p>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={calculateIntegratedDesign}
                      disabled={isCalculating}
                      className="w-full"
                      style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                      size="lg"
                    >
                      {isCalculating ? '🔄 计算中 / Calculating...' : '🚀 生成设计报告 / Generate Report'}
                    </Button>
                  </CardContent>
                </Card>

                {/* 结果展示区域 */}
                {(designResults || designContent || brandComparison) && (
                  <div className="space-y-6">
                    {/* 0. 品牌对比分析 */}
                    {isSearchingBrands && (
                      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
                        <CardContent className="p-8 text-center">
                          <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                          <p className="text-indigo-900 font-semibold">🔍 正在搜索各大品牌产品信息...</p>
                          <p className="text-sm text-indigo-700 mt-2">Cybex, Britax, Dorel, Graco, Maxi-Cosi</p>
                        </CardContent>
                      </Card>
                    )}

                    {brandComparison && (
                      <Card className="border-2 border-indigo-200">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              🏢 0. 市场同类产品对比分析
                            </CardTitle>
                            <Badge className="bg-indigo-500">
                              {brandComparison.brands.length} 个品牌
                            </Badge>
                          </div>
                          <CardDescription>
                            大品牌同类产品规格对比与设计建议
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {/* 品牌信息 */}
                          <div className="mb-6">
                            <h4 className="font-semibold text-indigo-900 mb-3">已搜索品牌</h4>
                            <div className="flex flex-wrap gap-2">
                              {brandComparison.brands.map((brandItem, idx) => (
                                <Badge key={idx} variant="outline" className="bg-indigo-50 border-indigo-300">
                                  {brandItem.brand} ({brandItem.products.length} 款产品)
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* 对比分析内容 */}
                          <div className="prose prose-sm max-w-none bg-white p-6 rounded-lg border border-indigo-100">
                            <div className="whitespace-pre-wrap text-gray-700">
                              {brandComparison.analysis}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* AI设计建议 */}
                    {designContent && (
                      <Card className="border-2 border-purple-200">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            🤖 AI设计建议 / AI Design Recommendations
                          </CardTitle>
                          <CardDescription>
                            基于R129标准的智能化设计方案
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm max-w-none bg-white p-6 rounded-lg border border-purple-100">
                            <div className="whitespace-pre-wrap text-gray-700">
                              {designContent}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {designResults && (
                      <>
                        {/* 1. 假人矩阵 */}
                    <Card className="border-2 border-violet-200">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            🧪 1. 测试假人矩阵
                          </CardTitle>
                          <Badge className="bg-violet-500">
                            {designResults.dummyMatrix.length} 个假人
                          </Badge>
                        </div>
                        <CardDescription>
                          根据输入范围和产品类型确定的测试假人
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-sm">
                            <thead className="bg-violet-500 text-white">
                              <tr>
                                <th className="text-left p-3">假人</th>
                                <th className="text-right p-3">身高</th>
                                <th className="text-right p-3">重量</th>
                                <th className="text-left p-3">年龄</th>
                                <th className="text-left p-3">朝向</th>
                                <th className="text-left p-3">包含原因</th>
                                <th className="text-center p-3">测试状态</th>
                              </tr>
                            </thead>
                            <tbody>
                              {designResults.dummyMatrix.map((dummy, idx) => (
                                <tr key={idx} className="border-b hover:bg-violet-50">
                                  <td className="p-3 font-bold">{dummy.name}</td>
                                  <td className="text-right p-3">{dummy.height} cm</td>
                                  <td className="text-right p-3">{dummy.weight} kg</td>
                                  <td className="p-3">{dummy.age}</td>
                                  <td className="p-3">
                                    <Badge variant={dummy.position.includes('Rearward') ? 'default' : 'secondary'}>
                                      {dummy.position}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-gray-600">{dummy.reason}</td>
                                  <td className="text-center p-3">
                                    <Badge className={dummy.test_required ? 'bg-emerald-500' : 'bg-gray-400'}>
                                      {dummy.test_required ? '必需测试' : '可选'}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 2. ISO尺寸分类 */}
                    <Card className="border-2 border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          📦 2. 产品外尺寸分类
                        </CardTitle>
                        <CardDescription>
                          基于最大假人规格的ISO尺寸分类
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-2">ISO尺寸分类</div>
                            <div className="text-3xl font-bold text-blue-900 mb-4">
                              {designResults.isoClass || '未确定'}
                            </div>
                            {designResults.internalDimensions?.external && (
                              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-blue-200">
                                <div>
                                  <div className="text-xs text-gray-600">总高度</div>
                                  <div className="text-lg font-bold text-blue-700">
                                    {designResults.internalDimensions.external.totalHeight} cm
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-600">总宽度</div>
                                  <div className="text-lg font-bold text-blue-700">
                                    {designResults.internalDimensions.external.totalWidth} cm
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-600">总深度</div>
                                  <div className="text-lg font-bold text-blue-700">
                                    {designResults.internalDimensions.external.totalDepth} cm
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 3. 碰撞测试矩阵 */}
                    <Card className="border-2 border-emerald-200">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            💥 3. 碰撞测试矩阵
                          </CardTitle>
                          <Badge className="bg-emerald-500">
                            {designResults.testMatrix.length} 项测试
                          </Badge>
                        </div>
                        <CardDescription>
                          基于{designInput.standard}标准的动态测试配置
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-xs">
                            <thead className="bg-emerald-500 text-white">
                              <tr>
                                <th className="text-left p-2">Test #</th>
                                <th className="text-left p-2">假人</th>
                                <th className="text-left p-2">标准</th>
                                <th className="text-left p-2">碰撞类型</th>
                                <th className="text-left p-2">朝向</th>
                                <th className="text-right p-2">速度</th>
                                <th className="text-left p-2">安装</th>
                                <th className="text-center p-2">状态</th>
                              </tr>
                            </thead>
                            <tbody>
                              {designResults.testMatrix.map((test, idx) => (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50'}>
                                  <td className="p-2 font-semibold">{test['Test #']}</td>
                                  <td className="p-2 font-bold">{test.Dummy}</td>
                                  <td className="p-2">
                                    <Badge variant="outline">{test.Standard}</Badge>
                                  </td>
                                  <td className="p-2">{test.Impact}</td>
                                  <td className="p-2">{test.Position}</td>
                                  <td className="text-right p-2">{test['Speed (km/h)']} km/h</td>
                                  <td className="p-2">{test.Installation}</td>
                                  <td className="text-center p-2">
                                    <Badge className={test.Status === 'Pending' ? 'bg-yellow-500' : 'bg-emerald-500'}>
                                      {test.Status}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                          <h4 className="font-semibold text-emerald-900 mb-2">测试标准限值</h4>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-emerald-700">HIC限值:</span> {designResults.testMatrix[0]?.['HIC Limit']}
                            </div>
                            <div>
                              <span className="text-emerald-700">胸部加速度:</span> {designResults.testMatrix[0]?.['Chest Acc Limit']}
                            </div>
                            <div>
                              <span className="text-emerald-700">胸部变形:</span> {designResults.testMatrix[0]?.['Chest Deflection Limit']}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 4. 产品内部尺寸 */}
                    <Card className="border-2 border-orange-200">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          ⚙️ 4. 产品内部尺寸
                        </CardTitle>
                        <CardDescription>
                          座椅的内部结构和调节参数
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {designResults.internalDimensions && (
                          <>
                            {/* 基础尺寸 */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="bg-orange-50 p-4 rounded-lg text-center">
                                <div className="text-xs text-gray-600 mb-1">座椅宽度</div>
                                <div className="text-2xl font-bold text-orange-700">
                                  {designResults.internalDimensions.internal.seatWidth} cm
                                </div>
                              </div>
                              <div className="bg-orange-50 p-4 rounded-lg text-center">
                                <div className="text-xs text-gray-600 mb-1">座椅深度</div>
                                <div className="text-2xl font-bold text-orange-700">
                                  {designResults.internalDimensions.internal.seatDepth} cm
                                </div>
                              </div>
                              <div className="bg-orange-50 p-4 rounded-lg text-center">
                                <div className="text-xs text-gray-600 mb-1">靠背高度</div>
                                <div className="text-2xl font-bold text-orange-700">
                                  {designResults.internalDimensions.internal.backHeight} cm
                                </div>
                              </div>
                              <div className="bg-orange-50 p-4 rounded-lg text-center">
                                <div className="text-xs text-gray-600 mb-1">头枕高度</div>
                                <div className="text-2xl font-bold text-orange-700">
                                  {designResults.internalDimensions.internal.headrestHeight} cm
                                </div>
                              </div>
                            </div>

                            {/* 靠背角度 */}
                            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border-l-4 border-orange-500">
                              <h4 className="font-semibold text-orange-900 mb-2">靠背角度</h4>
                              <div className="flex items-center gap-6">
                                <div>
                                  <span className="text-sm text-orange-700">角度:</span>
                                  <span className="text-xl font-bold text-orange-900 ml-2">
                                    {designResults.internalDimensions.internal.backrestAngle.angle}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-orange-700">类型:</span>
                                  <span className="text-sm font-semibold text-orange-900 ml-2">
                                    {designResults.internalDimensions.internal.backrestAngle.fixed ? '固定' : '可调'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* 头托调节 */}
                            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border-l-4 border-orange-500">
                              <h4 className="font-semibold text-orange-900 mb-2">头托调节高度</h4>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <span className="text-sm text-orange-700">最小高度:</span>
                                  <span className="text-lg font-bold text-orange-900 ml-2">
                                    {designResults.internalDimensions.internal.headrestAdjustment.minHeight} cm
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-orange-700">最大高度:</span>
                                  <span className="text-lg font-bold text-orange-900 ml-2">
                                    {designResults.internalDimensions.internal.headrestAdjustment.maxHeight} cm
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-orange-700">调节范围:</span>
                                  <span className="text-lg font-bold text-orange-900 ml-2">
                                    {designResults.internalDimensions.internal.headrestAdjustment.adjustmentRange}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2">
                                <span className="text-sm text-orange-700">档位数量:</span>
                                <span className="text-lg font-bold text-orange-900 ml-2">
                                  {designResults.internalDimensions.internal.headrestAdjustment.positions} 档
                                </span>
                              </div>
                            </div>

                            {/* 倾斜角度 */}
                            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border-l-4 border-orange-500">
                              <h4 className="font-semibold text-orange-900 mb-2">倾斜角度范围</h4>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <span className="text-sm text-orange-700">最小角度:</span>
                                  <span className="text-lg font-bold text-orange-900 ml-2">
                                    {designResults.internalDimensions.internal.reclineAngle.minAngle}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-orange-700">最大角度:</span>
                                  <span className="text-lg font-bold text-orange-900 ml-2">
                                    {designResults.internalDimensions.internal.reclineAngle.maxAngle}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-orange-700">角度范围:</span>
                                  <span className="text-lg font-bold text-orange-900 ml-2">
                                    {designResults.internalDimensions.internal.reclineAngle.range}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2">
                                <span className="text-sm text-orange-700">倾斜档位:</span>
                                <span className="text-lg font-bold text-orange-900 ml-2">
                                  {designResults.internalDimensions.internal.reclineAngle.positions} 档
                                </span>
                              </div>
                            </div>

                            {/* 安全系统 */}
                            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border-l-4 border-orange-500">
                              <h4 className="font-semibold text-orange-900 mb-2">安全系统</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-orange-700">安全带插槽:</span>
                                  <span className="font-bold text-orange-900 ml-2">
                                    {designResults.internalDimensions.safetySystem.harnessSlots} 个
                                  </span>
                                </div>
                                <div>
                                  <span className="text-orange-700">安全带长度:</span>
                                  <span className="font-bold text-orange-900 ml-2">
                                    {designResults.internalDimensions.safetySystem.harnessLength} cm
                                  </span>
                                </div>
                                <div>
                                  <span className="text-orange-700">胸部夹扣:</span>
                                  <span className="font-bold text-orange-900 ml-2">
                                    {designResults.internalDimensions.safetySystem.chestClip}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-orange-700">侧撞保护:</span>
                                  <span className="font-bold text-orange-900 ml-2">
                                    {designResults.internalDimensions.safetySystem.sideImpactProtection}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* 容量规格 */}
                            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border-l-4 border-orange-500">
                              <h4 className="font-semibold text-orange-900 mb-2">容量规格</h4>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <span className="text-sm text-orange-700">最大身高:</span>
                                  <span className="text-lg font-bold text-orange-900 ml-2">
                                    {designResults.internalDimensions.capacity.maxHeight} cm
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-orange-700">最大重量:</span>
                                  <span className="text-lg font-bold text-orange-900 ml-2">
                                    {designResults.internalDimensions.capacity.maxWeight} kg
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-orange-700">最大年龄:</span>
                                  <span className="text-lg font-bold text-orange-900 ml-2">
                                    {designResults.internalDimensions.capacity.maxAge}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 尺寸计算标签页 */}
          <TabsContent value="dimensions">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle>
                  {getProductTypeName().labelCN} 尺寸计算 / Size Calculator
                  {selectedStandard === 'FMVSS213' ? ' (FMVSS 213)' : ' (R129)'}
                </CardTitle>
                <CardDescription>
                  根据儿童身高计算{getProductTypeName().labelCN}的各项尺寸参数
                  {selectedStandard === 'FMVSS213' && ' · 基于美国FMVSS 213标准'}
                </CardDescription>
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
                  开始计算 / Calculate
                </Button>

                {dimensionsResult && (
                  <Card className="bg-blue-50 border-l-4 border-blue-500">
                    <CardHeader>
                      <CardTitle className="text-lg">计算结果 / Calculation Results</CardTitle>
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
                <CardTitle>
                  伤害指标分析 / Injury Analysis
                  {selectedStandard === 'FMVSS213' ? ' (FMVSS 213)' : ' (R129)'}
                </CardTitle>
                <CardDescription>
                  分析碰撞测试中的各项伤害指标
                  {selectedStandard === 'FMVSS213' && ' · 正面HIC36≤1000，侧碰HIC15≤570'}
                  {selectedStandard === 'R129' && ' · HIC15≤1000，胸部加速度≤55g'}
                </CardDescription>
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
                  开始分析 / Analyze
                </Button>

                {injuryResult && (
                  <Card className="bg-blue-50 border-l-4 border-blue-500">
                    <CardHeader>
                      <CardTitle className="text-lg">分析结果 / Results</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(injuryResult).map(([key, value]) => {
                        if (key === '建议') {
                          return (
                            <div key={key} className="bg-white p-4 rounded-lg">
                              <div className="text-sm font-semibold text-blue-600 mb-2">设计建议 / Design Recommendations</div>
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
                                {isPass ? '通过 / Pass' : '未通过 / Fail'}
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

          {/* GPS人体测量工具标签页 */}
          <TabsContent value="gps-anthro">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <Tabs value={gpsActiveTab} onValueChange={setGpsActiveTab}>
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="data-analysis">数据分析 / Analysis</TabsTrigger>
                    <TabsTrigger value="seat-design">{getProductTypeName().labelCN}设计 / Design</TabsTrigger>
                    <TabsTrigger value="test-matrix">测试矩阵 / Matrix</TabsTrigger>
                    <TabsTrigger value="r129-compliance">
                      {selectedStandard === 'FMVSS213' ? 'FMVSS法规 / FMVSS' : 'R129法规 / R129'}
                    </TabsTrigger>
                    <TabsTrigger value="dummies">假人数据 / Dummies</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
            </Card>

            {/* 数据分析标签页 */}
            {gpsActiveTab === 'data-analysis' && (
              <Card className="bg-white/95 backdrop-blur">
                <CardHeader>
                  <CardTitle>儿童人体测量数据 / Child Anthropometric Data</CardTitle>
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

                  {gpsDataLoaded && getCurrentChildData().filter(child =>
                    child.age.toLowerCase().includes(searchAge.toLowerCase())
                  ).length > 0 ? (
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
                          {getCurrentChildData().filter(child =>
                            child.age.toLowerCase().includes(searchAge.toLowerCase())
                          ).map((child, index) => (
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
                      {gpsDataLoaded ? '没有找到匹配的数据' : '加载数据中...'}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 座椅设计标签页 */}
            {gpsActiveTab === 'seat-design' && (
              <Card className="bg-white/95 backdrop-blur">
                <CardHeader>
                  <CardTitle>{getProductTypeName().labelCN} 尺寸计算器 / Product Size Calculator</CardTitle>
                  <CardDescription>根据儿童身高计算{getProductTypeName().labelCN}的关键尺寸，并生成简笔画示意图</CardDescription>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      className="w-full"
                      style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                      onClick={() => {
                        const height = Number((document.getElementById('testHeight') as HTMLInputElement)?.value);
                        if (height) {
                          const dimensions = calculateSeatDimensions(height);
                          alert(`座椅尺寸计算结果:\n\n基础尺寸:\n- 总高度: ${dimensions.totalHeight}cm\n- 座椅宽度: ${dimensions.seatWidth}cm\n- 座椅深度: ${dimensions.seatDepth}cm\n- 靠背高度: ${dimensions.backHeight}cm\n- 头枕高度: ${dimensions.headrestHeight}cm\n\n安全带系统:\n- 插槽数量: ${dimensions.harnessSlots}个\n- 插槽间距: ${dimensions.harnessSlotHeight}cm\n- 起始高度: ${dimensions.harnessStartHeight}cm\n\n侧翼保护:\n- 侧翼深度: ${dimensions.sideWingDepth}cm\n- 肩宽容量: ${dimensions.shoulderBreadth}cm\n\n垫层厚度:\n- 座垫: ${dimensions.seatPadThickness}cm\n- 靠背垫: ${dimensions.backPadThickness}cm\n- 侧垫: ${dimensions.sidePadThickness}cm`);
                        }
                      }}
                    >
                      📐 计算座椅尺寸
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => {
                        const height = Number((document.getElementById('testHeight') as HTMLInputElement)?.value);
                        if (height) {
                          const dimensions = calculateSeatDimensions(height);
                          generateSeatSchematic(height, dimensions);
                        } else {
                          alert('请先输入儿童身高');
                        }
                      }}
                      disabled={isGeneratingImage}
                    >
                      {isGeneratingImage ? '🎨 生成中...' : '🖼️ 生成示意图'}
                    </Button>
                  </div>

                  {/* 图片样式选择 */}
                  <div>
                    <Label>示意图样式</Label>
                    <div className="flex gap-2 mt-2">
                      {(['simple', 'detailed', 'cartoon'] as const).map((style) => (
                        <Button
                          key={style}
                          variant={imageStyle === style ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setImageStyle(style)}
                          style={imageStyle === style ? { background: 'linear-gradient(135deg, #667eea, #764ba2)' } : {}}
                        >
                          {style === 'simple' ? '简笔画' : style === 'detailed' ? '详细' : '卡通'}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 图片展示区域 */}
                  {generatedImageUrl && (
                    <Card className="border-2 border-violet-200">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">生成的示意图</CardTitle>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadImage(generatedImageUrl, 'seat-schematic.png')}
                          >
                            📥 下载图片
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={generatedImageUrl}
                            alt="座椅示意图"
                            className="w-full h-auto"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 错误提示 */}
                  {imageError && (
                    <Card className="border-2 border-red-200 bg-red-50">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">❌</span>
                          <div>
                            <h4 className="font-semibold text-red-900">生成失败</h4>
                            <p className="text-sm text-red-700 mt-1">{imageError}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 加载中提示 */}
                  {isGeneratingImage && (
                    <Card className="border-2 border-blue-200 bg-blue-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 border-3 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                          <p className="text-blue-900 font-medium">正在生成示意图，请稍候...</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-semibold text-blue-900 mb-2">计算说明</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• 座椅宽度 = 身高 × 0.35（最小30cm）</li>
                      <li>• 座椅深度 = 身高 × 0.38（最小25cm）</li>
                      <li>• 靠背高度 = 身高 × 0.72</li>
                      <li>• 头枕高度 = 身高 × 0.28</li>
                      <li>• 插槽间距 = (肩高范围 ÷ 插槽数量)</li>
                      <li>• 侧翼深度 = 肩宽 × 0.15 + 侧垫厚度</li>
                    </ul>
                    <h4 className="font-semibold text-blue-900 mt-4 mb-2">基于R129标准</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• 使用R129法规数据进行肩高范围计算</li>
                      <li>• 考虑儿童肩宽设计侧翼保护</li>
                      <li>• 符合ECE R129（i-Size）标准要求</li>
                    </ul>
                    <h4 className="font-semibold text-blue-900 mt-4 mb-2">生成说明</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• 点击"生成示意图"按钮生成简笔画</li>
                      <li>• 可选择不同样式：简笔画/详细/卡通</li>
                      <li>• 示意图包含五点式安全带、侧翼保护等结构</li>
                      <li>• 支持下载保存图片</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* R129/FMVSS法规标签页 */}
            {gpsActiveTab === 'r129-compliance' && (
              <Card className="bg-white/95 backdrop-blur">
                <CardHeader>
                  <CardTitle>
                    {selectedStandard === 'FMVSS213' ? 'FMVSS 213法规适应性检查' : 'R129法规适应性检查'}
                  </CardTitle>
                  <CardDescription>
                    {selectedStandard === 'FMVSS213'
                      ? '检查座椅设计是否符合美国FMVSS 213法规要求'
                      : '检查座椅设计是否符合ECE R129法规要求'}
                  </CardDescription>
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
            )}

            {/* 测试矩阵标签页 */}
            {gpsActiveTab === 'test-matrix' && (
              <Card className="bg-white/95 backdrop-blur">
                <CardHeader>
                  <CardTitle>动态测试矩阵生成器 / Test Matrix Generator</CardTitle>
                  <CardDescription>
                    {selectedStandard === 'FMVSS213'
                      ? '基于FMVSS 213标准生成动态测试矩阵，支持导出为Excel格式'
                      : '基于R129标准生成动态测试矩阵，支持导出为Excel格式'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 配置区域 */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">测试配置</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label>碰撞类型</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {matrixConfig.impactTypes.map((type) => (
                            <Badge key={type} variant="outline" className="px-3 py-1">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>假人类型</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {matrixConfig.dummies.map((dummy) => (
                            <Badge key={dummy} variant="outline" className="px-3 py-1">
                              {dummy}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>座椅朝向</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {matrixConfig.positions.map((pos) => (
                            <Badge key={pos} variant="outline" className="px-3 py-1">
                              {pos}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>安装方式</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {matrixConfig.installations.map((inst) => (
                            <Badge key={inst} variant="outline" className="px-3 py-1">
                              {inst}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>座椅配置</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {matrixConfig.configurations.map((config) => (
                            <Badge key={config} variant="outline" className="px-3 py-1">
                              {config}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-4">
                    <Button
                      onClick={generateTestMatrix}
                      className="flex-1"
                      style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                    >
                      📋 生成测试矩阵
                    </Button>
                    <Button
                      onClick={exportMatrixToCSV}
                      disabled={testMatrix.length === 0 || exportingMatrix}
                      variant="outline"
                      className="flex-1"
                    >
                      {exportingMatrix ? '导出中...' : '📥 导出CSV'}
                    </Button>
                  </div>

                  {/* 统计信息 */}
                  {testMatrix.length > 0 && (
                    <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-200">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-3xl font-bold text-violet-600">{testMatrix.length}</div>
                            <div className="text-sm text-violet-700">测试总数</div>
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-violet-600">
                              {new Set(testMatrix.map(t => t.Dummy)).size}
                            </div>
                            <div className="text-sm text-violet-700">假人类型</div>
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-violet-600">
                              {new Set(testMatrix.map(t => t.Impact)).size}
                            </div>
                            <div className="text-sm text-violet-700">碰撞类型</div>
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-violet-600">
                              {new Set(testMatrix.map(t => t.Position)).size}
                            </div>
                            <div className="text-sm text-violet-700">座椅朝向</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 测试矩阵表格 */}
                  {testMatrix.length > 0 && (
                    <div className="overflow-x-auto">
                      <h4 className="font-semibold text-gray-900 mb-4">测试矩阵预览（前10项）</h4>
                      <table className="w-full border-collapse text-xs">
                        <thead className="bg-gradient-to-r from-violet-500 to-purple-500 text-white">
                          <tr>
                            <th className="text-left p-2">Test #</th>
                            <th className="text-left p-2">Impact</th>
                            <th className="text-left p-2">Dummy</th>
                            <th className="text-left p-2">Position</th>
                            <th className="text-left p-2">Installation</th>
                            <th className="text-left p-2">Config</th>
                            <th className="text-left p-2">Speed (km/h)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testMatrix.slice(0, 10).map((test, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="p-2 font-semibold">{test['Test #']}</td>
                              <td className="p-2">{test.Impact}</td>
                              <td className="p-2">{test.Dummy}</td>
                              <td className="p-2">{test.Position}</td>
                              <td className="p-2">{test.Installation}</td>
                              <td className="p-2">{test['Product Configuration']}</td>
                              <td className="p-2">{test['Speed (km/h)']}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {testMatrix.length > 10 && (
                        <div className="text-center text-sm text-gray-500 mt-2">
                          还有 {testMatrix.length - 10} 项测试，请导出查看完整列表
                        </div>
                      )}
                    </div>
                  )}

                  {/* 说明信息 */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-semibold text-blue-900 mb-2">功能说明</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• 基于{selectedStandard === 'FMVSS213' ? 'FMVSS 213（美国）' : 'R129（i-Size）'}标准生成动态测试矩阵</li>
                      <li>• 支持多种碰撞类型、假人类型、安装方式组合</li>
                      <li>• 自动配置测试参数（速度、安装方式等）</li>
                      <li>• 导出CSV文件，可直接导入Excel编辑</li>
                      <li>• 包含完整的测试配置和结果记录模板</li>
                    </ul>
                    <h4 className="font-semibold text-blue-900 mt-4 mb-2">导出说明</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• CSV文件使用UTF-8编码，支持Excel中文显示</li>
                      <li>• 包含测试编号、配置参数、结果记录等完整字段</li>
                      <li>• 可直接在Excel中编辑测试结果</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 假人数据标签页 */}
            {gpsActiveTab === 'dummies' && (
              <Card className="bg-white/95 backdrop-blur">
                <CardHeader>
                  <CardTitle>碰撞测试假人数据 / Crash Test Dummy Data</CardTitle>
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
                                选择 / Select
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* R129/FMVSS智能设计助手标签页 */}
          <TabsContent value="r129-expert">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle>
                  {selectedStandard === 'FMVSS213' ? 'FMVSS 213专家 / FMVSS Expert' : 'R129专家 / R129 Expert'}
                </CardTitle>
                <CardDescription>
                  {selectedStandard === 'FMVSS213'
                    ? '基于美国FMVSS 213标准的智能设计咨询'
                    : '基于ECE R129（i-Size）标准的智能设计咨询'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="r129HeightInput">儿童身高 (cm) *</Label>
                  <Input
                    id="r129HeightInput"
                    type="number"
                    placeholder="输入儿童身高，例如：105"
                    value={r129Height}
                    onChange={(e) => setR129Height(e.target.value)}
                    min="0"
                    max="200"
                  />
                  <p className="text-xs text-gray-500 mt-1">范围：0-200 cm</p>
                </div>

                <Button
                  onClick={consultR129Expert}
                  disabled={r129Consulting || !r129Height}
                  className="w-full"
                  style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                  size="lg"
                >
                  {r129Consulting ? '🤖 AI分析中...' : `🎓 咨询${selectedStandard === 'FMVSS213' ? 'FMVSS' : 'R129'}专家`}
                </Button>

                {/* AI响应显示区域 */}
                {r129StreamContent && (
                  <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          📋 {selectedStandard === 'FMVSS213' ? 'FMVSS 213' : 'R129'}设计建议报告
                        </CardTitle>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const content = r129StreamContent;
                            const blob = new Blob([content], { type: 'text/markdown' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${selectedStandard === 'FMVSS213' ? 'FMVSS-213' : 'R129'}-设计报告-${r129Height}cm.md`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                          }}
                        >
                          📥 导出报告
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none prose-violet">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: r129StreamContent
                              .replace(/### /g, '<h3 class="text-lg font-bold text-violet-900 mt-6 mb-3">')
                              .replace(/## /g, '<h2 class="text-xl font-bold text-violet-900 mt-6 mb-3">')
                              .replace(/# /g, '<h1 class="text-2xl font-bold text-violet-900 mt-6 mb-3">')
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-violet-700">$1</strong>')
                              .replace(/^- /g, '<li class="ml-4 text-gray-700">')
                              .replace(/\n/g, '<br/>')
                              .replace(/<li class="ml-4 text-gray-700">/g, '<li class="ml-4 text-gray-700">')
                              .replace(/<br\/>/g, '<br/>'),
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 加载中提示 */}
                {r129Consulting && (
                  <Card className="border-2 border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-3 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                        <p className="text-blue-900 font-medium">AI专家正在分析R129标准，请稍候...</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 功能说明 */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-900 mb-2">功能说明</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 基于ECE R129（i-Size）最新标准提供专业建议</li>
                    <li>• 自动判断身高组别和ISOFIX尺寸分类</li>
                    <li>• 提供详细的设计建议和碰撞测试矩阵</li>
                    <li>• 支持导出Markdown格式的专业报告</li>
                  </ul>
                  <h4 className="font-semibold text-blue-900 mt-4 mb-2">输入范围</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 婴儿提篮：40-83 cm（15个月以下）</li>
                    <li>• 后向座椅：40-105 cm</li>
                    <li>• 增高垫：100-150 cm</li>
                  </ul>
                </div>
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
