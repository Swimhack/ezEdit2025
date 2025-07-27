import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null

export async function POST(request: NextRequest) {
  try {
    const { message, context, provider = 'openai', model } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    let systemPrompt = `You are an AI coding assistant for EzEdit.co, a web-based code editor. You help users edit their website files through FTP connections.

Your capabilities:
- Analyze code and suggest improvements
- Fix bugs and errors
- Explain code functionality
- Generate new code snippets
- Help with HTML, CSS, JavaScript, PHP, Python, and other web technologies
- Provide security best practices
- Suggest optimizations

Always provide clear, actionable advice. When suggesting code changes, explain why the changes are beneficial.`

    if (context?.file_path) {
      systemPrompt += `\n\nCurrent file context: ${context.file_path}`
      if (context.language) {
        systemPrompt += `\nFile language: ${context.language}`
      }
    }

    if (provider === 'claude' || provider === 'anthropic') {
      if (!anthropic) {
        return NextResponse.json(
          { error: 'Anthropic API key not configured' },
          { status: 500 }
        )
      }

      const response = await anthropic.messages.create({
        model: model || 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\nUser message: ${message}`
          }
        ],
      })

      const content = response.content[0]
      if (content.type === 'text') {
        return NextResponse.json({
          response: content.text,
          provider: 'claude',
          model: response.model,
        })
      }
    } else {
      // Default to OpenAI
      if (!openai) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 500 }
        )
      }

      const completion = await openai.chat.completions.create({
        model: model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })

      const responseMessage = completion.choices[0]?.message?.content

      if (!responseMessage) {
        return NextResponse.json(
          { error: 'No response from AI provider' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        response: responseMessage,
        provider: 'openai',
        model: completion.model,
        usage: completion.usage,
      })
    }

    return NextResponse.json(
      { error: 'Invalid response from AI provider' },
      { status: 500 }
    )
  } catch (error) {
    console.error('AI Chat API Error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `AI service error: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}