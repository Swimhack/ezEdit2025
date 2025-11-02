import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import type { NLEditRequest, NLEditResponse } from '@/types/cms';

// Initialize AI clients only if API keys are available
const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

const getAnthropic = () => {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
};

export async function POST(request: NextRequest) {
  try {
    const body: NLEditRequest = await request.json();
    const { instruction, context } = body;

    if (!context?.currentContent) {
      return NextResponse.json(
        { success: false, error: 'Current content is required' },
        { status: 400 }
      );
    }

    const anthropic = getAnthropic();
    if (!anthropic) {
      return NextResponse.json(
        { success: false, error: 'AI service not configured' },
        { status: 503 }
      );
    }

    // Use Claude for natural language editing
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are a content editor. You will be given existing content and an instruction to modify it.

Current Content:
${context.currentContent}

Instruction:
${instruction}

Please provide:
1. The updated content
2. A list of changes made

Respond in JSON format:
{
  "updatedContent": "the modified content here",
  "changes": ["list", "of", "changes"]
}`,
        },
      ],
    });

    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse the AI response
    const aiResponse = JSON.parse(textContent.text);

    const result: NLEditResponse = {
      success: true,
      updatedContent: aiResponse.updatedContent,
      changes: aiResponse.changes,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Natural language edit error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
