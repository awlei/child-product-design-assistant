import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 设计助手API - 纯本地数据库版本 v3.0
 * 完全基于test-matrix-data.json，确保设计建议稳定输出
 */

interface TestMatrixData {
  version: string;
  standard: string;
  r129_height_groups: HeightGroup[];
  fmvss_213_weight_groups: WeightGroup[];
}

interface HeightGroup {
  height_range: string;
  isofix_size_class: string;
  primary_dummy: string;
  all_required_dummies: string[];
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
  test_matrix: Test[];
}

interface WeightGroup {
  weight_range: string;
  isofix_size_class: string;
  dummies: string[];
  height_range: string;
  age_range: string;
  design_requirements: {
    head_rest_height: string;
    harness_width: string;
    seat_angle: string;
    shoulder_width: string;
    hip_width: string;
    internal_length: string;
  };
  test_matrix: Test[];
}

interface Test {
  test_type: string;
  dummies: string[];
  speed: string;
  deceleration: string;
  injury_criteria: string[];
}

// 加载测试矩阵数据
function loadTestMatrixData(): TestMatrixData | null {
  try {
    const filePath = join(process.cwd(), 'public/data/test-matrix-data.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('[API] 加载测试矩阵数据失败:', error);
    return null;
  }
}

// 解析范围字符串
function parseRange(rangeStr: string): { min: number; max: number } | null {
  try {
    const cleaned = rangeStr.trim().replace(/cm|kg|kg\)|cm\)|\s/g, '');
    const parts = cleaned.split('-');
    if (parts.length === 2) {
      const min = parseFloat(parts[0]);
      const max = parseFloat(parts[1]);
      if (!isNaN(min) && !isNaN(max)) {
        return { min, max };
      }
    }
  } catch (error) {
    console.error('[API] 解析范围失败:', rangeStr, error);
  }
  return null;
}

// 根据身高范围匹配身高分组（ECE R129）
function matchHeightGroup(groups: HeightGroup[], inputRange: { min: number; max: number }): HeightGroup | null {
  for (const group of groups) {
    const groupRange = parseRange(group.height_range);
    if (!groupRange) continue;

    // 检查是否有重叠
    if (!(inputRange.max < groupRange.min || inputRange.min > groupRange.max)) {
      return group;
    }
  }
  return null;
}

// 根据体重范围匹配体重分组（FMVSS 213）
function matchWeightGroup(groups: WeightGroup[], inputRange: { min: number; max: number }): WeightGroup | null {
  for (const group of groups) {
    const groupRange = parseRange(group.weight_range);
    if (!groupRange) continue;

    // 检查是否有重叠
    if (!(inputRange.max < groupRange.min || inputRange.min > groupRange.max)) {
      return group;
    }
  }
  return null;
}

// 生成设计建议
function generateDesignAdvice(group: HeightGroup | WeightGroup, standard: string): string {
  const isHeightGroup = 'height_range' in group;
  
  // 提取通用字段
  const ageRange = group.age_range;
  const headRestHeight = group.design_requirements.head_rest_height;
  const harnessWidth = group.design_requirements.harness_width;
  const seatAngle = group.design_requirements.seat_angle;
  const shoulderWidth = group.design_requirements.shoulder_width;
  const hipWidth = group.design_requirements.hip_width;
  const internalLength = group.design_requirements.internal_length;
  const isofixSizeClass = group.isofix_size_class;
  
  // 提取特定字段
  let rangeStr = '';
  let dummyStr = '';
  if (isHeightGroup) {
    const heightGroup = group as HeightGroup;
    rangeStr = heightGroup.height_range;
    dummyStr = heightGroup.primary_dummy;
  } else {
    const weightGroup = group as WeightGroup;
    rangeStr = weightGroup.weight_range;
    dummyStr = weightGroup.dummies.join(', ');
  }

  let advice = `## 模块1：产品定位与适用标准

该${isHeightGroup ? '身高' : '体重'}范围对应${ageRange}儿童。

适用区域：${standard === 'R129' ? '欧洲及全球i-Size市场' : '北美市场'}

核心卖点：${standard === 'R129' ? '基于儿童身高分组，后向乘坐至15个月，强制侧撞保护' : '基于体重分组，符合美国联邦安全标准'}

标准名称：${standard === 'R129' ? 'ECE R129 (i-Size)' : 'FMVSS 213'}

---

## 模块2：关键技术要求

1. **头枕高度调节**：${headRestHeight}

2. **安全带宽度**：${harnessWidth}

3. **座椅角度**：${seatAngle}

4. **肩部宽度**：${shoulderWidth}

5. **臀部宽度**：${hipWidth}

6. **内部长度**：${internalLength}

7. **ISOFIX Size Class**：${isofixSizeClass}

---

## 模块3：核心安全功能推荐

### 1. 测试假人系统
**技术实现**：使用${dummyStr}假人进行测试
**安全价值**：确保在${rangeStr}范围内的儿童获得充分保护

### 2. 伤害指标控制
**技术实现**：严格控制伤害指标
**安全价值**：

`;

  // 添加伤害指标
  const frontalTest = group.test_matrix.find(t => t.test_type.includes('正面') || t.test_type.includes('Frontal'));
  if (frontalTest) {
    advice += `- 正面碰撞：${frontalTest.injury_criteria.join(', ')}\n`;
  }

  const sideTest = group.test_matrix.find(t => t.test_type.includes('侧面') || t.test_type.includes('Side'));
  if (sideTest) {
    advice += `- 侧面碰撞：${sideTest.injury_criteria.join(', ')}\n`;
  }

  // 碰撞测试列表
  const testList = group.test_matrix.map(t => `${t.test_type} (${t.speed})`).join('，');
  
  // 假人数量和列表
  let dummyCount = 0;
  let dummyList = '';
  if (isHeightGroup) {
    const heightGroup = group as HeightGroup;
    dummyCount = heightGroup.all_required_dummies.length;
    dummyList = heightGroup.all_required_dummies.join(', ');
  } else {
    const weightGroup = group as WeightGroup;
    dummyCount = weightGroup.dummies.length;
    dummyList = weightGroup.dummies.join(', ');
  }

  advice += `
### 3. 碰撞测试验证
**技术实现**：${testList}
**安全价值**：通过${group.test_matrix.length}种碰撞测试验证，确保全方位安全保护

### 4. 假人覆盖范围
**技术实现**：覆盖${dummyCount}个假人：${dummyList}
**安全价值**：确保从最小到最大范围内的儿童都能获得充分保护

---

*数据来源：本地测试矩阵数据库 (v${loadTestMatrixData()?.version || '未知'})*
*适用标准：${standard === 'R129' ? 'ECE R129 (i-Size)' : 'FMVSS 213'}*
*${rangeStr}* | *${ageRange}*
`;

  return advice;
}

// 默认设计建议（当没有匹配的数据时）
function getDefaultAdvice(standard: string, range: string): string {
  return `## 模块1：产品定位与适用标准

该${range.includes('cm') ? '身高' : '体重'}范围对应的儿童产品设计。

适用区域：${standard === 'R129' ? '欧洲及全球i-Size市场' : '北美市场'}

核心卖点：符合${standard === 'R129' ? 'ECE R129 (i-Size)' : 'FMVSS 213'}安全标准要求

标准名称：${standard === 'R129' ? 'ECE R129 (i-Size)' : 'FMVSS 213'}

---

## 模块2：关键技术要求

1. **头枕高度调节**：可调节至多档，适应不同身高儿童

2. **安全带宽度**：根据儿童体型调整安全带宽度

3. **座椅角度**：确保合适的座椅角度，保护儿童头部和颈部

4. **ISOFIX接口**：使用标准ISOFIX接口，确保安装稳固

5. **侧撞保护**：配备侧撞保护系统，吸收侧面碰撞能量

---

## 模块3：核心安全功能推荐

### 1. 伤害指标控制
**技术实现**：严格控制头部伤害指标（HIC）和胸部加速度
**安全价值**：减少碰撞对儿童头部和胸部的伤害

### 2. 碰撞测试验证
**技术实现**：通过正面碰撞和侧面碰撞测试
**安全价值**：确保在真实碰撞场景下的安全性能

### 3. 人体工学设计
**技术实现**：基于儿童人体测量数据设计
**安全价值**：提供舒适的乘坐体验，同时确保安全

---

*数据来源：本地测试矩阵数据库*
*适用标准：${standard === 'R129' ? 'ECE R129 (i-Size)' : 'FMVSS 213'}*
*范围：${range}*
`;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API] 开始处理设计请求（纯本地数据库）...');

    const { standard, heightRange, weightRange } = await request.json();

    // 加载测试矩阵数据
    const testData = loadTestMatrixData();
    if (!testData) {
      console.error('[API] 无法加载测试矩阵数据');
      return NextResponse.json(
        { success: false, error: '无法加载数据' },
        { status: 500 }
      );
    }

    // 匹配分组
    let matchedGroup: HeightGroup | WeightGroup | null = null;

    if (standard === 'R129' && heightRange) {
      const inputRange = parseRange(heightRange);
      if (inputRange) {
        matchedGroup = matchHeightGroup(testData.r129_height_groups, inputRange);
      }
    } else if (standard === 'FMVSS213' && weightRange) {
      const inputRange = parseRange(weightRange);
      if (inputRange) {
        matchedGroup = matchWeightGroup(testData.fmvss_213_weight_groups, inputRange);
      }
    }

    // 生成设计建议
    let advice: string;
    if (matchedGroup) {
      console.log('[API] 匹配到分组:', matchedGroup.height_range || matchedGroup.weight_range);
      advice = generateDesignAdvice(matchedGroup, standard);
    } else {
      console.log('[API] 未匹配到分组，使用默认建议');
      advice = getDefaultAdvice(standard, heightRange || weightRange || '未知范围');
    }

    console.log('[API] 设计建议生成成功，长度:', advice.length);

    // 流式返回
    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          // 添加标题
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            content: '## 📚 设计建议（本地数据库）\n\n' 
          })}\n\n`));

          // 优化流式输出：快速发送，减少延迟
          const chars = advice.split('');
          const chunkSize = 50;  // 每个chunk发送50个字符（原来是8个）
          for (let i = 0; i < chars.length; i += chunkSize) {
            const chunk = chars.slice(i, i + chunkSize).join('');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
            // 减少延迟到5ms（原来是15ms），加快输出速度
            await new Promise(resolve => setTimeout(resolve, 5));
          }

          controller.close();
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Data-Source': 'local-database-only',
        },
      }
    );
  } catch (error) {
    console.error('[API] 处理请求失败:', error);
    
    // 返回默认建议
    const defaultAdvice = getDefaultAdvice(
      'R129',
      '默认范围'
    );

    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const chars = defaultAdvice.split('');
          
          for (const char of chars) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: char })}\n\n`));
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          
          controller.close();
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Data-Source': 'local-database-fallback',
        },
      }
    );
  }
}
