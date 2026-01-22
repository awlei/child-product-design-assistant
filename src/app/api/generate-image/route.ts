import { NextRequest, NextResponse } from 'next/server';
import { ImageGenerationClient, Config } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, style = 'simple' } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: '请提供提示词' },
        { status: 400 }
      );
    }

    // 根据样式优化提示词
    let optimizedPrompt = prompt;
    if (style === 'simple') {
      optimizedPrompt = `Simple line drawing, sketch style, black and white, minimalist, ${prompt}`;
    } else if (style === 'detailed') {
      optimizedPrompt = `Detailed technical drawing, professional illustration, ${prompt}`;
    } else if (style === 'cartoon') {
      optimizedPrompt = `Cute cartoon style, colorful, friendly design, ${prompt}`;
    }

    const config = new Config();
    const client = new ImageGenerationClient(config);

    const response = await client.generate({
      prompt: optimizedPrompt,
      size: '2K',
      watermark: false,
      responseFormat: 'url',
    });

    const helper = client.getResponseHelper(response);

    if (helper.success && helper.imageUrls.length > 0) {
      return NextResponse.json({
        success: true,
        imageUrl: helper.imageUrls[0],
        model: response.model,
        created: response.created,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: helper.errorMessages.join(', ') || '图片生成失败',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '服务器错误',
      },
      { status: 500 }
    );
  }
}
