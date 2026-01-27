'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Shield, Ruler, Heart, Baby } from 'lucide-react';

interface ProductCard {
  id: string;
  title: string;
  titleEn: string;
  icon: string;
  iconComponent: React.ReactNode;
  description: string;
  descriptionEn: string;
  color: string;
  path: string;
  features: string[];
}

const PRODUCT_CARDS: ProductCard[] = [
  {
    id: 'stroller',
    title: '婴儿推车',
    titleEn: 'Baby Stroller',
    icon: '👶',
    iconComponent: <Baby className="w-8 h-8" />,
    description: '推车设计、尺寸计算、安全测试',
    descriptionEn: 'Stroller design, size calculation, safety testing',
    color: '#667eea',
    path: '/gps-anthro',
    features: ['GPS R016标准', 'EN 1888规范', '多类型推车支持'],
  },
  {
    id: 'car-seat',
    title: '儿童安全座椅',
    titleEn: 'Child Car Seat',
    icon: '🚗',
    iconComponent: <Shield className="w-8 h-8" />,
    description: 'ECE R129/FMVSS213、伤害指标分析',
    descriptionEn: 'ECE R129/FMVSS213, injury criteria analysis',
    color: '#764ba2',
    path: '/',
    features: ['i-Size标准', '伤害指标计算', '综合设计助手'],
  },
  {
    id: 'high-chair',
    title: '儿童高脚椅',
    titleEn: 'High Chair',
    icon: '🪑',
    iconComponent: <Ruler className="w-8 h-8" />,
    description: '人体工程学设计、安全规范',
    descriptionEn: 'Ergonomic design, safety standards',
    color: '#f093fb',
    path: '/',
    features: ['GB 28007标准', '尺寸规范', '安全设计'],
  },
  {
    id: 'crib',
    title: '婴儿床',
    titleEn: 'Baby Crib',
    icon: '🛏️',
    iconComponent: <Heart className="w-8 h-8" />,
    description: '睡眠安全、结构设计、材料选择',
    descriptionEn: 'Sleep safety, structural design, material selection',
    color: '#4facfe',
    path: '/',
    features: ['睡眠标准', '结构安全', '环保材料'],
  },
  {
    id: 'ai-design',
    title: 'AI智能产品设计',
    titleEn: 'AI Smart Design',
    icon: '🎨',
    iconComponent: <Sparkles className="w-8 h-8" />,
    description: '智能对话、设计方案生成、专业建议',
    descriptionEn: 'Smart conversation, design proposal, expert advice',
    color: '#43e97b',
    path: '/product-design',
    features: ['AI对话', '方案生成', '5大品类支持'],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* 顶部标题 */}
        <div className="text-center mb-8 md:mb-12">
          <CardTitle className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
            儿童产品设计助手
          </CardTitle>
          <CardDescription className="text-lg md:text-xl text-purple-100">
            Child Product Design Assistant
          </CardDescription>
          <Badge className="mt-4 bg-white/20 text-white border-white/30 text-sm">
            安全第一 · 符合法规 · 专业设计
          </Badge>
        </div>

        {/* 产品卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
          {PRODUCT_CARDS.map((card) => (
            <Link key={card.id} href={card.path}>
              <Card
                className="h-full transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer border-2 border-transparent hover:border-white/30 bg-white/95 backdrop-blur-sm"
                style={{
                  background: `linear-gradient(135deg, ${card.color}10, ${card.color}05)`,
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-3xl md:text-4xl shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}cc)` }}
                    >
                      {card.icon}
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-xs font-medium px-2 py-1"
                      style={{ backgroundColor: `${card.color}20`, color: card.color }}
                    >
                      {card.features.length} Features
                    </Badge>
                  </div>
                  <CardTitle className="text-xl md:text-2xl text-gray-800">
                    {card.title}
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base text-gray-600 font-medium">
                    {card.titleEn}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700">{card.description}</p>
                  <p className="text-xs text-gray-500 italic">{card.descriptionEn}</p>

                  <div className="space-y-2">
                    {card.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: card.color }}
                        />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full mt-4 font-semibold transition-all duration-300 hover:shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${card.color}, ${card.color}cc)`,
                    }}
                  >
                    <span className="mr-2">开始使用</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="mt-12 md:mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-white/20 backdrop-blur-sm border-white/30">
            <CardContent className="p-6">
              <p className="text-white text-sm md:text-base">
                <strong className="font-semibold">安全提示：</strong>
                最终产品必须通过权威机构检测认证，本系统提供的设计方案仅供参考。
                请严格遵守GB/EN/ASTM等国际安全标准。
              </p>
              <p className="text-purple-200 text-xs mt-2">
                Safety Reminder: Final products must be certified by authoritative institutions. Design proposals are for reference only.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 版本信息 */}
        <div className="mt-8 text-center">
          <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-xs">
            V8.1.0 · Professional Design Assistant
          </Badge>
        </div>
      </div>
    </div>
  );
}
