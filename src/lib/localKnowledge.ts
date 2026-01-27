/**
 * 本地知识库服务
 * 当AI服务不可用时，使用本地法规数据库生成设计建议
 */

export interface LocalKnowledgeRequest {
  productType: string;
  standard: 'ECE_R129' | 'FMVSS_213' | 'ECE_R44';
  heightRange?: { min: number; max: number };
  weightRange?: { min: number; max: number };
  ageRange?: { min: number; max: number };
}

export interface LocalDesignAdvice {
  source: 'local_knowledge_base';
  standard: string;
  confidence: number;
  sections: {
    title: string;
    content: string[];
  }[];
}

import { readFileSync } from 'fs';
import { join } from 'path';

export async function generateLocalAdvice(request: LocalKnowledgeRequest): Promise<LocalDesignAdvice> {
  try {
    console.log('[本地知识库] 请求参数:', request);

    // 读取本地知识库
    let knowledgeBase: any;
    try {
      const knowledgeBasePath = join(process.cwd(), 'public/data/local-knowledge-base.json');
      console.log('[本地知识库] 文件路径:', knowledgeBasePath);
      const fileContent = readFileSync(knowledgeBasePath, 'utf-8');
      knowledgeBase = JSON.parse(fileContent);
      console.log('[本地知识库] 知识库版本:', knowledgeBase.version);
    } catch (fetchError) {
      console.error('[本地知识库] 获取知识库失败:', fetchError);
      throw new Error(`获取本地知识库失败: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
    }

    if (!knowledgeBase || !knowledgeBase.standards) {
      throw new Error('知识库格式错误');
    }

    const standard = knowledgeBase.standards[request.standard];
    if (!standard) {
      console.error('[本地知识库] 未找到标准:', request.standard);
      throw new Error(`Unknown standard: ${request.standard}`);
    }

    console.log('[本地知识库] 标准名称:', standard.name);

    const sections: LocalDesignAdvice['sections'] = [];

    // 1. 标准概述
    sections.push({
      title: '标准概述',
      content: [
        `**标准名称**: ${standard.name}`,
        `**描述**: ${standard.description}`,
        `**生效日期**: ${standard.effective_date}`,
        request.standard === 'ECE_R129' && '**状态**: 当前推荐使用的先进标准',
        request.standard === 'ECE_R44' && '**状态**: 逐步淘汰，建议升级至ECE R129',
        request.standard === 'FMVSS_213' && '**状态**: 美国联邦标准，新版213a加强侧撞保护'
      ].filter(Boolean) as string[]
    });

    // 2. 关键要求
    sections.push({
      title: '关键要求',
      content: Object.entries(standard.key_requirements).map(([key, value]) => 
        `**${key}**: ${value}`
      )
    });

    // 3. 适用分组
    let applicableGroups: any[] = [];
    
    if (request.standard === 'ECE_R129' && request.heightRange) {
      // R129基于身高
      const height = (request.heightRange.min + request.heightRange.max) / 2;
      applicableGroups = standard.height_groups.filter((group: any) => {
        const [minStr, maxStr] = group.range.split('-').map((s: string) => parseInt(s.replace('cm', '')));
        return height >= minStr && height <= maxStr;
      });
    } else if (request.weightRange) {
      // R44和FMVSS 213基于体重
      const weight = (request.weightRange.min + request.weightRange.max) / 2;
      applicableGroups = standard.weight_groups.filter((group: any) => {
        const [minStr, maxStr] = group.weight_range.split('-').map((s: string) => parseInt(s.replace('kg', '')));
        return weight >= minStr && weight <= maxStr;
      });
    }

    if (applicableGroups.length > 0) {
      sections.push({
        title: '适用分组',
        content: applicableGroups.flatMap((group: any) => [
          `**分组**: ${group.name || group.range}`,
          `**体重/身高**: ${group.weight_range || group.range}`,
          `**年龄段**: ${group.age}`,
          `**安装方式**: ${group.installation}`,
          '',
          '**核心特性**:',
          ...group.features.map((f: string) => `- ${f}`),
          '',
          '**技术规格**:',
          ...Object.entries(group.technical_specs).map(([key, value]) => `- ${key}: ${value}`)
        ])
      });
    }

    // 4. 伤害指标
    if (standard.injury_criteria) {
      sections.push({
        title: '伤害指标要求',
        content: Object.entries(standard.injury_criteria).map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return `**${key}**:\n${Object.entries(value).map(([k, v]) => `  - ${k}: ${v}`).join('\n')}`;
          }
          return `**${key}**: ${value}`;
        })
      });
    }

    // 5. 安全建议
    if (standard.safety_recommendations && standard.safety_recommendations.length > 0) {
      sections.push({
        title: '安全建议',
        content: standard.safety_recommendations.map((tip: string, index: number) => 
          `${index + 1}. ${tip}`
        )
      });
    }

    // 6. 人体测量数据
    if (request.heightRange && knowledgeBase.anthropometry.r129_data) {
      const anthropometryData = knowledgeBase.anthropometry.r129_data.filter((data: any) => {
        return data.stature >= request.heightRange!.min &&
               data.stature <= request.heightRange!.max;
      });

      if (anthropometryData.length > 0) {
        const anthropometryContent = anthropometryData.map((data: any) =>
          [
            `**身高**: ${data.stature} cm`,
            `- 坐高: ${data.sitting_height} cm`,
            `- 肩宽: ${data.shoulder_breadth} cm`,
            `- 臀宽: ${data.hip_breadth} cm`,
            `- 肩高(最小): ${data.shoulder_height_min} cm`
          ].join('\n\n')
        );
        sections.push({
          title: '人体测量参考数据',
          content: anthropometryContent
        });
      }
    }

    // 7. 通用功能特性
    if (knowledgeBase.common_features) {
      const featuresContent = Object.entries(knowledgeBase.common_features).map(([key, feature]: [string, any]) =>
        [
          `**${feature.name}**`,
          `- ${feature.description}`,
          `- 技术规格: ${feature.technical_specs}`
        ].join('\n\n')
      );
      sections.push({
        title: '推荐功能特性',
        content: featuresContent
      });
    }

    // 8. 设计提示
    if (knowledgeBase.design_tips && knowledgeBase.design_tips.length > 0) {
      sections.push({
        title: '设计提示',
        content: knowledgeBase.design_tips.map((tip: string, index: number) => 
          `${index + 1}. ${tip}`
        )
      });
    }

    return {
      source: 'local_knowledge_base',
      standard: standard.name,
      confidence: 0.85,
      sections
    };

  } catch (error) {
    console.error('Local knowledge base error:', error);
    throw new Error('无法从本地知识库生成建议');
  }
}

export function formatLocalAdvice(advice: LocalDesignAdvice): string {
  let markdown = `# ${advice.standard} - 设计建议\n\n`;
  markdown += `*数据来源: ${advice.source}* | *置信度: ${(advice.confidence * 100).toFixed(0)}%*\n\n`;
  markdown += '---\n\n';

  advice.sections.forEach(section => {
    markdown += `## ${section.title}\n\n`;
    if (Array.isArray(section.content)) {
      section.content.forEach(content => {
        markdown += `${content}\n\n`;
      });
    } else {
      markdown += `${section.content}\n\n`;
    }
  });

  markdown += '---\n\n';
  markdown += '**注意**: 本建议基于本地法规数据库生成，仅供参考。实际产品设计请遵循最新官方标准和认证要求。';

  return markdown;
}
