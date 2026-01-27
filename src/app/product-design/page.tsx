'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, MessageSquare, User, Bot, Sparkles, ChevronRight, Loader2, AlertCircle, Smartphone } from 'lucide-react';
import { isNativeApp } from '@/lib/capacitor-utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Category {
  id: string;
  nameCN: string;
  nameEN: string;
  icon: string;
  color: string;
  descriptionCN: string;
  descriptionEN: string;
  standards: string[];
  questions: Array<{
    id: string;
    textCN: string;
    textEN: string;
    type: string;
    optionsCN: string[];
    optionsEN: string[];
  }>;
}

interface UserPreferences {
  age?: string;
  weight?: string;
  height?: string;
  scenario?: string;
  preference?: string;
}

export default function ProductDesignPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [view, setView] = useState<'home' | 'chat'>('home');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
  const [collectedInfo, setCollectedInfo] = useState<string[]>([]);
  const [isNative, setIsNative] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 检测是否为原生应用
  useEffect(() => {
    setIsNative(isNativeApp());
  }, []);

  // 加载产品分类数据
  useEffect(() => {
    fetch('/data/product-categories.json')
      .then(res => res.json())
      .then(data => setCategories(data.categories))
      .catch(err => console.error('Failed to load categories:', err));
  }, []);

  // 滚动到消息底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamContent, scrollToBottom]);

  // 选择产品类别
  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    setView('chat');
    setMessages([]);

    // 发送欢迎消息
    const welcomeMessage = {
      role: 'assistant' as const,
      content: `欢迎使用儿童产品设计助手！🎉\n\n您选择了【${category.nameCN} ${category.nameEN}】，我将帮您打造安全又实用的儿童产品～\n\n为了给您提供最专业的设计方案，我需要了解一些基本信息：\n\n1. 🎂 目标儿童年龄范围\n2. ⚖️ 预计使用体重范围\n3. 📏 预计使用身高范围\n4. 🎯 使用场景与需求\n5. 💡 其他偏好\n\n请告诉我您的具体需求，例如："我要设计一款适合0-12个月宝宝的日常使用的婴儿推车"`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);
    setStreamContent('');

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/design-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          productId: selectedCategory?.id || 'unknown',
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is null');
      }

      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setStreamContent(fullContent);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: fullContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamContent('');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Error sending message:', error);
        const errorMessage: Message = {
          role: 'assistant',
          content: '抱歉，我遇到了一些问题。请稍后再试。',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  // 快捷回答问题
  const handleQuickAnswer = (questionId: string, answer: string, answerEN: string) => {
    const question = selectedCategory?.questions.find(q => q.id === questionId);
    if (!question) return;

    const quickMessage = `${question.textCN}: ${answer}`;
    setInputMessage(quickMessage);
    setUserPreferences(prev => ({ ...prev, [questionId]: answer }));
    setCollectedInfo(prev => [...prev, `${question.textCN}: ${answer}`]);
  };

  // 返回首页
  const handleBack = () => {
    setView('home');
    setSelectedCategory(null);
    setMessages([]);
    setInputMessage('');
    setStreamContent('');
    setUserPreferences({});
    setCollectedInfo([]);
  };

  // 格式化Markdown内容
  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/### (.*?)(\n|$)/g, '<h3 class="text-lg font-bold mt-4 mb-2 text-purple-600">$1</h3>')
      .replace(/## (.*?)(\n|$)/g, '<h2 class="text-xl font-bold mt-4 mb-2 text-purple-700">$1</h2>')
      .replace(/- (.*?)(\n|$)/g, '<li class="ml-4">$1</li>')
      .replace(/\n/g, '<br />');
  };

  // 渲染产品分类卡片
  const renderCategoryCard = (category: Category) => (
    <Card
      key={category.id}
      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-purple-300"
      onClick={() => handleSelectCategory(category)}
      style={{ background: `linear-gradient(135deg, ${category.color}20, ${category.color}05)` }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="text-5xl mb-2">{category.icon}</div>
          <Badge
            variant="secondary"
            className="ml-2"
            style={{ backgroundColor: category.color, color: 'white' }}
          >
            {category.standards.length} Standards
          </Badge>
        </div>
        <CardTitle className="text-lg md:text-xl text-gray-800">
          {category.nameCN}
        </CardTitle>
        <CardDescription className="text-sm text-gray-600">
          {category.nameEN}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 mb-3">{category.descriptionCN}</p>
        <div className="flex flex-wrap gap-1">
          {category.standards.slice(0, 3).map((standard, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {standard}
            </Badge>
          ))}
          {category.standards.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{category.standards.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // 渲染消息
  const renderMessage = (message: Message, index: number) => (
    <div
      key={index}
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`flex max-w-[90%] md:max-w-[80%] ${
          message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            message.role === 'user'
              ? 'bg-purple-600 ml-2'
              : 'bg-gradient-to-br from-purple-500 to-pink-500 mr-2'
          }`}
        >
          {message.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
        </div>
        <div
          className={`rounded-2xl px-4 py-3 ${
            message.role === 'user'
              ? 'bg-purple-600 text-white'
              : 'bg-white border border-purple-200 text-gray-800 shadow-sm'
          }`}
        >
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: formatMessage(message.content),
            }}
          />
          <div className="text-xs mt-2 opacity-70">
            {message.timestamp.toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // 如果是原生应用（APK/IPA），显示提示页面
  if (isNative) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-gray-800">APK版功能说明</CardTitle>
            <CardDescription className="text-base text-gray-600 mt-2">
              Mobile App Feature Notice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">此功能在APK中不可用</h3>
                  <p className="text-sm text-gray-600">
                    AI设计助手功能仅在Web浏览器中可用。
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">可用的功能：</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>尺寸计算器</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>伤害指标分析</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>GPS人体测量数据查询</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>婴儿推车、高脚椅、婴儿床标准查询</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>综合设计工具</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">如何使用AI功能？</h4>
              <p className="text-sm text-gray-600 mb-2">
                如需使用AI设计助手功能，请使用Web浏览器访问应用：
              </p>
              <div className="bg-white border border-gray-200 rounded p-2">
                <code className="text-xs text-blue-600 break-all">
                  https://child-product-design-assistant.vercel.app
                </code>
              </div>
            </div>

            <Button
              onClick={() => window.history.back()}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              返回
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {view === 'chat' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="mr-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-800">
                  {view === 'home' ? '儿童产品设计助手' : (selectedCategory?.nameCN || '产品设计')}
                </h1>
                <p className="text-xs text-gray-500">
                  {view === 'home' ? 'Professional Product Design Assistant' : (selectedCategory?.nameEN || 'Design Assistant')}
                </p>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            <MessageSquare className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
        </div>
      </div>

      {/* 主内容 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {view === 'home' ? (
          <div className="space-y-6">
            {/* 欢迎卡片 */}
            <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl">
                  👋 欢迎使用儿童产品设计助手
                </CardTitle>
                <CardDescription className="text-purple-100 text-base">
                  Professional Child Product Design Assistant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-purple-50 mb-4">
                  我是您专业的儿童产品设计顾问，拥有10年以上行业经验，精通全球主流安全标准。
                  选择一个产品类别，我将为您提供专业的设计方案和安全建议。
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/20 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">🛡️</div>
                    <div className="text-sm font-medium">安全第一</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">📋</div>
                    <div className="text-sm font-medium">符合法规</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">🎯</div>
                    <div className="text-sm font-medium">人性化</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">💝</div>
                    <div className="text-sm font-medium">温暖有爱</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 产品分类 */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                选择产品类别
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map(category => renderCategoryCard(category))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-[calc(100vh-120px)]">
            {/* 聊天区域 */}
            <ScrollArea className="flex-1 pr-4 mb-4">
              <div className="space-y-2 pb-4">
                {messages.map((message, index) => renderMessage(message, index))}

                {/* 正在输入提示 */}
                {isTyping && (
                  <div className="flex justify-start mb-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 mr-2">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-white border border-purple-200 rounded-2xl px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                          <span className="text-sm text-gray-600">正在思考中...</span>
                        </div>
                        {streamContent && (
                          <div className="mt-2 prose prose-sm max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: formatMessage(streamContent) }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* 快捷问题按钮 */}
            {selectedCategory && collectedInfo.length < 5 && (
              <div className="mb-3 space-y-2">
                {selectedCategory.questions.slice(collectedInfo.length).slice(0, 1).map((question, idx) => (
                  <Card key={question.id} className="bg-purple-50 border-purple-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-purple-800 flex items-center gap-2">
                        <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                          {collectedInfo.length + idx + 1}
                        </span>
                        {question.textCN}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {question.optionsCN.map((option, optIdx) => (
                          <Button
                            key={optIdx}
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAnswer(question.id, option, question.optionsEN[optIdx])}
                            className="hover:bg-purple-100 hover:border-purple-300"
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* 输入区域 */}
            <div className="bg-white rounded-2xl shadow-lg border border-purple-200 p-3">
              <div className="flex gap-2">
                <Textarea
                  placeholder="输入您的需求，例如：我要设计一款适合0-12个月宝宝的日常使用的婴儿推车..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 min-h-[80px] resize-none border-purple-200 focus:border-purple-400 focus:ring-purple-200"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 self-end"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
